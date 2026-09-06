import '../global.css';

import { useEffect } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Stack, useRouter, useSegments } from 'expo-router';
import { AppProviders } from '../src/components/AppProviders';
import { LoadingState } from '../src/components/ui/StateViews';
import { useMe, useSession } from '../src/hooks/use-auth';

function AuthGate() {
  const { hydrated, isAuthenticated, user } = useSession();
  const segments = useSegments();
  const router = useRouter();

  // Keep the persisted user profile fresh once signed in.
  useMe();

  useEffect(() => {
    if (!hydrated) return;

    const parts = segments as string[];
    const inAuthFlow = parts[0] === '(auth)';
    const needsRole =
      isAuthenticated && user != null && user.roles.length === 0;

    if (!isAuthenticated && !inAuthFlow) {
      router.replace('/(auth)/phone');
    } else if (isAuthenticated && needsRole && parts[1] !== 'role') {
      router.replace('/(auth)/role');
    } else if (isAuthenticated && !needsRole && inAuthFlow) {
      router.replace('/(tabs)');
    }
  }, [hydrated, isAuthenticated, user, segments, router]);

  if (!hydrated) {
    return (
      <View className="flex-1 bg-surface">
        <LoadingState label="Starting KasaHouse…" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="listing/[id]"
        options={{ headerShown: true, title: 'Listing' }}
      />
      <Stack.Screen
        name="listing/create"
        options={{ headerShown: true, title: 'New listing', presentation: 'modal' }}
      />
      <Stack.Screen
        name="listing/[id]/edit"
        options={{ headerShown: true, title: 'Edit listing', presentation: 'modal' }}
      />
      <Stack.Screen
        name="listing/[id]/media"
        options={{ headerShown: true, title: 'Photos & video', presentation: 'modal' }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AppProviders>
      <StatusBar style="dark" />
      <AuthGate />
    </AppProviders>
  );
}
