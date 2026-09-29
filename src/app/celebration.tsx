import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';
import { spacing } from '@/theme/tokens';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { CELEBRATION_MESSAGES } from '@/content/messages';
import { getCelebrationMessage, type CelebrationType } from '@/services/content.service';

/**
 * Celebration screen for completed fasts, finished challenges, and milestones.
 * type=fast | challenge | milestone; hours=<n> for fasts; rate=<0-100> for challenges.
 */
export default function CelebrationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: string; hours?: string; rate?: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const type: CelebrationType = params.type === 'challenge' ? 'challenge' : params.type === 'milestone' ? 'milestone' : 'fast';
  const meta = CELEBRATION_MESSAGES[type];
  const message = getCelebrationMessage(type);
  const hours = params.hours ? Number(params.hours) : null;
  const rate = params.rate ? Number(params.rate) : null;

  const floatAnim = useState(() => new Animated.Value(0))[0];

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [floatAnim]);

  const handleDone = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + spacing.xxl, paddingBottom: insets.bottom + spacing.xl }]}>
      <View style={styles.confettiRow}>
        {CONFETTI_EMOJIS.map((emoji, i) => (
          <Animated.Text
            key={i}
            style={[styles.confetti, { transform: [{ translateY: floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, i % 2 === 0 ? -14 : 14] }) }] }]}
          >
            {emoji}
          </Animated.Text>
        ))}
      </View>

      <AppText variant="title" weight="bold" align="center">
        {meta.title}
      </AppText>
      <AppText color="dim" align="center" style={styles.body}>
        {message}
      </AppText>

      {hours !== null && Number.isFinite(hours) ? (
        <AppCard style={styles.statCard}>
          <AppText weight="semibold" align="center">
            ⏱️ {Math.round(hours * 10) / 10} hours fasted
          </AppText>
        </AppCard>
      ) : null}
      {rate !== null && Number.isFinite(rate) ? (
        <AppCard style={styles.statCard}>
          <AppText weight="semibold" align="center">
            🎯 {Math.round(rate)}% of days on track — something to be proud of
          </AppText>
        </AppCard>
      ) : null}

      <View style={styles.footer}>
        <AppButton label="Done" size="lg" onPress={handleDone} />
      </View>
    </View>
  );
}

const CONFETTI_EMOJIS = ['🎉', '✨', '🎊', '🌟', '💪', '🥳'];

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl, gap: spacing.lg },
  confettiRow: { flexDirection: 'row', gap: spacing.md },
  confetti: { fontSize: 30 },
  body: { maxWidth: 300, lineHeight: 22 },
  statCard: { alignSelf: 'stretch' },
  footer: { alignSelf: 'stretch', marginTop: spacing.lg },
});
