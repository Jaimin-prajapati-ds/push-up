export interface WorkoutSession {
  id: string;
  date: string;
  durationMinutes: number;
  totalReps: number;
  volume: number;
}

export function saveWorkout(session: WorkoutSession) {
  const existing = getWorkouts();
  existing.push(session);
  localStorage.setItem('workouts', JSON.stringify(existing));
}

export function getWorkouts(): WorkoutSession[] {
  try {
    const data = localStorage.getItem('workouts');
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export const getHistory = getWorkouts;

export function getWeeklyStats() {
  const workouts = getWorkouts();
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const weeklyWorkouts = workouts.filter(w => new Date(w.date) >= oneWeekAgo);
  const totalReps = weeklyWorkouts.reduce((sum, w) => sum + w.totalReps, 0);
  const totalDuration = weeklyWorkouts.reduce((sum, w) => sum + w.durationMinutes, 0);
  
  let avgIntensity = 0;
  if (totalDuration > 0) {
    // Reps per minute * some multiplier to get a percentage
    // Let's say 30 reps per minute is 100% intensity
    avgIntensity = Math.min(100, Math.round((totalReps / totalDuration) / 30 * 100));
  }

  return {
    totalVolume: weeklyWorkouts.reduce((sum, w) => sum + w.volume, 0),
    workoutsCount: weeklyWorkouts.length,
    timeUnderTension: totalDuration,
    avgIntensity
  };
}

export function getLifetimeStats() {
  const workouts = getWorkouts();
  const maxWorkout = workouts.reduce((max, w) => w.totalReps > max.totalReps ? w : max, { totalReps: 0 } as WorkoutSession);
  const latestWorkout = workouts.length > 0 ? workouts[workouts.length - 1] : null;

  return {
    maxReps: maxWorkout.totalReps,
    totalWorkouts: workouts.length,
    lastWorkoutDate: latestWorkout ? new Date(latestWorkout.date).toLocaleDateString() : 'None',
  };
}

export function getStreak(): number {
  const workouts = getWorkouts();
  // Fix 16: Use unique dates to prevent double-counting same-day workouts
  const uniqueDates = [...new Set(
    workouts.map(w => w.date.slice(0, 10)) // "2026-05-14" format
  )].sort().reverse(); // Latest first

  if (uniqueDates.length === 0) return 0;

  let streak = 0;
  const today = new Date().toISOString().slice(0, 10);
  let expected = today;

  // Check if latest workout is today or yesterday
  if (uniqueDates[0] !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);
    if (uniqueDates[0] !== yesterdayStr) return 0;
    expected = yesterdayStr;
  }

  for (const dateStr of uniqueDates) {
    if (dateStr === expected) {
      streak++;
      const d = new Date(expected);
      d.setDate(d.getDate() - 1);
      expected = d.toISOString().slice(0, 10);
    } else if (dateStr < expected) {
      break;
    }
  }

  return streak;
}

export function getTotalLifetimeReps(): number {
  const workouts = getWorkouts();
  return workouts.reduce((sum, w) => sum + w.totalReps, 0);
}

export function getUserLevel(totalReps: number) {
  // Simple RPG leveling formula based on reps
  const LEVELS = [
    { name: "Rookie", minReps: 0 },
    { name: "Beginner", minReps: 50 },
    { name: "Amateur", minReps: 250 },
    { name: "Fighter", minReps: 1000 },
    { name: "Warrior", minReps: 2500 },
    { name: "Gladiator", minReps: 5000 },
    { name: "Spartan", minReps: 10000 },
    { name: "Demi-God", minReps: 25000 },
    { name: "PushChamp God", minReps: 50000 },
  ];

  let currentLevel = LEVELS[0];
  let nextLevel = LEVELS[1];
  let levelIndex = 1;

  for (let i = 0; i < LEVELS.length; i++) {
    if (totalReps >= LEVELS[i].minReps) {
      currentLevel = LEVELS[i];
      levelIndex = i + 1;
      nextLevel = LEVELS[i + 1] || LEVELS[i]; // Cap at max
    } else {
      break;
    }
  }

  const repsInCurrentLevel = totalReps - currentLevel.minReps;
  const repsNeededForNext = nextLevel.minReps - currentLevel.minReps;
  let progress = 100;
  
  if (repsNeededForNext > 0) {
    progress = Math.min(100, Math.max(0, (repsInCurrentLevel / repsNeededForNext) * 100));
  }

  return {
    levelNumber: levelIndex,
    title: currentLevel.name,
    progressPercent: progress,
    repsToNext: nextLevel.minReps - totalReps > 0 ? nextLevel.minReps - totalReps : 0,
    nextLevelReps: nextLevel.minReps,
    nextLevelTitle: nextLevel.name
  };
}
