import { useState, useEffect } from 'react';
import { playCountdownTick, playCountdownGo } from '@/src/lib/sounds';
import { vibrateCountdown, vibrateGo } from '@/src/lib/haptics';

interface CountdownProps {
  seconds: number;
  onComplete: () => void;
}

export function Countdown({ seconds, onComplete }: CountdownProps) {
  const [count, setCount] = useState(seconds);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (count <= 0) {
      playCountdownGo();
      vibrateGo();
      onComplete();
      return;
    }

    playCountdownTick();
    vibrateCountdown();
    setScale(1.3);
    const scaleTimer = setTimeout(() => setScale(1), 200);

    const timer = setTimeout(() => {
      setCount(c => c - 1);
    }, 1000);

    return () => {
      clearTimeout(timer);
      clearTimeout(scaleTimer);
    };
  }, [count, onComplete]);

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center">
      {/* Pulsing background glow */}
      <div className="absolute w-64 h-64 bg-[#D4F45D]/20 rounded-full blur-[100px] animate-pulse" />
      
      <div className="relative flex flex-col items-center gap-8">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em]">
          GET IN POSITION
        </span>
        
        <div 
          className="transition-transform duration-200 ease-out"
          style={{ transform: `scale(${scale})` }}
        >
          {count > 0 ? (
            <span className="font-heading text-[120px] leading-none text-[#D4F45D] drop-shadow-[0_0_40px_rgba(195,244,0,0.5)]">
              {count}
            </span>
          ) : (
            <span className="font-heading text-[80px] leading-none text-[#D4F45D] drop-shadow-[0_0_40px_rgba(195,244,0,0.8)]">
              GO!
            </span>
          )}
        </div>

        <div className="flex flex-col items-center gap-3 mt-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-[#D4F45D] rounded-full animate-pulse" />
            <span className="text-sm text-gray-400">
              Place phone on floor, lean against something
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-[#D4F45D] rounded-full animate-pulse" />
            <span className="text-sm text-gray-400">
              Position yourself side-on to camera
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
