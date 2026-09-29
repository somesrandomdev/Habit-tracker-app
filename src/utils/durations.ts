export const HOUR_MS = 3600000;
export const MINUTE_MS = 60000;

function pad(n: number): string {
  return String(Math.floor(n)).padStart(2, '0');
}

/** "05:04:09" clock style; negative durations clamp to 00:00:00. */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

/** "12h 05m" human style. Shows seconds below one hour. */
export function formatDurationHuman(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${pad(m)}m`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
}

export function formatHours(hours: number): string {
  return `${(Math.round(hours * 10) / 10).toFixed(1)}h`;
}

export function msToHours(ms: number): number {
  return ms / HOUR_MS;
}

export function hoursToMs(hours: number): number {
  return hours * HOUR_MS;
}
