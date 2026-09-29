import { currentStreak, longestStreak } from '@/utils/streaks';
import { addDaysToKey } from '@/utils/dates';

describe('currentStreak', () => {
  const today = '2026-09-28';

  it('counts consecutive days ending today', () => {
    const dates = ['2026-09-26', '2026-09-27', '2026-09-28'];
    expect(currentStreak(dates, today)).toBe(3);
  });

  it('anchors at yesterday when today is not yet recorded (fast in progress)', () => {
    const dates = ['2026-09-25', '2026-09-26', '2026-09-27'];
    expect(currentStreak(dates, today)).toBe(3);
  });

  it('returns 0 when neither today nor yesterday has an entry', () => {
    const dates = ['2026-09-20', '2026-09-25'];
    expect(currentStreak(dates, today)).toBe(0);
  });

  it('breaks on gaps', () => {
    const dates = [addDaysToKey(today, -2), today];
    expect(currentStreak(dates, today)).toBe(1);
  });

  it('deduplicates input dates', () => {
    expect(currentStreak([today, today, today], today)).toBe(1);
  });
});

describe('longestStreak', () => {
  it('finds the best historical run', () => {
    const dates = [
      '2026-09-01',
      '2026-09-02',
      '2026-09-03',
      '2026-09-05', // gap
      '2026-09-06',
    ];
    expect(longestStreak(dates)).toBe(3);
  });

  it('returns 0 for empty input', () => {
    expect(longestStreak([])).toBe(0);
  });

  it('handles a single day', () => {
    expect(longestStreak(['2026-01-01'])).toBe(1);
  });
});
