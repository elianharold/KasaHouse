import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AuthTokens, User } from '@kasahouse/shared-types';

interface AuthState {
  tokens: AuthTokens | null;
  user: User | null;
  /** False until the persisted store has been read from disk. */
  hydrated: boolean;

  setSession: (tokens: AuthTokens, user: User) => void;
  setTokens: (tokens: AuthTokens) => void;
  setUser: (user: User) => void;
  clear: () => void;
  markHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      tokens: null,
      user: null,
      hydrated: false,

      setSession: (tokens, user) => set({ tokens, user }),
      setTokens: (tokens) => set({ tokens }),
      setUser: (user) => set({ user }),
      clear: () => set({ tokens: null, user: null }),
      markHydrated: () => set({ hydrated: true }),
    }),
    {
      name: 'kasahouse.auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ tokens: state.tokens, user: state.user }),
      onRehydrateStorage: () => (state) => {
        state?.markHydrated();
      },
    },
  ),
);

export const getAccessToken = (): string | null =>
  useAuthStore.getState().tokens?.accessToken ?? null;

export const getRefreshToken = (): string | null =>
  useAuthStore.getState().tokens?.refreshToken ?? null;
