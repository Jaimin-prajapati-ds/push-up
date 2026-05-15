import { useEffect, useRef, useState, useCallback } from "react";
import { usePoseDetection } from "@/src/hooks/usePoseDetection";
import type { BodyAnalysis } from "@/src/hooks/usePoseDetection";
import { ChevronLeft, Zap, Activity, ChevronRight } from "lucide-react";
import { triggerRepHaptic, triggerSuccessHaptic } from "@/src/lib/notifications";
import { App as CapApp } from '@capacitor/app';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { cn } from "@/src/lib/utils";
import { Countdown } from "@/src/components/Countdown";
import { RepAnimation, MilestoneAnimation } from "@/src/components/RepAnimation";
import { playRepSound, playMilestoneSound } from "@/src/lib/sounds";
import { speak } from "@/src/lib/speech";
import { requestWakeLock, releaseWakeLock, setupWakeLockReacquire } from "@/src/lib/wakelock";
import { getAppSettings } from "@/src/lib/userProfile";

const MILESTONES = [10, 25, 50, 100, 250, 500];
const UP_THRESHOLD = 155;
const DOWN_THRESHOLD = 90;
const HYSTERESIS = 5;

const SKELETON_CONNECTIONS = [
  ['left_shoulder', 'right_shoulder'],
  ['left_shoulder', 'left_elbow'],
  ['left_elbow', 'left_wrist'],
  ['right_shoulder', 'right_elbow'],
  ['right_elbow', 'right_wrist'],
  ['left_shoulder', 'left_hip'],
  ['right_shoulder', 'right_hip'],
  ['left_hip', 'right_hip'],
  ['left_hip', 'left_knee'],
  ['left_knee', 'left_ankle'],
  ['right_hip', 'right_knee'],
  ['right_knee', 'right_ankle'],
];

const BODY_SILHOUETTE = [
  ['left_shoulder', 'right_shoulder'],
  ['right_shoulder', 'right_hip'],
  ['right_hip', 'left_hip'],
  ['left_hip', 'left_shoulder'],
];

const JOINT_LABELS: Record<string, string> = {
  left_shoulder: 'S', right_shoulder: 'S',
  left_elbow: 'E', right_elbow: 'E',
  left_wrist: 'W', right_wrist: 'W',
  left_hip: 'H', right_hip: 'H',
  left_knee: 'K', right_knee: 'K',
  left_ankle: 'A', right_ankle: 'A',
};

function getBoneColor(score: number): string {
  if (score > 0.7) return '#D4F45D';
  if (score > 0.5) return '#F4D03F';
  return '#F45D5D';
}

function getBoneGlow(score: number): string {
  if (score > 0.7) return 'rgba(212,244,93,0.6)';
  if (score > 0.5) return 'rgba(244,208,63,0.4)';
  return 'rgba(244,93,93,0.3)';
}

function interpolateColor(score: number): string {
  const r = score < 0.5 ? 244 : Math.round(244 - (score - 0.5) * 2 * (244 - 212) / (1 - 0.5));
  const g = score < 0.5 ? Math.round(93 + (score - 0.3) * 2 * (208 - 93) / (0.5 - 0.3)) : Math.round(208 + (score - 0.5) * 2 * (244 - 208) / (1 - 0.5));
  const b = score < 0.5 ? 93 : Math.round(93 - (score - 0.5) * 2 * 93 / (1 - 0.5));
  return `rgb(${Math.min(255,Math.max(0,r))},${Math.min(255,Math.max(0,g))},${Math.min(255,Math.max(0,b))})`;
}

