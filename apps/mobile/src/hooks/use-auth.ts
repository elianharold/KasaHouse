import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  UserRole,
  type AuthSession,
  type RequestOtpResult,
  type VerifyOtpPayload,
} from '@kasahouse/shared-types';
import { queryKeys } from '../lib/query-client';
import { authService } from '../services/auth-service';
import { usersService } from '../services/users-service';
import { getRefreshToken, useAuthStore } from '../store/auth-store';

/** Reactive view of the current auth session. */
export function useSession() {
  const tokens = useAuthStore((s) => s.tokens);
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);

  return {
    hydrated,
    isAuthenticated: !!tokens && !!user,
    user,
    isLandlord: !!user?.roles.includes(UserRole.LANDLORD),
    isTenant: !!user?.roles.includes(UserRole.TENANT),
    isKycVerified: user?.kycStatus === 'VERIFIED',
  };
}

/** Keeps the persisted user fresh from the server once authenticated. */
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

function useSessionMutation<TVars>(fn: (v: TVars) => Promise<AuthSession>) {
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
  return useSessionMutation((p: VerifyOtpPayload) => authService.verifyOtp(p));
}

export function useVerifyEmailOtp() {
  return useSessionMutation((p: VerifyOtpPayload) => authService.verifyEmailOtp(p));
}

export function usePasswordLogin() {
  return useSessionMutation((p: { email: string; password: string }) =>
    authService.passwordLogin(p),
  );
}

export function useSetPassword() {
  return useMutation({ mutationFn: authService.setPassword });
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
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      await authService.logout(refreshToken).catch(() => undefined);
    }
    clear();
    qc.clear();
  }, [clear, qc]);
}
