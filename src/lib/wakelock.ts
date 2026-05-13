/**
 * Screen Wake Lock API — prevents screen from turning off during workouts.
 */

let wakeLock: WakeLockSentinel | null = null;

export async function requestWakeLock(): Promise<boolean> {
  try {
    if ('wakeLock' in navigator) {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => {
        wakeLock = null;
      });
      return true;
    }
  } catch (err) {
    console.warn('Wake Lock failed:', err);
  }
  return false;
}

export async function releaseWakeLock(): Promise<void> {
  try {
    if (wakeLock) {
      await wakeLock.release();
      wakeLock = null;
    }
  } catch (err) {
    console.warn('Wake Lock release failed:', err);
  }
}

/** Re-acquire wake lock when page becomes visible again */
export function setupWakeLockReacquire() {
  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'visible' && !wakeLock) {
      await requestWakeLock();
    }
  });
}
