import type { Habit, HabitCompletion, HabitCompletionStatus, HabitStats } from '@/types/models';
import { addDaysToKey, diffDays, weekdayOf } from './dates';

export function parseScheduledDays(json: string): number[] {
  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed)) return parsed.filter((n) => typeof n === 'number');
    return [];
  } catch {
    return [];
  }
}

export function isScheduledOn(
  habit: Pick<Habit, 'schedule_type' | 'scheduled_days'>,
  dateKey: string,
): boolean {
  const weekday = weekdayOf(dateKey);
  switch (habit.schedule_type) {
    case 'daily':
      return true;
    case 'weekdays':
      return weekday >= 1 && weekday <= 5;
    case 'custom':
      return parseScheduledDays(habit.scheduled_days).includes(weekday);
    default:
      return false;
  }
}

/**
 * Current streak of completed scheduled days. Walking back from today:
 * completed increases, skipped preserves without increasing, missed breaks.
 * An unchecked today is still pending: the streak anchors at yesterday instead.
 */
export function computeHabitStreak(
  habit: Habit,
  statusByDate: Map<string, HabitCompletionStatus>,
  todayKey: string,
): number {
  let streak = 0;
  let key = todayKey;
  let guard = 0;
  while (guard < 3650) {
    if (isScheduledOn(habit, key)) {
      const status = statusByDate.get(key);
      if (status === 'completed') {
        streak += 1;
      } else if (status === 'skipped') {
        // preserved streak, no increment
      } else if (key !== todayKey) {
        break; // a missed past day breaks the streak
      }
      // today without a record: pending, keep walking
    }
    key = addDaysToKey(key, -1);
    guard += 1;
  }
  return streak;
}

export function computeHabitStats(
  habit: Habit,
  completions: HabitCompletion[],
  todayKey: string,
): HabitStats {
  const statusByDate = new Map<string, HabitCompletionStatus>();
  for (const c of completions) {
    if (c.habit_id === habit.id) statusByDate.set(c.local_date, c.status);
  }

  let scheduled = 0;
  let completed = 0;
  const weekdayScheduled = [0, 0, 0, 0, 0, 0, 0];
  const weekdayCompleted = [0, 0, 0, 0, 0, 0, 0];
  const windowStart = addDaysToKey(todayKey, -13);

  let cursor = windowStart;
  let guard = 0;
  while (diffDays(todayKey, cursor) >= 0 && guard < 3650) {
    if (isScheduledOn(habit, cursor)) {
      scheduled += 1;
      const wd = weekdayOf(cursor);
      weekdayScheduled[wd] += 1;
      if (statusByDate.get(cursor) === 'completed') {
        completed += 1;
        weekdayCompleted[wd] += 1;
      }
    }
    cursor = addDaysToKey(cursor, 1);
    guard += 1;
  }

  // Longest streak scans from the earliest completion (or creation) forward.
  const firstDate = completions
    .filter((c) => c.habit_id === habit.id)
    .map((c) => c.local_date)
    .sort()[0];
  let longest = 0;
  if (firstDate) {
    let run = 0;
    let key = firstDate;
    guard = 0;
    while (diffDays(todayKey, key) >= 0 && guard < 3650) {
      if (isScheduledOn(habit, key)) {
        const status = statusByDate.get(key);
        if (status === 'completed') {
          run += 1;
          longest = Math.max(longest, run);
        } else if (status === 'skipped') {
          // preserved
        } else if (key !== todayKey) {
          run = 0;
        }
      }
      key = addDaysToKey(key, 1);
      guard += 1;
    }
  }

  return {
    currentStreak: computeHabitStreak(habit, statusByDate, todayKey),
    longestStreak: longest,
    weeklyRate: scheduled > 0 ? completed / scheduled : 0,
    totalCompletions: completions.filter((c) => c.habit_id === habit.id && c.status === 'completed')
      .length,
    weekdayRates: weekdayScheduled.map((s, i) => (s > 0 ? weekdayCompleted[i] / s : 0)),
  };
}

export interface TodayHabitRow {
  habit: Habit;
  completion: HabitCompletion | null;
}

/** Habits scheduled today, plus stats helpers used by screens. */
export function habitsScheduledOn(habits: Habit[], dateKey: string): Habit[] {
  return habits.filter((h) => h.active === 1 && isScheduledOn(h, dateKey));
}

export function completionsByDate(
  completions: HabitCompletion[],
): Map<string, Map<number, HabitCompletion>> {
  const map = new Map<string, Map<number, HabitCompletion>>();
  for (const c of completions) {
    let byHabit = map.get(c.local_date);
    if (!byHabit) {
      byHabit = new Map<number, HabitCompletion>();
      map.set(c.local_date, byHabit);
    }
    byHabit.set(c.habit_id, c);
  }
  return map;
}
