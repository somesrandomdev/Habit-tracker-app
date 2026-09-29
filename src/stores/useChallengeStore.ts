import { create } from 'zustand';
import * as challengeService from '@/services/challenge.service';
import { useAchievementsStore } from './useAchievementsStore';
import type { ChallengeType, CheckInStatus } from '@/types/models';

type ChallengeState = ReturnType<typeof challengeService.getChallengeState>;

interface ChallengeStore {
  state: ChallengeState;
  hydrate: () => void;
  checkIn: (input: {
    status: CheckInStatus;
    craving_intensity: number | null;
    trigger_type: string | null;
    note: string | null;
  }) => { ok: boolean; error?: string };
  abandon: () => { ok: boolean; error?: string };
  startNew: (input: {
    type: ChallengeType;
    title: string;
    rules: string;
    durationDays: number;
  }) => { ok: boolean; error?: string };
}

function afterMutation(): void {
  useAchievementsStore.getState().evaluateAndQueue();
}

export const useChallengeStore = create<ChallengeStore>((set, get) => ({
  state: null,

  hydrate: () => {
    challengeService.refreshChallengeStatus();
    set({ state: challengeService.getChallengeState() });
  },

  checkIn: (input) => {
    const result = challengeService.checkIn(input);
    if (result.ok) {
      get().hydrate();
      afterMutation();
      return { ok: true };
    }
    return { ok: false, error: result.error };
  },

  abandon: () => {
    const result = challengeService.abandonChallenge();
    if (result.ok) {
      get().hydrate();
      return { ok: true };
    }
    return { ok: false, error: result.error };
  },

  startNew: (input) => {
    const result = challengeService.startChallenge(input);
    if (result.ok) {
      get().hydrate();
      afterMutation();
      return { ok: true };
    }
    return { ok: false, error: result.error };
  },
}));
