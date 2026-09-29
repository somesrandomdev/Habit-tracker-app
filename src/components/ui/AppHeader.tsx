import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { spacing } from '@/theme/tokens';
import { AppText } from './AppText';

interface AppHeaderProps {
  title: string;
  showBack?: boolean;
  right?: React.ReactNode;
  subtitle?: string;
}

export function AppHeader({ title, showBack = false, right, subtitle }: AppHeaderProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm, backgroundColor: colors.background }]}>
      <View style={styles.row}>
        <View style={styles.side}>
          {showBack ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={() => router.back()}
              style={({ pressed }) => [styles.back, pressed && { opacity: 0.6 }]}
            >
              <AppText style={{ color: colors.primary, fontSize: 17 }}>←</AppText>
            </Pressable>
          ) : null}
        </View>
        <View style={styles.center}>
          <AppText variant="heading" weight="bold" numberOfLines={1} align="center">
            {title}
          </AppText>
          {subtitle ? (
            <AppText variant="caption" color="dim" align="center" numberOfLines={1}>
              {subtitle}
            </AppText>
          ) : null}
        </View>
        <View style={[styles.side, styles.right]}>{right}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 40 },
  side: { width: 60 },
  right: { alignItems: 'flex-end' },
  center: { flex: 1 },
  back: { minHeight: 40, minWidth: 40, alignItems: 'flex-start', justifyContent: 'center' },
});
