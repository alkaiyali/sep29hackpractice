import type * as NotificationsNS from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { Medicine } from '../types/medicine';

export const NOTIFICATION_CATEGORY_ID = 'MEDICATION_ALARM';

/**
 * Notification support detection.
 *
 * Expo Go cannot run this app's alarms: `expo-notifications` dropped remote
 * push in Expo Go (Android) at SDK 53 and prints a loud error banner the
 * moment the module is loaded. We therefore keep the native module *unloaded*
 * in Expo Go and no-op every call, so nothing errors there.
 *
 * Real builds — the APK, or a development build — get the full behaviour.
 */
export const isExpoGo =
  Constants.expoGoConfig != null || String(Constants.appOwnership ?? '') === 'expo';

export interface NotificationsAvailability {
  supported: boolean;
  reason?: string;
}

export function getNotificationsAvailability(): NotificationsAvailability {
  if (Platform.OS === 'web') {
    return { supported: false, reason: 'On web, Meddy shows a browser alert instead of a system notification.' };
  }
  if (isExpoGo) {
    return {
      supported: false,
      reason: 'Expo Go cannot schedule medicine alarms. Install the Meddy APK (or a development build) for real reminders — sound and vibration still work here.',
    };
  }
  return { supported: true };
}

type NotificationsModule = typeof NotificationsNS;

let notificationsModule: NotificationsModule | null = null;
let loadFailed = false;

/** Loads expo-notifications on demand; returns null when unsupported. */
async function loadNotifications(): Promise<NotificationsModule | null> {
  if (!getNotificationsAvailability().supported || loadFailed) return null;
  if (notificationsModule) return notificationsModule;

  try {
    const module = await import('expo-notifications');

    // Configure foreground presentation once the module is actually loaded.
    module.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
        priority: module.AndroidNotificationPriority.MAX,
      }),
    });

    notificationsModule = module;
    return module;
  } catch (err) {
    loadFailed = true;
    console.warn('[notifications] expo-notifications could not be loaded:', err);
    return null;
  }
}

