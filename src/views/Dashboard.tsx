import { useEffect } from "react";
import { Bell, Calendar, TrendingUp, Trophy, Dumbbell, Target, CheckCircle2, ChevronRight, Shield, Zap, Star } from "lucide-react";
import { getWorkouts, getWeeklyStats, getLifetimeStats, getStreak, getTotalLifetimeReps, getUserLevel } from "@/src/lib/storage";
import { getUserProfile, calculateVolume } from "@/src/lib/userProfile";
import { showBannerAd, hideBannerAd } from "@/src/lib/admob";

export function Dashboard({ onStartWorkout, onOpenSettings }: { onStartWorkout: () => void; onOpenSettings: () => void }) {
  useEffect(() => {
    const init = async () => {
      try { await showBannerAd(); } catch (e) {}
    };
    init();
    return () => { hideBannerAd(); };
  }, []);

  const workouts = getWorkouts();
  const stats = getWeeklyStats();
  const lifetime = getLifetimeStats();
  const profile = getUserProfile();
  const streak = getStreak();
  const totalReps = getTotalLifetimeReps();
  const userLevel = getUserLevel(totalReps);
  
  const weeklyGoal = profile.weeklyGoalReps || 200;
  // Fix 15: Correct progress calculation based on volume/reps
  const progressPercent = Math.min(100, Math.floor((stats.totalVolume / weeklyGoal) * 100));

  // Fix 13: Calculate dynamic bar heights
  const dayReps = [0, 0, 0, 0, 0, 0, 0]; // Mon to Sun
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  workouts.filter(w => new Date(w.date) >= oneWeekAgo).forEach(w => {
    const d = new Date(w.date).getDay(); // 0=Sun, 1=Mon...
    const idx = d === 0 ? 6 : d - 1;   // Convert to Mon=0 index
    dayReps[idx] += w.totalReps;
  });

  const maxReps = Math.max(...dayReps, 1);
  const barHeights = dayReps.map(r => Math.round((r / maxReps) * 100) + '%');
  const todayIdx = now.getDay() === 0 ? 6 : now.getDay() - 1;

  return (
    <div className="flex flex-col min-h-screen bg-[#000] pb-24 font-sans selection:bg-[#D4F45D] selection:text-black">
      <div className="bg-mesh" />

      {/* Header */}
      <header className="fixed top-0 left-0 w-full h-20 flex items-center justify-between px-8 z-50 bg-black/60 backdrop-blur-2xl border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#D4F45D] flex items-center justify-center rounded-xl rotate-[-4deg] shadow-[0_0_20px_rgba(212,244,93,0.3)]">
            <span className="text-black font-black text-2xl tracking-tighter italic">P</span>
          </div>
          <h1 className="font-heading text-2xl italic tracking-[-0.05em] text-white">PUSHCHAMP</h1>
        </div>
        <button className="relative w-12 h-12 flex items-center justify-center bg-white/5 rounded-2xl border border-white/10 active:scale-90 transition-transform">
          <Bell className="w-6 h-6 text-white" />
          <div className="absolute top-3 right-3 w-2 h-2 bg-[#D4F45D] rounded-full shadow-[0_0_10px_#D4F45D]" />
        </button>
      </header>

      <main className="pt-24 px-6 space-y-8 max-w-xl mx-auto">
        {/* Welcome Section */}
        <div className="space-y-1 animate-in">
          <div className="flex items-center gap-2 mb-2">
            <span className="h-px w-8 bg-[#D4F45D]" />
            <p className="text-[#D4F45D] font-bold text-[10px] tracking-[0.3em] uppercase">Champion Performance</p>
          </div>
          <h2 className="text-5xl font-heading leading-[0.85] text-white italic">
            LIMITLESS <br />
            <span className="text-[#D4F45D] tracking-tighter">POTENTIAL.</span>
          </h2>
        </div>

        {/* Hero Workout Card with Real Image */}
        <div className="relative group animate-in" style={{ animationDelay: '0.1s' }}>
          <div className="relative h-[420px] w-full rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl">
            <img 
              src="/assets/hero.png" 
              alt="Workout Hero" 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            
            <div className="absolute bottom-8 left-8 right-8 space-y-6">
              <div className="space-y-1">
                <p className="text-white/60 font-bold text-[10px] tracking-[0.2em] uppercase">Daily Target</p>
                <h3 className="text-4xl font-heading text-white italic">PRO PUSH-UPS</h3>
              </div>
              
              <div className="flex items-center gap-4">
                <button 
                  onClick={onStartWorkout}
                  className="flex-1 bg-[#D4F45D] text-black h-16 rounded-[2rem] font-black italic text-lg flex items-center justify-center gap-2 shadow-[0_10px_40px_rgba(212,244,93,0.3)] active:scale-95 transition-all"
                >
                  START SESSION <ChevronRight size={22} />
                </button>
                <button onClick={onOpenSettings} className="w-16 h-16 bg-white/10 backdrop-blur-xl border border-white/20 rounded-[1.8rem] flex items-center justify-center text-white active:scale-90 transition-all">
                  <Calendar size={24} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-4 gap-3 animate-in" style={{ animationDelay: '0.2s' }}>
          <MetricBox icon={<Zap size={18} />} label="Streak" value={streak} unit="DAYS" />
          <MetricBox icon={<Target size={18} />} label="Total" value={totalReps} unit="REPS" />
          <MetricBox icon={<Dumbbell size={18} />} label="Volume" value={stats.totalVolume.toLocaleString()} unit="KG" />
          <MetricBox icon={<Trophy size={18} />} label="Progress" value={progressPercent} unit="PERCENT" color="#D4F45D" />
        </div>

        {/* Weekly Analysis */}
        <section className="space-y-4 animate-in" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-bold tracking-[0.3em] text-white/50 uppercase">Weekly Activity</h3>
            <button className="text-[#D4F45D] text-[10px] font-black tracking-widest uppercase">Analysis</button>
          </div>
          <div className="bg-[#111] p-8 rounded-[3rem] border border-white/5 flex items-center justify-between">
            <div className="flex items-end gap-3 h-32 flex-1">
              <Bar height={barHeights[0]} label="M" active={todayIdx === 0} />
              <Bar height={barHeights[1]} label="T" active={todayIdx === 1} />
              <Bar height={barHeights[2]} label="W" active={todayIdx === 2} />
              <Bar height={barHeights[3]} label="T" active={todayIdx === 3} />
              <Bar height={barHeights[4]} label="F" active={todayIdx === 4} />
              <Bar height={barHeights[5]} label="S" active={todayIdx === 5} />
              <Bar height={barHeights[6]} label="S" active={todayIdx === 6} />
            </div>
            <div className="w-px h-24 bg-white/5 mx-6" />
            <div className="flex flex-col items-end gap-1">
              <span className="text-4xl font-heading italic text-white leading-none">{progressPercent}%</span>
              <span className="text-[9px] font-bold text-[#D4F45D] uppercase tracking-widest">Mastery</span>
            </div>
          </div>
        </section>

        {/* Native Ad Slot - High Revenue */}
        <div className="bg-white/5 p-1 rounded-[3rem] border border-white/5 overflow-hidden">
          <div className="bg-[#111] p-6 rounded-[2.8rem] flex flex-col items-center gap-4">
            <div className="flex items-center gap-3 w-full">
              <div className="w-10 h-10 bg-white/5 rounded-xl border border-white/10" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-32 bg-white/5 rounded-full" />
                <div className="h-2 w-20 bg-white/5 rounded-full opacity-50" />
              </div>
              <div className="px-4 py-2 bg-[#D4F45D] text-black text-[10px] font-black italic rounded-lg">PROMOTED</div>
            </div>
            <div className="w-full h-40 bg-white/5 rounded-[2rem] border border-white/5 flex items-center justify-center">
              <span className="text-[10px] font-bold tracking-[0.4em] text-white/20 uppercase">Premium Content</span>
            </div>
          </div>
        </div>

        {/* Achievement Badges */}
        <section className="space-y-4 animate-in" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-bold tracking-[0.3em] text-white/50 uppercase">Milestones</h3>
          </div>
          <div className="flex justify-between items-center gap-4 px-2 overflow-x-auto hide-scrollbar pb-2">
            <Badge icon={<Shield size={20} />} value={userLevel.levelNumber} label="LEVEL" />
            <Badge icon={<CheckCircle2 size={20} />} value={lifetime.totalWorkouts} label="WORKOUTS" />
            <Badge icon={<Star size={20} />} value={lifetime.maxReps} label="MAX REPS" />
            <Badge icon={<TrendingUp size={20} />} value="PRO" label="STATUS" />
          </div>
        </section>
      </main>
    </div>
  );
}