export function Workout({ onStop }: { onStop: (reps: number, duration: number) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [reps, setReps] = useState(0);
  const [feedback, setFeedback] = useState("WAITING FOR AI...");
  const [timer, setTimer] = useState(0);
  const isPausedRef = useRef(false);
  const [showCountdown, setShowCountdown] = useState(true);
  const [repPulse, setRepPulse] = useState(0);
  const [milestone, setMilestone] = useState<number | null>(null);
  const [repQuality, setRepQuality] = useState<number>(100);
  const [bodyAnalysis, setBodyAnalysis] = useState<BodyAnalysis | null>(null);
  const [avgAngle, setAvgAngle] = useState(180);
  const settings = getAppSettings();
  const bodyAnalysisRef = useRef<BodyAnalysis | null>(null);

  const { isReady, processFrame, analyzePose } = usePoseDetection();

  const stateRef = useRef({
    stage: "up" as "up" | "down",
    reps: 0,
    startTime: 0,
    smoothedAngle: 180,
    lastRepTime: 0,
    lastMilestoneRep: 0,
    lastVoiceTime: 0,
    qualitySamples: [] as number[],
    consecutiveBadForm: 0,
  });

  const lockOrientation = async () => {
    try {
      await ScreenOrientation.lock({ orientation: 'portrait' });
    } catch {}
  };

  const unlockOrientation = async () => {
    try {
      await ScreenOrientation.unlock();
    } catch {}
  };

  useEffect(() => {
    lockOrientation();
    setupWakeLockReacquire();
    return () => {
      unlockOrientation();
    };
  }, []);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            if (canvasRef.current && videoRef.current) {
              canvasRef.current.width = videoRef.current.videoWidth;
              canvasRef.current.height = videoRef.current.videoHeight;
            }
          };
        }
      } catch (err) {
        setFeedback("CAMERA ERROR");
      }
    };
    startCamera();
    return () => {
      releaseWakeLock();
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (showCountdown) {
      stateRef.current.startTime = 0;
      return;
    }
    stateRef.current.startTime = Date.now();
    requestWakeLock();
    const interval = setInterval(() => {
      if (!isPausedRef.current && stateRef.current.startTime > 0) {
        setTimer(Math.floor((Date.now() - stateRef.current.startTime) / 1000));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [showCountdown]);

  useEffect(() => {
    let listener: { remove: () => void } | null = null;
    CapApp.addListener('appStateChange', ({ isActive }) => {
      isPausedRef.current = !isActive;
      if (isActive) requestWakeLock();
    }).then(l => { listener = l; });
    return () => {
      listener?.remove();
    };
  }, []);

  const checkMilestone = useCallback((newReps: number) => {
    for (const m of MILESTONES) {
      if (newReps >= m && stateRef.current.lastMilestoneRep < m) {
        stateRef.current.lastMilestoneRep = m;
        setMilestone(m);
        playMilestoneSound();
        if (settings.voiceEnabled) {
          speak(`${m} reps! Great work!`);
        }
        setTimeout(() => setMilestone(null), 2000);
        break;
      }
    }
  }, [settings.voiceEnabled]);

  const drawSkeleton = useCallback((ctx: CanvasRenderingContext2D, pose: any, analysis: BodyAnalysis | null) => {
    const keypoints = pose.keypoints;
    const kpMap = new Map<string, any>();
    keypoints.forEach((kp: any) => kpMap.set(kp.name, kp));

    const getAvgScore = (name1: string, name2: string): number => {
      const k1 = kpMap.get(name1);
      const k2 = kpMap.get(name2);
      if (!k1 || !k2) return 0;
      return ((k1.score ?? 0) + (k2.score ?? 0)) / 2;
    };

    BODY_SILHOUETTE.forEach(([s, e]) => {
      const kp1 = kpMap.get(s);
      const kp2 = kpMap.get(e);
      if (kp1 && kp2 && (kp1.score ?? 0) > 0.25 && (kp2.score ?? 0) > 0.25) {
        ctx.beginPath();
        ctx.moveTo(kp1.x, kp1.y);
        ctx.lineTo(kp2.x, kp2.y);
        ctx.lineTo(kpMap.get(s === 'left_shoulder' ? 'left_hip' : 'right_hip')?.x || kp2.x, kpMap.get(s === 'left_shoulder' ? 'left_hip' : 'right_hip')?.y || kp2.y);
        ctx.closePath();
        ctx.fillStyle = 'rgba(212, 244, 93, 0.06)';
        ctx.fill();
      }
    });

    SKELETON_CONNECTIONS.forEach(([s, e]) => {
      const kp1 = kpMap.get(s);
      const kp2 = kpMap.get(e);
      if (kp1 && kp2 && (kp1.score ?? 0) > 0.25 && (kp2.score ?? 0) > 0.25) {
        const avgScore = getAvgScore(s, e);
        const color = getBoneColor(avgScore);
        const glow = getBoneGlow(avgScore);
        const lineW = Math.max(4, Math.min(10, avgScore * 10));

        ctx.shadowBlur = 20;
        ctx.shadowColor = glow;

        ctx.beginPath();
        ctx.lineWidth = lineW;
        ctx.lineCap = "round";
        ctx.strokeStyle = color;
        ctx.moveTo(kp1.x, kp1.y);
        ctx.lineTo(kp2.x, kp2.y);
        ctx.stroke();

        ctx.shadowBlur = 0;
      }
    });

    keypoints.forEach((kp: any) => {
      const score = kp.score ?? 0;
      if (score > 0.25) {
        const radius = Math.max(5, Math.min(10, score * 10));

        ctx.shadowBlur = 15;
        ctx.shadowColor = getBoneGlow(score);

        ctx.beginPath();
        ctx.arc(kp.x, kp.y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = getBoneColor(score);
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.shadowBlur = 0;

        if (score > 0.5 && kp.name && JOINT_LABELS[kp.name]) {
          ctx.fillStyle = 'rgba(255,255,255,0.8)';
          ctx.font = 'bold 11px "Inter", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(JOINT_LABELS[kp.name], kp.x, kp.y - radius - 8);
        }
      }
    });

    if (analysis) {
      const findKP = (name: string) => keypoints.find((kp: any) => kp.name === name);
      const lE = findKP('left_elbow');
      const rE = findKP('right_elbow');

      [lE, rE].forEach((elbow, idx) => {
        if (!elbow || (elbow.score ?? 0) < 0.3) return;
        const angle = idx === 0 ? analysis.leftArm.angle : analysis.rightArm.angle;
        const conf = idx === 0 ? analysis.leftArm.confidence : analysis.rightArm.confidence;
        if (conf < 0.3) return;

        ctx.save();
        const anchorX = elbow.x;
        const anchorY = elbow.y;

        ctx.translate(anchorX, anchorY);

        ctx.shadowBlur = 15;
        ctx.shadowColor = "rgba(212, 244, 93, 0.4)";

        ctx.beginPath();
        ctx.arc(0, 0, 38, 0, 2 * Math.PI);
        ctx.strokeStyle = "rgba(212, 244, 93, 0.2)";
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.beginPath();
        const progress = Math.min(1, Math.max(0, (UP_THRESHOLD - angle) / (UP_THRESHOLD - DOWN_THRESHOLD)));
        ctx.arc(0, 0, 38, -Math.PI / 2, (-Math.PI / 2) + (progress * 2 * Math.PI));
        ctx.strokeStyle = interpolateColor(1 - progress);
        ctx.lineWidth = 6;
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.fillStyle = "white";
        ctx.font = "bold 13px 'Outfit', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`${Math.round(angle)}°`, 0, 5);

        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.font = "bold 8px 'Inter', sans-serif";
        ctx.fillText(idx === 0 ? 'L' : 'R', 0, -28);
        ctx.restore();
      });
    }
  }, []);

  const drawBodyDiagram = useCallback((ctx: CanvasRenderingContext2D, analysis: BodyAnalysis | null, canvasW: number, canvasH: number) => {
    if (!analysis) return;

    const margin = 16;
    const diagramSize = 90;
    const startX = canvasW - diagramSize - margin;
    const startY = margin + 40;

    ctx.save();
    ctx.globalAlpha = 0.85;

    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.beginPath();
    ctx.roundRect(startX - 8, startY - 8, diagramSize + 16, diagramSize + 16, 12);
    ctx.fill();

    const cx = startX + diagramSize / 2;
    const headY = startY + 8;
    const shoulderY = startY + 24;
    const hipY = startY + 52;
    const kneeY = startY + 74;
    const ankleY = startY + 86;

    const bodyParts = [
      { name: 'shoulders', y: shoulderY },
      { name: 'elbows', y: shoulderY + 14 },
      { name: 'wrists', y: shoulderY + 28 },
      { name: 'hips', y: hipY },
      { name: 'knees', y: kneeY },
      { name: 'ankles', y: ankleY },
    ];

    ctx.beginPath();
    ctx.arc(cx, headY, 8, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx - 16, shoulderY);
    ctx.lineTo(cx + 16, shoulderY);
    ctx.moveTo(cx - 12, shoulderY);
    ctx.lineTo(cx - 16, hipY + 4);
    ctx.lineTo(cx - 10, hipY + 4);
    ctx.moveTo(cx + 12, shoulderY);
    ctx.lineTo(cx + 16, hipY + 4);
    ctx.lineTo(cx + 10, hipY + 4);
    ctx.moveTo(cx - 8, hipY);
    ctx.lineTo(cx + 8, hipY);
    ctx.moveTo(cx - 8, hipY + 4);
    ctx.lineTo(cx - 6, kneeY);
    ctx.lineTo(cx - 6, ankleY);
    ctx.moveTo(cx + 8, hipY + 4);
    ctx.lineTo(cx + 6, kneeY);
    ctx.lineTo(cx + 6, ankleY);
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    bodyParts.forEach((part, i) => {
      const isVisible = analysis.visibility[part.name as keyof typeof analysis.visibility];
      ctx.beginPath();
      ctx.arc(cx - 12 + (i % 2 === 0 ? 0 : 24), part.y, 4, 0, 2 * Math.PI);
      ctx.fillStyle = isVisible ? '#D4F45D' : 'rgba(255,255,255,0.15)';
      ctx.fill();

      if (isVisible && i === 0) {
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#D4F45D';
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    });

    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = 'bold 7px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('BODY', startX + diagramSize / 2, startY + diagramSize + 14);
    ctx.restore();
  }, []);

  const drawAngleIndicator = useCallback((ctx: CanvasRenderingContext2D, avgAng: number, canvasW: number, canvasH: number) => {
    ctx.save();
    const size = 60;
    const x = 20;
    const y = canvasH - 80;

    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.roundRect(x - 4, y - 4, size + 8, size + 8, 10);
    ctx.fill();

    ctx.translate(x + size / 2, y + size / 2);

    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 3;
    ctx.stroke();

    const progress = Math.min(1, Math.max(0, (UP_THRESHOLD - avgAng) / (UP_THRESHOLD - DOWN_THRESHOLD)));

    ctx.beginPath();
    ctx.arc(0, 0, 24, -Math.PI / 2, (-Math.PI / 2) + (progress * 2 * Math.PI));
    ctx.strokeStyle = interpolateColor(1 - progress);
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.round(avgAng)}°`, 0, 4);
    ctx.restore();
  }, []);

  useEffect(() => {
    let animationId: number;
    const runDetection = async () => {
      if (isPausedRef.current || showCountdown) {
        animationId = requestAnimationFrame(runDetection);
        return;
      }
      if (!videoRef.current || !canvasRef.current || !isReady) {
        animationId = requestAnimationFrame(runDetection);
        return;
      }

      const pose = await processFrame(videoRef.current);
      const ctx = canvasRef.current.getContext("2d");

      if (ctx && pose) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        ctx.save();
        ctx.scale(-1, 1);
        ctx.translate(-canvasRef.current.width, 0);
        drawSkeleton(ctx, pose, bodyAnalysisRef.current);
        ctx.restore();

        const analysis = analyzePose(pose, settings.confidenceThreshold || 0.4);
        if (analysis) {
          bodyAnalysisRef.current = analysis;
          setBodyAnalysis(analysis);
          setAvgAngle(analysis.avgAngle);

          drawBodyDiagram(ctx, analysis, canvasRef.current.width, canvasRef.current.height);
          drawAngleIndicator(ctx, analysis.avgAngle, canvasRef.current.width, canvasRef.current.height);

          const { leftArm, rightArm, avgAngle: aAngle, backStraight, hipsLowered, visibility } = analysis;

          if (!visibility.shoulders && !visibility.hips) {
            setFeedback("MOVE IN FRAME");
          } else if (!backStraight) {
            setFeedback("KEEP BACK STRAIGHT");
            stateRef.current.consecutiveBadForm++;
          } else if (!hipsLowered) {
            setFeedback("LOWER YOUR HIPS");
            stateRef.current.consecutiveBadForm++;
          } else if (aAngle > UP_THRESHOLD - 10 && stateRef.current.stage === "up") {
            setFeedback("GO DOWN");
          } else if (aAngle < DOWN_THRESHOLD + 10 && stateRef.current.stage === "down") {
            setFeedback("PUSH UP!");
          } else if (aAngle > UP_THRESHOLD - 10) {
            setFeedback("GO DOWN");
          } else {
            stateRef.current.consecutiveBadForm = Math.max(0, stateRef.current.consecutiveBadForm - 1);
            setFeedback(stateRef.current.stage === "down" ? "PUSH UP!" : "GO LOWER");
          }

          const angleUpThreshold = UP_THRESHOLD;
          const angleDownThreshold = DOWN_THRESHOLD;
          const hysteresis = HYSTERESIS;

          if (stateRef.current.stage === "up" && aAngle < angleDownThreshold + hysteresis) {
            stateRef.current.stage = "down";
            triggerRepHaptic();

            if (backStraight && hipsLowered) {
              const depthScore = Math.min(1, Math.max(0, (angleUpThreshold - aAngle) / (angleUpThreshold - angleDownThreshold)));
              stateRef.current.qualitySamples.push(depthScore);
            }
          }

          if (stateRef.current.stage === "down" && aAngle > angleUpThreshold - hysteresis) {
            const now = Date.now();
            if (now - stateRef.current.lastRepTime > 500) {
              const avgQual = stateRef.current.qualitySamples.length > 0
                ? stateRef.current.qualitySamples.reduce((a, b) => a + b, 0) / stateRef.current.qualitySamples.length
                : 1;
              const quality = Math.round(avgQual * 100);

              stateRef.current.stage = "up";
              stateRef.current.reps++;
              stateRef.current.lastRepTime = now;
              stateRef.current.qualitySamples = [];

              setReps(stateRef.current.reps);
              setRepPulse(prev => prev + 1);
              setRepQuality(quality);
              triggerSuccessHaptic();
              playRepSound();
              checkMilestone(stateRef.current.reps);

              if (settings.voiceEnabled && now - stateRef.current.lastVoiceTime > 30000) {
                stateRef.current.lastVoiceTime = now;
                speak(`${stateRef.current.reps} reps. Keep going!`);
              }
            }
          }
        } else {
          setFeedback("FINDING BODY...");
        }
      }

      animationId = requestAnimationFrame(runDetection);
    };

    runDetection();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isReady, processFrame, analyzePose, showCountdown, settings.confidenceThreshold, checkMilestone, drawSkeleton, drawBodyDiagram, drawAngleIndicator]);

  if (showCountdown) {
    return <Countdown seconds={settings.countdownSeconds} onComplete={() => setShowCountdown(false)} />;
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col overflow-hidden font-sans">
      <div className="absolute inset-0 pointer-events-none z-50">
        <div className="p-8 flex items-start justify-between w-full pointer-events-auto">
          <button onClick={() => onStop(reps, timer)} className="w-14 h-14 bg-black/40 backdrop-blur-3xl rounded-2xl flex items-center justify-center border border-white/10 active:scale-90 transition-all shadow-2xl">
            <ChevronLeft className="text-white" size={28} />
          </button>

          <div className="flex flex-col items-end gap-2">
            <div className="bg-black/40 backdrop-blur-3xl px-6 py-3 rounded-2xl border border-white/10 flex items-center gap-3 shadow-2xl">
              <div className="w-2 h-2 rounded-full bg-[#D4F45D] animate-pulse" />
              <span className="font-heading text-2xl italic text-white tracking-tighter">
                {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}
              </span>
            </div>
            <div className="bg-[#D4F45D]/10 backdrop-blur-3xl px-4 py-1.5 rounded-full border border-[#D4F45D]/20">
              <span className="text-[10px] font-black text-[#D4F45D] uppercase tracking-widest">LIVE SESSION</span>
            </div>
          </div>
        </div>

        <div className="absolute top-28 left-1/2 -translate-x-1/2 w-full flex flex-col items-center gap-3 px-8">
          <div className={cn(
            "px-6 py-2.5 rounded-2xl border backdrop-blur-xl transition-all duration-500 flex items-center gap-2.5",
            feedback.includes("LOWER") || feedback.includes("STRAIGHT") || feedback.includes("FRAME")
              ? "bg-red-500/20 border-red-500/30 scale-110"
              : feedback.includes("FINDING")
                ? "bg-yellow-500/10 border-yellow-500/20"
                : "bg-white/5 border-white/10"
          )}>
            <Zap size={14} className={
              feedback.includes("LOWER") || feedback.includes("STRAIGHT") || feedback.includes("FRAME")
                ? "text-red-500"
                : feedback.includes("FINDING")
                  ? "text-yellow-400"
                  : "text-[#D4F45D]"
            } />
            <span className={cn(
              "font-black italic text-xs uppercase tracking-[0.2em]",
              feedback.includes("LOWER") || feedback.includes("STRAIGHT") || feedback.includes("FRAME")
                ? "text-red-500"
                : feedback.includes("FINDING")
                  ? "text-yellow-400"
                  : "text-white"
            )}>
              {feedback}
            </span>
          </div>
        </div>
      </div>

      <div className="relative flex-1 bg-black overflow-hidden">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover opacity-80 scale-x-[-1]"
          autoPlay
          playsInline
          muted
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover z-20 pointer-events-none"
        />

        <RepAnimation reps={repPulse} />
        <MilestoneAnimation milestone={milestone} onDone={() => setMilestone(null)} />

        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30 z-10">
          <div className="w-full h-[2px] bg-[#D4F45D] absolute top-0 animate-[scan_4s_linear_infinite]" />
          <div className="w-full h-full bg-[linear-gradient(rgba(212,244,93,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(212,244,93,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />
        </div>

        <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center p-8">
          <div className="w-full h-full border-2 border-white/5 rounded-[4rem] relative overflow-hidden">
            <div className="absolute top-10 left-10 w-12 h-12 border-t-4 border-l-4 border-[#D4F45D] rounded-tl-3xl shadow-[0_0_20px_rgba(212,244,93,0.5)]" />
            <div className="absolute top-10 right-10 w-12 h-12 border-t-4 border-r-4 border-[#D4F45D] rounded-tr-3xl shadow-[0_0_20px_rgba(212,244,93,0.5)]" />
            <div className="absolute bottom-10 left-10 w-12 h-12 border-b-4 border-l-4 border-[#D4F45D] rounded-bl-3xl shadow-[0_0_20px_rgba(212,244,93,0.5)]" />
            <div className="absolute bottom-10 right-10 w-12 h-12 border-b-4 border-r-4 border-[#D4F45D] rounded-br-3xl shadow-[0_0_20px_rgba(212,244,93,0.5)]" />
          </div>
        </div>
      </div>

      <div className="h-52 bg-[#080808] border-t border-white/10 px-8 flex items-center justify-between z-50 relative">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-[#D4F45D]/5 to-transparent pointer-events-none" />

        <div className="flex items-center gap-6 relative">
          <div className="relative group">
            <div className="absolute inset-0 bg-[#D4F45D] blur-3xl opacity-20 group-hover:opacity-40 transition-opacity" />
            <div className="w-16 h-16 bg-[#D4F45D] rounded-[1.8rem] flex items-center justify-center relative shadow-[0_0_40px_rgba(212,244,93,0.4)]">
              <Activity className="text-black" size={30} />
            </div>
          </div>
          <div className="space-y-0">
            <p className="text-[#D4F45D] font-black text-[10px] tracking-[0.5em] uppercase opacity-60">Total Reps</p>
            <div className="flex items-baseline gap-3">
              <span className="text-7xl font-heading italic text-white leading-none tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                {reps}
              </span>
              <span className="text-2xl font-heading italic text-[#D4F45D]">REPS</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-5">
          <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 px-4 py-3 flex flex-col items-center">
            <span className={cn(
              "text-xs font-black tracking-wider",
              repQuality >= 80 ? "text-[#D4F45D]" : repQuality >= 50 ? "text-yellow-400" : "text-red-400"
            )}>
              {repQuality}%
            </span>
            <span className="text-[8px] text-white/30 font-bold uppercase tracking-widest">Quality</span>
          </div>

          {bodyAnalysis && (
            <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 px-4 py-3 hidden md:flex flex-col items-center">
              <span className="text-xs font-black text-white tracking-wider">{Math.round(avgAngle)}°</span>
              <span className="text-[8px] text-white/30 font-bold uppercase tracking-widest">Angle</span>
            </div>
          )}

          <button
            onClick={() => onStop(reps, timer)}
            className="h-16 px-10 bg-white text-black rounded-[2.5rem] font-black italic uppercase tracking-[0.2em] shadow-[0_10px_40px_rgba(255,255,255,0.2)] active:scale-95 transition-all flex items-center gap-3 hover:bg-[#D4F45D]"
          >
            FINISH <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan {
          0% { top: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}} />
    </div>
  );
}
