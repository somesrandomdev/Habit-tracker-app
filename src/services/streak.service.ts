import * as challengeService from './challenge.service';
import * as fastingService from './fasting.service';
import * as habitsRepo from '@/repositories/habits.repo';
import type { Habit } from '@/types/models';
import { todayKey } from '@/utils/dates';
import { computeHabitStats } from '@/utils/habitLogic';

export interface StreakSummary {
  fasting: { current: number; longest: number };
  sugar: { current: number; longest: number } | null;
  habits: { current: number; habit: Habit | null };
}

/** Aggregated streaks for the dashboard. Sugar is null when no challenge exists. */
export function getStreakSummary(dateKey: string = todayKey()): StreakSummary {
  const fasting = fastingService.getFastingStats(dateKey);
  const state = challengeService.getChallengeState(dateKey);

  let bestHabit: { current: number; habit: Habit | null } = { current: 0, habit: null };
  const habits = habitsRepo.getAllHabits();
  const completions = habitsRepo.getAllCompletions();
  for (const habit of habits) {
    const stats = computeHabitStats(habit, completions, dateKey);
    if (stats.currentStreak > bestHabit.current) {
      bestHabit = { current: stats.currentStreak, habit };
    }
  }

  return {
    fasting: { current: fasting.currentStreak, longest: fasting.longestStreak },
    sugar: state
      ? { current: state.stats.currentStreak, longest: state.stats.longestStreak }
      : null,
    habits: bestHabit,
  };
}
