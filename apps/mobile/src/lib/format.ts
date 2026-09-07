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

/** 180000 (pesewas) -> "GH₵1,800" */
export const formatGhs = (amount: Pesewas): string => cedis.format(fromPesewas(amount));

export const formatPrice = (
  amount: Pesewas,
  purpose: ListingPurpose,
  rentPeriod: RentPeriod | null,
): string => {
  if (purpose === 'SALE') return formatGhs(amount);
  const per = rentPeriod === RentPeriod.YEAR ? 'yr' : 'mo';
  return `${formatGhs(amount)}/${per}`;
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

export const propertyTypeLabel = (type: PropertyType): string =>
  PROPERTY_TYPE_LABELS[type] ?? type;

export const relativeTime = (iso: string): string => {
  const then = new Date(iso).getTime();
  const diffMs = Date.now() - then;
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.round(months / 12)}y ago`;
};

export const bedroomLabel = (n: number | null): string | null =>
  n == null ? null : n === 0 ? 'Studio' : `${n} bed${n === 1 ? '' : 's'}`;

export const messageTime = (iso: string): string => {
  const d = new Date(iso);
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
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

export const dayLabel = (iso: string): string => {
  const d = new Date(iso);
  const now = new Date();
  const startOf = (x: Date) =>
    new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((startOf(now) - startOf(d)) / 86_400_000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return d.toLocaleDateString('en-GH', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
};