export const notificationService = {
  async registerNotificationCategories(): Promise<void> {
    const Notifications = await loadNotifications();
    if (!Notifications) return;

    try {
      await Notifications.setNotificationCategoryAsync(NOTIFICATION_CATEGORY_ID, [
        {
          identifier: 'ACTION_TAKE',
          buttonTitle: '✓ Take Now',
          options: {
            opensAppToForeground: false,
          },
        },
        {
          identifier: 'ACTION_SNOOZE',
          buttonTitle: '⏰ Snooze',
          options: {
            opensAppToForeground: false,
          },
        },
      ]);
    } catch (err) {
      console.warn('[notificationService] Error registering categories:', err);
    }
  },

  async requestPermissions(): Promise<boolean> {
    const Notifications = await loadNotifications();
    if (!Notifications) return false;

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('medicine-alarms', {
          name: 'Medicine Reminders',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#0D9488',
          sound: 'default',
        });
      }

      return finalStatus === 'granted';
    } catch (err) {
      console.warn('[notificationService] Error requesting permissions:', err);
      return false;
    }
  },

  async scheduleMedicineAlarms(medicine: Medicine): Promise<string[]> {
    const Notifications = await loadNotifications();
    if (!Notifications) return [];

    const notificationIds: string[] = [];

    try {
      // Cancel any previous alarms for this medicine
      if (medicine.notificationIds && medicine.notificationIds.length > 0) {
        await Promise.all(
          medicine.notificationIds.map((id) => Notifications.cancelScheduledNotificationAsync(id))
        );
      }

      for (const timeStr of medicine.scheduleTimes) {
        const [hourStr, minuteStr] = timeStr.split(':');
        const hour = parseInt(hourStr, 10);
        const minute = parseInt(minuteStr, 10);

        for (const weekday of medicine.daysOfWeek) {
          // In Expo Notifications, Sunday is 1, Saturday is 7
          const expoWeekday = weekday === 0 ? 1 : weekday + 1;

          const id = await Notifications.scheduleNotificationAsync({
            content: {
              title: `Time for ${medicine.name}`,
              body: `${medicine.dosage} ${medicine.dosageUnit} • ${medicine.instruction.replace('_', ' ')}`,
              data: {
                medicineId: medicine.id,
                timeStr,
                forMemberId: medicine.forMemberId,
              },
              categoryIdentifier: NOTIFICATION_CATEGORY_ID,
              sound: medicine.reminderSettings.soundEnabled ? 'default' : undefined,
              priority: Notifications.AndroidNotificationPriority.MAX,
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
              hour,
              minute,
              weekday: expoWeekday,
              repeats: true,
            },
          });

          notificationIds.push(id);
        }
      }
    } catch (err) {
      console.warn('[notificationService] Error scheduling alarms:', err);
    }

    return notificationIds;
  },

  async scheduleSnoozeAlarm(medicine: Medicine, minutes: number = 10): Promise<string | null> {
    const Notifications = await loadNotifications();
    if (!Notifications) return null;

    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: `⏰ Snoozed: ${medicine.name}`,
          body: `Reminder: ${medicine.dosage} ${medicine.dosageUnit} • Please take your dose now.`,
          data: {
            medicineId: medicine.id,
            isSnooze: true,
          },
          categoryIdentifier: NOTIFICATION_CATEGORY_ID,
          sound: medicine.reminderSettings.soundEnabled ? 'default' : undefined,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: minutes * 60,
          repeats: false,
        },
      });

      return id;
    } catch (err) {
      console.warn('[notificationService] Error scheduling snooze:', err);
      return null;
    }
  },

  async notifyMissedDose(medicine: Medicine, timeStr: string, urgent: boolean): Promise<void> {
    const title = urgent ? `🚨 Still missed: ${medicine.name}` : `⚠️ Missed dose: ${medicine.name}`;
    const body = urgent
      ? `${medicine.dosage} ${medicine.dosageUnit} at ${timeStr} is still unlogged. Please check in with your care circle.`
      : `${medicine.dosage} ${medicine.dosageUnit} at ${timeStr} was missed. Open Meddy to log it now.`;

    if (Platform.OS === 'web') {
      alert(`[Notification] ${title}: ${body}`);
      return;
    }

    const Notifications = await loadNotifications();
    if (!Notifications) return;

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: {
            medicineId: medicine.id,
            missedDose: true,
          },
          categoryIdentifier: NOTIFICATION_CATEGORY_ID,
          sound: 'default',
          priority: urgent
            ? Notifications.AndroidNotificationPriority.MAX
            : Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 1,
          repeats: false,
        },
      });
    } catch (err) {
      console.warn('[notificationService] Error sending missed-dose alert:', err);
    }
  },

  async notifyLowSupply(medicine: Medicine, remaining: number): Promise<void> {
    if (Platform.OS === 'web') {
      alert(`Low supply: only ${remaining} left of ${medicine.name}. Time to request a refill.`);
      return;
    }

    const Notifications = await loadNotifications();
    if (!Notifications) return;

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `⚠️ Low Supply: ${medicine.name}`,
          body: `Only ${remaining} ${remaining === 1 ? 'dose' : 'doses'} left. Time to request a refill!`,
          data: {
            medicineId: medicine.id,
            lowSupply: true,
          },
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 1,
          repeats: false,
        },
      });
    } catch (err) {
      console.warn('[notificationService] Error sending low-supply alert:', err);
    }
  },

  async triggerTestAlarm(
    title: string = 'Meddy Test Reminder',
    body: string = '500mg Amoxicillin - Take with water'
  ): Promise<void> {
    if (Platform.OS === 'web') {
      alert(`[Notification] ${title}: ${body}`);
      return;
    }

    const Notifications = await loadNotifications();
    if (!Notifications) return;

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { test: true },
          categoryIdentifier: NOTIFICATION_CATEGORY_ID,
          sound: 'default',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 2,
          repeats: false,
        },
      });
    } catch (err) {
      console.warn('[notificationService] Error sending test alarm:', err);
    }
  },

  /**
   * Subscribes to notification action taps (Take / Snooze in the shade).
   * Resolves to a no-op unsubscribe when notifications are unavailable.
   */
  async addResponseListener(
    handler: (response: NotificationsNS.NotificationResponse) => void
  ): Promise<() => void> {
    const Notifications = await loadNotifications();
    if (!Notifications) return () => {};

    const subscription = Notifications.addNotificationResponseReceivedListener(handler);
    return () => subscription.remove();
  },
};
