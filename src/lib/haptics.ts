/**
 * Haptic feedback using Vibration API.
 * Falls back silently if not supported.
 */

function isVibrationEnabled(): boolean {
  try {
    const prefs = localStorage.getItem('pushchamp_settings');
    if (prefs) {
      const settings = JSON.parse(prefs);
      return settings.vibrationEnabled !== false;
    }
  } catch {}
  return true;
}

function vibrate(pattern: number | number[]) {
  if (!isVibrationEnabled()) return;
  try {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  } catch {}
}

/** Short tap — on each rep count */
export function vibrateRep() {
  vibrate(50);
}

/** Double tap — milestone (10, 25, 50 reps) */
export function vibrateMilestone() {
  vibrate([50, 50, 100]);
}

/** Triple pulse — workout complete */
export function vibrateComplete() {
  vibrate([100, 50, 100, 50, 200]);
}

/** Single light tap — countdown tick */
export function vibrateCountdown() {
  vibrate(30);
}

/** Strong pulse — countdown GO */
export function vibrateGo() {
  vibrate(150);
}
