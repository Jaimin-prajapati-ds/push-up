import { Settings, Dumbbell, Repeat, Timer, ChevronDown, TrendingUp } from "lucide-react";
import { getWorkouts, getWeeklyStats } from "@/src/lib/storage";

export function History({ onOpenSettings }: { onOpenSettings: () => void }) {
  const stats = getWeeklyStats();
  const workouts = getWorkouts().reverse();

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return "TODAY";
    const month = d.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
    return month;
  };

  return (
    <div className="flex flex-col min-h-screen pb-32 md:pb-12 pt-8">
      <nav className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 h-16 bg-surface/70 backdrop-blur-md border-b border-surface-container-highest">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary-fixed" />
          <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">History</span>
        </div>
        <div className="font-display-lg text-headline-lg italic uppercase text-primary tracking-wider">
          PUSHCHAMP
        </div>
        <button onClick={onOpenSettings} className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors rounded-xl active:scale-95 duration-100">
          <Settings className="w-5 h-5" />
        </button>
      </nav>

      <main className="mt-16 px-5 max-w-7xl mx-auto flex flex-col gap-8 w-full">
        {/* Weekly Stats */}
        <section className="relative w-full rounded-xl overflow-hidden border border-surface-container-highest bg-surface-container isolate group">
          <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary-container/5 via-transparent to-primary-fixed/5" />
          <div className="relative z-10 p-6 md:p-8 flex flex-col gap-6">
            <header className="flex justify-between items-center">
              <h2 className="font-label-caps text-label-caps text-primary uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 bg-primary-fixed rounded-full animate-pulse" />
                THIS WEEK
              </h2>
            </header>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 border-t border-surface-container-highest pt-6">
              <div className="flex flex-col">
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-1">TOTAL VOLUME</span>
                <span className="font-stats-xl text-headline-lg md:text-stats-xl text-primary-fixed leading-none mt-2">{(stats.totalVolume / 1000).toFixed(1)}<span className="text-headline-lg-mobile text-primary">k</span></span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-1">WORKOUTS</span>
                <span className="font-stats-xl text-headline-lg md:text-stats-xl text-primary leading-none mt-2">{stats.workoutsCount}</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-1">TIME</span>
                <span className="font-stats-xl text-headline-lg md:text-stats-xl text-primary leading-none mt-2">
                  <span className="flex items-baseline gap-1">
                    {Math.floor(stats.timeUnderTension / 60)}<span className="text-headline-lg-mobile text-on-surface-variant">H</span>
                    {stats.timeUnderTension % 60}<span className="text-headline-lg-mobile text-on-surface-variant">M</span>
                  </span>
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-1">INTENSITY</span>
                <span className="font-stats-xl text-headline-lg md:text-stats-xl text-primary leading-none mt-2">{stats.avgIntensity || 0}<span className="text-headline-lg-mobile text-primary-fixed">%</span></span>
              </div>
            </div>
          </div>
        </section>

        {/* Previous Workouts */}
        <section className="flex flex-col gap-4">
          <h3 className="font-headline-lg-mobile md:font-headline-lg text-primary uppercase tracking-wide">PREVIOUS WORKOUTS</h3>
          <div className="flex flex-col border-y border-surface-variant bg-surface-container/50">
            {workouts.length === 0 ? (
              <div className="p-8 text-center text-on-surface-variant font-label-caps tracking-widest uppercase">No workouts yet</div>
            ) : workouts.map((w, i) => (
              <div key={w.id} className="relative flex flex-col md:flex-row md:items-center justify-between p-4 md:p-6 border-b border-surface-variant last:border-0 hover:bg-surface-container-high transition-colors group">
                {i === 0 && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-fixed" />}
                <div className="flex items-start md:items-center gap-4 md:gap-6 w-full md:w-auto">
                  <div className={`flex flex-col items-center justify-center w-14 h-14 min-w-[56px] bg-surface border rounded-lg ${i === 0 ? 'border-primary-fixed/30 shadow-[0_0_10px_rgba(195,244,0,0.1)]' : 'border-surface-variant'}`}>
                    <span className={`font-label-caps text-label-caps leading-none mb-0.5 ${i === 0 ? 'text-primary-fixed' : 'text-on-surface-variant'}`}>{formatDate(w.date)}</span>
                    <span className={`font-display-lg text-headline-lg-mobile leading-none ${i === 0 ? 'text-primary' : 'text-secondary'}`}>{new Date(w.date).getDate()}</span>
                  </div>
                  <div className="flex flex-col gap-1 flex-grow">
                    <h4 className="font-headline-lg-mobile text-[16px] text-primary uppercase tracking-wide group-hover:text-primary-fixed transition-colors">PUSHUPS ROUTINE</h4>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                      <div className="flex items-center gap-1 font-label-caps text-label-caps text-on-surface-variant">
                        <Repeat className={`w-3.5 h-3.5 ${i === 0 ? 'text-primary-fixed' : ''}`} />
                        <span className={i === 0 ? 'text-primary' : 'text-secondary'}>{w.totalReps}</span> REPS
                      </div>
                      <div className="flex items-center gap-1 font-label-caps text-label-caps text-on-surface-variant">
                        <Timer className={`w-3.5 h-3.5 ${i === 0 ? 'text-primary-fixed' : ''}`} />
                        <span className={i === 0 ? 'text-primary' : 'text-secondary'}>{w.durationMinutes}</span> MIN
                      </div>
                      <div className="flex items-center gap-1 font-label-caps text-label-caps text-on-surface-variant">
                        <Dumbbell className={`w-3.5 h-3.5 ${i === 0 ? 'text-primary-fixed' : ''}`} />
                        <span className={i === 0 ? 'text-primary' : 'text-secondary'}>{w.calories}</span> KCAL
                      </div>
                    </div>
                  </div>
                </div>
                {/* Real mini chart from rep count */}
                <div className="mt-3 md:mt-0 flex items-end justify-between gap-0.5 h-8 w-20 ml-auto">
                  {(() => {
                    const maxReps = Math.max(...workouts.slice(Math.max(0, i - 2), i + 3).map(x => x.totalReps), 1);
                    return workouts.slice(Math.max(0, i - 2), i + 3).map((x, j) => (
                      <div key={j} className={`flex-1 rounded-t-sm transition-all ${j === Math.min(2, i) ? 'bg-primary-fixed shadow-[0_0_6px_rgba(195,244,0,0.4)]' : 'bg-surface-container-highest'}`} style={{ height: `${Math.max(15, (x.totalReps / maxReps) * 100)}%` }} />
                    ));
                  })()}
                </div>
              </div>
            ))}
          </div>
          
          {workouts.length > 5 && (
            <button className="mt-2 py-3 w-full border border-surface-variant text-primary font-label-caps text-label-caps uppercase tracking-widest hover:bg-surface-container hover:border-primary-fixed transition-all duration-200 flex items-center justify-center gap-2 group rounded-xl">
              LOAD MORE
              <ChevronDown className="w-4 h-4 group-hover:translate-y-1 transition-transform" />
            </button>
          )}
        </section>
      </main>
    </div>
  );
}
