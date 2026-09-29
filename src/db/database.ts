import * as SQLite from 'expo-sqlite';
import { MIGRATIONS, SCHEMA_VERSION } from './schema';

export type FastHabitDb = SQLite.SQLiteDatabase;

let instance: FastHabitDb | null = null;

const ALL_TABLES = [
  'challenge_checkins',
  'challenges',
  'habit_completions',
  'habits',
  'fast_sessions',
  'fasting_plans',
  'daily_logs',
  'metric_entries',
  'achievements',
  'notification_preferences',
  'app_settings',
  'profile',
] as const;

export function getDb(): FastHabitDb {
  if (!instance) {
    instance = SQLite.openDatabaseSync('fasthabit.db');
    instance.execSync('PRAGMA foreign_keys = ON');
  }
  return instance;
}

export function initDatabase(): void {
  const db = getDb();
  const row = db.getFirstSync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;
  if (current >= SCHEMA_VERSION) return;

  db.withTransactionSync(() => {
    for (let v = current; v < SCHEMA_VERSION; v++) {
      db.execSync(MIGRATIONS[v]);
    }
    db.execSync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
  });
}

/** Deletes every row. Must NOT be called inside an open transaction (no nesting support). */
export function wipeAllTables(): void {
  const db = getDb();
  db.execSync('PRAGMA foreign_keys = OFF');
  for (const t of ALL_TABLES) db.execSync(`DELETE FROM ${t}`);
  db.execSync('PRAGMA foreign_keys = ON');
}

/** Wipes all data in its own transaction. */
export function resetDatabase(): void {
  getDb().withTransactionSync(() => {
    wipeAllTables();
  });
}
