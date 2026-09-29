import { backupFileSchema, parseBackup } from '@/utils/validation';

const validBackup = {
  app: 'FastHabit',
  version: 1,
  exported_at: '2026-09-28T18:00:00.000Z',
  data: {
    profile: { id: 1, name: 'K', goal: 'all', experience: 'beginner', onboarded_at: '2026-09-28T18:00:00.000Z' },
    fasting_plans: [],
    fast_sessions: [],
    challenges: [],
    challenge_checkins: [],
    habits: [],
    habit_completions: [],
    daily_logs: [],
    metric_entries: [],
    achievements: [],
    notification_preferences: [],
    app_settings: [],
  },
};

describe('parseBackup', () => {
  it('accepts a valid backup', () => {
    const result = parseBackup(JSON.stringify(validBackup));
    expect(result.ok).toBe(true);
  });

  it('rejects invalid JSON with a friendly error', () => {
    const result = parseBackup('{not json');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/Not valid JSON/);
  });

  it('rejects wrong app marker', () => {
    const result = parseBackup(JSON.stringify({ ...validBackup, app: 'OtherApp' }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/not exported from FastHabit/);
  });

  it('rejects backups from a newer schema version before touching data', () => {
    const result = parseBackup(JSON.stringify({ ...validBackup, version: 99 }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/newer version/);
  });

  it('rejects malformed dates with a path hint', () => {
    const broken = JSON.parse(JSON.stringify(validBackup));
    broken.data.challenges.push({
      id: 1,
      title: 'X',
      challenge_type: 'no_added_sugar',
      rules_text: '',
      start_date: '09/01/2026',
      end_date: '2026-09-30',
      status: 'active',
      created_at: '2026-09-28T18:00:00.000Z',
    });
    const result = parseBackup(JSON.stringify(broken));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/data\.challenges/);
  });

  it('allows missing optional fields (nullish tolerance)', () => {
    const relaxed = JSON.parse(JSON.stringify(validBackup));
    relaxed.data.profile.onboarded_at = null;
    expect(parseBackup(JSON.stringify(relaxed)).ok).toBe(true);
  });
});

describe('backupFileSchema shape', () => {
  it('requires every table key', () => {
    const missing = JSON.parse(JSON.stringify(validBackup));
    delete missing.data.daily_logs;
    expect(backupFileSchema.safeParse(missing).success).toBe(false);
  });
});
