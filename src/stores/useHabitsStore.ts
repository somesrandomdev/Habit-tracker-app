import { create } from 'zustand';
import * as habitService from '@/services/habit.service';
import * as notificationsService from '@/services/notifications.service';
import { getAllCompletions, type HabitInput } from '@/repositories/habits.repo';
import { useAchievementsStore } from './useAchievementsStore';
import type { HabitCompletion, HabitCompletionStatus, Habit } from '@/types/models';
import { todayKey } from '@/utils/dates';

interface HabitsStore {
  habits: Habit[];
  completions: HabitCompletion[];
  hydrate: () => void;
  toggleCompletion: (habitId: number, dateKey?: string) => { ok: boolean; completed?: boolean; error?: string };
  setStatus: (habitId: number, dateKey: string, status: HabitCompletionStatus) => { ok: boolean; error?: string };
  addHabit: (input: HabitInput) => { ok: boolean; error?: string };
  updateHabit: (id: number, input: HabitInput) => { ok: boolean; error?: string };
  deactivateHabit: (id: number) => void;
}

function afterMutation(): void {
  useAchievementsStore.getState().evaluateAndQueue();
  notificationsService.syncNotifications();
}

export const useHabitsStore = create<HabitsStore>((set, get) => ({
  habits: [],
  completions: [],

  hydrate: () => {
    set({
      habits: habitService.getAllHabits(),
      completions: getAllCompletions(),
    });
  },

  toggleCompletion: (habitId, dateKey = todayKey()) => {
    const result = habitService.toggleCompletion(habitId, dateKey);
    if (result.ok) {
      get().hydrate();
      afterMutation();
      return { ok: true, completed: result.value?.completed };
    }
    return { ok: false, error: result.error };
  },

  setStatus: (habitId, dateKey, status) => {
    const result = habitService.setStatus(habitId, dateKey, status);
    if (result.ok) {
      get().hydrate();
      afterMutation();
      return { ok: true };
    }
    return { ok: false, error: result.error };
  },

  addHabit: (input) => {
    const result = habitService.createHabit(input);
    if (result.ok) {
      get().hydrate();
      afterMutation();
      return { ok: true };
    }
    return { ok: false, error: result.error };
  },

  updateHabit: (id, input) => {
    const result = habitService.updateHabit(id, input);
    if (result.ok) {
      get().hydrate();
      afterMutation();
      return { ok: true };
    }
    return { ok: false, error: result.error };
  },

  deactivateHabit: (id) => {
    habitService.deactivateHabit(id);
    get().hydrate();
    notificationsService.syncNotifications();
  },
}));
