import { useEffect, useState } from 'react';
import { useFastingStore } from '@/stores/useFastingStore';
import { computeFastProgress } from '@/utils/fasting';
import type { FastProgress, FastSession } from '@/types/models';

export interface ActiveFastView {
  session: FastSession;
  progress: FastProgress;
}

/**
 * Live fast timer state, recomputed every second from stored timestamps.
 * The tick is a subscription to the clock (an external system), not derived state.
 */
export function useActiveFast(): ActiveFastView | null {
  const activeFast = useFastingStore((s) => s.activeFast);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!activeFast) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
    // The tick only depends on whether a fast exists; its id change remounts the clock.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFast?.id]);

  if (!activeFast) return null;
  return {
    session: activeFast,
    progress: computeFastProgress(activeFast.start_time_utc, activeFast.scheduled_end_time_utc, now),
  };
}
