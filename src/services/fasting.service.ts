import * as fastingRepo from '@/repositories/fasting.repo';
import type { FastSession, FastingPlan, FastingStats } from '@/types/models';
import { addDaysToKey, keyFromIso, todayKey } from '@/utils/dates';
import { HOUR_MS, msToHours } from '@/utils/durations';
import { computeFastProgress, resolveEndStatus } from '@/utils/fasting';
import { fastingHoursByDay } from '@/utils/insights';
import { currentStreak, longestStreak } from '@/utils/streaks';

export interface ServiceResult<T> {
  ok: boolean;
  value?: T;
  error?: string;
}

function ok<T>(value: T): ServiceResult<T> {
  return { ok: true, value };
}

function fail<T>(error: string): ServiceResult<T> {
  return { ok: false, error };
}

/** Starts a fast with the given plan (or the active plan). Only one active fast is allowed. */
export function startFast(planId?: number): ServiceResult<FastSession> {
  if (fastingRepo.getActiveFast()) {
    return fail('A fast is already in progress. End it before starting a new one.');
  }
  const plan = planId ? fastingRepo.getPlanById(planId) : fastingRepo.getActivePlan();
  if (!plan) return fail('No fasting plan found. Set one up in Settings first.');
  const now = Date.now();
  const startIso = new Date(now).toISOString();
  const scheduledEndIso = new Date(now + plan.fasting_hours * HOUR_MS).toISOString();
  return ok(fastingRepo.createActiveSession(plan.id, startIso, scheduledEndIso));
}

/** Extends the active fast by `hours`, counted from max(now, scheduled end). */
export function extendFast(sessionId: number, hours: number): ServiceResult<FastSession> {
  if (!(hours > 0) || hours > 72) return fail('Extension must be between 0 and 72 hours.');
  const session = fastingRepo.getSessionById(sessionId);
  if (!session || session.status !== 'active') return fail('No active fast to extend.');
  const now = Date.now();
  const scheduledEnd = new Date(session.scheduled_end_time_utc).getTime();
  const base = Math.max(now, scheduledEnd);
  const newEndIso = new Date(base + hours * HOUR_MS).toISOString();
  fastingRepo.extendSession(sessionId, newEndIso);
  return ok(fastingRepo.getSessionById(sessionId) as FastSession);
}

export interface EndFastOutcome {
  session: FastSession;
  completed: boolean;
  stoppedEarly: boolean;
  abandoned: boolean;
}

export function endFast(
  sessionId: number,
  reason: string | null,
): ServiceResult<EndFastOutcome> {
  const session = fastingRepo.getSessionById(sessionId);
  if (!session || session.status !== 'active') return fail('No active fast to end.');
  const nowIso = new Date().toISOString();
  const elapsed = Date.now() - new Date(session.start_time_utc).getTime();
  const scheduled = new Date(session.scheduled_end_time_utc).getTime() -
    new Date(session.start_time_utc).getTime();
  const status = resolveEndStatus(elapsed, scheduled);
  const updated = fastingRepo.finishSession(sessionId, status, nowIso, reason);
  if (!updated) return fail('Could not end the fast. Please try again.');
  return ok({
    session: updated,
    completed: status === 'completed',
    stoppedEarly: status === 'stopped_early',
    abandoned: status === 'abandoned',
  });
}

/** Cancels/abandons the active fast regardless of duration (user-initiated cancel). */
export function abandonFast(sessionId: number, reason: string | null): ServiceResult<FastSession> {
  const session = fastingRepo.getSessionById(sessionId);
  if (!session || session.status !== 'active') return fail('No active fast to cancel.');
  const updated = fastingRepo.finishSession(sessionId, 'abandoned', new Date().toISOString(), reason);
  if (!updated) return fail('Could not cancel the fast. Please try again.');
  return ok(updated);
}

/** Corrects the start time; the scheduled end keeps the original planned duration. */
export function updateStartTime(sessionId: number, newStartIso: string): ServiceResult<FastSession> {
  const start = new Date(newStartIso);
  if (Number.isNaN(start.getTime())) return fail('Invalid start time.');
  if (start.getTime() > Date.now()) return fail('Start time cannot be in the future.');
  const session = fastingRepo.getSessionById(sessionId);
  if (!session) return fail('Fast not found.');
  const duration =
    new Date(session.scheduled_end_time_utc).getTime() -
    new Date(session.start_time_utc).getTime();
  const newEndIso = new Date(start.getTime() + duration).toISOString();
  fastingRepo.updateSessionStart(sessionId, start.toISOString(), newEndIso);
  return ok(fastingRepo.getSessionById(sessionId) as FastSession);
}

export function updateNotes(sessionId: number, notes: string): ServiceResult<FastSession> {
  const session = fastingRepo.getSessionById(sessionId);
  if (!session) return fail('Fast not found.');
  fastingRepo.updateSessionNotes(sessionId, notes);
  return ok(fastingRepo.getSessionById(sessionId) as FastSession);
}

export function deleteSession(sessionId: number): ServiceResult<true> {
  fastingRepo.deleteSession(sessionId);
  return ok(true);
}

export function computeFastingStats(sessions: FastSession[], dateKey: string): FastingStats {
  const completed = sessions.filter((s) => s.status === 'completed' && s.actual_end_time_utc);
  const durations = completed.map(
    (s) =>
      new Date(s.actual_end_time_utc as string).getTime() -
      new Date(s.start_time_utc).getTime(),
  );
  const totalMs = durations.reduce((sum, d) => sum + d, 0);
  const weekStart = addDaysToKey(dateKey, -6);
  const weekDurations = completed.filter(
    (s) => keyFromIso(s.actual_end_time_utc as string) >= weekStart,
  );
  return {
    totalCompleted: completed.length,
    totalHours: msToHours(totalMs),
    averageHours: durations.length > 0 ? msToHours(totalMs / durations.length) : 0,
    currentStreak: currentStreak(
      completed.map((s) => keyFromIso(s.actual_end_time_utc as string)),
      dateKey,
    ),
    longestStreak: longestStreak(
      completed.map((s) => keyFromIso(s.actual_end_time_utc as string)),
    ),
    weekHours: msToHours(
      weekDurations.reduce(
        (sum, s) =>
          sum +
          (new Date(s.actual_end_time_utc as string).getTime() -
            new Date(s.start_time_utc).getTime()),
        0,
      ),
    ),
    last7Days: fastingHoursByDay(completed, dateKey, 7),
  };
}

export function getFastingStats(dateKey: string = todayKey()): FastingStats {
  return computeFastingStats(fastingRepo.getAllSessions(), dateKey);
}

export function fastProgressFor(session: FastSession, nowMs = Date.now()) {
  return computeFastProgress(session.start_time_utc, session.scheduled_end_time_utc, nowMs);
}

export function planLabel(plan: FastingPlan): string {
  return plan.name;
}
