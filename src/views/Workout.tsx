import { useEffect, useRef, useState } from "react";
import { usePoseDetection } from "@/src/hooks/usePoseDetection";
import { ChevronLeft, Zap, Target, Timer as TimerIcon, Activity, ChevronRight } from "lucide-react";
import { triggerRepHaptic, triggerSuccessHaptic } from "@/src/lib/notifications";
import { App as CapApp } from '@capacitor/app';
import { cn } from "@/src/lib/utils";

export function Workout({ onStop }: { onStop: (reps: number, duration: number) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [reps, setReps] = useState(0);
  const [feedback, setFeedback] = useState("WAITING FOR AI...");
  const [timer, setTimer] = useState(0);
  const isPausedRef = useRef(false);
  const { isReady, processFrame, validatePushupPosition } = usePoseDetection();
  
  const stateRef = useRef({
    stage: "up",
    reps: 0,
    startTime: Date.now(),
    isCounting: false,
    smoothedAngle: 180,
    lastRepTime: 0
  });

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
    
    const interval = setInterval(() => {
      if (!isPausedRef.current) {
        setTimer(Math.floor((Date.now() - stateRef.current.startTime) / 1000));
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const calculateAngle = (a: any, b: any, c: any) => {
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs(radians * 180.0 / Math.PI);
    if (angle > 180.0) angle = 360 - angle;
    return angle;
  };

  useEffect(() => {
    let animationId: number;
    
    const runDetection = async () => {
      if (isPausedRef.current) {
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
        
        // DRAW SKELETON (Instant Visibility)
        ctx.save();
        ctx.scale(-1, 1);
        ctx.translate(-canvasRef.current.width, 0);
        drawSkeleton(ctx, pose);
        ctx.restore();

        // SCIENTIFIC PUSHUP LOGIC
        const keypoints = pose.keypoints;
        const findKP = (name: string) => keypoints.find(kp => kp.name === name);

        const lS = findKP('left_shoulder');
        const lE = findKP('left_elbow');
        const lW = findKP('left_wrist');
        const lH = findKP('left_hip');
        const lK = findKP('left_knee');

        const rS = findKP('right_shoulder');
        const rE = findKP('right_elbow');
        const rW = findKP('right_wrist');
        const rH = findKP('right_hip');
        const rK = findKP('right_knee');

        // Choose the most visible side
        const leftScore = (lS?.score || 0) + (lE?.score || 0) + (lW?.score || 0);
        const rightScore = (rS?.score || 0) + (rE?.score || 0) + (rW?.score || 0);
        const bestSide = leftScore > rightScore ? 'left' : 'right';

        const S = bestSide === 'left' ? lS : rS;
        const E = bestSide === 'left' ? lE : rE;
        const W = bestSide === 'left' ? lW : rW;
        const H = bestSide === 'left' ? lH : rH;
        const K = bestSide === 'left' ? lK : rK;

        if (S && E && W && S.score > 0.4 && E.score > 0.4 && W.score > 0.4) {
          const rawAngle = calculateAngle(S, E, W);
          
          // Smoothing (EMA) for professional feel
          stateRef.current.smoothedAngle = stateRef.current.smoothedAngle * 0.7 + rawAngle * 0.3;
          const angle = stateRef.current.smoothedAngle;

          // HIP STABILITY CHECK (Research-based: Straight back)
          let formFeedback = "READY";
          if (H && K && S && H.score > 0.4 && K.score > 0.4) {
            const bodyAngle = calculateAngle(S, H, K);
            if (bodyAngle < 150) formFeedback = "KEEP BACK STRAIGHT";
            else if (H.y < S.y - 20) formFeedback = "LOWER YOUR HIPS";
          }

          // REP COUNTING
          if (angle < 90 && stateRef.current.stage === "up") {
            stateRef.current.stage = "down";
            triggerRepHaptic();
          }
          if (angle > 160 && stateRef.current.stage === "down") {
            const now = Date.now();
            if (now - stateRef.current.lastRepTime > 500) { // Anti-double count
              stateRef.current.stage = "up";
              stateRef.current.reps++;
              stateRef.current.lastRepTime = now;
              setReps(stateRef.current.reps);
              triggerSuccessHaptic();
            }
          }

          setFeedback(formFeedback === "READY" ? (stateRef.current.stage === "up" ? "GO DOWN" : "PUSH UP!") : formFeedback);

          // DRAW PRO ANGLE OVERLAY
          ctx.save();
          // Use original coordinates for HUD (not mirrored)
          const anchorX = canvasRef.current.width - E.x; 
          const anchorY = E.y;
          
          ctx.translate(anchorX, anchorY);
          
          // Glow
          ctx.shadowBlur = 20;
          ctx.shadowColor = "#D4F45D";
          
          // Arc
          ctx.beginPath();
          ctx.arc(0, 0, 45, 0, 2 * Math.PI);
          ctx.strokeStyle = "rgba(212, 244, 93, 0.4)";
          ctx.lineWidth = 4;
          ctx.stroke();

          // Progress Circle
          ctx.beginPath();
          const progress = Math.min(1, Math.max(0, (160 - angle) / 70));
          ctx.arc(0, 0, 45, -Math.PI/2, (-Math.PI/2) + (progress * 2 * Math.PI));
          ctx.strokeStyle = "#D4F45D";
          ctx.lineWidth = 8;
          ctx.stroke();

          // Text
          ctx.fillStyle = "white";
          ctx.font = "bold 18px Outfit";
          ctx.textAlign = "center";
          ctx.shadowBlur = 0;
          ctx.fillText(`${Math.round(angle)}°`, 0, 7);
          ctx.restore();
        } else {
          setFeedback("FINDING BODY...");
        }
      }
      
      animationId = requestAnimationFrame(runDetection);
    };

    runDetection();

    const handleAppStateChange = CapApp.addListener('appStateChange', ({ isActive }) => {
      isPausedRef.current = !isActive;
    });

    return () => {
      cancelAnimationFrame(animationId);
      handleAppStateChange.then(l => l.remove());
    };
  }, [isReady, processFrame]);

  const drawSkeleton = (ctx: CanvasRenderingContext2D, pose: any) => {
    const connections = [
      ['left_shoulder', 'right_shoulder'],
      ['left_shoulder', 'left_hip'],
      ['right_shoulder', 'right_hip'],
      ['left_hip', 'right_hip'],
      ['left_shoulder', 'left_elbow'],
      ['left_elbow', 'left_wrist'],
      ['right_shoulder', 'right_elbow'],
      ['right_elbow', 'right_wrist'],
      ['left_hip', 'left_knee'],
      ['left_knee', 'left_ankle'],
      ['right_hip', 'right_knee'],
      ['right_knee', 'right_ankle']
    ];

    connections.forEach(([s, e]) => {
      const kp1 = pose.keypoints.find((k: any) => k.name === s);
      const kp2 = pose.keypoints.find((k: any) => k.name === e);
      
      if (kp1 && kp2 && (kp1.score ?? 0) > 0.3 && (kp2.score ?? 0) > 0.3) {
        // FULL VISIBILITY SKELETON
        ctx.beginPath();
        ctx.lineWidth = 6;
        ctx.lineCap = "round";
        ctx.strokeStyle = "#D4F45D"; // Pure solid color
        
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#D4F45D";

        ctx.moveTo(kp1.x, kp1.y);
        ctx.lineTo(kp2.x, kp2.y);
        ctx.stroke();
      }
    });

    // Joints
    pose.keypoints.forEach((kp: any) => {
      if ((kp.score ?? 0) > 0.3) { 
        ctx.beginPath();
        ctx.arc(kp.x, kp.y, 6, 0, 2 * Math.PI);
        ctx.fillStyle = "white";
        ctx.fill();
        ctx.strokeStyle = "#D4F45D";
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col overflow-hidden font-sans">
      {/* Premium HUD Overlay */}
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

        {/* Form Feedback Indicator */}
        <div className="absolute top-32 left-1/2 -translate-x-1/2 w-full flex flex-col items-center gap-4 px-8">
          <div className={cn(
            "px-8 py-3 rounded-2xl border backdrop-blur-xl transition-all duration-500 flex items-center gap-3",
            feedback.includes("LOWER") || feedback.includes("STRAIGHT") 
              ? "bg-red-500/20 border-red-500/30 scale-110" 
              : "bg-white/5 border-white/10"
          )}>
            <Zap size={16} className={feedback.includes("LOWER") ? "text-red-500" : "text-[#D4F45D]"} />
            <span className={cn(
              "font-black italic text-sm uppercase tracking-[0.2em]",
              feedback.includes("LOWER") || feedback.includes("STRAIGHT") ? "text-red-500" : "text-white"
            )}>
              {feedback}
            </span>
          </div>
        </div>
      </div>

      {/* Camera Core */}
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
        
        {/* Dynamic Scan Effect */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30 z-10">
          <div className="w-full h-[2px] bg-[#D4F45D] absolute top-0 animate-[scan_4s_linear_infinite]" />
          <div className="w-full h-full bg-[linear-gradient(rgba(212,244,93,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(212,244,93,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />
        </div>

        {/* Frame Guide */}
        <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center p-8">
          <div className="w-full h-full border-2 border-white/5 rounded-[4rem] relative overflow-hidden">
            {/* Corner Accents */}
            <div className="absolute top-10 left-10 w-12 h-12 border-t-4 border-l-4 border-[#D4F45D] rounded-tl-3xl shadow-[0_0_20px_rgba(212,244,93,0.5)]" />
            <div className="absolute top-10 right-10 w-12 h-12 border-t-4 border-r-4 border-[#D4F45D] rounded-tr-3xl shadow-[0_0_20px_rgba(212,244,93,0.5)]" />
            <div className="absolute bottom-10 left-10 w-12 h-12 border-b-4 border-l-4 border-[#D4F45D] rounded-bl-3xl shadow-[0_0_20px_rgba(212,244,93,0.5)]" />
            <div className="absolute bottom-10 right-10 w-12 h-12 border-b-4 border-r-4 border-[#D4F45D] rounded-br-3xl shadow-[0_0_20px_rgba(212,244,93,0.5)]" />
          </div>
        </div>
      </div>

      {/* Rep Counter Floor */}
      <div className="h-56 bg-[#080808] border-t border-white/10 px-10 flex items-center justify-between z-50 relative">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-[#D4F45D]/5 to-transparent pointer-events-none" />
        
        <div className="flex items-center gap-8 relative">
          <div className="relative group">
            <div className="absolute inset-0 bg-[#D4F45D] blur-3xl opacity-20 group-hover:opacity-40 transition-opacity" />
            <div className="w-20 h-20 bg-[#D4F45D] rounded-[2rem] flex items-center justify-center relative shadow-[0_0_40px_rgba(212,244,93,0.4)]">
              <Activity className="text-black" size={36} />
            </div>
          </div>
          <div className="space-y-0">
            <p className="text-[#D4F45D] font-black text-[10px] tracking-[0.5em] uppercase opacity-60">Total Reps</p>
            <div className="flex items-baseline gap-3">
              <span className="text-8xl font-heading italic text-white leading-none tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                {reps}
              </span>
              <span className="text-2xl font-heading italic text-[#D4F45D]">REPS</span>
            </div>
          </div>
        </div>
        
        <button 
          onClick={() => onStop(reps, timer)}
          className="h-20 px-12 bg-white text-black rounded-[2.5rem] font-black italic uppercase tracking-[0.2em] shadow-[0_10px_40px_rgba(255,255,255,0.2)] active:scale-95 transition-all flex items-center gap-3 hover:bg-[#D4F45D]"
        >
          FINISH <ChevronRight size={24} />
        </button>
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
