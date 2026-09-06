import { ListingStatus, type KycStatus } from '@kasahouse/shared-types';
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
