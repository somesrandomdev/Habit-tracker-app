import { Modal, StyleSheet, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { radius, spacing } from '@/theme/tokens';
import { AppButton } from '../ui/AppButton';
import { AppText } from '../ui/AppText';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Centered confirmation dialog for destructive or ambiguous actions. */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { colors } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <View style={[styles.dialog, { backgroundColor: colors.surface }]}>
          <AppText variant="heading" weight="bold">
            {title}
          </AppText>
          <AppText color="dim" style={styles.message}>
            {message}
          </AppText>
          <View style={styles.buttons}>
            <AppButton label={cancelLabel} onPress={onCancel} variant="secondary" style={styles.button} />
            <AppButton
              label={confirmLabel}
              onPress={onConfirm}
              variant={danger ? 'danger' : 'primary'}
              style={styles.button}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl },
  dialog: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 340,
    gap: spacing.sm,
  },
  message: { lineHeight: 21 },
  buttons: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  button: { flex: 1 },
});
