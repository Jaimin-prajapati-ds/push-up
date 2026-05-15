export interface PassLevel {
  level: number;
  xpRequired: number;
  reward: string;
  type: 'badge' | 'avatar' | 'theme' | 'booster';
}

export const PUSH_PASS_LEVELS: PassLevel[] = Array.from({ length: 50 }, (_, i) => ({
  level: i + 1,
  xpRequired: (i + 1) * 500,
  reward: i % 5 === 0 ? 'Exclusive Avatar' : 'XP Booster',
  type: i % 5 === 0 ? 'avatar' : 'booster',
}));

export interface UserStats {
  xp: number;
  level: number;
  unlockedRewards: string[];
}

export function calculateXP(reps: number, durationSeconds: number): number {
  // Base XP: 10 per rep + 1 per 10 seconds
  return (reps * 10) + Math.floor(durationSeconds / 10);
}

export function getLevelFromXP(xp: number): number {
  let level = 1;
  for (const l of PUSH_PASS_LEVELS) {
    if (xp >= l.xpRequired) level = l.level;
    else break;
  }
  return level;
}
