import { addDaysToKey, diffDays } from './dates';

/**
 * Consecutive-day streak ending at today, or at yesterday when today has no entry yet
 * (a day in progress must not break an existing streak).
 */
export function currentStreak(dates: Iterable<string>, todayKey: string): number {
  const set = new Set(dates);
  let anchor = todayKey;
  if (!set.has(anchor)) {
    const yesterday = addDaysToKey(todayKey, -1);
    if (!set.has(yesterday)) return 0;
    anchor = yesterday;
  }
  let streak = 0;
  let key = anchor;
  while (set.has(key)) {
    streak += 1;
    key = addDaysToKey(key, -1);
  }
  return streak;
}

/** Best run of consecutive days anywhere in the set. */
export function longestStreak(dates: Iterable<string>): number {
  const sorted = Array.from(new Set(dates)).sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const key of sorted) {
    if (prev !== null && diffDays(key, prev) === 1) {
      run += 1;
    } else {
      run = 1;
    }
    best = Math.max(best, run);
    prev = key;
  }
  return best;
}
