import { getDb } from '@/db/database';
import type { Achievement } from '@/types/models';
import { isoNow } from '@/utils/dates';

export function getUnlockedAchievements(): Achievement[] {
  return getDb().getAllSync<Achievement>('SELECT * FROM achievements ORDER BY unlocked_at');
}

export function isUnlocked(key: string): boolean {
  return (
    getDb().getFirstSync<{ id: number }>('SELECT id FROM achievements WHERE key = ?', [key]) != null
  );
}

export function unlock(key: string): void {
  getDb().runSync(
    'INSERT OR IGNORE INTO achievements (key, unlocked_at) VALUES (?, ?)',
    [key, isoNow()],
  );
}

export function unlockMany(keys: string[]): Achievement[] {
  const db = getDb();
  const unlocked: Achievement[] = [];
  db.withTransactionSync(() => {
    for (const key of keys) {
      db.runSync('INSERT OR IGNORE INTO achievements (key, unlocked_at) VALUES (?, ?)', [
        key,
        isoNow(),
      ]);
      const row = db.getFirstSync<Achievement>('SELECT * FROM achievements WHERE key = ?', [key]);
      if (row) unlocked.push(row);
    }
  });
  return unlocked;
}
