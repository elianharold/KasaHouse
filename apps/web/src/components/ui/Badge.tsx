import {
  ListingPurpose,
  ListingStatus,
  type KycStatus,
} from '@kasahouse/shared-types';
import { BadgeCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'brand';

const tones: Record<Tone, string> = {
  neutral: 'bg-surface-sunken text-ink-muted',
  success: 'bg-brand-light text-brand-dark',
  warning: 'bg-amber-100 text-amber-800',
  danger: 'bg-red-100 text-danger',
  brand: 'bg-brand text-white',
};

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function ListingStatusBadge({ status }: { status: ListingStatus }) {
  const map: Record<ListingStatus, [string, Tone]> = {
    [ListingStatus.DRAFT]: ['Draft', 'neutral'],
    [ListingStatus.PUBLISHED]: ['Live', 'success'],
    [ListingStatus.UNLISTED]: ['Unlisted', 'warning'],
    [ListingStatus.TAKEN]: ['Taken', 'danger'],
  };
  const [label, tone] = map[status];
  return <Badge tone={tone}>{label}</Badge>;
}

/** "For rent" / "For sale" — high-contrast, meant to sit on top of a photo. */
export function PurposeBadge({
  purpose,
  className,
}: {
  purpose: ListingPurpose;
  className?: string;
}) {
  const isRent = purpose === ListingPurpose.RENT;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-white shadow-sm',
        isRent ? 'bg-brand' : 'bg-accent',
        className,
      )}
    >
      {isRent ? 'For rent' : 'For sale'}
    </span>
  );
}

/**
 * Trust marker for another person (listing owner, chat counterparty).
 * Shows a green "Verified" pill when their Ghana Card is confirmed, and a
 * muted "ID not verified" when it isn't — so buyers/tenants and landlords
 * can always tell who they're dealing with.
 */
export function VerifiedTick({
  verified,
  size = 'sm',
  showUnverified = false,
  className,
}: {
  verified: boolean;
  size?: 'sm' | 'xs';
  showUnverified?: boolean;
  className?: string;
}) {
  if (!verified && !showUnverified) return null;
  const icon = size === 'xs' ? 'size-3' : 'size-3.5';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-semibold',
        size === 'xs' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs',
        verified ? 'bg-brand-light text-brand-dark' : 'bg-surface-sunken text-ink-muted',
        className,
      )}
      title={verified ? 'Ghana Card verified' : 'Ghana Card not verified'}
    >
      {verified ? <BadgeCheck className={icon} /> : null}
      {verified ? 'Verified' : 'ID not verified'}
    </span>
  );
}

export function KycBadge({ status }: { status: KycStatus }) {
  const map: Record<KycStatus, [string, Tone]> = {
    UNVERIFIED: ['ID not verified', 'neutral'],
    PENDING: ['ID under review', 'warning'],
    VERIFIED: ['ID verified', 'success'],
    REJECTED: ['ID rejected', 'danger'],
  };
  const [label, tone] = map[status];
  return <Badge tone={tone}>{label}</Badge>;
}
