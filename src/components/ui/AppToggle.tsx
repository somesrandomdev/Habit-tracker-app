import { Switch, StyleSheet, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from './AppText';

interface AppToggleProps {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

export function AppToggle({ label, description, value, onValueChange }: AppToggleProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <View style={styles.textCol}>
        <AppText weight="medium">{label}</AppText>
        {description ? (
          <AppText variant="caption" color="dim">
            {description}
          </AppText>
        ) : null}
      </View>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.surfaceAlt, true: colors.primary }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  textCol: { flex: 1, paddingRight: 12, gap: 2 },
});
