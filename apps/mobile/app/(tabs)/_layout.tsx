import { Text, type ColorValue } from 'react-native';
import { Tabs } from 'expo-router';
import { colors } from '../../src/theme/tokens';
import { useSession } from '../../src/hooks/use-auth';

function TabIcon({ glyph, color }: { glyph: string; color: ColorValue }) {
  return <Text style={{ fontSize: 20, color }}>{glyph}</Text>;
}

export default function TabsLayout() {
  const { isLandlord } = useSession();

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.inkFaint,
        headerTitleStyle: { color: colors.ink },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Browse',
          tabBarIcon: ({ color }) => <TabIcon glyph="⌂" color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color }) => <TabIcon glyph="⚲" color={color} />,
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'My listings',
          href: isLandlord ? '/(tabs)/dashboard' : null,
          tabBarIcon: ({ color }) => <TabIcon glyph="▤" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <TabIcon glyph="◉" color={color} />,
        }}
      />
    </Tabs>
  );
}
