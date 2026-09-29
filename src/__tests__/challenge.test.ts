import { computeChallengeStats, isQualifying } from '@/utils/challengeLogic';
import type { Challenge, ChallengeCheckIn, CheckInStatus } from '@/types/models';

function challenge(start: string, end: string, status: Challenge['status'] = 'active'): Challenge {
  return { id: 1, title: 'Test', challenge_type: 'no_added_sugar', rules_text: '', start_date: start, end_date: end, status, created_at: '2026-01-01T00:00:00Z' };
}

function checkin(localDate: string, status: CheckInStatus): ChallengeCheckIn {
  return { id: 1, challenge_id: 1, local_date: localDate, status, craving_intensity: null, trigger_type: null, note: null, created_at: '', updated_at: '' };
}

describe('isQualifying', () => {
  it('counts success and craving_only, not slip/fail', () => {
    expect(isQualifying('success')).toBe(true);
    expect(isQualifying('craving_only')).toBe(true);
    expect(isQualifying('slip')).toBe(false);
    expect(isQualifying('fail')).toBe(false);
  });
});

describe('computeChallengeStats', () => {
  it('tracks day number, totals, and rate over a 7-day challenge', () => {
    const c = challenge('2026-09-01', '2026-09-07');
    const checkins = [
      checkin('2026-09-01', 'success'),
      checkin('2026-09-02', 'craving_only'),
      checkin('2026-09-03', 'slip'),
      checkin('2026-09-04', 'fail'),
      checkin('2026-09-05', 'success'),
      // 09-06 missed, 09-07 pending (today)
    ];
    const stats = computeChallengeStats(c, checkins, '2026-09-07');
    expect(stats.totalDays).toBe(7);
    expect(stats.dayNumber).toBe(7);
    expect(stats.successDays).toBe(2);
    expect(stats.cravingDays).toBe(1);
    expect(stats.slips).toBe(1);
    expect(stats.fails).toBe(1);
    expect(stats.missedDays).toBe(1); // 09-06
    expect(stats.todayCheckIn).toBeNull();
    expect(stats.completionRate).toBeCloseTo(3 / 6, 5); // 6 elapsed days (today pending, not missed)
    expect(stats.isFinished).toBe(false);
  });

  it('resets current streak on slip but keeps challenge progress', () => {
    const c = challenge('2026-09-01', '2026-09-10');
    const checkins = [
      checkin('2026-09-01', 'success'),
      checkin('2026-09-02', 'success'),
      checkin('2026-09-03', 'slip'),
      checkin('2026-09-04', 'success'),
    ];
    const stats = computeChallengeStats(c, checkins, '2026-09-04');
    expect(stats.currentStreak).toBe(1);
    expect(stats.longestStreak).toBe(2);
    expect(stats.slips).toBe(1);
    expect(stats.successDays).toBe(3); // progress not erased: 01, 02, and 04 all still count
  });

  it('does not break the streak when today is unchecked (pending)', () => {
    const c = challenge('2026-09-01', '2026-09-10');
    const checkins = [checkin('2026-09-03', 'success'), checkin('2026-09-04', 'success')];
    const stats = computeChallengeStats(c, checkins, '2026-09-04');
    expect(stats.currentStreak).toBe(2);
  });

  it('marks finished once today passes the end date', () => {
    const c = challenge('2026-09-01', '2026-09-07');
    const stats = computeChallengeStats(c, [checkin('2026-09-07', 'success')], '2026-09-08');
    expect(stats.isFinished).toBe(true);
    expect(stats.dayNumber).toBe(7); // capped at totalDays
  });

  it('counts a missed past day as breaking the run for longest streak', () => {
    const c = challenge('2026-09-01', '2026-09-07');
    const checkins = [checkin('2026-09-01', 'success'), checkin('2026-09-03', 'success')];
    const stats = computeChallengeStats(c, checkins, '2026-09-05');
    expect(stats.longestStreak).toBe(1);
  });
});
