'use client';

import { useCallback, useEffect } from 'react';
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

export function useVerifyOtp() {
  const setSession = useAuthStore((s) => s.setSession);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: VerifyOtpPayload) => authService.verifyOtp(payload),
    onSuccess: (session) => {
      setSession(session.tokens, session.user);
      qc.setQueryData(queryKeys.session, session.user);
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
  return useCallback(async () => {
    const rt = getRefreshToken();
    if (rt) await authService.logout(rt).catch(() => undefined);
    clear();
    qc.clear();
  }, [clear, qc]);
}
