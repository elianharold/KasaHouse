import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/query-client';
import { kycService } from '../services/kyc-service';
import { useAuthStore } from '../store/auth-store';
import { useSession } from './use-auth';

export function useKycStatus() {
  const { isAuthenticated } = useSession();
  return useQuery({
    queryKey: ['kyc', 'status'],
    queryFn: () => kycService.getStatus(),
    enabled: isAuthenticated,
  });
}

export function useSubmitKyc() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: kycService.submit,
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['kyc', 'status'] });
      qc.invalidateQueries({ queryKey: queryKeys.session });
      if (user) setUser({ ...user, kycStatus: result.status });
    },
  });
}
