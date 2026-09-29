import { StyleSheet, TextInput, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { radius, spacing } from '@/theme/tokens';
import { AppText } from './AppText';

interface AppTextInputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'numeric' | 'email-address';
  error?: string | null;
  maxLength?: number;
  autoCapitalize?: 'none' | 'sentences' | 'words';
}

export function AppTextInput({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  keyboardType = 'default',
  error,
  maxLength,
  autoCapitalize = 'sentences',
}: AppTextInputProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      {label ? (
        <AppText variant="label" weight="medium" color="dim" style={styles.label}>
          {label}
        </AppText>
      ) : null}
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textFaint}
        multiline={multiline}
        keyboardType={keyboardType}
        maxLength={maxLength}
        autoCapitalize={autoCapitalize}
        style={[
          styles.input,
          { backgroundColor: colors.surfaceAlt, color: colors.text, borderColor: error ? colors.danger : colors.border },
          multiline && styles.multiline,
        ]}
      />
      {error ? (
        <AppText variant="caption" color="danger" style={styles.error}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.lg },
  label: { marginBottom: spacing.xs + 2 },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    minHeight: 46,
    fontSize: 15,
  },
  multiline: { minHeight: 90, textAlignVertical: 'top', paddingTop: spacing.md },
  error: { marginTop: spacing.xs },
});
