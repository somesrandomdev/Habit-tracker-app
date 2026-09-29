import * as challengeRepo from '@/repositories/challenge.repo';
import { getSetting, setSetting } from '@/repositories/settings.repo';
import type {
  Challenge,
  ChallengeCheckIn,
  ChallengeStats,
  ChallengeType,
  CheckInStatus,
} from '@/types/models';
import { addDaysToKey, todayKey as nowKey } from '@/utils/dates';
import { computeChallengeStats } from '@/utils/challengeLogic';

export interface ChallengeState {
  challenge: Challenge;
  checkins: ChallengeCheckIn[];
  stats: ChallengeStats;
}

export function startChallenge(input: {
  type: ChallengeType;
  title: string;
  rules: string;
  durationDays: number;
}): { ok: boolean; value?: Challenge; error?: string } {
  if (!Number.isInteger(input.durationDays) || input.durationDays < 1 || input.durationDays > 365) {
    return { ok: false, error: 'Challenge duration must be between 1 and 365 days.' };
  }
  if (challengeRepo.getActiveChallenge()) {
    return { ok: false, error: 'A challenge is already active. Finish or abandon it first.' };
  }
  const start = nowKey();
  const end = addDaysToKey(start, input.durationDays - 1);
  const challenge = challengeRepo.createChallenge({
    title: input.title.trim() || 'No Sugar Challenge',
    challenge_type: input.type,
    rules_text: input.rules.trim(),
    start_date: start,
    end_date: end,
  });
  return { ok: true, value: challenge };
}

export function getChallengeState(dateKey: string = nowKey()): ChallengeState | null {
  const challenge = challengeRepo.getActiveChallenge();
  if (!challenge) return null;
  const checkins = challengeRepo.getCheckIns(challenge.id);
  return { challenge, checkins, stats: computeChallengeStats(challenge, checkins, dateKey) };
}

/**
 * Marks an active challenge completed once today is past its end date.
 * Returns whether the transition happened now (for celebration).
 */
export function refreshChallengeStatus(dateKey: string = nowKey()): {
  justCompleted: boolean;
  challenge: Challenge | null;
} {
  const challenge = challengeRepo.getActiveChallenge();
  if (!challenge) return { justCompleted: false, challenge: null };
  if (dateKey > challenge.end_date) {
    challengeRepo.updateChallengeStatus(challenge.id, 'completed');
    return { justCompleted: true, challenge: challengeRepo.getChallengeById(challenge.id) };
  }
  return { justCompleted: false, challenge };
}

export interface CheckInInput {
  status: CheckInStatus;
  craving_intensity: number | null;
  trigger_type: string | null;
  note: string | null;
}

export function checkIn(input: CheckInInput, dateKey: string = nowKey()): {
  ok: boolean;
  value?: ChallengeCheckIn;
  error?: string;
} {
  const challenge = challengeRepo.getActiveChallenge();
  if (!challenge) return { ok: false, error: 'No active challenge.' };
  if (dateKey < challenge.start_date || dateKey > challenge.end_date) {
    return { ok: false, error: 'Today is outside the challenge period.' };
  }
  const value = challengeRepo.upsertCheckIn({
    challenge_id: challenge.id,
    local_date: dateKey,
    status: input.status,
    craving_intensity: input.craving_intensity,
    trigger_type: input.trigger_type,
    note: input.note,
  });
  return { ok: true, value };
}

export function abandonChallenge(): { ok: boolean; error?: string } {
  const challenge = challengeRepo.getActiveChallenge();
  if (!challenge) return { ok: false, error: 'No active challenge.' };
  challengeRepo.updateChallengeStatus(challenge.id, 'abandoned');
  return { ok: true };
}

export function countCompletedChallenges(): number {
  return challengeRepo
    .getAllChallenges()
    .filter((c) => c.status === 'completed').length;
}

/** True when yesterday had a slip/fail and today is a qualifying day (comeback achievement). */
export function isComebackDay(checkins: ChallengeCheckIn[], dateKey: string = nowKey()): boolean {
  const byDate = new Map(checkins.map((c) => [c.local_date, c]));
  const today = byDate.get(dateKey);
  const yesterday = byDate.get(addDaysToKey(dateKey, -1));
  if (!today || !yesterday) return false;
  const qualifiedToday = today.status === 'success' || today.status === 'craving_only';
  const slippedYesterday = yesterday.status === 'slip' || yesterday.status === 'fail';
  return qualifiedToday && slippedYesterday;
}

// ---- Completion celebration (one-shot per challenge via a settings flag) ----

export function shouldCelebrateCompletion(challengeId: number): boolean {
  return getSetting(`celebrated_challenge_${challengeId}`) !== '1';
}

export function markChallengeCelebrated(challengeId: number): void {
  setSetting(`celebrated_challenge_${challengeId}`, '1');
}
