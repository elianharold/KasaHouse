'use client';

import { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  UserRole,
  type RequestOtpResult,
  type VerifyOtpPayload,
} from '@kasahouse/shared-types';
import { queryKeys } from '@/lib/query-client';
import { authService } from '@/services/auth-service';
import { usersService } from '@/services/users-service';
import { getRefreshToken } from '@/lib/session';
import { useAuthStore } from '@/store/auth-store';

export function useSession() {
  const tokens = useAuthStore((s) => s.tokens);
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  return {
    hydrated,
    isAuthenticated: !!tokens && !!user,
    user,
    isLandlord: !!user?.roles.includes(UserRole.LANDLORD),
    isTenant: !!user?.roles.includes(UserRole.TENANT),
    isKycVerified: user?.kycStatus === 'VERIFIED',
    needsRole: !!user && user.roles.length === 0,
  };
}

export function useMe() {
  const { isAuthenticated } = useSession();
  const setUser = useAuthStore((s) => s.setUser);

  return useQuery({
    queryKey: queryKeys.session,
    queryFn: async () => {
      const me = await usersService.getMe();
      setUser(me);
      return me;
    },
    enabled: isAuthenticated,
  });
}

export function useRequestOtp() {
  return useMutation<RequestOtpResult, Error, { phone: string }>({
    mutationFn: ({ phone }) => authService.requestOtp({ phone }),
  });
}

export function useRequestEmailOtp() {
  return useMutation<RequestOtpResult, Error, { email: string }>({
    mutationFn: ({ email }) => authService.requestEmailOtp({ email }),
  });
}

function useSessionMutation<TVars>(fn: (v: TVars) => Promise<import('@kasahouse/shared-types').AuthSession>) {
  const setSession = useAuthStore((s) => s.setSession);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (session) => {
      setSession(session.tokens, session.user);
      qc.setQueryData(queryKeys.session, session.user);
    },
  });
}

export function useVerifyOtp() {
  return useSessionMutation((payload: VerifyOtpPayload) => authService.verifyOtp(payload));
}

export function useVerifyEmailOtp() {
  return useSessionMutation((payload: VerifyOtpPayload) => authService.verifyEmailOtp(payload));
}

export function usePasswordLogin() {
  return useSessionMutation((payload: { email: string; password: string }) =>
    authService.passwordLogin(payload),
  );
}

export function useSetPassword() {
  return useMutation({
    mutationFn: authService.setPassword,
  });
}

export function useDeleteAccount() {
  const clear = useAuthStore((s) => s.clear);
  const qc = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: () => usersService.deleteMe(),
    onSuccess: () => {
      clear();
      qc.clear();
      router.replace('/');
      router.refresh();
    },
  });
}

export function useUpdateProfile() {
  const setUser = useAuthStore((s) => s.setUser);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: usersService.updateMe,
    onSuccess: (user) => {
      setUser(user);
      qc.setQueryData(queryKeys.session, user);
    },
  });
}

export function useLogout() {
  const clear = useAuthStore((s) => s.clear);
  const qc = useQueryClient();
  const router = useRouter();
  return useCallback(
    async (redirectTo = '/') => {
      const rt = useAuthStore.getState().tokens?.refreshToken ?? getRefreshToken();
      if (rt) await authService.logout(rt).catch(() => undefined);
      clear();
      qc.clear();
      router.replace(redirectTo);
      router.refresh();
    },
    [clear, qc, router],
  );
}
