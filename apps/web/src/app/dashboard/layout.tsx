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
        <h1 className="text-xl font-semibold text-ink">Become a landlord to list a property</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Your account is set up as a tenant/buyer. Add the landlord role to post listings.
        </p>
        <div className="mt-6">
          <Button
            loading={updateProfile.isPending}
            onClick={() => updateProfile.mutate({ addRole: UserRole.LANDLORD })}
          >
            Add landlord role
          </Button>
        </div>
      </Container>
    );
  }

  return <Container className="py-8">{children}</Container>;
}