function MetricBox({ icon, label, value, unit, color }: { icon: any; label: string; value: string | number; unit: string; color?: string }) {
  return (
    <div className="bg-[#111] p-4 rounded-[1.8rem] border border-white/5 flex flex-col items-center justify-center space-y-1.5 transition-colors hover:bg-white/5">
      <div style={{ color: color || '#D4F45D' }} className="opacity-80">{icon}</div>
      <div className="text-center">
        <p className="text-xl font-heading italic text-white leading-none">{value}</p>
        <p className="text-[8px] text-white/30 font-bold uppercase tracking-widest mt-1">{unit}</p>
      </div>
    </div>
  );
}

function Bar({ height, label, active }: { height: string; label: string; active?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-3 flex-1 h-full justify-end">
      <div className="w-full bg-white/5 rounded-full overflow-hidden flex flex-col justify-end h-full">
        <div 
          className={`w-full rounded-full transition-all duration-700 ease-out ${active ? 'bg-[#D4F45D] shadow-[0_0_20px_rgba(212,244,93,0.4)]' : 'bg-white/10'}`} 
          style={{ height }} 
        />
      </div>
      <span className={`text-[9px] font-black tracking-widest ${active ? 'text-[#D4F45D]' : 'text-white/20'}`}>{label}</span>
    </div>
  );
}

function Badge({ icon, value, label }: { icon: any; value: string | number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-3 flex-shrink-0">
      <div className="w-16 h-16 glass-morphism rounded-2xl flex items-center justify-center relative overflow-hidden group">
        <div className="absolute inset-0 bg-[#D4F45D]/5 group-hover:bg-[#D4F45D]/10 transition-colors" />
        <div className="relative z-10 flex flex-col items-center">
          <div className="text-[#D4F45D] mb-0.5">{icon}</div>
          <span className="text-[10px] font-black italic text-white leading-none">{value}</span>
        </div>
      </div>
      <span className="text-[8px] text-white/40 font-bold tracking-[0.2em] uppercase">{label}</span>
    </div>
  );
}
