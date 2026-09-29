import { addDaysToKey, diffDays, keyFromIso, localDateKey, weekdayOf, hoursPlanLabel } from '@/utils/dates';
import { formatDurationHuman } from '@/utils/durations';

describe('local date keys', () => {
  it('formats YYYY-MM-DD in local time', () => {
    const d = new Date(2026, 8, 28, 23, 30); // Sep 28 2026 local
    expect(localDateKey(d)).toBe('2026-09-28');
  });

  it('adds days across month boundaries', () => {
    expect(addDaysToKey('2026-09-30', 1)).toBe('2026-10-01');
    expect(addDaysToKey('2026-01-01', -1)).toBe('2025-12-31');
    expect(addDaysToKey('2026-02-28', 1)).toBe('2026-03-01');
  });

  it('computes day differences', () => {
    expect(diffDays('2026-09-28', '2026-09-25')).toBe(3);
    expect(diffDays('2026-09-25', '2026-09-28')).toBe(-3);
    expect(diffDays('2026-09-28', '2026-09-28')).toBe(0);
  });

  it('maps UTC ISO timestamps to the local date', () => {
    // Build a timestamp that is a known local date regardless of TZ:
    const localNoon = new Date(2026, 2, 15, 12, 0, 0);
    expect(keyFromIso(localNoon.toISOString())).toBe('2026-03-15');
  });

  it('derives weekday numbers matching Date.getDay', () => {
    expect(weekdayOf('2026-09-28')).toBe(new Date(2026, 8, 28).getDay());
  });

  it('builds plan labels from hours', () => {
    expect(hoursPlanLabel(16, 8)).toBe('16:8');
    expect(hoursPlanLabel(14.5, 9.5)).toBe('14.5:9.5');
  });
});

describe('streak helper parity', () => {
  it('formats the midnight-crossing example used in fasting tests', () => {
    // 23:10 start, completed at 15:10 next day = 16h
    const start = new Date(2026, 8, 27, 23, 10);
    const end = new Date(2026, 8, 28, 15, 10);
    expect(formatDurationHuman(end.getTime() - start.getTime())).toBe('16h 00m');
  });
});
