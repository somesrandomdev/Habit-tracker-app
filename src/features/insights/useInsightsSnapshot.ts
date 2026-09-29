import { useMemo } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import * as fastingService from '@/services/fasting.service';
import * as challengeService from '@/services/challenge.service';
import * as achievementsService from '@/services/achievements.service';
import * as habitsRepo from '@/repositories/habits.repo';
import * as logsRepo from '@/repositories/logs.repo';
import type { Achievement, DailyLog, Habit, HabitCompletion, MetricEntry } from '@/types/models';

export interface InsightsSnapshot {
  fasting: ReturnType<typeof fastingService.getFastingStats>;
  challenge: ReturnType<typeof challengeService.getChallengeState>;
  habits: Habit[];
  habitCompletions: HabitCompletion[];
  logs: DailyLog[];
  metrics: MetricEntry[];
  achievements: Achievement[];
}

/** One bundled data load for the Insights screen, refreshed on app refresh. */
export function getInsightsSnapshot(): InsightsSnapshot {
  return {
    fasting: fastingService.getFastingStats(),
    challenge: challengeService.getChallengeState(),
    habits: habitsRepo.getAllHabits(true),
    habitCompletions: habitsRepo.getAllCompletions(),
    logs: logsRepo.getAllLogs(),
    metrics: logsRepo.getAllMetrics(),
    achievements: achievementsService.getUnlocked(),
  };
}

export function useInsightsSnapshot(): InsightsSnapshot | null {
  const ready = useAppStore((s) => s.ready);
  const refreshCount = useAppStore((s) => s.refreshCount);

  return useMemo(() => {
    if (!ready) return null;
    try {
      void refreshCount;
      return getInsightsSnapshot();
    } catch {
      return null;
    }
  }, [ready, refreshCount]);
}
