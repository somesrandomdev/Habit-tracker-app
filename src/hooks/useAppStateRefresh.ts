import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useAppStore } from '@/stores/useAppStore';

/**
 * Re-syncs all stores from the database whenever the app returns to the
 * foreground, so long background periods never show stale data.
 */
export function useAppStateRefresh(): void {
  const refreshAll = useAppStore((s) => s.refreshAll);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshAll();
    });
    return () => subscription.remove();
  }, [refreshAll]);
}
