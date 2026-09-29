import { useAppStore } from '@/stores/useAppStore';

/** True once the database is initialized and stores are hydrated. */
export function useDatabaseReady(): boolean {
  return useAppStore((s) => s.ready);
}

export function useAppInitError(): string | null {
  return useAppStore((s) => s.initError);
}
