import { useRef, useEffect, useCallback, useState } from 'react';
import { usePoseDetection } from '@/src/hooks/usePoseDetection';
import { initializeAdMob, showBannerAd, hideBannerAd } from '@/src/lib/admob';
import { useReadyPose } from '@/src/hooks/useReadyPose';
import { cn } from '@/src/lib/utils';
import { Square, Pause, Accessibility, Play, Loader2 } from "lucide-react";
import { Countdown } from '@/src/components/Countdown';
import { RepAnimation, MilestoneAnimation } from '@/src/components/RepAnimation';
import { initializePurchases } from '@/src/lib/subscription';
import { playRepSound, playMilestoneSound } from '@/src/lib/sounds';
import { vibrateRep, vibrateMilestone } from '@/src/lib/haptics';
import { requestWakeLock, releaseWakeLock } from '@/src/lib/wakelock';
import { getAppSettings } from '@/src/lib/userProfile';
import { speak } from '@/src/lib/speech';
import type * as poseDetection from '@tensorflow-models/pose-detection';
import { showRewardVideo } from '@/src/lib/admob';
import { Capacitor } from '@capacitor/core';

export function Workout({ onStop }: { onStop: (reps: number, durationSeconds: number) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const startTime = useRef<number>(0);
  const pausedElapsed = useRef<number>(0);
  const [elapsed, setElapsed] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showCountdown, setShowCountdown] = useState(true);
  const [milestone, setMilestone] = useState<number | null>(null);
  const [camError, setCamError] = useState<string | null>(null);
  const lastSpokenRef = useRef<number>(0);
  
  const isPro = localStorage.getItem('pushchamp_is_pro') === 'true';
  const settings = getAppSettings();

  // Initialize AdMob and subscription status on mount
  useEffect(() => {
    initializeAdMob();
    initializePurchases();
    if (!isPro) {
      showBannerAd();
    }
    // Offline ad handling
    const handleOnline = () => {
      if (!isPro) showBannerAd();
    };
    const handleOffline = () => {
      hideBannerAd();
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      hideBannerAd();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (settings.keepScreenOn) {
      requestWakeLock();
    }
    return () => { 
      releaseWakeLock(); 
    };
  }, []);

  // Timer
  useEffect(() => {
    if (isPaused || showCountdown) return;
    if (startTime.current === 0) {
      startTime.current = Date.now() - pausedElapsed.current * 1000;
    }
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isPaused, showCountdown]);

  // Pause handling
  const handlePause = () => {
    if (isPaused) {
      // Resuming — adjust start time
      startTime.current = Date.now() - pausedElapsed.current * 1000;
    } else {
      // Pausing — save current elapsed
      pausedElapsed.current = elapsed;
    }
    setIsPaused(!isPaused);
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    if (h > 0) return `${h}:${m}:${s}`;
    return `${m}:${s}`;
  };

  const drawSkeleton = useCallback((poses: poseDetection.Pose[]) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !videoRef.current) return;

    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    poses.forEach((pose) => {
      // Draw keypoints
      pose.keypoints.forEach((kp) => {
        if (kp.score && kp.score > 0.3) {
          ctx.beginPath();
          ctx.arc(kp.x, kp.y, 5, 0, 2 * Math.PI);
          ctx.fillStyle = '#c3f400';
          ctx.fill();
          ctx.beginPath();
          ctx.arc(kp.x, kp.y, 8, 0, 2 * Math.PI);
          ctx.strokeStyle = 'rgba(195, 244, 0, 0.3)';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      });

      // Draw full skeleton
      const connect = (kp1Name: string, kp2Name: string) => {
        const kp1 = pose.keypoints.find(k => k.name === kp1Name);
        const kp2 = pose.keypoints.find(k => k.name === kp2Name);
        if (kp1?.score && kp1.score > 0.3 && kp2?.score && kp2.score > 0.3) {
          ctx.beginPath();
          ctx.moveTo(kp1.x, kp1.y);
          ctx.lineTo(kp2.x, kp2.y);
          ctx.strokeStyle = 'rgba(195, 244, 0, 0.4)';
          ctx.lineWidth = 3;
          ctx.stroke();
        }
      };

      // Arms
      connect('left_shoulder', 'left_elbow');
      connect('left_elbow', 'left_wrist');
      connect('right_shoulder', 'right_elbow');
      connect('right_elbow', 'right_wrist');
      // Torso
      connect('left_shoulder', 'right_shoulder');
      connect('left_shoulder', 'left_hip');
      connect('right_shoulder', 'right_hip');
      connect('left_hip', 'right_hip');
      // Legs
      connect('left_hip', 'left_knee');
      connect('left_knee', 'left_ankle');
      connect('right_hip', 'right_knee');
      connect('right_knee', 'right_ankle');
    });
  }, []);

  const handleRep = useCallback(() => {
    playRepSound();
    vibrateRep();
  }, []);

  const handleMilestone = useCallback((count: number) => {
    playMilestoneSound();
    vibrateMilestone();
    setMilestone(count);
    speak(`${count} reps! Keep going!`);
  }, []);

  const { isLoaded, reps, isDown, isVisible, formFeedback } = usePoseDetection(
    videoRef, isPaused || showCountdown, drawSkeleton, handleRep, handleMilestone
  );
const { isReady, readyScore } = useReadyPose(videoRef, isPaused || showCountdown, drawSkeleton);

  // Form feedback speech coaching
  useEffect(() => {
    if (formFeedback && settings.soundEnabled) {
      const now = Date.now();
      if (now - lastSpokenRef.current > 4000) { // Speak at most once every 4 seconds
        // Simplify message for speech
        let speechText = formFeedback;
        if (formFeedback.includes('LIE FLAT')) speechText = "Lie flat, lower your hips.";
        speak(speechText);
        lastSpokenRef.current = now;
      }
    }
  }, [formFeedback, settings.soundEnabled]);

  // Camera setup
  useEffect(() => {
    let stream: MediaStream | null = null;

    async function setupCamera() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCamError('Camera not available. Please use HTTPS and grant camera permissions.');
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => { videoRef.current?.play(); };
        }
      } catch (err: any) {
        setCamError(`Camera error: ${err.message || err.toString()}`);
      }
    }
    setupCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const getFormText = () => {
    if (camError) return "CAMERA ERROR";
    if (isPaused) return "PAUSED";
    if (showCountdown) return "GET READY...";
    if (!isLoaded) return "LOADING AI MODEL...";
    if (!isVisible) return "GET IN FRAME";
    if (formFeedback) return formFeedback;
    return isDown ? "PUSH UP!" : "GO DOWN — KEEP CORE TIGHT";
  };

  return (
    <div className="h-screen w-screen overflow-hidden relative flex flex-col items-center">
      {/* Countdown overlay */}
      {showCountdown && (
        <Countdown seconds={settings.countdownSeconds} onComplete={() => setShowCountdown(false)} />
      )}

      {/* Milestone overlay */}
      <MilestoneAnimation milestone={milestone} onDone={() => setMilestone(null)} />

      {camError && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/90 p-8 text-center text-red-500 font-body-lg">
          <div className="flex flex-col items-center gap-4">
            <Accessibility className="w-12 h-12 text-red-500" />
            <p>{camError}</p>
            <p className="text-on-surface-variant text-sm">Please allow camera permissions and ensure you're using HTTPS.</p>
            <button 
              onClick={() => { setCamError(null); window.location.reload(); }}
              className="px-6 py-2 bg-surface-container-high text-white rounded-lg uppercase tracking-widest text-sm hover:bg-surface-variant transition-colors"
            >Retry</button>
          </div>
        </div>
      )}
{/* Ready overlay */}
{!isReady && !showCountdown && (
  <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-20">
    <div className="text-center text-white font-display-lg">
      <p>Stand straight, feet hip‑width apart.</p>
      <p className="mt-2 text-sm opacity-80">When the green skeleton steadies, you’re ready.</p>
    </div>
  </div>
)}

      {/* Camera feed */}
      <video ref={videoRef} className="absolute inset-0 z-0 w-full h-full object-cover" playsInline muted />
      <canvas ref={canvasRef} className="absolute inset-0 z-[1] w-full h-full object-cover pointer-events-none" />
      
      {/* Overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/20 to-background/95 mix-blend-overlay z-0 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-background/40 to-background shadow-[inset_0_0_100px_rgba(0,0,0,0.9)] z-0 pointer-events-none" />

      {/* Top bar */}
      <nav className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 h-14 bg-surface/60 backdrop-blur-md border-b border-surface-container-highest">
        <div className="flex flex-col">
          <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">Activity</span>
          <span className="font-headline-lg text-[18px] text-tertiary uppercase leading-none">Pushups</span>
        </div>
        <span className="font-display-lg text-headline-lg-mobile italic uppercase text-primary tracking-wider leading-none">PUSHCHAMP</span>
        <div className="flex flex-col items-end">
          {camError ? (
            <span className="font-label-caps text-label-caps text-red-500 uppercase">Failed</span>
          ) : isLoaded ? (
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-primary-fixed rounded-full animate-pulse" />
              <span className="font-label-caps text-label-caps text-primary-fixed uppercase">Live</span>
            </div>
          ) : (
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">Loading...</span>
          )}
          <span className="font-headline-lg text-[18px] text-tertiary tabular-nums tracking-widest leading-none mt-0.5">{formatTime(elapsed)}</span>
        </div>
      </nav>

      <main className="relative z-10 w-full h-full flex flex-col justify-between pt-20 pb-6 px-5 max-w-[1280px] mx-auto">
        {/* Rep counter - center */}
        <div className="flex flex-col items-center justify-center flex-1 w-full">
          <div className="relative flex flex-col items-center justify-center mt-[-8vh]">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-primary-fixed blur-[80px] opacity-20 rounded-full animate-pulse" />
            <RepAnimation reps={reps} />
            <div className="flex items-baseline gap-2 relative z-10">
              <span className={cn(
                "font-stats-xl text-stats-xl text-primary-fixed drop-shadow-[0_0_12px_rgba(195,244,0,0.6)] transform scale-[2.5] origin-bottom tracking-tighter leading-none transition-all duration-150",
                isDown ? "scale-[2.3] opacity-80" : ""
              )}>
                {reps}
              </span>
            </div>
            <div className="mt-16 bg-surface-container/80 backdrop-blur-md px-6 py-2 rounded-full border border-primary-fixed/30 shadow-[0_0_15px_rgba(195,244,0,0.1)]">
              <span className="font-label-caps text-label-caps text-primary-fixed uppercase tracking-widest">Reps Completed</span>
            </div>
          </div>
        </div>

        {/* Bottom: Form guide + buttons */}
        <footer className="flex flex-col items-center gap-6 w-full max-w-[480px] mx-auto">
          <div className="w-full relative flex flex-col items-center">
            <div className="absolute -top-3 px-3 bg-surface-container z-10 border border-surface-container-highest rounded-full">
              <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">Form Guide</span>
            </div>
            <div className="w-full py-6 border-2 border-dashed border-primary-fixed/40 rounded-xl relative flex flex-col items-center justify-center bg-surface-container/30 backdrop-blur-sm overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-primary-fixed/50 shadow-[0_0_8px_rgba(195,244,0,0.8)] opacity-50 animate-pulse" />
              <Accessibility className="text-primary-fixed/80 w-10 h-10 mb-2" strokeWidth={1} />
              <span className={cn(
                "font-label-caps text-label-caps uppercase bg-background/80 px-3 py-1 rounded border shadow-lg",
                formFeedback ? "text-orange-400 border-orange-400/30" : "text-tertiary border-surface-variant"
              )}>{getFormText()}</span>
            </div>
          </div>

          <div className="w-full flex justify-between gap-4">
            <button
                disabled={!isReady}
                onClick={() => {
                  onStop(reps, elapsed);
                }}
                className="flex-1 bg-transparent text-tertiary font-display-lg text-body-lg uppercase py-4 rounded-lg flex justify-center items-center gap-2 border border-surface-variant hover:bg-surface-container transition-colors shadow-lg leading-none active:scale-95"
            >
                <Square className="w-5 h-5 fill-current" />
                Stop
            </button>
            <button onClick={handlePause} className="flex-1 bg-primary-fixed text-on-primary-fixed font-display-lg text-body-lg uppercase py-4 rounded-lg flex justify-center items-center gap-2 hover:bg-primary-fixed-dim transition-colors shadow-[0_4px_20px_rgba(195,244,0,0.3)] leading-none active:scale-95">
              {isPaused ? <Play className="w-5 h-5 fill-current" /> : <Pause className="w-5 h-5 fill-current" />}
              {isPaused ? 'Resume' : 'Pause'}
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
}
