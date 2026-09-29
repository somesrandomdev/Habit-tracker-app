import { getDb } from '@/db/database';
import type { DailyLog, MetricEntry } from '@/types/models';
import { isoNow } from '@/utils/dates';

// ---- Daily wellness logs ----

export interface DailyLogInput {
  mood: number | null;
  hunger: number | null;
  energy: number | null;
  water_cups: number;
  craving_intensity: number;
  note: string | null;
}

export function getDailyLog(localDate: string): DailyLog | null {
  return (
    getDb().getFirstSync<DailyLog>('SELECT * FROM daily_logs WHERE local_date = ?', [localDate]) ??
    null
  );
}

export function upsertDailyLog(localDate: string, input: DailyLogInput): DailyLog {
  const now = isoNow();
  getDb().runSync(
    `INSERT INTO daily_logs (local_date, mood, hunger, energy, water_cups, craving_intensity, note, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(local_date) DO UPDATE SET
       mood = excluded.mood, hunger = excluded.hunger, energy = excluded.energy,
       water_cups = excluded.water_cups, craving_intensity = excluded.craving_intensity,
       note = excluded.note, updated_at = excluded.updated_at`,
    [
      localDate,
      input.mood,
      input.hunger,
      input.energy,
      input.water_cups,
      input.craving_intensity,
      input.note,
      now,
      now,
    ],
  );
  return getDailyLog(localDate) as DailyLog;
}

export function getRecentLogs(days: number, todayKey: string): DailyLog[] {
  return getDb().getAllSync<DailyLog>(
    'SELECT * FROM daily_logs WHERE local_date >= date(?, ?) ORDER BY local_date',
    [todayKey, -days],
  );
}

export function getAllLogs(): DailyLog[] {
  return getDb().getAllSync<DailyLog>('SELECT * FROM daily_logs ORDER BY local_date');
}

// ---- Body metrics ----

export interface MetricInput {
  weight: number | null;
  waist: number | null;
  body_fat: number | null;
  note: string | null;
}

export function getMetricEntry(localDate: string): MetricEntry | null {
  return (
    getDb().getFirstSync<MetricEntry>('SELECT * FROM metric_entries WHERE local_date = ?', [
      localDate,
    ]) ?? null
  );
}

export function upsertMetricEntry(localDate: string, input: MetricInput): MetricEntry {
  const now = isoNow();
  getDb().runSync(
    `INSERT INTO metric_entries (local_date, weight, waist, body_fat, note, created_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(local_date) DO UPDATE SET
       weight = excluded.weight, waist = excluded.waist, body_fat = excluded.body_fat, note = excluded.note`,
    [localDate, input.weight, input.waist, input.body_fat, input.note, now],
  );
  return getMetricEntry(localDate) as MetricEntry;
}

export function getRecentMetrics(days: number, todayKey: string): MetricEntry[] {
  return getDb().getAllSync<MetricEntry>(
    'SELECT * FROM metric_entries WHERE local_date >= date(?, ?) ORDER BY local_date',
    [todayKey, -days],
  );
}

export function getAllMetrics(): MetricEntry[] {
  return getDb().getAllSync<MetricEntry>('SELECT * FROM metric_entries ORDER BY local_date');
}
