import { PUSH_PASS_LEVELS, getLevelFromXP, calculateXP } from "@/src/lib/gamification";
import { getWorkouts } from "@/src/lib/storage";
import { cn } from "@/src/lib/utils";
import { Gift, Zap } from 'lucide-react';
import { useState } from 'react';

function progressPercent(level: number, xp: number): number {
  if (level <= 0) return 0;
  if (level >= PUSH_PASS_LEVELS.length) return 100;
  const currentLevelReq = PUSH_PASS_LEVELS[level - 1]?.xpRequired || 0;
  const nextLevelReq = PUSH_PASS_LEVELS[level]?.xpRequired || currentLevelReq;
  const range = nextLevelReq - currentLevelReq;
  if (range <= 0) return 100;
  return Math.min(100, Math.round(((xp - currentLevelReq) / range) * 100));
}

export function PushPass() {
  const workouts = getWorkouts();
  const xp = workouts.reduce((sum, w) => {
    return sum + calculateXP(w.totalReps, w.durationMinutes * 60);
  }, 0);
  
  const currentLevel = getLevelFromXP(xp);

  const [claimed, setClaimed] = useState<number[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('pushchamp_claimed_levels') || '[]');
    } catch { return []; }
  });

  const claimLevel = (levelNum: number) => {
    const updated = [...claimed, levelNum];
    setClaimed(updated);
    localStorage.setItem('pushchamp_claimed_levels', JSON.stringify(updated));
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0A0A0A] pb-24">
      <header className="p-6 pt-12 space-y-2">
        <div className="flex items-center gap-2">
          <div className="bg-[#D4F45D] text-black px-2 py-0.5 rounded font-black italic text-[10px] tracking-tighter">SEASON 1</div>
          <h1 className="text-3xl font-heading text-white">PUSH PASS</h1>
        </div>
        <div className="bg-[#111] p-4 rounded-3xl border border-white/5 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Your Level</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-heading italic text-[#D4F45D]">{currentLevel}</span>
              <span className="text-xs text-gray-400 font-bold">/ 50</span>
            </div>
          </div>
          <div className="flex-1 max-w-[150px] space-y-2">
            <div className="flex justify-between text-[8px] font-bold text-gray-500 uppercase tracking-widest">
              <span>XP: {xp}</span>
              <span>Next: {PUSH_PASS_LEVELS[Math.min(currentLevel, PUSH_PASS_LEVELS.length - 1)]?.xpRequired || 'MAX'}</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#D4F45D] shadow-[0_0_10px_rgba(212,244,93,0.5)] transition-all duration-1000" 
                style={{ width: `${progressPercent(currentLevel, xp)}%` }} 
              />
            </div>
          </div>
        </div>
      </header>

      <div className="px-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-sm tracking-widest text-white">REWARDS</h2>
        </div>

        <div className="space-y-3">
          {PUSH_PASS_LEVELS.slice(0, currentLevel + 5).map((level) => (
            <LevelRow 
              key={level.level} 
              level={level} 
              isUnlocked={currentLevel >= level.level} 
              isClaimed={claimed.includes(level.level)}
              onClaim={() => claimLevel(level.level)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function LevelRow({ level, isUnlocked, isClaimed, onClaim }: { level: any; isUnlocked: boolean; isClaimed: boolean; onClaim: () => void }) {
  return (
    <div className={cn(
      "relative p-4 rounded-[2rem] border transition-all duration-300",
      isUnlocked ? "bg-white/5 border-white/10" : "bg-black border-white/5 opacity-60"
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center font-heading italic text-xl",
            isUnlocked ? "bg-[#D4F45D] text-black" : "bg-white/5 text-gray-500"
          )}>
            {level.level}
          </div>
          <div className="space-y-0.5">
            <h4 className="font-bold text-white text-sm">{level.reward}</h4>
            <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">{level.type}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isClaimed ? (
            <div className="bg-white/10 text-white/40 px-4 py-2 rounded-full font-black italic text-[10px] tracking-widest">
              CLAIMED
            </div>
          ) : isUnlocked ? (
            <button 
              onClick={onClaim}
              className="bg-[#D4F45D] text-black px-4 py-2 rounded-full font-black italic text-[10px] tracking-widest active:scale-95 transition-transform shadow-[0_0_15px_rgba(212,244,93,0.3)]"
            >
              CLAIM
            </button>
          ) : (
            <Gift className="text-gray-700" size={20} />
          )}
        </div>
      </div>
      
      <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none">
        <Zap size={60} />
      </div>
    </div>
  );
}
