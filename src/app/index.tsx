import { Redirect } from 'expo-router';
import { useAppStore } from '@/stores/useAppStore';
import { LoadingState } from '@/components/ui/LoadingState';

/** Entry gate: first-run onboarding vs. the main app. */
export default function Index() {
  const ready = useAppStore((s) => s.ready);
  const profile = useAppStore((s) => s.profile);

  if (!ready) {
    return <LoadingState lines={4} />;
  }
  if (profile?.onboarded_at) {
    return <Redirect href="/(tabs)" />;
  }
  return <Redirect href="/(onboarding)/welcome" />;
}
