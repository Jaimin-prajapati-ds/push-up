import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export async function setupDailyReminder() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    // Request permission first
    const permission = await LocalNotifications.requestPermissions();
    if (permission.display !== 'granted') return;

    // Clear existing to avoid duplicates
    await LocalNotifications.cancel({ notifications: [{ id: 1 }] });

    // Schedule a daily notification at 7:00 PM (19:00)
    await LocalNotifications.schedule({
      notifications: [
        {
          title: "PushChamp Time! 🔥",
          body: "Don't break your streak! Drop down and give me 20!",
          id: 1,
          schedule: {
            allowWhileIdle: true,
            every: 'day', // Repeats daily
            on: {
              hour: 19,
              minute: 0
            }
          },
          sound: undefined,
          attachments: undefined,
          actionTypeId: "",
          extra: null
        }
      ]
    });
    
    console.log("Daily reminder scheduled.");
  } catch (error) {
    console.error("Error setting up notifications", error);
  }
}
