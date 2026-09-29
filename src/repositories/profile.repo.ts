import { getDb } from '@/db/database';
import type { Profile } from '@/types/models';
import { isoNow } from '@/utils/dates';

export function getProfile(): Profile | null {
  return getDb().getFirstSync<Profile>('SELECT * FROM profile WHERE id = 1') ?? null;
}

export function upsertProfile(input: {
  name: string;
  goal: string;
  experience: string;
  onboarded_at?: string | null;
}): Profile {
  const db = getDb();
  db.runSync(
    `INSERT INTO profile (id, name, goal, experience, onboarded_at)
     VALUES (1, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET name = excluded.name, goal = excluded.goal,
       experience = excluded.experience,
       onboarded_at = COALESCE(excluded.onboarded_at, profile.onboarded_at)`,
    [input.name, input.goal, input.experience, input.onboarded_at ?? null],
  );
  return getProfile() as Profile;
}

export function markOnboarded(): void {
  getDb().runSync('UPDATE profile SET onboarded_at = ? WHERE id = 1', [isoNow()]);
}
