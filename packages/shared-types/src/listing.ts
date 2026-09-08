import type { ISODateString, PaginationQuery, Pesewas } from './common';
import type { Media } from './media';
import type { PublicUserProfile } from './user';

export const ListingPurpose = {
  RENT: 'RENT',
  SALE: 'SALE',
} as const;
export type ListingPurpose = (typeof ListingPurpose)[keyof typeof ListingPurpose];

export const PropertyType = {
  SINGLE_ROOM: 'SINGLE_ROOM',
  CHAMBER_AND_HALL: 'CHAMBER_AND_HALL',
  APARTMENT: 'APARTMENT',
  HOUSE: 'HOUSE',
  SERVICED_APARTMENT: 'SERVICED_APARTMENT',
  COMMERCIAL: 'COMMERCIAL',
  LAND: 'LAND',
} as const;
export type PropertyType = (typeof PropertyType)[keyof typeof PropertyType];

export const RentPeriod = {
  MONTH: 'MONTH',
  YEAR: 'YEAR',
} as const;
export type RentPeriod = (typeof RentPeriod)[keyof typeof RentPeriod];

export const ListingStatus = {
  /** Owner is still editing; not shown in browse. */
  DRAFT: 'DRAFT',
  /** Live and searchable. */
  PUBLISHED: 'PUBLISHED',
  /** Owner paused it; hidden from browse, kept for the owner. */
  UNLISTED: 'UNLISTED',
  /** A lease/sale is in progress or done. */
  TAKEN: 'TAKEN',
} as const;
export type ListingStatus = (typeof ListingStatus)[keyof typeof ListingStatus];

export interface ListingLocation {
  /** Ghana region, e.g. "Greater Accra". */
  region: string;
  /** Town/city, e.g. "Accra". */
  city: string;
  /** Neighbourhood/area, e.g. "East Legon". */
  area: string;
  landmark?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

/** A paid extra attached to a listing (e.g. "Fitted kitchen", "Borehole water"). */
export interface ListingAddOn {
  label: string;
  /** null = included / informational only. */
  price: Pesewas | null;
}

export interface Listing {
  id: string;
  ownerId: string;
  owner: PublicUserProfile;
  purpose: ListingPurpose;
  propertyType: PropertyType;
  title: string;
  description: string;
  /** Rent (per rentPeriod) or sale price, in pesewas, always GHS. */
  price: Pesewas;
  rentPeriod: RentPeriod | null;
  /** Months of rent required upfront (Ghana norm is often 6–12); null for SALE. */
  advanceMonths: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  location: ListingLocation;
  /** Free-form tenant/buyer requirements, one per line in the UI. */
  requirements: string[];
  addOns: ListingAddOn[];
  status: ListingStatus;
  media: Media[];
  createdAt: ISODateString;
  updatedAt: ISODateString;
  publishedAt: ISODateString | null;
}

/** Lightweight shape for browse/search cards — no full description, first image only. */
export interface ListingSummary {
  id: string;
  purpose: ListingPurpose;
  propertyType: PropertyType;
  title: string;
  price: Pesewas;
  rentPeriod: RentPeriod | null;
  bedrooms: number | null;
  bathrooms: number | null;
  location: Pick<ListingLocation, 'city' | 'area' | 'latitude' | 'longitude'>;
  coverImageUrl: string | null;
  coverThumbnailUrl: string | null;
  mediaCount: number;
  hasVideo: boolean;
  status: ListingStatus;
  /** True when the listing owner has passed Ghana Card verification. */
  ownerVerified: boolean;
  createdAt: ISODateString;
}

export interface ListingFilters {
  purpose?: ListingPurpose;
  propertyType?: PropertyType;
  city?: string;
  area?: string;
  minPrice?: Pesewas;
  maxPrice?: Pesewas;
  minBedrooms?: number;
  /** Full-text over title/description/area. */
  q?: string;
  sort?: 'newest' | 'price_asc' | 'price_desc';
}

export type BrowseListingsQuery = ListingFilters & PaginationQuery;

export interface UpsertListingPayload {
  purpose: ListingPurpose;
  propertyType: PropertyType;
  title: string;
  description: string;
  /** Whole GHS from the form; converted to pesewas server-side. */
  priceCedis: number;
  rentPeriod?: RentPeriod | null;
  advanceMonths?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  location: ListingLocation;
  requirements: string[];
  addOns: ListingAddOn[];
}

export interface ChangeListingStatusPayload {
  status: Extract<ListingStatus, 'PUBLISHED' | 'UNLISTED' | 'DRAFT'>;
}
