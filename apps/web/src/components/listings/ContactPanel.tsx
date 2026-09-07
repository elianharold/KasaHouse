'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, MessageCircle, ShieldCheck } from 'lucide-react';
import { ListingStatus, type Listing } from '@kasahouse/shared-types';
import { Button, ButtonLink } from '@/components/ui/Button';
import { ListingStatusBadge } from '@/components/ui/Badge';
import { useChangeListingStatus } from '@/hooks/use-listing-mutations';
import { useSession } from '@/hooks/use-auth';
import { useStartThread } from '@/hooks/use-chat';
import { toApiError } from '@/lib/api-error';
import { formatPrice } from '@/lib/format';

export function ContactPanel({ listing }: { listing: Listing }) {
  const router = useRouter();
  const { user, isAuthenticated, isKycVerified, hydrated } = useSession();
  const changeStatus = useChangeListingStatus(listing.id);
  const startThread = useStartThread();
  const [error, setError] = useState<string | null>(null);

  const openChat = async () => {
    setError(null);
    try {
      const thread = await startThread.mutateAsync(listing.id);
      router.push(`/messages/${thread.id}`);
    } catch (e) {
      const err = toApiError(e);
      if (err.code === 'KYC_REQUIRED') {
        router.push(`/verify-id?next=/listings/${listing.id}`);
        return;
      }
      setError(err.message);
    }
  };

  const isOwner = isAuthenticated && user?.id === listing.ownerId;
  const memberSince = new Date(listing.owner.memberSince).toLocaleDateString('en-GH', {
    month: 'long',
    year: 'numeric',
  });

  const setStatus = async (status: 'PUBLISHED' | 'UNLISTED') => {
    setError(null);
    try {
      await changeStatus.mutateAsync({ status });
    } catch (e) {
      setError(toApiError(e).message);
    }
  };

  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <div className="flex items-center justify-between">
        <p className="text-lg font-bold text-brand">
          {formatPrice(listing.price, listing.purpose, listing.rentPeriod)}
        </p>
        {isOwner ? <ListingStatusBadge status={listing.status} /> : null}
      </div>

      <div className="mt-4 border-t border-line pt-4">
        <p className="text-xs text-ink-muted">Listed by</p>
        <p className="font-semibold text-ink">{listing.owner.fullName ?? 'KasaHouse member'}</p>
        <p className="text-xs text-ink-faint">Member since {memberSince}</p>
      </div>

      <div className="mt-4">
        {!hydrated ? (
          <div className="h-11 animate-pulse rounded-xl bg-surface-sunken" />
        ) : isOwner ? (
          <div className="flex flex-col gap-2">
            <ButtonLink href={`/dashboard/listings/${listing.id}/edit`} variant="secondary" fullWidth>
              Edit details
            </ButtonLink>
            <ButtonLink href={`/dashboard/listings/${listing.id}/media`} variant="secondary" fullWidth>
              Manage photos & video
            </ButtonLink>
            {listing.status === ListingStatus.PUBLISHED ? (
              <Button
                variant="ghost"
                fullWidth
                loading={changeStatus.isPending}
                onClick={() => setStatus('UNLISTED')}
              >
                Unlist
              </Button>
            ) : (
              <Button
                fullWidth
                loading={changeStatus.isPending}
                disabled={listing.media.length === 0}
                onClick={() => setStatus('PUBLISHED')}
              >
                Publish listing
              </Button>
            )}
            {listing.media.length === 0 && listing.status !== ListingStatus.PUBLISHED ? (
              <p className="text-center text-xs text-ink-muted">Add at least one photo to publish.</p>
            ) : null}
            {error ? <p className="text-center text-xs text-danger">{error}</p> : null}
          </div>
        ) : !isAuthenticated ? (
          <div>
            <ButtonLink href={`/sign-in?next=/listings/${listing.id}`} fullWidth>
              Sign in to message the owner
            </ButtonLink>
            <p className="mt-3 rounded-xl bg-surface-sunken p-3 text-xs text-ink-muted">
              You&apos;ll verify your Ghana Card next. Deals stay on KasaHouse so
              you keep a payment record and dispute protection.
            </p>
          </div>
        ) : !isKycVerified ? (
          <div>
            <ButtonLink href={`/verify-id?next=/listings/${listing.id}`} fullWidth>
              Verify your Ghana Card to message
            </ButtonLink>
            <div className="mt-3 flex gap-2 rounded-xl bg-surface-sunken p-3 text-xs text-ink-muted">
              <Lock className="size-4 shrink-0" />
              <span>
                Owners only open chat for verified people. It takes a minute and
                only the last 4 digits are stored.
              </span>
            </div>
          </div>
        ) : (
          <div>
            <Button fullWidth loading={startThread.isPending} onClick={openChat}>
              <MessageCircle className="size-4" />
              Message owner
            </Button>
            <div className="mt-3 flex gap-2 rounded-xl bg-brand-light p-3 text-xs text-brand-dark">
              <ShieldCheck className="size-4 shrink-0" />
              <span>Your ID is verified. Keep the conversation on KasaHouse.</span>
            </div>
            {error ? <p className="mt-2 text-center text-xs text-danger">{error}</p> : null}
          </div>
        )}
      </div>
    </div>
  );
}
