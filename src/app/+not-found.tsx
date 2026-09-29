import { StyleSheet, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';

export default function NotFound() {
  const { colors } = useTheme();
  const router = useRouter();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <AppText style={styles.emoji}>🧭</AppText>
      <AppText variant="heading" weight="bold">
        Screen not found
      </AppText>
      <AppText color="dim" align="center">
        That link or screen does not exist in FastHabit.
      </AppText>
      <AppButton label="Go home" onPress={() => router.replace('/(tabs)')} style={styles.button} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  emoji: { fontSize: 44 },
  button: { marginTop: 8 },
});
