// Pure date helpers. Calendar-day records use "local date keys" (YYYY-MM-DD in the
// device's timezone at that moment). Timestamps are always stored as UTC ISO strings.

import { format, addDays, differenceInCalendarDays, parse } from 'date-fns';

const KEY_FORMAT = 'yyyy-MM-dd';

/** YYYY-MM-DD in the device timezone for a given Date. */
export function localDateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayKey(): string {
  return localDateKey(new Date());
}

/** Local-midnight Date for a date key. */
export function dateFromKey(key: string): Date {
  return parse(key, KEY_FORMAT, new Date());
}

export function keyToDate(key: string): Date {
  return dateFromKey(key);
}

/** Local date key for a UTC ISO timestamp. */
export function keyFromIso(iso: string): string {
  return localDateKey(new Date(iso));
}

export function isoNow(): string {
  return new Date().toISOString();
}

export function addDaysToKey(key: string, days: number): string {
  return format(addDays(dateFromKey(key), days), KEY_FORMAT);
}

/** a - b in whole calendar days. */
export function diffDays(a: string, b: string): number {
  return differenceInCalendarDays(dateFromKey(a), dateFromKey(b));
}

export function isKeyAfter(a: string, b: string): boolean {
  return diffDays(a, b) > 0;
}

export function formatKeyFriendly(key: string): string {
  return format(dateFromKey(key), 'EEE, MMM d');
}

export function formatKeyShort(key: string): string {
  return format(dateFromKey(key), 'MMM d');
}

/** Local HH:mm for a UTC ISO timestamp. */
export function formatIsoTime(iso: string): string {
  return format(new Date(iso), 'HH:mm');
}

export function formatIsoDateTime(iso: string): string {
  return format(new Date(iso), 'MMM d, HH:mm');
}

/** Day of year (1-based), used for deterministic daily content rotation. */
export function dayOfYear(key: string): number {
  const d = dateFromKey(key);
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d.getTime() - start.getTime()) / 86400000);
}

export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function weekdayOf(key: string): number {
  return dateFromKey(key).getDay(); // 0 = Sunday, matches Date.getDay()
}

/** "14:10" plan-style label from hours. */
export function hoursPlanLabel(fastingHours: number, eatingHours: number): string {
  const f = Number.isInteger(fastingHours) ? fastingHours : fastingHours.toFixed(1);
  const e = Number.isInteger(eatingHours) ? eatingHours : eatingHours.toFixed(1);
  return `${f}:${e}`;
}
