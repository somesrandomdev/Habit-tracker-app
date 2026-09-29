import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as achievementsRepo from '@/repositories/achievements.repo';
import { getDb, resetDatabase, wipeAllTables } from '@/db/database';
import * as challengeRepo from '@/repositories/challenge.repo';
import * as fastingRepo from '@/repositories/fasting.repo';
import * as habitsRepo from '@/repositories/habits.repo';
import * as logsRepo from '@/repositories/logs.repo';
import {
  getProfile,
  upsertProfile,
} from '@/repositories/profile.repo';
import {
  NOTIFICATION_CATEGORIES,
  setSetting,
  updateNotificationPref,
} from '@/repositories/settings.repo';
import type { BackupFile } from '@/utils/validation';
import { parseBackup } from '@/utils/validation';
import { todayKey } from '@/utils/dates';

// ---- Export ----

export function buildBackup(): BackupFile {
  const db = getDb();
  return {
    app: 'FastHabit',
    version: 1,
    exported_at: new Date().toISOString(),
    data: {
      profile: getProfile(),
      fasting_plans: fastingRepo.getAllPlans(),
      fast_sessions: fastingRepo.getAllSessions(),
      challenges: challengeRepo.getAllChallenges(),
      challenge_checkins: challengeRepo.getAllCheckIns(),
      habits: habitsRepo.getAllHabits(true),
      habit_completions: habitsRepo.getAllCompletions(),
      daily_logs: logsRepo.getAllLogs(),
      metric_entries: logsRepo.getAllMetrics(),
      achievements: achievementsRepo.getUnlockedAchievements(),
      notification_preferences: db.getAllSync('SELECT * FROM notification_preferences'),
      app_settings: db.getAllSync('SELECT * FROM app_settings'),
    },
  };
}

export interface ExportResult {
  ok: boolean;
  json?: string;
  fileName?: string;
  error?: string;
}

/** Writes a JSON backup to cache and opens the share sheet when available. */
export async function exportBackup(): Promise<ExportResult> {
  try {
    const json = JSON.stringify(buildBackup(), null, 2);
    const fileName = `fasthabit-backup-${todayKey()}.json`;
    const file = new File(Paths.cache, fileName);
    file.write(json);
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(file.uri, {
        mimeType: 'application/json',
        dialogTitle: 'Export FastHabit data',
      });
    }
    return { ok: true, json, fileName };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Export failed.' };
  }
}

// ---- Import ----

export interface ImportResult {
  ok: boolean;
  error?: string;
}

/**
 * Replaces the entire database with the backup contents inside one transaction.
 * Row ids are preserved so cross-references (plan_id, challenge_id, habit_id) stay valid.
 */
export function importFromJson(json: string): ImportResult {
  const parsed = parseBackup(json);
  if (!parsed.ok) return { ok: false, error: parsed.error };

  const db = getDb();
  const d = parsed.data.data;
  try {
    db.withTransactionSync(() => {
      wipeAllTables();
      if (d.profile) {
        upsertProfile({
          name: d.profile.name,
          goal: d.profile.goal,
          experience: d.profile.experience,
          onboarded_at: d.profile.onboarded_at ?? null,
        });
      }
      for (const p of d.fasting_plans) {
        db.runSync(
          'INSERT INTO fasting_plans (id, name, fasting_hours, eating_window_hours, is_custom, active) VALUES (?, ?, ?, ?, ?, ?)',
          [p.id, p.name, p.fasting_hours, p.eating_window_hours, p.is_custom, p.active],
        );
      }
      for (const s of d.fast_sessions) {
        db.runSync(
          `INSERT INTO fast_sessions (id, plan_id, start_time_utc, scheduled_end_time_utc, actual_end_time_utc, status, notes, reason_for_stopping, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [s.id, s.plan_id, s.start_time_utc, s.scheduled_end_time_utc, s.actual_end_time_utc ?? null, s.status, s.notes ?? null, s.reason_for_stopping ?? null, s.created_at, s.updated_at],
        );
      }
      for (const c of d.challenges) {
        db.runSync(
          'INSERT INTO challenges (id, title, challenge_type, rules_text, start_date, end_date, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [c.id, c.title, c.challenge_type, c.rules_text, c.start_date, c.end_date, c.status, c.created_at],
        );
      }
      for (const c of d.challenge_checkins) {
        db.runSync(
          `INSERT INTO challenge_checkins (id, challenge_id, local_date, status, craving_intensity, trigger_type, note, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [c.id, c.challenge_id, c.local_date, c.status, c.craving_intensity ?? null, c.trigger_type ?? null, c.note ?? null, c.created_at, c.updated_at],
        );
      }
      for (const h of d.habits) {
        db.runSync(
          'INSERT INTO habits (id, title, emoji, schedule_type, scheduled_days, reminder_time, active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [h.id, h.title, h.emoji ?? '🎯', h.schedule_type, h.scheduled_days, h.reminder_time ?? null, h.active, h.created_at],
        );
      }
      for (const c of d.habit_completions) {
        db.runSync(
          'INSERT INTO habit_completions (id, habit_id, local_date, status, note, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [c.id, c.habit_id, c.local_date, c.status, c.note ?? null, c.created_at, c.updated_at],
        );
      }
      for (const l of d.daily_logs) {
        db.runSync(
          'INSERT INTO daily_logs (id, local_date, mood, hunger, energy, water_cups, craving_intensity, note, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [l.id, l.local_date, l.mood ?? null, l.hunger ?? null, l.energy ?? null, l.water_cups, l.craving_intensity, l.note ?? null, l.created_at, l.updated_at],
        );
      }
      for (const m of d.metric_entries) {
        db.runSync(
          'INSERT INTO metric_entries (id, local_date, weight, waist, body_fat, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [m.id, m.local_date, m.weight ?? null, m.waist ?? null, m.body_fat ?? null, m.note ?? null, m.created_at],
        );
      }
      for (const a of d.achievements) {
        db.runSync('INSERT INTO achievements (id, key, unlocked_at) VALUES (?, ?, ?)', [a.id, a.key, a.unlocked_at]);
      }
      for (const n of d.notification_preferences) {
        if (NOTIFICATION_CATEGORIES.includes(n.category as never)) {
          updateNotificationPref(
            n.category as (typeof NOTIFICATION_CATEGORIES)[number],
            n.enabled === 1,
            n.time ?? null,
          );
        }
      }
      for (const s of d.app_settings) {
        setSetting(s.key, s.value);
      }
    });
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? `Import failed: ${error.message}` : 'Import failed.',
    };
  }
}

export async function importFromPickedFile(): Promise<ImportResult> {
  try {
    const result = await File.pickFileAsync({ mimeTypes: ['application/json'] });
    const picked = Array.isArray(result) ? result[0] : result;
    if (!picked) return { ok: false, error: 'No file selected.' };
    const file = picked instanceof File ? picked : new File(String((picked as { uri: string }).uri));
    const json = await file.text();
    return importFromJson(json);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? `Could not read file: ${error.message}` : 'Could not read file.',
    };
  }
}

// ---- Reset ----

export function resetAllData(): ImportResult {
  try {
    resetDatabase();
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? `Reset failed: ${error.message}` : 'Reset failed.',
    };
  }
}

export const DEMO_FLAG_KEY = 'demo_data_loaded';
