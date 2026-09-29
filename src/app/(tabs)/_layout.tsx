import { Tabs } from 'expo-router';
import { Text, type ColorValue } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

const TAB_ICONS: Record<string, string> = {
  index: '🏠',
  fasting: '⏱️',
  challenge: '🍬',
  habits: '✅',
  insights: '📊',
};

export default function TabsLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ color }) => <TabEmoji emoji={TAB_ICONS.index} color={color} />,
        }}
      />
      <Tabs.Screen
        name="fasting"
        options={{
          title: 'Fasting',
          tabBarIcon: ({ color }) => <TabEmoji emoji={TAB_ICONS.fasting} color={color} />,
        }}
      />
      <Tabs.Screen
        name="challenge"
        options={{
          title: 'Challenge',
          tabBarIcon: ({ color }) => <TabEmoji emoji={TAB_ICONS.challenge} color={color} />,
        }}
      />
      <Tabs.Screen
        name="habits"
        options={{
          title: 'Habits',
          tabBarIcon: ({ color }) => <TabEmoji emoji={TAB_ICONS.habits} color={color} />,
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          tabBarIcon: ({ color }) => <TabEmoji emoji={TAB_ICONS.insights} color={color} />,
        }}
      />
    </Tabs>
  );
}

function TabEmoji({ emoji }: { emoji: string; color?: ColorValue }) {
  return <Text style={{ fontSize: 20, lineHeight: 24 }}>{emoji}</Text>;
}
