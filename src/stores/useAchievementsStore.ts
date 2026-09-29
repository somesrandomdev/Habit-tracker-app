import { create } from 'zustand';
import * as achievementsService from '@/services/achievements.service';
import type { Achievement } from '@/types/models';
import { ACHIEVEMENT_DEFS, type AchievementDef } from '@/services/achievements.service';

interface AchievementsStore {
  unlocked: Achievement[];
  /** Celebration modal queue: achievements unlocked but not yet shown. */
  queue: AchievementDef[];
  hydrate: () => void;
  /** Re-evaluates all achievement rules; queues any newly unlocked ones. */
  evaluateAndQueue: () => void;
  dismissNext: () => void;
}

export const useAchievementsStore = create<AchievementsStore>((set, get) => ({
  unlocked: [],
  queue: [],

  hydrate: () => {
    set({ unlocked: achievementsService.getUnlocked() });
  },

  evaluateAndQueue: () => {
    try {
      const newly = achievementsService.evaluateAchievements();
      const defs = newly
        .map((a) => ACHIEVEMENT_DEFS.find((d) => d.key === a.key))
        .filter((d): d is AchievementDef => d !== undefined);
      set((s) => ({
        unlocked: [...s.unlocked, ...newly],
        queue: defs.length > 0 ? [...s.queue, ...defs] : s.queue,
      }));
    } catch {
      // Achievement evaluation must never break the action that triggered it.
    }
  },

  dismissNext: () => {
    set((s) => ({ queue: s.queue.slice(1) }));
  },
}));

export { ACHIEVEMENT_DEFS };
export type { AchievementDef };
