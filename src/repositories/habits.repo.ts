import { getDb } from '@/db/database';
import type {
  Habit,
  HabitCompletion,
  HabitCompletionStatus,
  ScheduleType,
} from '@/types/models';
import { isoNow } from '@/utils/dates';

export function getAllHabits(includeInactive = false): Habit[] {
  const sql = includeInactive
    ? 'SELECT * FROM habits ORDER BY active DESC, id'
    : 'SELECT * FROM habits WHERE active = 1 ORDER BY id';
  return getDb().getAllSync<Habit>(sql);
}

export function getHabitById(id: number): Habit | null {
  return getDb().getFirstSync<Habit>('SELECT * FROM habits WHERE id = ?', [id]) ?? null;
}

export interface HabitInput {
  title: string;
  emoji: string;
  schedule_type: ScheduleType;
  scheduled_days: number[];
  reminder_time: string | null;
}

export function createHabit(input: HabitInput): Habit {
  getDb().runSync(
    'INSERT INTO habits (title, emoji, schedule_type, scheduled_days, reminder_time, active, created_at) VALUES (?, ?, ?, ?, ?, 1, ?)',
    [
      input.title,
      input.emoji,
      input.schedule_type,
      JSON.stringify(input.scheduled_days),
      input.reminder_time,
      isoNow(),
    ],
  );
  const id = getDb().getFirstSync<{ id: number }>('SELECT last_insert_rowid() AS id')?.id ?? 0;
  return getHabitById(id) as Habit;
}

export function updateHabit(id: number, input: HabitInput): Habit | null {
  getDb().runSync(
    'UPDATE habits SET title = ?, emoji = ?, schedule_type = ?, scheduled_days = ?, reminder_time = ? WHERE id = ?',
    [
      input.title,
      input.emoji,
      input.schedule_type,
      JSON.stringify(input.scheduled_days),
      input.reminder_time,
      id,
    ],
  );
  return getHabitById(id);
}

/** Habits are deactivated instead of deleted so historical completions stay intact. */
export function deactivateHabit(id: number): void {
  getDb().runSync('UPDATE habits SET active = 0 WHERE id = ?', [id]);
}

export function getCompletions(daysBack: number, todayKey: string): HabitCompletion[] {
  return getDb().getAllSync<HabitCompletion>(
    'SELECT * FROM habit_completions WHERE local_date >= date(?, ?) ORDER BY local_date',
    [todayKey, -daysBack],
  );
}

export function getAllCompletions(): HabitCompletion[] {
  return getDb().getAllSync<HabitCompletion>('SELECT * FROM habit_completions ORDER BY local_date');
}

export function getCompletionFor(habitId: number, localDate: string): HabitCompletion | null {
  return (
    getDb().getFirstSync<HabitCompletion>(
      'SELECT * FROM habit_completions WHERE habit_id = ? AND local_date = ?',
      [habitId, localDate],
    ) ?? null
  );
}

export function upsertCompletion(input: {
  habit_id: number;
  local_date: string;
  status: HabitCompletionStatus;
  note?: string | null;
}): HabitCompletion {
  const now = isoNow();
  getDb().runSync(
    `INSERT INTO habit_completions (habit_id, local_date, status, note, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(habit_id, local_date) DO UPDATE SET
       status = excluded.status, note = excluded.note, updated_at = excluded.updated_at`,
    [input.habit_id, input.local_date, input.status, input.note ?? null, now, now],
  );
  return getCompletionFor(input.habit_id, input.local_date) as HabitCompletion;
}

export function deleteCompletion(habitId: number, localDate: string): void {
  getDb().runSync('DELETE FROM habit_completions WHERE habit_id = ? AND local_date = ?', [
    habitId,
    localDate,
  ]);
}
