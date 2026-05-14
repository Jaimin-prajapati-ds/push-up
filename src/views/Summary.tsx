import { useEffect, useRef } from "react";
import { CheckCircle2, Timer, Dumbbell, Weight, Share2, ChevronRight, Trophy, Zap } from "lucide-react";
import { saveWorkout } from "@/src/lib/storage";
import { getUserProfile, calculateVolume } from "@/src/lib/userProfile";
import { playWorkoutComplete } from "@/src/lib/sounds";
import { vibrateComplete } from "@/src/lib/haptics";
import { showInterstitialAd } from "@/src/lib/admob";

export function Summary({ reps, duration, onClose }: { reps: number; duration: number; onClose: () => void }) {
  const profile = getUserProfile();
  const durationMinutes = Math.max(1, Math.round(duration / 60));

  const volume = calculateVolume(reps, profile.weightKg);
  
  const savedRef = useRef(false);
  
  useEffect(() => {
    if (!savedRef.current) {
      saveWorkout({
        id: Date.now().toString(),
        date: new Date().toISOString(),
        durationMinutes,

        totalReps: reps,
        volume,
      });
      savedRef.current = true;
      playWorkoutComplete();
      vibrateComplete();
    }
  }, []);

  const handleDone = async () => {
    try { await showInterstitialAd(); } catch (e) {}
    onClose();
  };

  const handleShare = async () => {
    const text = `I just hit ${reps} push-ups in ${durationMinutes} min with PushChamp! 💪`;
    if (navigator.share) {
      try { await navigator.share({ title: 'PushChamp Workout', text }); } catch {}
    } else {
      try { await navigator.clipboard.writeText(text); } catch {}
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0A0A0A] text-white p-6 pb-12 overflow-y-auto hide-scrollbar">
      {/* Success Animation Area */}
      <div className="flex flex-col items-center justify-center pt-12 pb-8 space-y-4">
        <div className="relative">
          <div className="absolute inset-0 bg-[#D4F45D] blur-3xl opacity-20 animate-pulse" />
          <div className="relative w-32 h-32 bg-[#D4F45D]/10 rounded-full border-2 border-[#D4F45D]/30 flex items-center justify-center shadow-[0_0_50px_rgba(212,244,93,0.1)]">
            <Trophy className="w-16 h-16 text-[#D4F45D]" strokeWidth={1.5} />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-[#D4F45D] text-black p-2 rounded-full shadow-lg">
            <CheckCircle2 size={24} />
          </div>
        </div>
        <div className="text-center space-y-1">
          <h1 className="text-4xl font-heading italic leading-none">WORKOUT</h1>
          <h2 className="text-2xl font-bold tracking-[0.2em] text-[#D4F45D] uppercase leading-none">Complete!</h2>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <SummaryStat icon={<Timer size={20} />} label="Duration" value={durationMinutes} unit="MIN" />
        <SummaryStat icon={<Dumbbell size={20} />} label="Total Reps" value={reps} unit="REPS" />
        <SummaryStat icon={<Weight size={20} />} label="Volume" value={(volume / 1000).toFixed(1)} unit="K" />
        <SummaryStat icon={<Zap size={20} />} label="Pace" value={durationMinutes > 0 ? Math.round(reps / durationMinutes) : 0} unit="RPM" />
      </div>

      {/* Performance Card */}
      <div className="bg-[#111] rounded-[2.5rem] p-6 border border-white/5 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Trophy size={80} className="text-[#D4F45D]" />
        </div>
        <div className="relative z-10 space-y-4">
          <div className="space-y-1">
            <p className="text-[#D4F45D] font-bold text-[10px] tracking-widest uppercase">Performance Rank</p>
            <h3 className="text-3xl font-heading text-white">
              {reps >= 50 ? 'ELITE BEAST' : reps >= 30 ? 'ALPHA CHAMP' : 'RISING STAR'}
            </h3>
          </div>
          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-[#D4F45D] shadow-[0_0_10px_rgba(212,244,93,0.5)]" style={{ width: `${Math.min(100, reps * 2)}%` }} />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-auto space-y-3">
        <button 
          onClick={handleDone}
          className="w-full py-6 bg-[#D4F45D] text-black rounded-[2rem] font-black italic uppercase tracking-[0.2em] shadow-[0_4px_30px_rgba(212,244,93,0.3)] active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          FINISH SESSION <ChevronRight size={20} />
        </button>
        
        <button 
          onClick={handleShare}
          className="w-full py-5 bg-white/5 border border-white/10 text-white rounded-[2rem] font-bold uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <Share2 size={18} /> SHARE PROGRESS
        </button>
      </div>
    </div>
  );
}

function SummaryStat({ icon, label, value, unit }: { icon: any; label: string; value: string | number; unit: string }) {
  return (
    <div className="bg-[#111] p-5 rounded-[2rem] border border-white/5 flex flex-col items-center justify-center space-y-2">
      <div className="text-[#D4F45D] opacity-60">{icon}</div>
      <div className="text-center">
        <p className="text-[28px] font-black italic leading-none text-white">{value}</p>
        <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mt-1">{unit}</p>
      </div>
    </div>
  );
}
