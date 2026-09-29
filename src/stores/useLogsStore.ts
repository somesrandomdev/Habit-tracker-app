import { create } from 'zustand';
import * as wellnessService from '@/services/wellness.service';
import type { DailyLog, MetricEntry } from '@/types/models';
import { todayKey } from '@/utils/dates';
import type { DailyLogInput, MetricInput } from '@/repositories/logs.repo';

interface LogsStore {
  todayLog: DailyLog | null;
  recentLogs: DailyLog[]; // last 14 days, for quick trends
  metrics: MetricEntry[]; // last 30 days
  hydrate: () => void;
  saveLog: (input: Partial<DailyLogInput> & { water_delta?: number }, dateKey?: string) => void;
  saveMetric: (input: Partial<MetricInput>, dateKey?: string) => void;
}

export const useLogsStore = create<LogsStore>((set) => ({
  todayLog: null,
  recentLogs: [],
  metrics: [],

  hydrate: () => {
    const key = todayKey();
    set({
      todayLog: wellnessService.getTodayLog(key),
      recentLogs: wellnessService.getRecentLogs(14, key),
      metrics: wellnessService.getRecentMetrics(30, key),
    });
  },

  saveLog: (input, dateKey = todayKey()) => {
    wellnessService.saveDailyLog(dateKey, input);
    set((s) => ({
      todayLog: dateKey === todayKey() ? wellnessService.getTodayLog(todayKey()) : s.todayLog,
      recentLogs: wellnessService.getRecentLogs(14, todayKey()),
    }));
  },

  saveMetric: (input, dateKey = todayKey()) => {
    wellnessService.saveMetricEntry(dateKey, input);
    set({
      metrics: wellnessService.getRecentMetrics(30, todayKey()),
    });
  },
}));
