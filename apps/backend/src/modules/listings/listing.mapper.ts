import type {
  Listing as PrismaListing,
  Media as PrismaMedia,
  User as PrismaUser,
} from '@prisma/client';
import type {
  Listing,
  ListingAddOn,
  ListingPurpose,
  ListingStatus,
  ListingSummary,
  Media,
  MediaType,
  PropertyType,
  RentPeriod,
} from '@kasahouse/shared-types';
import { toPublicUserProfile } from '../users/user.mapper';

type ListingRow = PrismaListing & {
  owner: Pick<PrismaUser, 'id' | 'fullName' | 'roles' | 'createdAt'>;
  media: PrismaMedia[];
};

const parseAddOns = (value: PrismaListing['addOns']): ListingAddOn[] => {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (entry): entry is { label: string; price: number | null } =>
        !!entry &&
        typeof entry === 'object' &&
        typeof (entry as { label?: unknown }).label === 'string',
    )
    .map((entry) => ({
      label: entry.label,
      price: typeof entry.price === 'number' ? entry.price : null,
    }));
};

export const toMedia = (row: PrismaMedia): Media => ({
  id: row.id,
  listingId: row.listingId,
  type: row.type as MediaType,
  url: row.url,
  thumbnailUrl: row.thumbnailUrl,
  storageKey: row.storageKey,
  width: row.width,
  height: row.height,
  durationSeconds: row.durationSeconds,
  order: row.order,
  createdAt: row.createdAt.toISOString(),
});

export const toListing = (row: ListingRow): Listing => ({
  id: row.id,
  ownerId: row.ownerId,
  owner: toPublicUserProfile(row.owner),
  purpose: row.purpose as ListingPurpose,
  propertyType: row.propertyType as PropertyType,
  title: row.title,
  description: row.description,
  price: row.price,
  rentPeriod: (row.rentPeriod as RentPeriod | null) ?? null,
  advanceMonths: row.advanceMonths,
  bedrooms: row.bedrooms,
  bathrooms: row.bathrooms,
  location: {
    region: row.region,
    city: row.city,
    area: row.area,
    landmark: row.landmark,
    latitude: row.latitude,
    longitude: row.longitude,
  },
  requirements: row.requirements,
  addOns: parseAddOns(row.addOns),
  status: row.status as ListingStatus,
  media: [...row.media].sort((a, b) => a.order - b.order).map(toMedia),
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
  publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
});

export const toListingSummary = (row: ListingRow): ListingSummary => {
  const ordered = [...row.media].sort((a, b) => a.order - b.order);
  const cover = ordered.find((m) => m.type === 'IMAGE') ?? ordered[0] ?? null;
  return {
    id: row.id,
    purpose: row.purpose as ListingPurpose,
    propertyType: row.propertyType as PropertyType,
    title: row.title,
    price: row.price,
    rentPeriod: (row.rentPeriod as RentPeriod | null) ?? null,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    location: {
      city: row.city,
      area: row.area,
      latitude: row.latitude,
      longitude: row.longitude,
    },
    coverImageUrl: cover ? cover.url : null,
    coverThumbnailUrl: cover ? cover.thumbnailUrl : null,
    mediaCount: ordered.length,
    hasVideo: ordered.some((m) => m.type === 'VIDEO'),
    status: row.status as ListingStatus,
    createdAt: row.createdAt.toISOString(),
  };
};
