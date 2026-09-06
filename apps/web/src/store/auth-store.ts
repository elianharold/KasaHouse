'use client';

import { create } from 'zustand';
import type { AuthTokens, User } from '@kasahouse/shared-types';
import {
  clearSession,
  persistSession,
  persistTokens,
  persistUser,
  readSession,
} from '@/lib/session';

interface AuthState {
  tokens: AuthTokens | null;
  user: User | null;
  hydrated: boolean;

  hydrate: () => void;
  setSession: (tokens: AuthTokens, user: User) => void;
  setTokens: (tokens: AuthTokens) => void;
  setUser: (user: User) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  tokens: null,
  user: null,
  hydrated: false,

  hydrate: () => {
    const { tokens, user } = readSession();
    set({ tokens, user, hydrated: true });
  },
  setSession: (tokens, user) => {
    persistSession(tokens, user);
    set({ tokens, user });
  },
  setTokens: (tokens) => {
    persistTokens(tokens);
    set({ tokens });
  },
  setUser: (user) => {
    persistUser(user);
    set({ user });
  },
  clear: () => {
    clearSession();
    set({ tokens: null, user: null });
  },
}));
