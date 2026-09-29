import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { AppButton } from './AppButton';
import { spacing } from '@/theme/tokens';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <View style={styles.container} accessibilityRole="alert">
      <AppText style={styles.emoji}>⚠️</AppText>
      <AppText variant="heading" weight="semibold" align="center">
        Something went wrong
      </AppText>
      <AppText variant="caption" color="dim" align="center" style={styles.message}>
        {message}
      </AppText>
      {onRetry ? <AppButton label="Try again" onPress={onRetry} variant="secondary" style={styles.retry} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', padding: spacing.xxl, gap: spacing.sm },
  emoji: { fontSize: 36 },
  message: { maxWidth: 280 },
  retry: { marginTop: spacing.sm },
});
