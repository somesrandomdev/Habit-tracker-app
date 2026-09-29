import { create } from 'zustand';
import { Platform } from 'react-native';
import { initDatabase } from '@/db/database';
import * as challengeService from '@/services/challenge.service';
import * as notificationsService from '@/services/notifications.service';
import type { Profile } from '@/types/models';
import { getProfile } from '@/repositories/profile.repo';
import { useSettingsStore } from './useSettingsStore';
import { useFastingStore } from './useFastingStore';
import { useChallengeStore } from './useChallengeStore';
import { useHabitsStore } from './useHabitsStore';
import { useLogsStore } from './useLogsStore';
import { useAchievementsStore } from './useAchievementsStore';

interface AppStore {
  ready: boolean;
  refreshCount: number;
  profile: Profile | null;
  initError: string | null;
  bootstrap: () => void;
  refreshProfile: () => void;
  /** Re-reads everything from the database (foreground return, pull-to-refresh). */
  refreshAll: () => void;
}

function hydrateAll(): void {
  useSettingsStore.getState().hydrate();
  useFastingStore.getState().hydrate();
  useChallengeStore.getState().hydrate();
  useHabitsStore.getState().hydrate();
  useLogsStore.getState().hydrate();
  useAchievementsStore.getState().hydrate();
}

export const useAppStore = create<AppStore>((set, get) => ({
  ready: false,
  refreshCount: 0,
  profile: null,
  initError: null,

  bootstrap: () => {
    try {
      initDatabase();
      challengeService.refreshChallengeStatus();
      notificationsService.syncNotifications();
      hydrateAll();
      set({ ready: true, profile: getProfile(), initError: null });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to open the database.';
      const webNoSharedArrayBuffer =
        Platform.OS === 'web' && typeof SharedArrayBuffer === 'undefined';
      set({
        ready: true,
        initError: webNoSharedArrayBuffer
          ? `${message}. This page is not cross-origin isolated, which web SQLite requires. Open the app through the header-proxy URL (http://localhost:3000), or test on your phone with Expo Go.`
          : message,
      });
    }
  },

  refreshProfile: () => set({ profile: getProfile() }),

  refreshAll: () => {
    if (!get().ready || get().initError) return;
    challengeService.refreshChallengeStatus();
    notificationsService.syncNotifications();
    hydrateAll();
    set({ profile: getProfile(), refreshCount: get().refreshCount + 1 });
  },
}));
