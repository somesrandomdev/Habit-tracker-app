// Versioned SQLite schema. MIGRATIONS[i] upgrades the database to version i + 1.
// The applied version is tracked via PRAGMA user_version.

export const MIGRATIONS: string[] = [
  // v1: initial schema
  `
  CREATE TABLE IF NOT EXISTS profile (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    name TEXT NOT NULL DEFAULT '',
    goal TEXT NOT NULL DEFAULT 'all',
    experience TEXT NOT NULL DEFAULT 'beginner',
    onboarded_at TEXT
  );

  CREATE TABLE IF NOT EXISTS fasting_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    fasting_hours REAL NOT NULL,
    eating_window_hours REAL NOT NULL,
    is_custom INTEGER NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS fast_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_id INTEGER NOT NULL REFERENCES fasting_plans(id),
    start_time_utc TEXT NOT NULL,
    scheduled_end_time_utc TEXT NOT NULL,
    actual_end_time_utc TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','stopped_early','abandoned')),
    notes TEXT,
    reason_for_stopping TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_fast_sessions_status ON fast_sessions(status);
  CREATE INDEX IF NOT EXISTS idx_fast_sessions_start ON fast_sessions(start_time_utc);

  CREATE TABLE IF NOT EXISTS challenges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    challenge_type TEXT NOT NULL CHECK (challenge_type IN ('no_added_sugar','strict_no_sugar','custom')),
    rules_text TEXT NOT NULL DEFAULT '',
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','abandoned')),
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_challenges_status ON challenges(status);

  CREATE TABLE IF NOT EXISTS challenge_checkins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    challenge_id INTEGER NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    local_date TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('success','craving_only','slip','fail')),
    craving_intensity INTEGER,
    trigger_type TEXT,
    note TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE (challenge_id, local_date)
  );

  CREATE TABLE IF NOT EXISTS habits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    emoji TEXT NOT NULL DEFAULT '🎯',
    schedule_type TEXT NOT NULL CHECK (schedule_type IN ('daily','weekdays','custom')),
    scheduled_days TEXT NOT NULL DEFAULT '[]',
    reminder_time TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS habit_completions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    habit_id INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    local_date TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('completed','missed','skipped')),
    note TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE (habit_id, local_date)
  );
  CREATE INDEX IF NOT EXISTS idx_habit_completions_date ON habit_completions(local_date);

  CREATE TABLE IF NOT EXISTS daily_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    local_date TEXT NOT NULL UNIQUE,
    mood INTEGER,
    hunger INTEGER,
    energy INTEGER,
    water_cups INTEGER NOT NULL DEFAULT 0,
    craving_intensity INTEGER NOT NULL DEFAULT 0,
    note TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS metric_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    local_date TEXT NOT NULL UNIQUE,
    weight REAL,
    waist REAL,
    body_fat REAL,
    note TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL UNIQUE,
    unlocked_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS notification_preferences (
    category TEXT PRIMARY KEY,
    enabled INTEGER NOT NULL DEFAULT 0,
    time TEXT
  );

  CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
  `,
];

export const SCHEMA_VERSION = MIGRATIONS.length;
