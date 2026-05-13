import { useEffect, useRef } from "react";
import { CheckCircle, Timer, Flame, Dumbbell, Weight, Share2, Instagram } from "lucide-react";
import { saveWorkout } from "@/src/lib/storage";
import { getUserProfile, calculateCalories, calculateVolume } from "@/src/lib/userProfile";
import { playWorkoutComplete } from "@/src/lib/sounds";
import { vibrateComplete } from "@/src/lib/haptics";
import { showInterstitialAd } from "@/src/lib/admob";

export function Summary({ reps, durationSeconds, onDone }: { reps: number; durationSeconds: number; onDone: () => void }) {
  const profile = getUserProfile();
  const durationMinutes = Math.max(1, Math.round(durationSeconds / 60));
  const calories = calculateCalories(durationSeconds, profile.weightKg);
  const volume = calculateVolume(reps, profile.weightKg);
  
  const savedRef = useRef(false);
  
  useEffect(() => {
    if (!savedRef.current) {
      saveWorkout({
        id: Date.now().toString(),
        date: new Date().toISOString(),
        durationMinutes,
        calories,
        totalReps: reps,
        volume,
      });
      savedRef.current = true;
      playWorkoutComplete();
      vibrateComplete();
    }
  }, []);

  const handleDone = async () => {
    // High Earning Strategy: Show Interstitial when workout ends
    await showInterstitialAd();
    onDone();
  };

  const handleShare = async () => {
    const text = `💪 I just hit ${reps} pushups in ${durationMinutes}m on PushChamp!\n🔥 ${calories} kcal burned\n\nBuilt by @jai._.min2`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'PushChamp Workout', text });
      } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(text);
      } catch {}
    }
  };

  return (
    <div className="flex-grow flex flex-col items-center justify-center p-5 w-full max-w-7xl mx-auto space-y-8 min-h-screen pt-16">
      
      {/* Header */}
      <div className="text-center space-y-2 w-full">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full border-4 border-primary-container mb-4 shadow-[0_0_30px_rgba(195,244,0,0.3)]">
          <CheckCircle className="w-12 h-12 text-primary-container" strokeWidth={2} />
        </div>
        <h1 className="font-display-lg text-display-lg text-primary uppercase">Workout Complete!</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">You crushed it. Here's your summary.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-4xl">
        <div className="bg-surface-container border border-surface-container-highest rounded-xl p-5 flex flex-col items-center justify-center space-y-2 col-span-1">
          <Timer className="text-primary-container w-7 h-7" strokeWidth={1.5} />
          <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">Duration</span>
          <span className="font-stats-xl text-headline-lg text-primary leading-none">{durationMinutes}<span className="font-headline-lg text-headline-lg-mobile ml-0.5">m</span></span>
        </div>
        <div className="bg-surface-container border border-surface-container-highest rounded-xl p-5 flex flex-col items-center justify-center space-y-2 col-span-1">
          <Flame className="text-primary-container w-7 h-7" strokeWidth={1.5} />
          <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">Calories</span>
          <span className="font-stats-xl text-headline-lg text-primary leading-none">{calories}</span>
        </div>
        <div className="bg-surface-container border border-surface-container-highest rounded-xl p-5 flex flex-col items-center justify-center space-y-2 col-span-1">
          <Dumbbell className="text-primary-container w-7 h-7" strokeWidth={1.5} />
          <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">Reps</span>
          <span className="font-stats-xl text-headline-lg text-primary leading-none">{reps}</span>
        </div>
        <div className="bg-surface-container border border-surface-container-highest rounded-xl p-5 flex flex-col items-center justify-center space-y-2 col-span-1">
          <Weight className="text-primary-container w-7 h-7" strokeWidth={1.5} />
          <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">Volume</span>
          <span className="font-stats-xl text-headline-lg text-primary leading-none">{(volume / 1000).toFixed(1)}<span className="font-headline-lg text-headline-lg-mobile ml-0.5">k</span></span>
        </div>
      </div>

      {/* Intensity Zone */}
      <div className="w-full max-w-4xl bg-surface-container border border-surface-container-highest rounded-xl p-5 flex flex-col items-start space-y-4 relative overflow-hidden h-40">
        <div className="z-10 w-full flex justify-between items-center">
          <span className="font-headline-lg text-headline-lg-mobile text-primary uppercase">Intensity</span>
          <span className="font-label-caps text-label-caps text-primary-container px-3 py-1 bg-surface-container-high rounded-full">
            {reps > 30 ? 'BEAST MODE' : reps > 15 ? 'PEAK PERFORMANCE' : 'GETTING STARTED'}
          </span>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-20 flex items-end justify-between px-4 gap-1 opacity-80">
          {Array.from({ length: 7 }, (_, i) => {
            const heights = [25, 45, 65, 100, 85, 50, 30];
            const h = heights[i];
            return (
              <div key={i} className={`w-full rounded-t-sm transition-all ${i === 3 ? 'bg-primary-container shadow-[0_-5px_15px_rgba(195,244,0,0.3)]' : h > 60 ? 'bg-primary-fixed/60' : 'bg-surface-container-highest'}`} style={{ height: `${h}%` }} />
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="w-full max-md flex flex-col space-y-3 pt-4">
        <button onClick={handleDone} className="w-full bg-primary-container text-black font-display-lg text-headline-lg uppercase py-4 rounded-xl shadow-[0_0_20px_rgba(195,244,0,0.2)] hover:bg-surface-tint transition-colors active:scale-95 leading-none">
          Done
        </button>
        <button onClick={handleShare} className="w-full bg-transparent border-2 border-primary-container text-primary-fixed font-display-lg text-headline-lg uppercase py-4 rounded-xl hover:bg-surface-container transition-colors active:scale-95 flex items-center justify-center gap-2 leading-none">
          <Share2 className="w-5 h-5" /> Share
        </button>
        <a href="https://instagram.com/jai._.min2" target="_blank" rel="noopener noreferrer" className="w-full bg-transparent text-on-surface-variant font-label-caps text-label-caps uppercase tracking-widest py-3 flex items-center justify-center gap-2 hover:text-pink-400 transition-colors">
          <Instagram className="w-4 h-4" /> Built by @jai._.min2
        </a>
      </div>
    </div>
  );
}
