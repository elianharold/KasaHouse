import { Text, View, type ColorValue } from 'react-native';
import { Tabs } from 'expo-router';
import type { User } from '@kasahouse/shared-types';
import { colors } from '../../src/theme/tokens';
import { useSession } from '../../src/hooks/use-auth';

function TabIcon({ glyph, color }: { glyph: string; color: ColorValue }) {
  return <Text style={{ fontSize: 20, color }}>{glyph}</Text>;
}

function userInitials(user: User): string {
  const name = user.fullName?.trim();
  if (name) {
    const p = name.split(/\s+/).filter(Boolean);
    return (p[0]![0]! + (p[1]?.[0] ?? '')).toUpperCase();
  }
  if (user.email) return user.email[0]!.toUpperCase();
  if (user.phone) return user.phone.slice(-2);
  return '·';
}

/** Profile tab icon = the user's avatar, so identity is visible from the tab bar. */
function ProfileTabIcon({ color, focused }: { color: ColorValue; focused: boolean }) {
  const { user } = useSession();
  if (!user) return <TabIcon glyph="◉" color={color} />;
  return (
    <View
      style={{
        width: 26,
        height: 26,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: focused ? colors.brand : colors.surfaceSunken,
        borderWidth: focused ? 0 : 1,
        borderColor: colors.border,
      }}
    >
      <Text
        style={{
          fontSize: 11,
          fontWeight: '700',
          color: focused ? '#fff' : colors.inkMuted,
        }}
      >
        {userInitials(user)}
      </Text>
    </View>
  );
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
          tabBarIcon: ({ color, focused }) => (
            <ProfileTabIcon color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
