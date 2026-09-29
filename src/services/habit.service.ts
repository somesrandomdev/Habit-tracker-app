import * as habitsRepo from '@/repositories/habits.repo';
import type { Habit, HabitCompletion, HabitCompletionStatus } from '@/types/models';

export interface HabitResult {
  ok: boolean;
  value?: Habit | null;
  error?: string;
}

function validateInput(input: habitsRepo.HabitInput): string | null {
  if (!input.title.trim()) return 'Please give your habit a name.';
  if (input.title.length > 60) return 'Habit names work best under 60 characters.';
  if (input.schedule_type === 'custom' && input.scheduled_days.length === 0) {
    return 'Pick at least one day of the week.';
  }
  if (input.reminder_time !== null && !/^([01]\d|2[0-3]):[0-5]\d$/.test(input.reminder_time)) {
    return 'Reminder time must be in HH:mm format.';
  }
  return null;
}

export function createHabit(input: habitsRepo.HabitInput): HabitResult {
  const error = validateInput(input);
  if (error) return { ok: false, error };
  return { ok: true, value: habitsRepo.createHabit({ ...input, title: input.title.trim() }) };
}

export function updateHabit(id: number, input: habitsRepo.HabitInput): HabitResult {
  const error = validateInput(input);
  if (error) return { ok: false, error };
  return { ok: true, value: habitsRepo.updateHabit(id, { ...input, title: input.title.trim() }) };
}

/** Deactivates instead of deleting so history and stats stay consistent. */
export function deactivateHabit(id: number): HabitResult {
  habitsRepo.deactivateHabit(id);
  return { ok: true, value: habitsRepo.getHabitById(id) };
}

export interface ToggleOutcome {
  completed: boolean;
  completion: HabitCompletion | null;
}

/** Toggles today's completion; second tap undoes. Duplicate taps are safe. */
export function toggleCompletion(
  habitId: number,
  dateKey: string,
): { ok: boolean; value?: ToggleOutcome; error?: string } {
  const habit = habitsRepo.getHabitById(habitId);
  if (!habit) return { ok: false, error: 'Habit not found.' };
  const existing = habitsRepo.getCompletionFor(habitId, dateKey);
  if (existing && existing.status === 'completed') {
    habitsRepo.deleteCompletion(habitId, dateKey);
    return { ok: true, value: { completed: false, completion: null } };
  }
  const completion = habitsRepo.upsertCompletion({ habit_id: habitId, local_date: dateKey, status: 'completed' });
  return { ok: true, value: { completed: true, completion } };
}

/** Sets an explicit status (completed/missed/skipped) for a given day, e.g. history editing. */
export function setStatus(
  habitId: number,
  dateKey: string,
  status: HabitCompletionStatus,
): { ok: boolean; value?: HabitCompletion; error?: string } {
  const habit = habitsRepo.getHabitById(habitId);
  if (!habit) return { ok: false, error: 'Habit not found.' };
  return { ok: true, value: habitsRepo.upsertCompletion({ habit_id: habitId, local_date: dateKey, status }) };
}

export function clearStatus(habitId: number, dateKey: string): void {
  habitsRepo.deleteCompletion(habitId, dateKey);
}

export function getHabit(habitId: number): Habit | null {
  return habitsRepo.getHabitById(habitId);
}

export function getAllHabits(includeInactive = false): Habit[] {
  return habitsRepo.getAllHabits(includeInactive);
}
