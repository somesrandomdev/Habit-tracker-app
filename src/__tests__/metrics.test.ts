import { kgToLb, lbToKg, cmToIn, inToCm, displayWeight, toStoredWeight, latestEntry, metricChange } from '@/utils/metrics';
import type { MetricEntry } from '@/types/models';

function entry(partial: Partial<MetricEntry>): MetricEntry {
  return {
    id: 1,
    local_date: '2026-09-28',
    weight: null,
    waist: null,
    body_fat: null,
    note: null,
    created_at: '2026-09-28T00:00:00Z',
    ...partial,
  };
}

describe('unit conversion', () => {
  it('converts weight both ways', () => {
    expect(lbToKg(kgToLb(80))).toBeCloseTo(80, 5);
    expect(kgToLb(80)).toBeCloseTo(176.37, 1);
  });

  it('converts length both ways', () => {
    expect(inToCm(cmToIn(86))).toBeCloseTo(86, 5);
    expect(cmToIn(86)).toBeCloseTo(33.86, 1);
  });

  it('round-trips user display values into storage units', () => {
    expect(toStoredWeight(displayWeight(80.12, 'imperial') as number, 'imperial')).toBeCloseTo(80.1, 1);
    expect(toStoredWeight(displayWeight(80.12, 'metric') as number, 'metric')).toBeCloseTo(80.1, 1);
  });
});

describe('latestEntry', () => {
  it('picks the newest local date, then newest created_at', () => {
    const a = entry({ id: 1, local_date: '2026-09-26', weight: 81 });
    const b = entry({ id: 2, local_date: '2026-09-28', weight: 80 });
    const c = entry({ id: 3, local_date: '2026-09-28', weight: 79.5, created_at: '2026-09-28T19:00:00Z' });
    expect(latestEntry([a, b, c])?.id).toBe(3);
  });

  it('returns null for empty input', () => {
    expect(latestEntry([])).toBeNull();
  });
});

describe('metricChange', () => {
  it('computes delta between the first and last entries in the window', () => {
    const entries = [
      entry({ id: 1, local_date: '2026-09-01', weight: 82 }),
      entry({ id: 2, local_date: '2026-09-15', weight: 81 }),
      entry({ id: 3, local_date: '2026-09-27', weight: 80.4 }),
    ];
    const change = metricChange(entries, 'weight', 30, '2026-09-28');
    expect(change?.from).toBe(82);
    expect(change?.to).toBe(80.4);
    expect(change?.delta).toBeCloseTo(-1.6, 1);
  });

  it('returns null with fewer than two data points', () => {
    expect(metricChange([entry({ weight: 80 })], 'weight', 30, '2026-09-28')).toBeNull();
    expect(metricChange([], 'weight', 30, '2026-09-28')).toBeNull();
  });

  it('ignores entries outside the window', () => {
    const entries = [entry({ id: 1, local_date: '2026-08-01', weight: 90 }), entry({ id: 2, local_date: '2026-09-27', weight: 80 }), entry({ id: 3, local_date: '2026-09-28', weight: 79 })];
    const change = metricChange(entries, 'weight', 7, '2026-09-28');
    expect(change?.from).toBe(80);
  });
});
