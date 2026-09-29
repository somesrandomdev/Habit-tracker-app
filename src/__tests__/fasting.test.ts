import { computeFastProgress, fastPhaseForElapsed, resolveEndStatus } from '@/utils/fasting';
import { HOUR_MS, MINUTE_MS } from '@/utils/durations';
import { computeFastingStats } from '@/services/fasting.service';
import { keyFromIso } from '@/utils/dates';
import type { FastSession } from '@/types/models';

const T0 = new Date('2026-09-28T18:00:00.000Z').getTime(); // 16:8 plan start

function session(partial: Partial<FastSession>): FastSession {
  const start = partial.start_time_utc ?? new Date(T0).toISOString();
  return {
    id: 1,
    plan_id: 1,
    start_time_utc: start,
    scheduled_end_time_utc: partial.scheduled_end_time_utc ?? new Date(T0 + 16 * HOUR_MS).toISOString(),
    actual_end_time_utc: partial.actual_end_time_utc ?? null,
    status: partial.status ?? 'active',
    notes: partial.notes ?? null,
    reason_for_stopping: partial.reason_for_stopping ?? null,
    created_at: start,
    updated_at: start,
  };
}

describe('computeFastProgress', () => {
  it('computes elapsed, remaining, and ratio mid-fast', () => {
    const p = computeFastProgress(new Date(T0).toISOString(), new Date(T0 + 16 * HOUR_MS).toISOString(), T0 + 8 * HOUR_MS);
    expect(p.elapsedMs).toBe(8 * HOUR_MS);
    expect(p.remainingMs).toBe(8 * HOUR_MS);
    expect(p.ratio).toBeCloseTo(0.5);
    expect(p.isComplete).toBe(false);
  });

  it('clamps ratio to 1 and reports completion past the target', () => {
    const p = computeFastProgress(new Date(T0).toISOString(), new Date(T0 + 16 * HOUR_MS).toISOString(), T0 + 20 * HOUR_MS);
    expect(p.ratio).toBe(1);
    expect(p.isComplete).toBe(true);
    expect(p.remainingMs).toBeLessThan(0);
  });

  it('is correct across midnight and DST-agnostic (pure timestamp math)', () => {
    // 23:00 start, target 15:00 next day: 16h regardless of local calendar
    const start = new Date('2026-09-28T23:00:00.000Z').getTime();
    const p = computeFastProgress(new Date(start).toISOString(), new Date(start + 16 * HOUR_MS).toISOString(), start + 15.5 * HOUR_MS);
    expect(p.elapsedMs).toBe(15.5 * HOUR_MS);
  });
});

describe('fast phases', () => {
  it('labels early, fat-burning, and extended zones', () => {
    expect(fastPhaseForElapsed(6 * HOUR_MS)).toBe('early');
    expect(fastPhaseForElapsed(13 * HOUR_MS)).toBe('fat_burning');
    expect(fastPhaseForElapsed(26 * HOUR_MS)).toBe('extended');
  });
});

describe('resolveEndStatus', () => {
  it('completes when the target is reached', () => {
    expect(resolveEndStatus(16 * HOUR_MS, 16 * HOUR_MS)).toBe('completed');
    expect(resolveEndStatus(17 * HOUR_MS, 16 * HOUR_MS)).toBe('completed');
  });

  it('marks fast cancels under 15 minutes as abandoned', () => {
    expect(resolveEndStatus(5 * MINUTE_MS, 16 * HOUR_MS)).toBe('abandoned');
  });

  it('marks anything in between as stopped early', () => {
    expect(resolveEndStatus(12 * HOUR_MS, 16 * HOUR_MS)).toBe('stopped_early');
  });
});

describe('computeFastingStats', () => {
  const todayKey = keyFromIso(new Date('2026-09-28T18:00:00.000Z').toISOString());

  const completedFast = (dayOffset: number, hours: number) => {
    const s = new Date(Date.UTC(2026, 8, 20 + dayOffset, 18, 0)).getTime();
    return session({
      start_time_utc: new Date(s).toISOString(),
      scheduled_end_time_utc: new Date(s + hours * HOUR_MS).toISOString(),
      actual_end_time_utc: new Date(s + hours * HOUR_MS).toISOString(),
      status: 'completed',
    });
  };

  it('sums totals, averages, and streaks from completed fasts', () => {
    const sessions = [completedFast(0, 16), completedFast(1, 16), completedFast(2, 12), session({ status: 'stopped_early', actual_end_time_utc: new Date(T0 + 3 * HOUR_MS).toISOString() })];
    const stats = computeFastingStats(sessions, todayKey);
    expect(stats.totalCompleted).toBe(3);
    expect(stats.totalHours).toBeCloseTo(44, 1);
    expect(stats.averageHours).toBeCloseTo(44 / 3, 1);
    expect(stats.longestStreak).toBeGreaterThanOrEqual(1);
  });

  it('ignores abandoned fasts for totals', () => {
    const sessions = [completedFast(0, 16), session({ status: 'abandoned', actual_end_time_utc: new Date(T0 + 4 * MINUTE_MS).toISOString() })];
    const stats = computeFastingStats(sessions, todayKey);
    expect(stats.totalCompleted).toBe(1);
  });
});
