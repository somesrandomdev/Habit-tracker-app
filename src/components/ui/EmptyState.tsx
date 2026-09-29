import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { AppButton } from './AppButton';
import { useTheme } from '@/hooks/useTheme';
import { spacing } from '@/theme/tokens';

interface EmptyStateProps {
  emoji: string;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ emoji, title, message, actionLabel, onAction }: EmptyStateProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <AppText style={styles.emoji}>{emoji}</AppText>
      <AppText variant="heading" weight="semibold" align="center">
        {title}
      </AppText>
      <AppText variant="caption" color="dim" align="center" style={styles.message}>
        {message}
      </AppText>
      {actionLabel && onAction ? (
        <AppButton label={actionLabel} onPress={onAction} variant="secondary" style={styles.action} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emoji: { fontSize: 40 },
  message: { maxWidth: 260 },
  action: { marginTop: spacing.sm },
});
