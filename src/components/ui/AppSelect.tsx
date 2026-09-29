import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { radius, spacing } from '@/theme/tokens';
import { AppText } from './AppText';

export interface SelectOption {
  value: string;
  label: string;
}

interface AppSelectProps {
  label?: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
}

/** Lightweight select built on a modal — no native picker dependency. */
export function AppSelect({ label, value, options, onChange, placeholder }: AppSelectProps) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View style={styles.container}>
      {label ? (
        <AppText variant="label" weight="medium" color="dim" style={styles.label}>
          {label}
        </AppText>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label ?? 'Select an option'}
        onPress={() => setOpen(true)}
        style={[styles.trigger, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
      >
        <AppText color={selected ? 'text' : 'faint'}>{selected?.label ?? placeholder ?? 'Select…'}</AppText>
        <AppText color="faint">▾</AppText>
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={[styles.overlay, { backgroundColor: colors.overlay }]} onPress={() => setOpen(false)}>
          <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
            {options.map((option) => (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                accessibilityLabel={option.label}
                onPress={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                style={({ pressed }) => [
                  styles.option,
                  pressed && { backgroundColor: colors.surfaceAlt },
                ]}
              >
                <AppText weight={option.value === value ? 'semibold' : 'regular'}>{option.label}</AppText>
                {option.value === value ? <AppText color="primary">✓</AppText> : null}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.lg },
  label: { marginBottom: spacing.xs + 2 },
  trigger: {
    borderWidth: 1,
    borderRadius: radius.md,
    minHeight: 46,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  overlay: { flex: 1, justifyContent: 'center', padding: spacing.xxl },
  sheet: { borderRadius: radius.lg, paddingVertical: spacing.sm },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 46,
    paddingHorizontal: spacing.lg,
  },
});
