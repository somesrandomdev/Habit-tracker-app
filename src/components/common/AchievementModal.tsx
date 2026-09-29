import { useEffect, useState } from 'react';
import { Animated, Modal, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';
import { radius, spacing } from '@/theme/tokens';
import { AppButton } from '../ui/AppButton';
import { AppText } from '../ui/AppText';
import type { AchievementDef } from '@/services/achievements.service';

interface AchievementModalProps {
  achievement: AchievementDef | null;
  onDismiss: () => void;
}

/** Global celebration modal shown whenever a new achievement unlocks. */
export function AchievementModal({ achievement, onDismiss }: AchievementModalProps) {
  const { colors } = useTheme();
  const [scale] = useState(() => new Animated.Value(0.6));
  const visible = achievement !== null;

  useEffect(() => {
    if (!visible) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
    }).start();
    return () => scale.setValue(0.6);
  }, [visible, scale]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <Animated.View style={[styles.card, { backgroundColor: colors.surface, transform: [{ scale }] }]}>
          <AppText style={styles.emoji}>{achievement?.emoji ?? '🎉'}</AppText>
          <AppText variant="label" weight="semibold" color="primary">
            ACHIEVEMENT UNLOCKED
          </AppText>
          <AppText variant="heading" weight="bold" align="center">
            {achievement?.title}
          </AppText>
          <AppText color="dim" align="center" style={styles.description}>
            {achievement?.description}
          </AppText>
          <AppButton label="Keep going" onPress={onDismiss} style={styles.button} />
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl },
  card: {
    borderRadius: radius.xl,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emoji: { fontSize: 52 },
  description: { marginBottom: spacing.sm },
  button: { alignSelf: 'stretch' },
});
