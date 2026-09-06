'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole } from '@kasahouse/shared-types';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import { KycBadge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/States';
import { useLogout, useMe, useSession, useUpdateProfile } from '@/hooks/use-auth';
import { toApiError } from '@/lib/api-error';

export default function ProfilePage() {
  const router = useRouter();
  const { hydrated, isAuthenticated, user, isLandlord, isTenant } = useSession();
  const updateProfile = useUpdateProfile();
  const logout = useLogout();
  useMe();

  const [name, setName] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated && !isAuthenticated) router.replace('/sign-in?next=/profile');
  }, [hydrated, isAuthenticated, router]);

  useEffect(() => {
    if (user) setName(user.fullName ?? '');
  }, [user]);

  if (!hydrated || !user) {
    return (
      <Container className="py-10">
        <Spinner label="Loading your profile…" />
      </Container>
    );
  }

  const saveName = async () => {
    setMsg(null);
    setError(null);
    try {
      await updateProfile.mutateAsync({ fullName: name.trim() });
      setMsg('Saved.');
    } catch (e) {
      setError(toApiError(e).message);
    }
  };

  return (
    <Container size="narrow" className="py-10">
      <h1 className="text-2xl font-semibold text-ink">Your account</h1>

      <div className="mt-6">
        <Field label="Full name" error={error ?? undefined} hint={msg ?? undefined}>
          {(id) => (
            <Input id={id} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ama Boateng" />
          )}
        </Field>
        <Button variant="secondary" loading={updateProfile.isPending} onClick={saveName}>
          Save name
        </Button>
      </div>

      <div className="mt-8 rounded-2xl border border-line p-4">
        <Row label="Phone" value={user.phone} />
        <Row label="Roles" value={user.roles.join(' + ') || 'None'} />
        <div className="flex items-center justify-between py-3">
          <span className="text-sm text-ink-muted">ID verification</span>
          <KycBadge status={user.kycStatus} />
        </div>
        <p className="text-xs text-ink-muted">
          Tenants and buyers verify their Ghana Card before a landlord&apos;s contact details and
          chat unlock. ID verification opens in the next KasaHouse update.
        </p>
      </div>

      {(!isLandlord || !isTenant) && (
        <div className="mt-6">
          <h2 className="mb-2 text-sm font-medium text-ink">Add a role</h2>
          <div className="space-y-2">
            {!isLandlord && (
              <RoleButton
                label="Become a landlord / seller"
                onClick={() => updateProfile.mutate({ addRole: UserRole.LANDLORD })}
              />
            )}
            {!isTenant && (
              <RoleButton
                label="Also look for a place as a tenant / buyer"
                onClick={() => updateProfile.mutate({ addRole: UserRole.TENANT })}
              />
            )}
          </div>
        </div>
      )}

      <div className="mt-10">
        <Button variant="ghost" onClick={() => void logout()}>
          Sign out
        </Button>
      </div>
    </Container>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-line py-3 last:border-0">
      <span className="text-sm text-ink-muted">{label}</span>
      <span className="text-sm font-medium text-ink">{value}</span>
    </div>
  );
}

function RoleButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-xl border border-line p-3 text-left text-sm text-ink hover:bg-surface-sunken"
    >
      {label}
    </button>
  );
}
