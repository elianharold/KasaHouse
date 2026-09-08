'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Container } from '@/components/layout/Container';
import { Spinner } from '@/components/ui/States';
import { Button } from '@/components/ui/Button';
import { useMe, useSession, useUpdateProfile } from '@/hooks/use-auth';
import { UserRole } from '@kasahouse/shared-types';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { hydrated, isAuthenticated, isLandlord, user } = useSession();
  const updateProfile = useUpdateProfile();
  useMe();

  useEffect(() => {
    if (hydrated && !isAuthenticated) router.replace('/sign-in?next=/dashboard');
  }, [hydrated, isAuthenticated, router]);

  if (!hydrated || !isAuthenticated) {
    return (
      <Container className="py-10">
        <Spinner label="Loading your dashboard…" />
      </Container>
    );
  }

  if (user && !isLandlord) {
    return (
      <Container size="narrow" className="py-16 text-center">
        <h1 className="text-xl font-semibold text-ink">Switch to a landlord account to list</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Your account is set up as a tenant/buyer. Switch it to landlord/seller
          to post listings — you can switch back any time in your profile.
        </p>
        <div className="mt-6">
          <Button
            loading={updateProfile.isPending}
            onClick={() => updateProfile.mutate({ role: UserRole.LANDLORD })}
          >
            Switch to landlord
          </Button>
        </div>
      </Container>
    );
  }

  return <Container className="py-8">{children}</Container>;
}
