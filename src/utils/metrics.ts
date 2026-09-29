import type { MetricEntry } from '@/types/models';
import { addDaysToKey, diffDays } from './dates';

export const KG_PER_LB = 0.453592;
export const CM_PER_IN = 2.54;

export function kgToLb(kg: number): number {
  return kg / KG_PER_LB;
}

export function lbToKg(lb: number): number {
  return lb * KG_PER_LB;
}

export function cmToIn(cm: number): number {
  return cm / CM_PER_IN;
}

export function inToCm(inches: number): number {
  return inches * CM_PER_IN;
}

export function displayWeight(kg: number | null, units: 'metric' | 'imperial'): number | null {
  if (kg === null) return null;
  return round(units === 'metric' ? kg : kgToLb(kg));
}

export function displayLength(cm: number | null, units: 'metric' | 'imperial'): number | null {
  if (cm === null) return null;
  return round(units === 'metric' ? cm : cmToIn(cm));
}

/** Convert a user-entered value in the active unit system back to storage units (kg / cm). */
export function toStoredWeight(value: number, units: 'metric' | 'imperial'): number {
  return round(units === 'metric' ? value : lbToKg(value));
}

export function toStoredLength(value: number, units: 'metric' | 'imperial'): number {
  return round(units === 'metric' ? value : inToCm(value));
}

function round(n: number): number {
  return Math.round(n * 10) / 10;
}

export type MetricField = 'weight' | 'waist' | 'body_fat';

/** Latest entry by local date (ties broken by created_at, then id). */
export function latestEntry(entries: MetricEntry[]): MetricEntry | null {
  if (entries.length === 0) return null;
  return [...entries].sort((a, b) => {
    if (a.local_date !== b.local_date) return a.local_date < b.local_date ? 1 : -1;
    if (a.created_at !== b.created_at) return a.created_at < b.created_at ? 1 : -1;
    return b.id - a.id;
  })[0];
}

export function entriesInWindow(
  entries: MetricEntry[],
  days: number,
  todayKey: string,
): MetricEntry[] {
  const start = addDaysToKey(todayKey, -(days - 1));
  return entries
    .filter((e) => diffDays(todayKey, e.local_date) >= 0 && diffDays(e.local_date, start) >= 0)
    .sort((a, b) => (a.local_date < b.local_date ? -1 : 1));
}

/** Change of a metric over the last `days` days: latest value minus earliest in window. */
export function metricChange(
  entries: MetricEntry[],
  field: MetricField,
  days: number,
  todayKey: string,
): { from: number; to: number; delta: number } | null {
  const window = entriesInWindow(entries, days, todayKey).filter((e) => e[field] !== null);
  if (window.length < 2) return null;
  const from = window[0][field] as number;
  const to = window[window.length - 1][field] as number;
  return { from, to, delta: Math.round((to - from) * 10) / 10 };
}
