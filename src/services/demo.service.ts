import * as achievementsRepo from '@/repositories/achievements.repo';
import { getDb, wipeAllTables } from '@/db/database';
import * as challengeRepo from '@/repositories/challenge.repo';
import * as fastingRepo from '@/repositories/fasting.repo';
import * as habitsRepo from '@/repositories/habits.repo';
import * as logsRepo from '@/repositories/logs.repo';
import { upsertProfile } from '@/repositories/profile.repo';
import {
  ensureNotificationPrefs,
  setSetting,
  updateNotificationPref,
} from '@/repositories/settings.repo';
import { DEMO_FLAG_KEY } from './backup.service';
import { addDaysToKey, isoNow, todayKey, weekdayOf } from '@/utils/dates';
import { HOUR_MS } from '@/utils/durations';

/**
 * Fills the database with realistic sample data relative to today, so every screen,
 * chart, and streak has something to show. Safe to call on any database state —
 * it wipes existing data first.
 */
export function loadDemoData(): { ok: boolean; error?: string } {
  try {
    const db = getDb();
    const today = todayKey();

    db.withTransactionSync(() => {
      wipeAllTables();
      upsertProfile({ name: 'Demo User', goal: 'all', experience: 'intermediate', onboarded_at: isoNow() });
      setSetting('theme', 'system');
      setSetting('units', 'metric');
      ensureNotificationPrefs();
      updateNotificationPref('fast_end', true, null);
      updateNotificationPref('checkin_reminder', true, '19:00');
      setSetting(DEMO_FLAG_KEY, '1');

      // Fasting plan: 16:8
      fastingRepo.createPlan({
        name: '16:8',
        fasting_hours: 16,
        eating_window_hours: 8,
        is_custom: false,
      });
      const plan = fastingRepo.getActivePlan() as { id: number; fasting_hours: number };

      // Fast history: 11 completed days, one early stop, one skipped day, plus an active fast
      const now = Date.now();
      for (let i = 12; i >= 1; i--) {
        if (i === 5) continue; // a day off — keeps streaks honest
        const start = new Date(now - i * 24 * HOUR_MS);
        const scheduledEnd = new Date(start.getTime() + plan.fasting_hours * HOUR_MS);
        const isEarlyStop = i === 8;
        const actualEnd = isEarlyStop
          ? new Date(start.getTime() + 12.5 * HOUR_MS)
          : scheduledEnd;
        db.runSync(
          `INSERT INTO fast_sessions (plan_id, start_time_utc, scheduled_end_time_utc, actual_end_time_utc, status, notes, reason_for_stopping, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            plan.id,
            start.toISOString(),
            scheduledEnd.toISOString(),
            actualEnd.toISOString(),
            isEarlyStop ? 'stopped_early' : 'completed',
            isEarlyStop ? 'Dinner with family came up.' : null,
            isEarlyStop ? 'Social event' : null,
            start.toISOString(),
            actualEnd.toISOString(),
          ],
        );
      }
      // Active fast, started 5 hours ago
      fastingRepo.createActiveSession(
        plan.id,
        new Date(now - 5 * HOUR_MS).toISOString(),
        new Date(now + (plan.fasting_hours - 5) * HOUR_MS).toISOString(),
      );

      // Challenge: started 9 days ago, running 30 days
      const challenge = challengeRepo.createChallenge({
        title: 'No Added Sugar',
        challenge_type: 'no_added_sugar',
        rules_text: 'No candy, desserts, or sugary drinks. Whole fruit is allowed.',
        start_date: addDaysToKey(today, -9),
        end_date: addDaysToKey(today, 20),
      });
      const checkinPlan: [number, 'success' | 'craving_only' | 'slip' | 'fail', number, string | null][] = [
        [9, 'success', 3, null],
        [8, 'success', 4, null],
        [7, 'craving_only', 7, 'Rough afternoon at work.'],
        [6, 'success', 2, null],
        [5, 'slip', 9, 'Birthday cake at the party.'],
        [4, 'success', 5, 'Back on track!'],
        [3, 'success', 3, null],
        [2, 'success', 2, null],
        [1, 'success', 1, null],
      ];
      for (const [daysAgo, status, craving, note] of checkinPlan) {
        challengeRepo.upsertCheckIn({
          challenge_id: challenge.id,
          local_date: addDaysToKey(today, -daysAgo),
          status,
          craving_intensity: craving,
          trigger_type: status === 'slip' ? 'social event' : null,
          note,
        });
      }

      // Habits + completions
      const water = habitsRepo.createHabit({ title: 'Drink 8 cups of water', emoji: '💧', schedule_type: 'daily', scheduled_days: [], reminder_time: null });
      const walk = habitsRepo.createHabit({ title: 'Walk daily', emoji: '🚶', schedule_type: 'weekdays', scheduled_days: [], reminder_time: null });
      habitsRepo.createHabit({ title: 'Sleep 7+ hours', emoji: '😴', schedule_type: 'daily', scheduled_days: [], reminder_time: '22:30' });

      for (let i = 13; i >= 1; i--) {
        const key = addDaysToKey(today, -i);
        const wd = weekdayOf(key);
        if (i !== 6) habitsRepo.upsertCompletion({ habit_id: water.id, local_date: key, status: 'completed' });
        if (wd >= 1 && wd <= 5 && i !== 10) {
          habitsRepo.upsertCompletion({ habit_id: walk.id, local_date: key, status: 'completed' });
        }
        if (i !== 3) habitsRepo.upsertCompletion({ habit_id: walk.id, local_date: key, status: 'skipped' });
      }

      // Daily wellness logs
      const moods = [4, 3, 4, 5, 3, 4, 4, 3, 4, 5];
      for (let i = 9; i >= 0; i--) {
        logsRepo.upsertDailyLog(addDaysToKey(today, -i), {
          mood: moods[i],
          hunger: 2 + (i % 3),
          energy: 5 - (i % 2),
          water_cups: 5 + (i % 5),
          craving_intensity: i === 4 ? 9 : 2 + (i % 4),
          note: i === 4 ? 'Craving hit after lunch, walked it off.' : null,
        });
      }

      // Weight trending down
      for (let i = 5; i >= 0; i--) {
        logsRepo.upsertMetricEntry(addDaysToKey(today, -i * 2), {
          weight: 82.4 - (5 - i) * 0.35,
          waist: 88 - (5 - i) * 0.5,
          body_fat: i === 3 ? 24.1 : null,
          note: null,
        });
      }

      // Seed a couple of obvious achievements; the rest unlock through evaluation
      achievementsRepo.unlock('first_fast');
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Demo data failed.' };
  }
}
