// ⚠️ We import expo-notifications submodules directly instead of the package index.
// Importing 'expo-notifications' (the index) executes DevicePushTokenAutoRegistration.fx,
// which THROWS at import time on Android inside Expo Go ("push removed from Expo Go in
// SDK 53"). The submodules below have a clean import graph and cover every API this app
// uses — all local-notification functionality keeps working in Expo Go. Only remote-push
// APIs (getExpoPushTokenAsync etc.) are unavailable there; this app never uses them.
import { setNotificationHandler } from 'expo-notifications/build/NotificationsHandler';
import { getPermissionsAsync, requestPermissionsAsync } from 'expo-notifications/build/NotificationPermissions';
import { scheduleNotificationAsync } from 'expo-notifications/build/scheduleNotificationAsync';
import { cancelAllScheduledNotificationsAsync } from 'expo-notifications/build/cancelAllScheduledNotificationsAsync';
import { setNotificationChannelAsync } from 'expo-notifications/build/setNotificationChannelAsync';
import { AndroidImportance } from 'expo-notifications/build/NotificationChannelManager.types';
import { SchedulableTriggerInputTypes } from 'expo-notifications/build/Notifications.types';
import { Platform } from 'react-native';
import * as fastingRepo from '@/repositories/fasting.repo';
import * as habitsRepo from '@/repositories/habits.repo';
import { getNotificationPrefs } from '@/repositories/settings.repo';
import { parseScheduledDays } from '@/utils/habitLogic';

// Local notifications only — the app never depends on push infrastructure.

export async function configureNotificationHandler(): Promise<void> {
  setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
  if (Platform.OS === 'android') {
    try {
      await setNotificationChannelAsync('reminders', {
        name: 'FastHabit reminders',
        importance: AndroidImportance.DEFAULT,
      });
    } catch {
      // Channel creation is cosmetic; scheduling still works without it.
    }
  }
}

export async function hasPermission(): Promise<boolean> {
  try {
    const current = await getPermissionsAsync();
    return !!current.granted;
  } catch {
    return false;
  }
}

/** Returns true when permission is (or already was) granted. Never throws. */
export async function requestPermission(): Promise<boolean> {
  try {
    if (await hasPermission()) return true;
    const result = await requestPermissionsAsync();
    return !!result.granted;
  } catch {
    return false;
  }
}

function parseTime(time: string | null): { hour: number; minute: number } | null {
  if (!time) return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

async function scheduleDailyReminder(
  time: string | null,
  title: string,
  body: string,
): Promise<void> {
  const parsed = parseTime(time);
  if (!parsed) return;
  await scheduleNotificationAsync({
    content: { title, body },
    trigger: {
      type: SchedulableTriggerInputTypes.DAILY,
      hour: parsed.hour,
      minute: parsed.minute,
    },
  });
}

/** expo weekday is 1-based with 1 = Sunday; JS getDay() is 0-based with 0 = Sunday. */
function expoWeekday(jsWeekday: number): number {
  return jsWeekday + 1;
}

async function scheduleHabitReminders(enabled: boolean): Promise<void> {
  if (!enabled) return;
  const habits = habitsRepo.getAllHabits();
  for (const habit of habits) {
    if (!habit.reminder_time) continue;
    const parsed = parseTime(habit.reminder_time);
    if (!parsed) continue;
    const content = {
      title: `${habit.emoji} ${habit.title}`,
      body: 'A gentle nudge from your habit list.',
    };
    if (habit.schedule_type === 'daily') {
      await scheduleNotificationAsync({
        content,
        trigger: {
          type: SchedulableTriggerInputTypes.DAILY,
          hour: parsed.hour,
          minute: parsed.minute,
        },
      });
    } else {
      const days =
        habit.schedule_type === 'weekdays'
          ? [1, 2, 3, 4, 5]
          : parseScheduledDays(habit.scheduled_days);
      for (const day of days) {
        await scheduleNotificationAsync({
          content,
          trigger: {
            type: SchedulableTriggerInputTypes.WEEKLY,
            weekday: expoWeekday(day),
            hour: parsed.hour,
            minute: parsed.minute,
          },
        });
      }
    }
  }
}

/**
 * Rebuilds the entire local notification schedule from current data:
 * prefs, active fast, and habit reminders. Called after any relevant change
 * and on app foreground, so the schedule can never drift out of sync.
 */
export async function syncNotifications(): Promise<void> {
  try {
    if (!(await hasPermission())) return;
    await cancelAllScheduledNotificationsAsync();
    const prefs = getNotificationPrefs();
    const pref = (category: string) => prefs.find((p) => p.category === category);

    const activeFast = fastingRepo.getActiveFast();
    const fastEnd = pref('fast_end');
    if (fastEnd?.enabled && activeFast) {
      const end = new Date(activeFast.scheduled_end_time_utc);
      if (end.getTime() > Date.now()) {
        await scheduleNotificationAsync({
          content: {
            title: 'Fast complete 🎉',
            body: 'You reached your target. Break your fast gently — and nicely done.',
          },
          trigger: { type: SchedulableTriggerInputTypes.DATE, date: end },
        });
      }
    }

    const fastStart = pref('fast_start');
    if (fastStart?.enabled) {
      await scheduleDailyReminder(
        fastStart.time,
        'Time to start your fast ⏱️',
        'Starting now keeps your eating window right where you planned it.',
      );
    }

    const checkin = pref('checkin_reminder');
    if (checkin?.enabled) {
      await scheduleDailyReminder(
        checkin.time,
        'Challenge check-in 🍬',
        'How did today go? A one-tap check-in keeps your streak honest.',
      );
    }

    const wellness = pref('wellness_reminder');
    if (wellness?.enabled) {
      await scheduleDailyReminder(
        wellness.time,
        'How are you feeling? 💧',
        'Thirty seconds to log your mood, energy, and water.',
      );
    }

    await scheduleHabitReminders(pref('habit_reminder')?.enabled === 1);
  } catch (error) {
    // Scheduling is best-effort; in-app reminder cards cover the rest.
    console.warn('Failed to sync notifications:', error);
  }
}
