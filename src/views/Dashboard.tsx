import { useEffect } from "react";
import { Play, Settings, TrendingUp, Trophy, Dumbbell, Calendar, Flame, Shield, Star } from "lucide-react";
import { getWeeklyStats, getLifetimeStats, getWorkouts, getStreak, getTotalLifetimeReps, getUserLevel } from "@/src/lib/storage";
import { getUserProfile } from "@/src/lib/userProfile";
import { showBannerAd, hideBannerAd } from "@/src/lib/admob";

export function Dashboard({ onStartWorkout, onOpenSettings }: { onStartWorkout: () => void; onOpenSettings: () => void }) {
  useEffect(() => {
    showBannerAd();
    return () => {
      hideBannerAd();
    };
  }, []);

  const stats = getWeeklyStats();
  const lifetime = getLifetimeStats();
  const workouts = getWorkouts();
  const profile = getUserProfile();
  const latestWorkout = workouts.length > 0 ? workouts[workouts.length - 1] : null;

  const streak = getStreak();
  const totalReps = getTotalLifetimeReps();
  const userLevel = getUserLevel(totalReps);

  const volumeGoal = profile.weeklyGoalReps * Math.round(profile.weightKg * 0.64);
  const progressPercent = volumeGoal > 0 ? Math.min(100, Math.floor(((stats.totalVolume || 0) / volumeGoal) * 100)) : 0;

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return "TODAY";
    const month = d.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
    return `${month} ${d.getDate()}`;
  };

  return (
    <div className="flex flex-col min-h-screen pb-32 pt-20">
      <header className="bg-surface/70 backdrop-blur-md border-b border-surface-container-highest fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 h-16">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary-fixed" />
          <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">Dashboard</span>
        </div>
        <h1 className="font-display-lg text-headline-lg italic uppercase text-primary tracking-wider">PUSHCHAMP</h1>
        <button onClick={onOpenSettings} className="text-on-surface-variant hover:bg-surface-container-high transition-colors p-2 rounded-full flex items-center justify-center">
          <Settings className="w-5 h-5" />
        </button>
      </header>
      
      <main className="max-w-7xl mx-auto px-5 md:grid md:grid-cols-12 md:gap-4 w-full">
        <div className="col-span-12 md:col-span-8 md:col-start-3 flex flex-col gap-6">
          
          {/* Level & Gamification Banner */}
          <section className="bg-gradient-to-br from-surface-container to-surface-container-high rounded-2xl p-5 border border-surface-container-highest shadow-xl relative overflow-hidden mt-2">
            <div className="absolute -right-6 -top-6 text-primary-fixed/5">
              <Shield className="w-32 h-32" />
            </div>
            <div className="flex justify-between items-start relative z-10">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-primary-fixed fill-primary-fixed" />
                  <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">Lvl {userLevel.levelNumber}</span>
                </div>
                <h2 className="font-headline-lg text-[24px] uppercase text-on-surface tracking-wide leading-none">{userLevel.title}</h2>
              </div>
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-1 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
                  <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
                  <span className="font-stats-xl text-[18px] text-orange-500 leading-none mt-1">{streak}</span>
                </div>
                <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest mt-1">Day Streak</span>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2 relative z-10">
              <div className="flex justify-between items-end">
                <span className="font-label-caps text-xs text-primary-fixed uppercase tracking-wider">{totalReps} Reps</span>
                <span className="font-label-caps text-xs text-on-surface-variant uppercase tracking-wider">{userLevel.repsToNext} to {userLevel.nextLevelTitle}</span>
              </div>
              <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
                <div className="h-full bg-primary-fixed transition-all duration-1000 ease-out rounded-full" style={{ width: `${userLevel.progressPercent}%` }} />
              </div>
            </div>
          </section>

          {/* Progress Ring */}
          <section className="flex flex-col items-center justify-center relative py-4 bg-surface-container/30 rounded-2xl border border-surface-container-highest">
            <div className="relative w-48 h-48 flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                <circle className="text-surface-container-highest" cx="96" cy="96" fill="transparent" r="80" stroke="currentColor" strokeWidth="12" />
                <circle className="text-primary-container transition-all duration-1000 ease-out" cx="96" cy="96" fill="transparent" r="80" stroke="currentColor" strokeDasharray="502" strokeDashoffset={502 - (502 * progressPercent) / 100} strokeLinecap="round" strokeWidth="12" />
              </svg>
              <div className="flex flex-col items-center text-center z-10">
                <span className="font-stats-xl text-stats-xl text-primary-container">{progressPercent || 0}<span className="text-headline-lg font-headline-lg">%</span></span>
                <span className="font-label-caps text-[11px] text-on-surface-variant uppercase tracking-widest mt-1">WEEKLY GOAL</span>
              </div>
            </div>
          </section>

          {/* PRs */}
          <section className="flex flex-col gap-2">
            <h2 className="font-headline-lg text-[16px] uppercase text-on-surface-variant tracking-wider px-1">Stats</h2>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-surface-container rounded-xl p-4 border border-surface-container-highest flex flex-col gap-2 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 h-16 bg-primary-container/10 blur-xl rounded-full -mr-4 -mt-4 transition-all group-hover:bg-primary-container/20" />
                <Trophy className="w-5 h-5 text-primary-fixed mb-1" />
                <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">BEST SET</span>
                <div className="flex items-baseline gap-1 mt-auto">
                  <span className="font-stats-xl text-[24px] text-primary-fixed leading-none mt-1">{lifetime.maxReps || 0}</span>
                </div>
              </div>
              <div className="bg-surface-container rounded-xl p-4 border border-surface-container-highest flex flex-col gap-2 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 h-16 bg-primary-container/10 blur-xl rounded-full -mr-4 -mt-4 transition-all group-hover:bg-primary-container/20" />
                <Dumbbell className="w-5 h-5 text-primary-fixed mb-1" />
                <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">TOTAL</span>
                <div className="flex items-baseline gap-1 mt-auto">
                  <span className="font-stats-xl text-[24px] text-primary-fixed leading-none mt-1">{lifetime.totalWorkouts || 0}</span>
                </div>
              </div>
              <div className="bg-surface-container rounded-xl p-4 border border-surface-container-highest flex flex-col gap-2 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 h-16 bg-primary-container/10 blur-xl rounded-full -mr-4 -mt-4 transition-all group-hover:bg-primary-container/20" />
                <Calendar className="w-5 h-5 text-primary-fixed mb-1" />
                <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">WEEKLY</span>
                <div className="flex items-baseline gap-1 mt-auto">
                  <span className="font-stats-xl text-[24px] text-primary-fixed leading-none mt-1">{stats.workoutsCount}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Latest Workout */}
          <section className="flex flex-col gap-2">
            <h2 className="font-headline-lg text-[16px] uppercase text-on-surface-variant tracking-wider px-1">Latest Workout</h2>
            {latestWorkout ? (
              <div className="bg-surface-container rounded-xl border border-surface-container-highest overflow-hidden relative group">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-container z-10" />
                <div className="relative py-5 px-4 w-full overflow-hidden bg-gradient-to-r from-primary-container/5 via-transparent to-transparent">
                  <div className="flex flex-col">
                    <h3 className="font-headline-lg text-[18px] text-primary uppercase leading-tight">Routine</h3>
                    <span className="font-label-caps text-[11px] tracking-wider text-on-surface-variant mt-1">{formatDate(latestWorkout.date)} • {latestWorkout.durationMinutes}M</span>
                  </div>
                </div>
                <div className="p-4 grid grid-cols-3 gap-4 border-t border-surface-container-highest bg-surface-container">
                  <div className="flex flex-col">
                    <span className="font-label-caps text-[10px] tracking-widest text-on-surface-variant">REPS</span>
                    <span className="font-body-lg text-[20px] text-on-surface font-semibold text-primary-container leading-none mt-1">{latestWorkout.totalReps}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-label-caps text-[10px] tracking-widest text-on-surface-variant">TIME</span>
                    <span className="font-body-lg text-[20px] text-on-surface font-semibold text-primary-container leading-none mt-1">{latestWorkout.durationMinutes}m</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-label-caps text-[10px] tracking-widest text-on-surface-variant">KCAL</span>
                    <span className="font-body-lg text-[20px] text-on-surface font-semibold text-primary-container leading-none mt-1">{latestWorkout.calories}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-surface-container rounded-xl p-8 border border-surface-container-highest text-center text-on-surface-variant font-label-caps tracking-widest uppercase text-sm">
                No workouts yet — tap START below!
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Start button */}
      <div className="fixed bottom-24 left-0 w-full px-5 z-40 flex justify-center pointer-events-none md:bottom-8">
        <button onClick={onStartWorkout} className="pointer-events-auto w-full max-w-sm bg-primary-container text-black font-headline-lg text-headline-lg uppercase py-4 rounded-xl flex justify-center items-center gap-2 border-[1.5px] border-primary-container shadow-[0_0_20px_rgba(195,244,0,0.2)] hover:shadow-[0_0_30px_rgba(195,244,0,0.4)] transition-all duration-200 active:scale-95 leading-none">
          <Play className="fill-black w-6 h-6" />
          START WORKOUT
        </button>
      </div>
    </div>
  );
}
