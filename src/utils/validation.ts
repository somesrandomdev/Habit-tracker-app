import { z } from 'zod';
import { SCHEMA_VERSION } from '@/db/schema';

const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD');
const iso = z.string().min(10);
const nullable = <T extends z.ZodTypeAny>(schema: T) => schema.nullable().optional();

const profileSchema = z.object({
  id: z.number(),
  name: z.string(),
  goal: z.string(),
  experience: z.string(),
  onboarded_at: nullable(iso),
});

const planSchema = z.object({
  id: z.number(),
  name: z.string(),
  fasting_hours: z.number(),
  eating_window_hours: z.number(),
  is_custom: z.number(),
  active: z.number(),
});

const sessionSchema = z.object({
  id: z.number(),
  plan_id: z.number(),
  start_time_utc: iso,
  scheduled_end_time_utc: iso,
  actual_end_time_utc: nullable(iso),
  status: z.enum(['active', 'completed', 'stopped_early', 'abandoned']),
  notes: nullable(z.string()),
  reason_for_stopping: nullable(z.string()),
  created_at: iso,
  updated_at: iso,
});

const challengeSchema = z.object({
  id: z.number(),
  title: z.string(),
  challenge_type: z.enum(['no_added_sugar', 'strict_no_sugar', 'custom']),
  rules_text: z.string(),
  start_date: dateKey,
  end_date: dateKey,
  status: z.enum(['active', 'completed', 'abandoned']),
  created_at: iso,
});

const checkinSchema = z.object({
  id: z.number(),
  challenge_id: z.number(),
  local_date: dateKey,
  status: z.enum(['success', 'craving_only', 'slip', 'fail']),
  craving_intensity: nullable(z.number()),
  trigger_type: nullable(z.string()),
  note: nullable(z.string()),
  created_at: iso,
  updated_at: iso,
});

const habitSchema = z.object({
  id: z.number(),
  title: z.string(),
  emoji: z.string(),
  schedule_type: z.enum(['daily', 'weekdays', 'custom']),
  scheduled_days: z.string(),
  reminder_time: nullable(z.string()),
  active: z.number(),
  created_at: iso,
});

const completionSchema = z.object({
  id: z.number(),
  habit_id: z.number(),
  local_date: dateKey,
  status: z.enum(['completed', 'missed', 'skipped']),
  note: nullable(z.string()),
  created_at: iso,
  updated_at: iso,
});

const dailyLogSchema = z.object({
  id: z.number(),
  local_date: dateKey,
  mood: nullable(z.number()),
  hunger: nullable(z.number()),
  energy: nullable(z.number()),
  water_cups: z.number(),
  craving_intensity: z.number(),
  note: nullable(z.string()),
  created_at: iso,
  updated_at: iso,
});

const metricSchema = z.object({
  id: z.number(),
  local_date: dateKey,
  weight: nullable(z.number()),
  waist: nullable(z.number()),
  body_fat: nullable(z.number()),
  note: nullable(z.string()),
  created_at: iso,
});

const achievementSchema = z.object({
  id: z.number(),
  key: z.string(),
  unlocked_at: iso,
});

const notifPrefSchema = z.object({
  category: z.string(),
  enabled: z.number(),
  time: nullable(z.string()),
});

export const backupFileSchema = z.object({
  app: z.literal('FastHabit'),
  version: z.number(),
  exported_at: iso,
  data: z.object({
    profile: profileSchema.nullable(),
    fasting_plans: z.array(planSchema),
    fast_sessions: z.array(sessionSchema),
    challenges: z.array(challengeSchema),
    challenge_checkins: z.array(checkinSchema),
    habits: z.array(habitSchema),
    habit_completions: z.array(completionSchema),
    daily_logs: z.array(dailyLogSchema),
    metric_entries: z.array(metricSchema),
    achievements: z.array(achievementSchema),
    notification_preferences: z.array(notifPrefSchema),
    app_settings: z.array(z.object({ key: z.string(), value: z.string() })),
  }),
});

export type BackupFile = z.infer<typeof backupFileSchema>;

export function parseBackup(json: string):
  | { ok: true; data: BackupFile }
  | { ok: false; error: string } {
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(json);
  } catch {
    return { ok: false, error: 'Not valid JSON.' };
  }
  const appCheck = z.object({ app: z.string(), version: z.number() }).safeParse(parsedJson);
  if (appCheck.success) {
    if (appCheck.data.app !== 'FastHabit') {
      return { ok: false, error: 'This file was not exported from FastHabit.' };
    }
    if (appCheck.data.version > SCHEMA_VERSION) {
      return {
        ok: false,
        error: `This backup was created by a newer version of FastHabit (schema v${appCheck.data.version}); update the app before importing.`,
      };
    }
  }
  const result = backupFileSchema.safeParse(parsedJson);
  if (!result.success) {
    const issue = result.error.issues[0];
    return {
      ok: false,
      error: issue ? `Invalid backup: ${issue.path.join('.') || 'root'} — ${issue.message}` : 'Invalid backup file.',
    };
  }
  return { ok: true, data: result.data };
}
