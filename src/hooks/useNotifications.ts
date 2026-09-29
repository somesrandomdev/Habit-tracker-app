import { useEffect } from 'react';
import * as notificationsService from '@/services/notifications.service';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useAppStateRefresh } from './useAppStateRefresh';
import { useAppStore } from '@/stores/useAppStore';

/**
 * App-wide wiring: configures the notification handler once, syncs schedules on
 * boot and foreground return, and keeps the permission flag fresh.
 */
export function useNotifications(): void {
  const hydrate = useSettingsStore((s) => s.hydrate);
  const ready = useAppStore((s) => s.ready);

  useAppStateRefresh();

  useEffect(() => {
    notificationsService.configureNotificationHandler();
  }, []);

  useEffect(() => {
    if (!ready) return;
    notificationsService.syncNotifications();
    useSettingsStore.getState().refreshPermission();
  }, [ready, hydrate]);
}
