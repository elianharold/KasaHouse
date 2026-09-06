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
