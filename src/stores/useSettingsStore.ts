import { create } from 'zustand';
import {
  getNotificationPrefs,
  getSettings,
  setSetting,
  updateNotificationPref,
} from '@/repositories/settings.repo';
import * as notificationsService from '@/services/notifications.service';
import type {
  AppSettings,
  NotificationCategory,
  NotificationPref,
  ThemeMode,
  Units,
} from '@/types/models';

interface SettingsStore {
  settings: AppSettings;
  notifPrefs: NotificationPref[];
  permissionGranted: boolean;
  hydrate: () => void;
  setTheme: (theme: ThemeMode) => void;
  setUnits: (units: Units) => void;
  setNotifPref: (category: NotificationCategory, enabled: boolean, time?: string | null) => void;
  refreshPermission: () => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: { theme: 'system', units: 'metric' },
  notifPrefs: [],
  permissionGranted: false,

  hydrate: () => {
    set({ settings: getSettings(), notifPrefs: getNotificationPrefs() });
    notificationsService.hasPermission().then((granted) => set({ permissionGranted: granted }));
  },

  setTheme: (theme) => {
    setSetting('theme', theme);
    set((s) => ({ settings: { ...s.settings, theme } }));
  },

  setUnits: (units) => {
    setSetting('units', units);
    set((s) => ({ settings: { ...s.settings, units } }));
  },

  setNotifPref: (category, enabled, time = undefined) => {
    updateNotificationPref(category, enabled, time !== undefined ? time : null);
    set((s) => {
      const existing = s.notifPrefs.find((p) => p.category === category);
      const next: NotificationPref = {
        category,
        enabled: enabled ? 1 : 0,
        time: time !== undefined ? time : (existing?.time ?? null),
      };
      const rest = s.notifPrefs.filter((p) => p.category !== category);
      return { notifPrefs: [...rest, next] };
    });
    notificationsService.syncNotifications();
  },

  refreshPermission: () => {
    notificationsService.hasPermission().then((granted) => set({ permissionGranted: granted }));
  },
}));
