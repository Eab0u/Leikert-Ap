import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const SETTINGS_KEY = 'sentio.reminder';
const CHANNEL_ID = 'daily-reminder';

export interface ReminderSettings {
  enabled: boolean;
  hour: number;
  minute: number;
}

export const DEFAULT_REMINDER: ReminderSettings = {
  enabled: false,
  hour: 20,
  minute: 0,
};

export const remindersSupported = Platform.OS !== 'web';

export async function getReminderSettings(): Promise<ReminderSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_REMINDER;
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'enabled' in parsed &&
      'hour' in parsed &&
      'minute' in parsed
    ) {
      return parsed as ReminderSettings;
    }
    return DEFAULT_REMINDER;
  } catch {
    return DEFAULT_REMINDER;
  }
}

async function saveReminderSettings(settings: ReminderSettings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

async function ensurePermissions(): Promise<boolean> {
  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Daily reminder',
    importance: Notifications.AndroidImportance.HIGH,
  });
}

/**
 * Schedules the daily "Time to rate your day!" local notification.
 * Returns false when notification permission was denied.
 */
export async function enableDailyReminder(
  hour: number,
  minute: number
): Promise<boolean> {
  if (!remindersSupported) return false;
  const granted = await ensurePermissions();
  if (!granted) return false;
  await ensureAndroidChannel();
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Time to rate your day!',
      body: 'How was today? Keep your streak alive 🔥',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: CHANNEL_ID,
    },
  });
  await saveReminderSettings({ enabled: true, hour, minute });
  return true;
}

export async function disableDailyReminder(): Promise<void> {
  const settings = await getReminderSettings();
  if (remindersSupported) {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }
  await saveReminderSettings({ ...settings, enabled: false });
}
