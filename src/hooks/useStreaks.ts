import { useEffect, useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { getStreakSummary, type StreakSummary } from '@/services/streak.service';

/** Aggregated fasting / sugar / habit streaks, refreshed with the app state. */
export function useStreaks(): StreakSummary | null {
  const ready = useAppStore((s) => s.ready);
  const refreshCount = useAppStore((s) => s.refreshCount);
  const [summary, setSummary] = useState<StreakSummary | null>(null);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    // Deferred a microtask so the synchronous DB read never runs inside render.
    Promise.resolve().then(() => {
      if (cancelled) return;
      try {
        setSummary(getStreakSummary());
      } catch {
        setSummary(null);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [ready, refreshCount]);

  return summary;
}
