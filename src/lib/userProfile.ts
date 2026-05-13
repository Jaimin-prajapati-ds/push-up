/**
 * User profile management — stored in localStorage.
 */

export interface UserProfile {
  name: string;
  weightKg: number;
  heightCm: number;
  age: number;
  gender: 'male' | 'female' | 'other';
  weeklyGoalReps: number;
  createdAt: string;
}

export interface AppSettings {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  keepScreenOn: boolean;
  modelType: 'lightning' | 'thunder';
  countdownSeconds: number;
  confidenceThreshold: number;
  hasCompletedOnboarding: boolean;
}

const DEFAULT_PROFILE: UserProfile = {
  name: '',
  weightKg: 70,
  heightCm: 170,
  age: 25,
  gender: 'male',
  weeklyGoalReps: 200,
  createdAt: new Date().toISOString(),
};

const DEFAULT_SETTINGS: AppSettings = {
  soundEnabled: true,
  vibrationEnabled: true,
  keepScreenOn: true,
  modelType: 'lightning',
  countdownSeconds: 5,
  confidenceThreshold: 0.45,
  hasCompletedOnboarding: false,
  voiceEnabled: false,
};

const PROFILE_KEY = 'pushchamp_profile';
const SETTINGS_KEY = 'pushchamp_settings';

export function getUserProfile(): UserProfile {
  try {
    const data = localStorage.getItem(PROFILE_KEY);
    if (data) return { ...DEFAULT_PROFILE, ...JSON.parse(data) };
  } catch {}
  return { ...DEFAULT_PROFILE };
}

export function saveUserProfile(profile: Partial<UserProfile>) {
  const existing = getUserProfile();
  const updated = { ...existing, ...profile };
  localStorage.setItem(PROFILE_KEY, JSON.stringify(updated));
}

export function getAppSettings(): AppSettings {
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    if (data) return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
  } catch {}
  return { ...DEFAULT_SETTINGS };
}

export function saveAppSettings(settings: Partial<AppSettings>) {
  const existing = getAppSettings();
  const updated = { ...existing, ...settings };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
}

/** Calculate calories burned from push-ups using MET formula */
export function calculateCalories(durationSeconds: number, weightKg: number): number {
  // MET for push-ups ≈ 8.0
  const MET = 8.0;
  const hours = durationSeconds / 3600;
  return Math.round(MET * weightKg * hours);
}

/** Calculate volume (total weight moved) */
export function calculateVolume(reps: number, weightKg: number): number {
  // Push-up lifts ~64% of body weight
  return Math.round(reps * weightKg * 0.64);
}

/** Check if user has completed onboarding */
export function hasCompletedOnboarding(): boolean {
  return getAppSettings().hasCompletedOnboarding;
}

/** Mark onboarding as complete */
export function completeOnboarding() {
  saveAppSettings({ hasCompletedOnboarding: true });
}
