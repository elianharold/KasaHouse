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
