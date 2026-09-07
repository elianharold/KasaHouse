'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole } from '@kasahouse/shared-types';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import { KycBadge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/States';
import {
  useDeleteAccount,
  useLogout,
  useMe,
  useSession,
  useSetPassword,
  useUpdateProfile,
} from '@/hooks/use-auth';
import { toApiError } from '@/lib/api-error';

export default function ProfilePage() {
  const router = useRouter();
  const { hydrated, isAuthenticated, user, isLandlord, isTenant } = useSession();
  const updateProfile = useUpdateProfile();
  const setPasswordMut = useSetPassword();
  const deleteAccount = useDeleteAccount();
  const logout = useLogout();
  useMe();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [banner, setBanner] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');

  useEffect(() => {
    if (hydrated && !isAuthenticated) router.replace('/sign-in?next=/profile');
  }, [hydrated, isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      setName(user.fullName ?? '');
      setEmail(user.email ?? '');
    }
  }, [user]);

  if (!hydrated || !user) {
    return (
      <Container className="py-10">
        <Spinner label="Loading your profile…" />
      </Container>
    );
  }

  const saveProfile = async () => {
    setBanner(null);
    try {
      await updateProfile.mutateAsync({
        fullName: name.trim(),
        ...(email.trim() && email.trim() !== user.email ? { email: email.trim() } : {}),
      });
      setBanner({ kind: 'ok', text: 'Saved.' });
    } catch (e) {
      setBanner({ kind: 'err', text: toApiError(e).message });
    }
  };

  const savePassword = async () => {
    setBanner(null);
    try {
      await setPasswordMut.mutateAsync({
        newPassword,
        ...(user.hasPassword ? { currentPassword } : {}),
      });
      setNewPassword('');
      setCurrentPassword('');
      setBanner({
        kind: 'ok',
        text: 'Password set. You were signed out on other devices for security.',
      });
    } catch (e) {
      setBanner({ kind: 'err', text: toApiError(e).message });
    }
  };

  return (
    <Container size="narrow" className="py-10">
      <h1 className="text-2xl font-semibold text-ink">Your account</h1>

      {banner ? (
        <p
          className={`mt-4 rounded-xl px-4 py-3 text-sm ${
            banner.kind === 'ok' ? 'bg-brand-light text-brand-dark' : 'bg-red-50 text-danger'
          }`}
        >
          {banner.text}
        </p>
      ) : null}

      <div className="mt-6">
        <Field label="Full name">
          {(id) => (
            <Input id={id} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ama Boateng" />
          )}
        </Field>
        <Field
          label="Email"
          hint={
            user.email
              ? 'Used for email sign-in codes.'
              : 'Add an email to enable email sign-in and a password.'
          }
        >
          {(id) => (
            <Input
              id={id}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          )}
        </Field>
        <Button variant="secondary" loading={updateProfile.isPending} onClick={saveProfile}>
          Save changes
        </Button>
      </div>

      <div className="mt-8 rounded-2xl border border-line p-4">
        <h2 className="text-sm font-semibold text-ink">
          {user.hasPassword ? 'Change password' : 'Set a password'}
        </h2>
        <p className="mb-3 mt-1 text-xs text-ink-muted">
          Optional — lets you sign in with just your email and password.
        </p>
        {!user.email ? (
          <p className="text-xs text-ink-muted">Add an email above first.</p>
        ) : (
          <>
            {user.hasPassword ? (
              <Field label="Current password">
                {(id) => (
                  <Input
                    id={id}
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                )}
              </Field>
            ) : null}
            <Field label="New password" hint="At least 8 characters.">
              {(id) => (
                <Input
                  id={id}
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              )}
            </Field>
            <Button
              variant="secondary"
              loading={setPasswordMut.isPending}
              disabled={newPassword.length < 8}
              onClick={savePassword}
            >
              {user.hasPassword ? 'Update password' : 'Set password'}
            </Button>
          </>
        )}
      </div>

      <div className="mt-8 rounded-2xl border border-line p-4">
        <Row label="Phone" value={user.phone ?? '—'} />
        <Row label="Email" value={user.email ?? '—'} />
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

      <div className="mt-10 rounded-2xl border border-danger/30 bg-red-50/40 p-4">
        <h2 className="text-sm font-semibold text-danger">Delete account</h2>
        <p className="mt-1 text-xs text-ink-muted">
          Permanently removes your account, your listings and their photos. This
          cannot be undone.
        </p>

        {!showDelete ? (
          <Button
            variant="danger"
            size="sm"
            className="mt-3"
            onClick={() => setShowDelete(true)}
          >
            Delete my account
          </Button>
        ) : (
          <div className="mt-3">
            <Field label='Type "DELETE" to confirm'>
              {(id) => (
                <Input
                  id={id}
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder="DELETE"
                  autoFocus
                />
              )}
            </Field>
            <div className="flex gap-2">
              <Button
                variant="danger"
                size="sm"
                loading={deleteAccount.isPending}
                disabled={deleteConfirm.trim() !== 'DELETE'}
                onClick={() => deleteAccount.mutate()}
              >
                Delete permanently
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowDelete(false);
                  setDeleteConfirm('');
                }}
              >
                Cancel
              </Button>
            </div>
            {deleteAccount.isError ? (
              <p className="mt-2 text-xs text-danger">
                {toApiError(deleteAccount.error).message}
              </p>
            ) : null}
          </div>
        )}
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
