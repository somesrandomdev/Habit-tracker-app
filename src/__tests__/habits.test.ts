import { computeHabitStats, isScheduledOn, parseScheduledDays } from '@/utils/habitLogic';
import type { Habit, HabitCompletion } from '@/types/models';

function habit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 1,
    title: 'Test habit',
    emoji: '🎯',
    schedule_type: 'daily',
    scheduled_days: '[]',
    reminder_time: null,
    active: 1,
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

function completion(habitId: number, localDate: string, status: HabitCompletion['status']): HabitCompletion {
  return { id: 1, habit_id: habitId, local_date: localDate, status, note: null, created_at: '', updated_at: '' };
}

describe('isScheduledOn', () => {
  it('schedules daily habits every day', () => {
    expect(isScheduledOn(habit(), '2026-09-28')).toBe(true);
  });

  it('schedules weekdays only Mon-Fri', () => {
    const h = habit({ schedule_type: 'weekdays' });
    // 2026-09-26 is Saturday, 2026-09-28 is Monday
    expect(isScheduledOn(h, '2026-09-26')).toBe(false);
    expect(isScheduledOn(h, '2026-09-28')).toBe(true);
  });

  it('honors custom day lists', () => {
    const h = habit({ schedule_type: 'custom', scheduled_days: JSON.stringify([1, 3, 5]) });
    expect(isScheduledOn(h, '2026-09-28')).toBe(true); // Monday
    expect(isScheduledOn(h, '2026-09-29')).toBe(false); // Tuesday
  });

  it('parses corrupted day lists safely', () => {
    expect(parseScheduledDays('not json')).toEqual([]);
    expect(parseScheduledDays('{"a":1}')).toEqual([]);
  });
});

describe('computeHabitStats', () => {
  it('completed days build the streak', () => {
    const h = habit();
    const completions = [completion(1, '2026-09-27', 'completed'), completion(1, '2026-09-26', 'completed')];
    expect(computeHabitStats(h, completions, '2026-09-28').currentStreak).toBe(2);
  });

  it('skipped days preserve but do not increase the streak', () => {
    const h = habit();
    const completions = [
      completion(1, '2026-09-28', 'completed'),
      completion(1, '2026-09-27', 'skipped'),
      completion(1, '2026-09-26', 'completed'),
    ];
    const stats = computeHabitStats(h, completions, '2026-09-28');
    expect(stats.currentStreak).toBe(2); // skipped preserved, counted only for the two completed
  });

  it('missed days break the streak', () => {
    const h = habit();
    const completions = [
      completion(1, '2026-09-28', 'completed'),
      completion(1, '2026-09-27', 'missed'),
      completion(1, '2026-09-26', 'completed'),
    ];
    expect(computeHabitStats(h, completions, '2026-09-28').currentStreak).toBe(1);
  });

  it('an unchecked today is pending, not broken', () => {
    const h = habit();
    const completions = [completion(1, '2026-09-27', 'completed'), completion(1, '2026-09-26', 'completed')];
    expect(computeHabitStats(h, completions, '2026-09-28').currentStreak).toBe(2);
  });

  it('only counts scheduled days for weekly rate (weekdays habit over a weekend-inclusive window)', () => {
    const h = habit({ schedule_type: 'weekdays' });
    // Two full weekday weeks inside the 14-day window ending 2026-09-27 (Sunday)
    const completions = [
      '2026-09-14', '2026-09-15', '2026-09-16', '2026-09-17', '2026-09-18',
      '2026-09-21', '2026-09-22', '2026-09-23', '2026-09-24', '2026-09-25',
    ].map((d) => completion(1, d, 'completed'));
    const stats = computeHabitStats(h, completions, '2026-09-27');
    expect(stats.weeklyRate).toBe(1);
  });

  it('counts total completions per habit only', () => {
    const h1 = habit({ id: 1 });
    const other = completion(2, '2026-09-26', 'completed');
    const completions = [completion(1, '2026-09-27', 'completed'), other];
    expect(computeHabitStats(h1, completions, '2026-09-28').totalCompletions).toBe(1);
  });
});
