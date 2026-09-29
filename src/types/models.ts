// Core domain types. Field names intentionally mirror SQLite column names (snake_case)
// so repository rows can be returned without a mapping layer.

export type Goal =
  | 'lose_weight'
  | 'quit_sugar'
  | 'build_habits'
  | 'improve_energy'
  | 'all';

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

export interface Profile {
  id: number;
  name: string;
  goal: Goal;
  experience: ExperienceLevel;
  onboarded_at: string | null;
}

export interface FastingPlan {
  id: number;
  name: string;
  fasting_hours: number;
  eating_window_hours: number;
  is_custom: 0 | 1;
  active: 0 | 1;
}

export interface FastPlanInput {
  name: string;
  fasting_hours: number;
  eating_window_hours: number;
  is_custom: boolean;
}

export type FastStatus = 'active' | 'completed' | 'stopped_early' | 'abandoned';

export interface FastSession {
  id: number;
  plan_id: number;
  start_time_utc: string;
  scheduled_end_time_utc: string;
  actual_end_time_utc: string | null;
  status: FastStatus;
  notes: string | null;
  reason_for_stopping: string | null;
  created_at: string;
  updated_at: string;
}

export type ChallengeType = 'no_added_sugar' | 'strict_no_sugar' | 'custom';

export type ChallengeStatus = 'active' | 'completed' | 'abandoned';

export interface Challenge {
  id: number;
  title: string;
  challenge_type: ChallengeType;
  rules_text: string;
  start_date: string; // local date key YYYY-MM-DD, inclusive
  end_date: string; // local date key YYYY-MM-DD, inclusive
  status: ChallengeStatus;
  created_at: string;
}

export type CheckInStatus = 'success' | 'craving_only' | 'slip' | 'fail';

export interface ChallengeCheckIn {
  id: number;
  challenge_id: number;
  local_date: string;
  status: CheckInStatus;
  craving_intensity: number | null;
  trigger_type: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export type ScheduleType = 'daily' | 'weekdays' | 'custom';

export interface Habit {
  id: number;
  title: string;
  emoji: string;
  schedule_type: ScheduleType;
  /** JSON-encoded array of weekday numbers 0 (Sunday) - 6 (Saturday). Used for custom schedules. */
  scheduled_days: string;
  reminder_time: string | null; // HH:mm, nullable
  active: 0 | 1;
  created_at: string;
}

export type HabitCompletionStatus = 'completed' | 'missed' | 'skipped';

export interface HabitCompletion {
  id: number;
  habit_id: number;
  local_date: string;
  status: HabitCompletionStatus;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface DailyLog {
  id: number;
  local_date: string;
  mood: number | null; // 1-5
  hunger: number | null; // 1-5
  energy: number | null; // 1-5
  water_cups: number; // 0-20
  craving_intensity: number; // 0-10
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface MetricEntry {
  id: number;
  local_date: string;
  weight: number | null; // stored in kg
  waist: number | null; // stored in cm
  body_fat: number | null; // stored in percent
  note: string | null;
  created_at: string;
}

export interface Achievement {
  id: number;
  key: string;
  unlocked_at: string;
}

export type NotificationCategory =
  | 'fast_start'
  | 'fast_end'
  | 'checkin_reminder'
  | 'habit_reminder'
  | 'wellness_reminder';

export interface NotificationPref {
  category: NotificationCategory;
  enabled: 0 | 1;
  time: string | null; // HH:mm, used by daily reminder categories
}

export type ThemeMode = 'system' | 'light' | 'dark';
export type Units = 'metric' | 'imperial';

export interface AppSettings {
  theme: ThemeMode;
  units: Units;
}

// ---- Onboarding draft (in-memory only, not persisted until completion) ----

export interface CustomHabitDraft {
  title: string;
}

export interface OnboardingDraft {
  name: string;
  goal: Goal;
  safetyAccepted: boolean;
  planKey: string; // '14:10' | '16:8' | ... | 'custom'
  customFastingHours: number | null;
  customEatingHours: number | null;
  challengeType: ChallengeType;
  customRules: string;
  durationDays: number;
  presetHabitKeys: string[];
  customHabits: string[];
  notificationsEnabled: boolean;
}

// ---- Computed view models ----

export type FastPhase = 'early' | 'fat_burning' | 'extended';

export interface FastProgress {
  elapsedMs: number;
  remainingMs: number;
  ratio: number; // 0..1, clamped
  phase: FastPhase;
  isComplete: boolean;
}

export interface ChallengeStats {
  dayNumber: number; // current day, 1-based
  totalDays: number;
  daysElapsed: number; // days from start through the last countable day
  successDays: number;
  cravingDays: number;
  slips: number;
  fails: number;
  missedDays: number;
  completionRate: number; // 0..1
  currentStreak: number;
  longestStreak: number;
  isFinished: boolean; // end date has passed
  todayCheckIn: ChallengeCheckIn | null;
}

export interface HabitStats {
  currentStreak: number;
  longestStreak: number;
  weeklyRate: number; // 0..1 over the last 7 scheduled days
  totalCompletions: number;
  weekdayRates: number[]; // 7 entries, index = weekday 0-6
}

export interface FastingStats {
  totalCompleted: number;
  totalHours: number;
  averageHours: number;
  currentStreak: number;
  longestStreak: number;
  weekHours: number;
  last7Days: { dateKey: string; hours: number; completed: boolean }[];
}
