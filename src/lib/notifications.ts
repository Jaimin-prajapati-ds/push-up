import { LocalNotifications } from '@capacitor/local-notifications';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export const scheduleDailyReminder = async () => {
  try {
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display !== 'granted') {
      const req = await LocalNotifications.requestPermissions();
      if (req.display !== 'granted') return;
    }

    // Clear existing to avoid duplicates
    await LocalNotifications.cancel({ notifications: [{ id: 101 }] });

    await LocalNotifications.schedule({
      notifications: [
        {
          title: "TIME FOR YOUR WORKOUT",
          body: "Maintain your daily streak. A quick session is all it takes to stay fit.",
          id: 101,
          schedule: { 
            allowWhileIdle: true,
            on: { hour: 10, minute: 0 }, // Every day at 10 AM
            repeats: true 
          },
          smallIcon: "res://ic_stat_name",
          actionTypeId: "",
          extra: null
        }
      ]
    });
    console.log('Daily reminder scheduled');
  } catch (e) {
    console.error('Notification scheduling failed', e);
  }
};

export const triggerRepHaptic = async () => {
  try {
    await Haptics.impact({ style: ImpactStyle.Heavy });
  } catch (e) {}
};

export const triggerSuccessHaptic = async () => {
  try {
    await Haptics.notification({ type: NotificationType.Success });
  } catch (e) {}
};
