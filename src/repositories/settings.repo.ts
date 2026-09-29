import { getDb } from '@/db/database';
import type { AppSettings, NotificationCategory, NotificationPref } from '@/types/models';

export const NOTIFICATION_CATEGORIES: NotificationCategory[] = [
  'fast_start',
  'fast_end',
  'checkin_reminder',
  'habit_reminder',
  'wellness_reminder',
];

export function getSettings(): AppSettings {
  const db = getDb();
  const rows = db.getAllSync<{ key: string; value: string }>(
    'SELECT key, value FROM app_settings',
  );
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const theme = map.get('theme');
  const units = map.get('units');
  return {
    theme: theme === 'light' || theme === 'dark' ? theme : 'system',
    units: units === 'imperial' ? 'imperial' : 'metric',
  };
}

export function setSetting(key: string, value: string): void {
  getDb().runSync(
    `INSERT INTO app_settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [key, value],
  );
}

export function getSetting(key: string): string | null {
  return getDb().getFirstSync<{ value: string }>(
    'SELECT value FROM app_settings WHERE key = ?',
    [key],
  )?.value ?? null;
}

export function setSettingIfAbsent(key: string, value: string): void {
  getDb().runSync(
    `INSERT INTO app_settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO NOTHING`,
    [key, value],
  );
}

export function getNotificationPrefs(): NotificationPref[] {
  ensureNotificationPrefs();
  return getDb().getAllSync<NotificationPref>(
    'SELECT * FROM notification_preferences ORDER BY category',
  );
}

export function ensureNotificationPrefs(): void {
  const db = getDb();
  for (const category of NOTIFICATION_CATEGORIES) {
    db.runSync(
      'INSERT OR IGNORE INTO notification_preferences (category, enabled, time) VALUES (?, 0, NULL)',
      [category],
    );
  }
}

export function updateNotificationPref(
  category: NotificationCategory,
  enabled: boolean,
  time: string | null,
): void {
  getDb().runSync(
    `INSERT INTO notification_preferences (category, enabled, time) VALUES (?, ?, ?)
     ON CONFLICT(category) DO UPDATE SET enabled = excluded.enabled, time = excluded.time`,
    [category, enabled ? 1 : 0, time],
  );
}
