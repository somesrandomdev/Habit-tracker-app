import { getDb } from '@/db/database';
import type { FastPlanInput, FastSession, FastingPlan, FastStatus } from '@/types/models';
import { isoNow } from '@/utils/dates';

// ---- Plans ----

export function getAllPlans(): FastingPlan[] {
  return getDb().getAllSync<FastingPlan>('SELECT * FROM fasting_plans ORDER BY id');
}

export function getActivePlan(): FastingPlan | null {
  return (
    getDb().getFirstSync<FastingPlan>(
      'SELECT * FROM fasting_plans WHERE active = 1 ORDER BY id LIMIT 1',
    ) ?? null
  );
}

export function createPlan(input: FastPlanInput): FastingPlan {
  const db = getDb();
  db.runSync(
    'INSERT INTO fasting_plans (name, fasting_hours, eating_window_hours, is_custom, active) VALUES (?, ?, ?, ?, 0)',
    [input.name, input.fasting_hours, input.eating_window_hours, input.is_custom ? 1 : 0],
  );
  const id = getLastId();
  db.runSync('UPDATE fasting_plans SET active = 0 WHERE id != ?', [id]);
  db.runSync('UPDATE fasting_plans SET active = 1 WHERE id = ?', [id]);
  return getPlanById(id) as FastingPlan;
}

export function activatePlan(id: number): void {
  const db = getDb();
  db.runSync('UPDATE fasting_plans SET active = 0');
  db.runSync('UPDATE fasting_plans SET active = 1 WHERE id = ?', [id]);
}

export function getPlanById(id: number): FastingPlan | null {
  return getDb().getFirstSync<FastingPlan>('SELECT * FROM fasting_plans WHERE id = ?', [id]) ?? null;
}

// ---- Sessions ----

export function getActiveFast(): FastSession | null {
  return (
    getDb().getFirstSync<FastSession>(
      "SELECT * FROM fast_sessions WHERE status = 'active' ORDER BY id DESC LIMIT 1",
    ) ?? null
  );
}

export function getRecentSessions(limit = 60): FastSession[] {
  return getDb().getAllSync<FastSession>(
    'SELECT * FROM fast_sessions ORDER BY start_time_utc DESC LIMIT ?',
    [limit],
  );
}

export function getSessionsSince(startIso: string): FastSession[] {
  return getDb().getAllSync<FastSession>(
    'SELECT * FROM fast_sessions WHERE start_time_utc >= ? ORDER BY start_time_utc DESC',
    [startIso],
  );
}

export function getAllSessions(): FastSession[] {
  return getDb().getAllSync<FastSession>('SELECT * FROM fast_sessions ORDER BY start_time_utc');
}

export function createActiveSession(
  planId: number,
  startIso: string,
  scheduledEndIso: string,
): FastSession {
  const now = isoNow();
  getDb().runSync(
    `INSERT INTO fast_sessions
       (plan_id, start_time_utc, scheduled_end_time_utc, actual_end_time_utc, status, notes, reason_for_stopping, created_at, updated_at)
     VALUES (?, ?, ?, NULL, 'active', NULL, NULL, ?, ?)`,
    [planId, startIso, scheduledEndIso, now, now],
  );
  return getSessionById(getLastId()) as FastSession;
}

export function getSessionById(id: number): FastSession | null {
  return getDb().getFirstSync<FastSession>('SELECT * FROM fast_sessions WHERE id = ?', [id]) ?? null;
}

export function finishSession(
  id: number,
  status: FastStatus,
  actualEndIso: string,
  reason: string | null,
): FastSession | null {
  getDb().runSync(
    "UPDATE fast_sessions SET status = ?, actual_end_time_utc = ?, reason_for_stopping = ?, updated_at = ? WHERE id = ? AND status = 'active'",
    [status, actualEndIso, reason, isoNow(), id],
  );
  return getSessionById(id);
}

export function extendSession(id: number, newScheduledEndIso: string): void {
  getDb().runSync(
    "UPDATE fast_sessions SET scheduled_end_time_utc = ?, updated_at = ? WHERE id = ? AND status = 'active'",
    [newScheduledEndIso, isoNow(), id],
  );
}

export function updateSessionStart(id: number, startIso: string, scheduledEndIso: string): void {
  getDb().runSync(
    'UPDATE fast_sessions SET start_time_utc = ?, scheduled_end_time_utc = ?, updated_at = ? WHERE id = ?',
    [startIso, scheduledEndIso, isoNow(), id],
  );
}

export function updateSessionNotes(id: number, notes: string): void {
  getDb().runSync('UPDATE fast_sessions SET notes = ?, updated_at = ? WHERE id = ?', [
    notes,
    isoNow(),
    id,
  ]);
}

export function deleteSession(id: number): void {
  getDb().runSync('DELETE FROM fast_sessions WHERE id = ?', [id]);
}

export function getLastId(): number {
  const row = getDb().getFirstSync<{ id: number }>('SELECT last_insert_rowid() AS id');
  return row?.id ?? 0;
}
