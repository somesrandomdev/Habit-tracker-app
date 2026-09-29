import { create } from 'zustand';
import * as fastingRepo from '@/repositories/fasting.repo';
import * as fastingService from '@/services/fasting.service';
import * as notificationsService from '@/services/notifications.service';
import { useAchievementsStore } from './useAchievementsStore';
import type { FastPlanInput, FastSession, FastingPlan } from '@/types/models';

interface FastingStore {
  plans: FastingPlan[];
  activePlan: FastingPlan | null;
  activeFast: FastSession | null;
  recentSessions: FastSession[];
  hydrate: () => void;
  startFast: (planId?: number) => { ok: boolean; error?: string };
  extendFast: (hours: number) => { ok: boolean; error?: string };
  endFast: (reason: string | null) => { ok: boolean; completed?: boolean; error?: string };
  abandonFast: (reason: string | null) => { ok: boolean; error?: string };
  updateStartTime: (iso: string) => { ok: boolean; error?: string };
  updateNotes: (notes: string) => { ok: boolean; error?: string };
  deleteSession: (id: number) => void;
  createPlan: (input: FastPlanInput) => { ok: boolean; error?: string };
  activatePlan: (id: number) => void;
}

function afterMutation(): void {
  useAchievementsStore.getState().evaluateAndQueue();
  notificationsService.syncNotifications();
}

export const useFastingStore = create<FastingStore>((set, get) => ({
  plans: [],
  activePlan: null,
  activeFast: null,
  recentSessions: [],

  hydrate: () => {
    set({
      plans: fastingRepo.getAllPlans(),
      activePlan: fastingRepo.getActivePlan(),
      activeFast: fastingRepo.getActiveFast(),
      recentSessions: fastingRepo.getRecentSessions(30),
    });
  },

  startFast: (planId) => {
    const result = fastingService.startFast(planId);
    if (result.ok) {
      get().hydrate();
      afterMutation();
      return { ok: true };
    }
    return { ok: false, error: result.error };
  },

  extendFast: (hours) => {
    const active = get().activeFast;
    if (!active) return { ok: false, error: 'No active fast.' };
    const result = fastingService.extendFast(active.id, hours);
    if (result.ok) {
      get().hydrate();
      afterMutation();
      return { ok: true };
    }
    return { ok: false, error: result.error };
  },

  endFast: (reason) => {
    const active = get().activeFast;
    if (!active) return { ok: false, error: 'No active fast.' };
    const result = fastingService.endFast(active.id, reason);
    if (result.ok) {
      get().hydrate();
      afterMutation();
      return { ok: true, completed: result.value?.completed };
    }
    return { ok: false, error: result.error };
  },

  abandonFast: (reason) => {
    const active = get().activeFast;
    if (!active) return { ok: false, error: 'No active fast.' };
    const result = fastingService.abandonFast(active.id, reason);
    if (result.ok) {
      get().hydrate();
      afterMutation();
      return { ok: true };
    }
    return { ok: false, error: result.error };
  },

  updateStartTime: (iso) => {
    const active = get().activeFast;
    if (!active) return { ok: false, error: 'No active fast.' };
    const result = fastingService.updateStartTime(active.id, iso);
    if (result.ok) {
      get().hydrate();
      afterMutation();
      return { ok: true };
    }
    return { ok: false, error: result.error };
  },

  updateNotes: (notes) => {
    const active = get().activeFast;
    if (!active) return { ok: false, error: 'No active fast.' };
    const result = fastingService.updateNotes(active.id, notes);
    if (result.ok) {
      get().hydrate();
      return { ok: true };
    }
    return { ok: false, error: result.error };
  },

  deleteSession: (id) => {
    fastingService.deleteSession(id);
    get().hydrate();
  },

  createPlan: (input) => {
    try {
      if (!(input.fasting_hours > 0 && input.fasting_hours < 24)) {
        return { ok: false, error: 'Fasting hours must be between 1 and 23.' };
      }
      if (!(input.eating_window_hours > 0 && input.eating_window_hours < 24)) {
        return { ok: false, error: 'Eating window must be between 1 and 23 hours.' };
      }
      if (input.fasting_hours + input.eating_window_hours !== 24) {
        return { ok: false, error: 'Fasting and eating hours must add up to 24.' };
      }
      fastingRepo.createPlan(input);
      get().hydrate();
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'Could not save plan.' };
    }
  },

  activatePlan: (id) => {
    fastingRepo.activatePlan(id);
    get().hydrate();
  },
}));
