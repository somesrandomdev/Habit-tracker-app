import type { DailyLog, FastSession, Habit, HabitCompletion } from '@/types/models';
import { addDaysToKey, diffDays, keyFromIso } from './dates';
import { msToHours } from './durations';
import { isScheduledOn } from './habitLogic';

/** Sum of completed-fast hours per local end-date over the last `days` days. */
export function fastingHoursByDay(
  sessions: FastSession[],
  todayKey: string,
  days: number,
): { dateKey: string; hours: number; completed: boolean }[] {
  const byDay = new Map<string, number>();
  for (const s of sessions) {
    if (s.status !== 'completed' || !s.actual_end_time_utc) continue;
    const key = keyFromIso(s.actual_end_time_utc);
    byDay.set(key, (byDay.get(key) ?? 0) + msToHours(
      new Date(s.actual_end_time_utc).getTime() - new Date(s.start_time_utc).getTime(),
    ));
  }
  const out: { dateKey: string; hours: number; completed: boolean }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const key = addDaysToKey(todayKey, -i);
    out.push({ dateKey: key, hours: Math.round((byDay.get(key) ?? 0) * 10) / 10, completed: byDay.has(key) });
  }
  return out;
}

export interface HabitRateRow {
  habit: Habit;
  rate: number;
}

/** Completion rate per habit over the last `days` (scheduled days only). */
export function habitCompletionRates(
  habits: Habit[],
  completions: HabitCompletion[],
  todayKey: string,
  days = 14,
): HabitRateRow[] {
  const start = addDaysToKey(todayKey, -(days - 1));
  return habits
    .filter((h) => h.active === 1)
    .map((habit) => {
      let scheduled = 0;
      let done = 0;
      let cursor = start;
      let guard = 0;
      while (diffDays(todayKey, cursor) >= 0 && guard < 3650) {
        if (isScheduledOn(habit, cursor)) {
          scheduled += 1;
          const rec = completions.find(
            (c) => c.habit_id === habit.id && c.local_date === cursor && c.status === 'completed',
          );
          if (rec) done += 1;
        }
        cursor = addDaysToKey(cursor, 1);
        guard += 1;
      }
      return { habit, rate: scheduled > 0 ? done / scheduled : 0 };
    });
}

export function bestAndWeakestHabits(
  habits: Habit[],
  completions: HabitCompletion[],
  todayKey: string,
  days = 14,
): { best: HabitRateRow | null; weakest: HabitRateRow | null } {
  const rates = habitCompletionRates(habits, completions, todayKey, days);
  if (rates.length === 0) return { best: null, weakest: null };
  const sorted = [...rates].sort((a, b) => b.rate - a.rate);
  return { best: sorted[0], weakest: sorted[sorted.length - 1] };
}

export function wellnessTrend(
  logs: DailyLog[],
  field: 'mood' | 'hunger' | 'energy' | 'craving_intensity',
  todayKey: string,
  days: number,
): { dateKey: string; value: number | null }[] {
  const byDate = new Map(logs.map((l) => [l.local_date, l]));
  const out: { dateKey: string; value: number | null }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const key = addDaysToKey(todayKey, -i);
    const log = byDate.get(key);
    const raw = log ? log[field] : null;
    out.push({ dateKey: key, value: raw === undefined ? null : raw });
  }
  return out;
}

export function averageWater(logs: DailyLog[], days: number, todayKey: string): number {
  const window = logs.filter((l) => diffDays(todayKey, l.local_date) < days);
  if (window.length === 0) return 0;
  return Math.round((window.reduce((sum, l) => sum + l.water_cups, 0) / window.length) * 10) / 10;
}
