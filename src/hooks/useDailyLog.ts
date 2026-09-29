import { useLogsStore } from '@/stores/useLogsStore';

/** Today's wellness log (or null), straight from the hydrated store. */
export function useDailyLog() {
  const todayLog = useLogsStore((s) => s.todayLog);
  return todayLog;
}
