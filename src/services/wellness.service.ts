import * as logsRepo from '@/repositories/logs.repo';
import type { DailyLog, MetricEntry } from '@/types/models';

export function saveDailyLog(
  localDate: string,
  input: Partial<logsRepo.DailyLogInput> & { water_delta?: number },
): DailyLog {
  const existing = logsRepo.getDailyLog(localDate);
  const merged: logsRepo.DailyLogInput = {
    mood: input.mood ?? existing?.mood ?? null,
    hunger: input.hunger ?? existing?.hunger ?? null,
    energy: input.energy ?? existing?.energy ?? null,
    water_cups: clamp(
      input.water_cups ?? (existing ? existing.water_cups + (input.water_delta ?? 0) : (input.water_delta ?? 0)),
      0,
      20,
    ),
    craving_intensity: clamp(input.craving_intensity ?? existing?.craving_intensity ?? 0, 0, 10),
    note: input.note ?? existing?.note ?? null,
  };
  return logsRepo.upsertDailyLog(localDate, merged);
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(n)));
}

export function getTodayLog(localDate: string): DailyLog | null {
  return logsRepo.getDailyLog(localDate);
}

export function getRecentLogs(days: number, todayKey: string): DailyLog[] {
  return logsRepo.getRecentLogs(days, todayKey);
}

export function saveMetricEntry(
  localDate: string,
  input: Partial<logsRepo.MetricInput>,
): MetricEntry {
  const existing = logsRepo.getMetricEntry(localDate);
  return logsRepo.upsertMetricEntry(localDate, {
    weight: input.weight ?? existing?.weight ?? null,
    waist: input.waist ?? existing?.waist ?? null,
    body_fat: input.body_fat ?? existing?.body_fat ?? null,
    note: input.note ?? existing?.note ?? null,
  });
}

export function getRecentMetrics(days: number, todayKey: string): MetricEntry[] {
  return logsRepo.getRecentMetrics(days, todayKey);
}
