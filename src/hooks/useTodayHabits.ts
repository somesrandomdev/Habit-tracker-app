import { useMemo } from 'react';
import { useHabitsStore } from '@/stores/useHabitsStore';
import { useAppStore } from '@/stores/useAppStore';
import { habitsScheduledOn, completionsByDate, type TodayHabitRow } from '@/utils/habitLogic';
import { todayKey } from '@/utils/dates';

export interface TodayHabits {
  rows: TodayHabitRow[];
  completedCount: number;
  scheduledCount: number;
}

/** Today's scheduled habits with their completion status. */
export function useTodayHabits(): TodayHabits {
  const habits = useHabitsStore((s) => s.habits);
  const completions = useHabitsStore((s) => s.completions);
  const refreshCount = useAppStore((s) => s.refreshCount);

  return useMemo(() => {
    void refreshCount;
    const key = todayKey();
    const scheduled = habitsScheduledOn(habits, key);
    const byHabit = completionsByDate(completions).get(key);
    const rows: TodayHabitRow[] = scheduled.map((habit) => ({
      habit,
      completion: byHabit?.get(habit.id) ?? null,
    }));
    return {
      rows,
      completedCount: rows.filter((r) => r.completion?.status === 'completed').length,
      scheduledCount: rows.length,
    };
  }, [habits, completions, refreshCount]);
}
