import { create } from 'zustand';
import * as onboardingService from '@/services/onboarding.service';
import { useAppStore } from './useAppStore';
import { useSettingsStore } from './useSettingsStore';
import { useFastingStore } from './useFastingStore';
import { useChallengeStore } from './useChallengeStore';
import { useHabitsStore } from './useHabitsStore';
import { useAchievementsStore } from './useAchievementsStore';
import * as notificationsService from '@/services/notifications.service';
import type { OnboardingDraft } from '@/types/models';

interface OnboardingStore {
  draft: OnboardingDraft;
  setDraft: (patch: Partial<OnboardingDraft>) => void;
  togglePresetHabit: (key: string) => void;
  addCustomHabit: (title: string) => void;
  removeCustomHabit: (title: string) => void;
  submit: () => { ok: boolean; error?: string };
  resetDraft: () => void;
}

export const useOnboardingStore = create<OnboardingStore>((set, get) => ({
  draft: onboardingService.defaultOnboardingDraft(),

  setDraft: (patch) => set((s) => ({ draft: { ...s.draft, ...patch } })),

  togglePresetHabit: (key) =>
    set((s) => {
      const has = s.draft.presetHabitKeys.includes(key);
      return {
        draft: {
          ...s.draft,
          presetHabitKeys: has
            ? s.draft.presetHabitKeys.filter((k) => k !== key)
            : [...s.draft.presetHabitKeys, key],
        },
      };
    }),

  addCustomHabit: (title) =>
    set((s) => ({
      draft: {
        ...s.draft,
        customHabits: [...s.draft.customHabits, title.trim()].filter(Boolean).slice(0, 10),
      },
    })),

  removeCustomHabit: (title) =>
    set((s) => ({
      draft: { ...s.draft, customHabits: s.draft.customHabits.filter((t) => t !== title) },
    })),

  submit: () => {
    const result = onboardingService.completeOnboarding(get().draft);
    if (result.ok) {
      useAppStore.getState().refreshProfile();
      useSettingsStore.getState().hydrate();
      useFastingStore.getState().hydrate();
      useChallengeStore.getState().hydrate();
      useHabitsStore.getState().hydrate();
      useAchievementsStore.getState().hydrate();
      useAchievementsStore.getState().evaluateAndQueue();
      notificationsService.syncNotifications();
      get().resetDraft();
      return { ok: true };
    }
    return result;
  },

  resetDraft: () => set({ draft: onboardingService.defaultOnboardingDraft() }),
}));
