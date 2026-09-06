'use client';

import Link from 'next/link';
import { ShieldCheck, Lock } from 'lucide-react';
import { ListingStatus, type Listing } from '@kasahouse/shared-types';
import { Button, ButtonLink } from '@/components/ui/Button';
import { ListingStatusBadge } from '@/components/ui/Badge';
import { useChangeListingStatus } from '@/hooks/use-listing-mutations';
import { useSession } from '@/hooks/use-auth';
import { toApiError } from '@/lib/api-error';
import { formatPrice } from '@/lib/format';
import { useState } from 'react';

export function ContactPanel({ listing }: { listing: Listing }) {
  const { user, isAuthenticated, isKycVerified, hydrated } = useSession();
  const changeStatus = useChangeListingStatus(listing.id);
  const [error, setError] = useState<string | null>(null);

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
        ) : (
          <div>
            <Button fullWidth disabled>
              Request to chat
            </Button>
            <div className="mt-3 flex gap-2 rounded-xl bg-surface-sunken p-3 text-xs text-ink-muted">
              {isKycVerified ? (
                <>
                  <ShieldCheck className="size-4 shrink-0 text-brand" />
                  <span>
                    Direct messaging with owners opens in the next KasaHouse update. Your ID is
                    already verified.
                  </span>
                </>
              ) : (
                <>
                  <Lock className="size-4 shrink-0" />
                  <span>
                    {isAuthenticated ? (
                      <>
                        Verify your Ghana Card to unlock the owner&apos;s contact details and chat.
                        Staying on-platform protects your payment history and gives you dispute cover.
                      </>
                    ) : (
                      <>
                        <Link href="/sign-in" className="font-semibold text-brand-dark underline">
                          Sign in
                        </Link>{' '}
                        and verify your Ghana Card to contact the owner. Deals stay on-platform so
                        you keep a payment record and dispute protection.
                      </>
                    )}
                  </span>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
