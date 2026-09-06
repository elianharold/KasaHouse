import { useEffect, type ReactNode } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../lib/query-client';
import { useAuthStore } from '../store/auth-store';

/**
 * Ensures the persisted auth store gets a hydration signal even when
 * onRehydrateStorage doesn't fire (e.g. no persisted value yet).
 */
function useEnsureHydrated() {
  const hydrated = useAuthStore((s) => s.hydrated);
  const markHydrated = useAuthStore((s) => s.markHydrated);

  useEffect(() => {
    if (hydrated) return;
    const timeout = setTimeout(markHydrated, 400);
    void useAuthStore.persist.rehydrate();
    return () => clearTimeout(timeout);
  }, [hydrated, markHydrated]);
}

export function AppProviders({ children }: { children: ReactNode }) {
  useEnsureHydrated();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
