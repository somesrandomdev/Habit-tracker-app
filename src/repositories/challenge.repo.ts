import { getDb } from '@/db/database';
import type {
  Challenge,
  ChallengeCheckIn,
  ChallengeType,
  CheckInStatus,
} from '@/types/models';
import { isoNow } from '@/utils/dates';

export function getActiveChallenge(): Challenge | null {
  return (
    getDb().getFirstSync<Challenge>(
      "SELECT * FROM challenges WHERE status = 'active' ORDER BY id DESC LIMIT 1",
    ) ?? null
  );
}

export function getChallengeById(id: number): Challenge | null {
  return getDb().getFirstSync<Challenge>('SELECT * FROM challenges WHERE id = ?', [id]) ?? null;
}

export function getAllChallenges(): Challenge[] {
  return getDb().getAllSync<Challenge>('SELECT * FROM challenges ORDER BY start_date');
}

export function createChallenge(input: {
  title: string;
  challenge_type: ChallengeType;
  rules_text: string;
  start_date: string;
  end_date: string;
}): Challenge {
  getDb().runSync(
    `INSERT INTO challenges (title, challenge_type, rules_text, start_date, end_date, status, created_at)
     VALUES (?, ?, ?, ?, ?, 'active', ?)`,
    [input.title, input.challenge_type, input.rules_text, input.start_date, input.end_date, isoNow()],
  );
  const id = getDb().getFirstSync<{ id: number }>('SELECT last_insert_rowid() AS id')?.id ?? 0;
  return getChallengeById(id) as Challenge;
}

export function updateChallengeStatus(
  id: number,
  status: 'active' | 'completed' | 'abandoned',
): void {
  getDb().runSync('UPDATE challenges SET status = ? WHERE id = ?', [status, id]);
}

export function getCheckIns(challengeId: number): ChallengeCheckIn[] {
  return getDb().getAllSync<ChallengeCheckIn>(
    'SELECT * FROM challenge_checkins WHERE challenge_id = ? ORDER BY local_date',
    [challengeId],
  );
}

export function getAllCheckIns(): ChallengeCheckIn[] {
  return getDb().getAllSync<ChallengeCheckIn>('SELECT * FROM challenge_checkins ORDER BY local_date');
}

export function getCheckInForDate(challengeId: number, localDate: string): ChallengeCheckIn | null {
  return (
    getDb().getFirstSync<ChallengeCheckIn>(
      'SELECT * FROM challenge_checkins WHERE challenge_id = ? AND local_date = ?',
      [challengeId, localDate],
    ) ?? null
  );
}

export function upsertCheckIn(input: {
  challenge_id: number;
  local_date: string;
  status: CheckInStatus;
  craving_intensity: number | null;
  trigger_type: string | null;
  note: string | null;
}): ChallengeCheckIn {
  const now = isoNow();
  getDb().runSync(
    `INSERT INTO challenge_checkins (challenge_id, local_date, status, craving_intensity, trigger_type, note, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(challenge_id, local_date) DO UPDATE SET
       status = excluded.status,
       craving_intensity = excluded.craving_intensity,
       trigger_type = excluded.trigger_type,
       note = excluded.note,
       updated_at = excluded.updated_at`,
    [
      input.challenge_id,
      input.local_date,
      input.status,
      input.craving_intensity,
      input.trigger_type,
      input.note,
      now,
      now,
    ],
  );
  return getCheckInForDate(input.challenge_id, input.local_date) as ChallengeCheckIn;
}

export function deleteCheckIn(id: number): void {
  getDb().runSync('DELETE FROM challenge_checkins WHERE id = ?', [id]);
}
