import {
  PropertyType,
  RentPeriod,
  fromPesewas,
  type ListingPurpose,
  type Pesewas,
} from '@kasahouse/shared-types';

const cedis = new Intl.NumberFormat('en-GH', {
  style: 'currency',
  currency: 'GHS',
  maximumFractionDigits: 0,
});

export const formatGhs = (amount: Pesewas): string => cedis.format(fromPesewas(amount));

export const formatPrice = (
  amount: Pesewas,
  purpose: ListingPurpose,
  rentPeriod: RentPeriod | null,
): string => {
  if (purpose === 'SALE') return formatGhs(amount);
  return `${formatGhs(amount)}/${rentPeriod === RentPeriod.YEAR ? 'yr' : 'mo'}`;
};

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  [PropertyType.SINGLE_ROOM]: 'Single room',
  [PropertyType.CHAMBER_AND_HALL]: 'Chamber & hall',
  [PropertyType.APARTMENT]: 'Apartment',
  [PropertyType.HOUSE]: 'House',
  [PropertyType.SERVICED_APARTMENT]: 'Serviced apartment',
  [PropertyType.COMMERCIAL]: 'Commercial',
  [PropertyType.LAND]: 'Land',
};

export const propertyTypeLabel = (t: PropertyType): string =>
  PROPERTY_TYPE_LABELS[t] ?? t;

export const bedroomLabel = (n: number | null): string | null =>
  n == null ? null : n === 0 ? 'Studio' : `${n} bed${n === 1 ? '' : 's'}`;

export const relativeTime = (iso: string): string => {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.round(days / 30);
  return months < 12 ? `${months}mo ago` : `${Math.round(months / 12)}y ago`;
};

const timeFmt = new Intl.DateTimeFormat('en-GH', { hour: 'numeric', minute: '2-digit' });

/** "3:45 PM" */
export const messageTime = (iso: string): string => timeFmt.format(new Date(iso));

/** "Today" / "Yesterday" / "Fri 5 Sep" — a day divider label. */
export const dayLabel = (iso: string): string => {
  const d = new Date(iso);
  const today = new Date();
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.round((startOf(today) - startOf(d)) / 86_400_000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return new Intl.DateTimeFormat('en-GH', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(d);
};

export const sameDay = (a: string, b: string): boolean => {
  const x = new Date(a);
  const y = new Date(b);
  return (
    x.getFullYear() === y.getFullYear() &&
    x.getMonth() === y.getMonth() &&
    x.getDate() === y.getDate()
  );
};
