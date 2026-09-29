import { formatClock, formatDurationHuman, formatHours, msToHours, hoursToMs, HOUR_MS } from '@/utils/durations';

describe('duration formatting', () => {
  it('formats clock style with padding', () => {
    expect(formatClock(0)).toBe('00:00:00');
    expect(formatClock(3661000 + 5000)).toBe('01:01:06');
    expect(formatClock(25 * HOUR_MS)).toBe('25:00:00');
  });

  it('clamps negative durations to zero', () => {
    expect(formatClock(-5000)).toBe('00:00:00');
    expect(formatDurationHuman(-1000)).toBe('0s');
  });

  it('formats human readable durations', () => {
    expect(formatDurationHuman(2 * HOUR_MS + 5 * 60000)).toBe('2h 05m');
    expect(formatDurationHuman(45 * 60000)).toBe('45m');
    expect(formatDurationHuman(30000)).toBe('30s');
  });

  it('formats hours with one decimal', () => {
    expect(formatHours(16)).toBe('16.0h');
    expect(formatHours(12.55)).toBe('12.6h');
  });

  it('converts between ms and hours', () => {
    expect(msToHours(HOUR_MS)).toBe(1);
    expect(hoursToMs(1.5)).toBe(1.5 * HOUR_MS);
  });
});
