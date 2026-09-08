import { Text, View } from 'react-native';
import { ListingStatus, type KycStatus } from '@kasahouse/shared-types';

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'brand';

const tones: Record<Tone, string> = {
  neutral: 'bg-surface-sunken text-ink-muted',
  success: 'bg-brand-light text-brand-dark',
  warning: 'bg-[#FDF1DC] text-[#8A5B00]',
  danger: 'bg-[#FBE9E7] text-danger',
  brand: 'bg-brand text-white',
};

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: Tone }) {
  return (
    <View className={`self-start rounded-md px-2 py-0.5 ${tones[tone].split(' ')[0]}`}>
      <Text className={`text-xs font-semibold ${tones[tone].split(' ')[1]}`}>
        {label}
      </Text>
    </View>
  );
}

export function ListingStatusBadge({ status }: { status: ListingStatus }) {
  const map: Record<ListingStatus, { label: string; tone: Tone }> = {
    [ListingStatus.DRAFT]: { label: 'Draft', tone: 'neutral' },
    [ListingStatus.PUBLISHED]: { label: 'Live', tone: 'success' },
    [ListingStatus.UNLISTED]: { label: 'Unlisted', tone: 'warning' },
    [ListingStatus.TAKEN]: { label: 'Taken', tone: 'danger' },
  };
  const { label, tone } = map[status];
  return <Badge label={label} tone={tone} />;
}

/** Trust marker for another person — shows only when they are verified,
 *  unless showUnverified is set. */
export function VerifiedTick({
  verified,
  showUnverified = false,
}: {
  verified: boolean;
  showUnverified?: boolean;
}) {
  if (!verified && !showUnverified) return null;
  return (
    <View
      className={`flex-row items-center self-start rounded-full px-2 py-0.5 ${
        verified ? 'bg-brand-light' : 'bg-surface-sunken'
      }`}
    >
      <Text
        className={`text-[11px] font-semibold ${
          verified ? 'text-brand-dark' : 'text-ink-muted'
        }`}
      >
        {verified ? '✓ Verified' : 'ID not verified'}
      </Text>
    </View>
  );
}

export function KycBadge({ status }: { status: KycStatus }) {
  const map: Record<KycStatus, { label: string; tone: Tone }> = {
    UNVERIFIED: { label: 'ID not verified', tone: 'neutral' },
    PENDING: { label: 'ID under review', tone: 'warning' },
    VERIFIED: { label: 'ID verified', tone: 'success' },
    REJECTED: { label: 'ID rejected', tone: 'danger' },
  };
  const { label, tone } = map[status];
  return <Badge label={label} tone={tone} />;
}
