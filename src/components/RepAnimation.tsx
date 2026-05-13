import { useState, useEffect } from 'react';

interface RepAnimationProps {
  reps: number;
}

export function RepAnimation({ reps }: RepAnimationProps) {
  const [showPulse, setShowPulse] = useState(false);
  const [prevReps, setPrevReps] = useState(reps);

  useEffect(() => {
    if (reps !== prevReps && reps > 0) {
      setShowPulse(true);
      setPrevReps(reps);
      const timer = setTimeout(() => setShowPulse(false), 400);
      return () => clearTimeout(timer);
    }
  }, [reps, prevReps]);

  if (!showPulse) return null;

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
      <div className="absolute w-32 h-32 border-2 border-primary-fixed/60 rounded-full animate-ping" />
      <div className="absolute w-20 h-20 bg-primary-fixed/20 rounded-full animate-pulse" />
      <div className="absolute animate-bounce">
        <span className="font-display-lg text-headline-lg text-primary-fixed drop-shadow-[0_0_10px_rgba(195,244,0,0.8)]">+1</span>
      </div>
    </div>
  );
}

interface MilestoneAnimationProps {
  milestone: number | null;
  onDone: () => void;
}

export function MilestoneAnimation({ milestone, onDone }: MilestoneAnimationProps) {
  useEffect(() => {
    if (milestone) {
      const timer = setTimeout(onDone, 2000);
      return () => clearTimeout(timer);
    }
  }, [milestone, onDone]);

  if (!milestone) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[60] flex items-center justify-center">
      <div className="flex flex-col items-center gap-2 animate-bounce">
        <span className="font-stats-xl text-[48px] text-primary-container drop-shadow-[0_0_30px_rgba(195,244,0,0.8)] leading-none">
          🔥 {milestone}
        </span>
        <span className="font-label-caps text-label-caps text-primary-fixed tracking-widest uppercase bg-surface-container/80 px-4 py-1 rounded-full backdrop-blur-sm">
          MILESTONE!
        </span>
      </div>
    </div>
  );
}
