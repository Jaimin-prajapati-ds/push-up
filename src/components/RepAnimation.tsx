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
      <div className="absolute w-32 h-32 border-2 border-[#D4F45D]/60 rounded-full animate-ping" />
      <div className="absolute w-20 h-20 bg-[#D4F45D]/20 rounded-full animate-pulse" />
      <div className="absolute animate-bounce">
        <span className="font-heading text-lg text-[#D4F45D] drop-shadow-[0_0_10px_rgba(195,244,0,0.8)]">+1</span>
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
        <span className="font-heading text-[48px] text-[#D4F45D] drop-shadow-[0_0_30px_rgba(195,244,0,0.8)] leading-none">
          {milestone}
        </span>
        <span className="text-[10px] font-bold text-[#D4F45D] tracking-widest uppercase bg-black/80 px-4 py-1 rounded-full backdrop-blur-sm">
          MILESTONE!
        </span>
      </div>
    </div>
  );
}
