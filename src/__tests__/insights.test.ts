import { fastingHoursByDay, habitCompletionRates, wellnessTrend, averageWater, bestAndWeakestHabits } from '@/utils/insights';
import * as habitService from '@/services/habit.service';
import * as wellnessService from '@/services/wellness.service';
import * as challengeService from '@/services/challenge.service';
import type { DailyLog, FastSession, Habit, HabitCompletion } from '@/types/models';

const TODAY = '2026-09-28';

function session(id: number, endIso: string, hours: number, status: FastSession['status'] = 'completed'): FastSession {
  const end = new Date(endIso).getTime();
  return {
    id,
    plan_id: 1,
    start_time_utc: new Date(end - hours * 3600000).toISOString(),
    scheduled_end_time_utc: new Date(end).toISOString(),
    actual_end_time_utc: endIso,
    status,
    notes: null,
    reason_for_stopping: null,
    created_at: '',
    updated_at: '',
  };
}

function habit(id: number, overrides: Partial<Habit> = {}): Habit {
  return {
    id,
    title: `Habit ${id}`,
    emoji: '🎯',
    schedule_type: 'daily',
    scheduled_days: '[]',
    reminder_time: null,
    active: 1,
    created_at: '',
    ...overrides,
  };
}

function completion(habitId: number, localDate: string, status: HabitCompletion['status'] = 'completed'): HabitCompletion {
  return { id: 1, habit_id: habitId, local_date: localDate, status, note: null, created_at: '', updated_at: '' };
}

describe('fastingHoursByDay', () => {
  it('sums completed fast hours by local end date over the window', () => {
    const sessions = [
      session(1, '2026-09-27T06:00:00.000Z', 16),
      session(2, '2026-09-27T06:00:00.000Z', 2), // same day: 18 total
      session(3, '2026-09-26T06:00:00.000Z', 16, 'stopped_early'), // excluded
    ];
    const bars = fastingHoursByDay(sessions, TODAY, 7);
    expect(bars).toHaveLength(7);
    expect(bars.find((b) => b.dateKey === '2026-09-27')?.hours).toBe(18);
    expect(bars.find((b) => b.dateKey === '2026-09-26')?.completed).toBe(false);
    expect(bars.find((b) => b.dateKey === TODAY)?.hours).toBe(0);
  });
});

describe('habitCompletionRates & best/weakest', () => {
  it('computes scheduled-only rates and ranks habits', () => {
    const habits = [habit(1), habit(2)];
    const completions: HabitCompletion[] = [];
    for (let i = 0; i < 14; i++) {
      const day = new Date(Date.UTC(2026, 8, 28 - i)).toISOString().slice(0, 10);
      completions.push(completion(1, day)); // habit 1: perfect
      if (i % 2 === 0) completions.push(completion(2, day)); // habit 2: ~50%
    }
    const rates = habitCompletionRates(habits, completions, TODAY);
    const h1 = rates.find((r) => r.habit.id === 1);
    const h2 = rates.find((r) => r.habit.id === 2);
    expect(h1?.rate).toBe(1);
    expect(h2?.rate).toBeLessThan(1);

    const { best, weakest } = bestAndWeakestHabits(habits, completions, TODAY);
    expect(best?.habit.id).toBe(1);
    expect(weakest?.habit.id).toBe(2);
  });
});

describe('wellnessTrend & averageWater', () => {
  it('builds a 7-day series with gaps as null', () => {
    const logs: DailyLog[] = [
      { id: 1, local_date: TODAY, mood: 4, hunger: 2, energy: 3, water_cups: 6, craving_intensity: 2, note: null, created_at: '', updated_at: '' },
      { id: 2, local_date: '2026-09-27', mood: 3, hunger: 3, energy: 2, water_cups: 4, craving_intensity: 5, note: null, created_at: '', updated_at: '' },
    ];
    const mood = wellnessTrend(logs, 'mood', TODAY, 7);
    expect(mood).toHaveLength(7);
    expect(mood[6]?.value).toBe(4);
    expect(mood[5]?.value).toBe(3);
    expect(mood[0]?.value).toBeNull();
    expect(averageWater(logs, 7, TODAY)).toBe(5);
  });
});

describe('service module surface', () => {
  it('exposes the expected fasting service API', () => {
    expect(typeof habitService.createHabit).toBe('function');
    expect(typeof habitService.toggleCompletion).toBe('function');
    expect(typeof wellnessService.saveDailyLog).toBe('function');
    expect(typeof wellnessService.saveMetricEntry).toBe('function');
    expect(typeof challengeService.checkIn).toBe('function');
    expect(typeof challengeService.startChallenge).toBe('function');
  });

  it('validates challenge duration bounds', () => {
    expect(challengeService.startChallenge({ type: 'no_added_sugar', title: 'X', rules: 'r', durationDays: 0 }).ok).toBe(false);
    expect(challengeService.startChallenge({ type: 'no_added_sugar', title: 'X', rules: 'r', durationDays: 400 }).ok).toBe(false);
  });
});
