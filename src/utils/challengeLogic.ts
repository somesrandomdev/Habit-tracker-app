import type {
  Challenge,
  ChallengeCheckIn,
  ChallengeStats,
  CheckInStatus,
} from '@/types/models';
import { addDaysToKey, diffDays, isKeyAfter } from './dates';

/** success and craving_only both count as a successful challenge day. */
export function isQualifying(status: CheckInStatus): boolean {
  return status === 'success' || status === 'craving_only';
}

export function challengeTotalDays(challenge: Pick<Challenge, 'start_date' | 'end_date'>): number {
  return Math.max(1, diffDays(challenge.end_date, challenge.start_date) + 1);
}

/**
 * Full challenge progress model. Days strictly before today without a check-in count
 * as missed; today stays "pending" so an unchecked today never breaks the streak.
 */
export function computeChallengeStats(
  challenge: Challenge,
  checkins: ChallengeCheckIn[],
  todayKey: string,
): ChallengeStats {
  const totalDays = challengeTotalDays(challenge);
  const finished = isKeyAfter(todayKey, challenge.end_date) || challenge.status !== 'active';
  const lastDay = finished
    ? challenge.status === 'abandoned'
      ? lastCheckInDate(checkins) ?? challenge.start_date
      : challenge.end_date
    : challenge.end_date < todayKey
      ? challenge.end_date
      : todayKey;

  const byDate = new Map<string, ChallengeCheckIn>();
  for (const c of checkins) byDate.set(c.local_date, c);

  let successDays = 0;
  let cravingDays = 0;
  let slips = 0;
  let fails = 0;
  let missedDays = 0;

  let cursor = challenge.start_date;
  let guard = 0;
  while (diffDays(lastDay, cursor) >= 0 && guard < 3650) {
    const record = byDate.get(cursor);
    if (!record) {
      if (cursor !== todayKey) missedDays += 1;
    } else if (record.status === 'success') successDays += 1;
    else if (record.status === 'craving_only') cravingDays += 1;
    else if (record.status === 'slip') slips += 1;
    else if (record.status === 'fail') fails += 1;
    cursor = addDaysToKey(cursor, 1);
    guard += 1;
  }

  const daysElapsedIncludingToday = guard;
  // An unchecked today is still pending: exclude it from the rate denominator.
  const lastCountable = finished
    ? challenge.end_date
    : challenge.end_date < todayKey
      ? challenge.end_date
      : todayKey;
  const todayPending =
    lastCountable === todayKey && !byDate.has(todayKey) && diffDays(todayKey, challenge.start_date) >= 0;
  const daysElapsed = Math.max(0, daysElapsedIncludingToday - (todayPending ? 1 : 0));
  const qualifyingDays = successDays + cravingDays;
  const completionRate = daysElapsed > 0 ? qualifyingDays / daysElapsed : 0;

  return {
    dayNumber: Math.min(diffDays(challenge.end_date < todayKey ? challenge.end_date : todayKey, challenge.start_date) + 1, totalDays),
    totalDays,
    daysElapsed,
    successDays,
    cravingDays,
    slips,
    fails,
    missedDays,
    completionRate,
    currentStreak: currentSugarStreak(challenge, byDate, todayKey),
    longestStreak: longestSugarStreak(challenge, byDate, todayKey),
    isFinished: finished,
    todayCheckIn: byDate.get(todayKey) ?? null,
  };
}

/**
 * Current streak of qualifying days. Walks back from today (or the challenge end when
 * today is beyond it). slip/fail and missed days reset the streak; today without a
 * check-in is pending and does not.
 */
export function currentSugarStreak(
  challenge: Challenge,
  byDate: Map<string, ChallengeCheckIn>,
  todayKey: string,
): number {
  let key = challenge.end_date < todayKey ? challenge.end_date : todayKey;
  if (key === todayKey && !byDate.has(key)) {
    key = addDaysToKey(key, -1); // today pending: anchor at yesterday
  }
  let streak = 0;
  let guard = 0;
  while (diffDays(challenge.start_date, key) <= 0 && guard < 3650) {
    const record = byDate.get(key);
    if (!record) break;
    if (isQualifying(record.status)) streak += 1;
    else break; // slip or fail resets
    key = addDaysToKey(key, -1);
    guard += 1;
  }
  return streak;
}

export function longestSugarStreak(
  challenge: Challenge,
  byDate: Map<string, ChallengeCheckIn>,
  todayKey: string,
): number {
  let best = 0;
  let run = 0;
  let cursor = challenge.start_date;
  const last = challenge.end_date < todayKey ? challenge.end_date : todayKey;
  let guard = 0;
  while (diffDays(last, cursor) >= 0 && guard < 3650) {
    const record = byDate.get(cursor);
    if (record && isQualifying(record.status)) {
      run += 1;
      best = Math.max(best, run);
    } else if (record || cursor !== todayKey) {
      run = 0; // slip, fail, or a missed past day breaks the run
    }
    cursor = addDaysToKey(cursor, 1);
    guard += 1;
  }
  return best;
}

export function lastCheckInDate(checkins: ChallengeCheckIn[]): string | null {
  if (checkins.length === 0) return null;
  return checkins.map((c) => c.local_date).sort().at(-1) ?? null;
}
