import { useMemo } from 'react';
import { useChallengeStore } from '@/stores/useChallengeStore';
import { useAppStore } from '@/stores/useAppStore';
import { computeChallengeStats } from '@/utils/challengeLogic';
import { todayKey } from '@/utils/dates';
import type { Challenge, ChallengeStats } from '@/types/models';

/** Challenge + its stats, recomputed whenever stores refresh or the day changes. */
export function useChallengeProgress(): {
  challenge: Challenge | null;
  stats: ChallengeStats | null;
} {
  const state = useChallengeStore((s) => s.state);
  const refreshCount = useAppStore((s) => s.refreshCount);

  return useMemo(() => {
    void refreshCount;
    if (!state) return { challenge: null, stats: null };
    return {
      challenge: state.challenge,
      stats: computeChallengeStats(state.challenge, state.checkins, todayKey()),
    };
  }, [state, refreshCount]);
}
