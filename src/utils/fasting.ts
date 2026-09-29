import type { FastPhase, FastProgress, FastStatus } from '@/types/models';
import { MINUTE_MS, msToHours } from './durations';

/** A fast canceled within this window counts as abandoned rather than stopped_early. */
export const ABANDON_THRESHOLD_MS = 15 * MINUTE_MS;

export const FAST_PHASE_META: Record<
  FastPhase,
  { label: string; emoji: string; hint: string }
> = {
  early: {
    label: 'Early Fast',
    emoji: '🌱',
    hint: 'Your body is digesting the last meal. Stay hydrated and take it easy.',
  },
  fat_burning: {
    label: 'Fat-Burning Zone',
    emoji: '🔥',
    hint: 'Glycogen is running low. This is where the magic happens — keep going.',
  },
  extended: {
    label: 'Extended Fast',
    emoji: '⚡',
    hint: 'You are beyond your target window. Listen to your body and break the fast gently when ready.',
  },
};

export function fastPhaseForElapsed(elapsedMs: number): FastPhase {
  const hours = msToHours(elapsedMs);
  if (hours < 12) return 'early';
  if (hours < 24) return 'fat_burning';
  return 'extended';
}

/**
 * Timer math is always computed from timestamps, never from accumulated intervals,
 * so restarts, backgrounding, timezone shifts and DST transitions stay correct.
 */
export function computeFastProgress(
  startIso: string,
  scheduledEndIso: string,
  nowMs: number = Date.now(),
): FastProgress {
  const start = new Date(startIso).getTime();
  const scheduledEnd = new Date(scheduledEndIso).getTime();
  const elapsedMs = Math.max(0, nowMs - start);
  const remainingMs = scheduledEnd - nowMs;
  const total = Math.max(1, scheduledEnd - start);
  const ratio = Math.min(1, Math.max(0, elapsedMs / total));
  return {
    elapsedMs,
    remainingMs,
    ratio,
    phase: fastPhaseForElapsed(elapsedMs),
    isComplete: remainingMs <= 0,
  };
}

/** Classification when the user ends a fast now. */
export function resolveEndStatus(elapsedMs: number, scheduledMs: number): FastStatus {
  if (elapsedMs >= scheduledMs) return 'completed';
  if (elapsedMs < ABANDON_THRESHOLD_MS) return 'abandoned';
  return 'stopped_early';
}

export function scheduledDurationMs(startIso: string, scheduledEndIso: string): number {
  return Math.max(0, new Date(scheduledEndIso).getTime() - new Date(startIso).getTime());
}

export function planTargetLabel(fastingHours: number): string {
  return `${Number.isInteger(fastingHours) ? fastingHours : fastingHours.toFixed(1)}h`;
}
