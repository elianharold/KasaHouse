import { z } from 'zod';
import {
  ListingPurpose,
  PropertyType,
  RentPeriod,
  fromPesewas,
  type Listing,
  type UpsertListingPayload,
} from '@kasahouse/shared-types';

export const listingFormSchema = z
  .object({
    purpose: z.nativeEnum(ListingPurpose),
    propertyType: z.nativeEnum(PropertyType),
    title: z.string().trim().min(6, 'Give the listing a clear title (6+ characters).').max(120),
    description: z
      .string()
      .trim()
      .min(20, 'Describe the property in a little more detail (20+ characters).')
      .max(4000),
    priceCedis: z
      .number({ invalid_type_error: 'Enter the price in GH₵.' })
      .positive('Enter the price in GH₵.')
      .max(1_000_000),
    rentPeriod: z.nativeEnum(RentPeriod).nullable().optional(),
    advanceMonths: z.number().int().min(0).max(24).nullable().optional(),
    bedrooms: z.number().int().min(0).max(50).nullable().optional(),
    bathrooms: z.number().int().min(0).max(50).nullable().optional(),
    region: z.string().trim().min(2, 'Region is required.').max(60),
    city: z.string().trim().min(2, 'City / town is required.').max(60),
    area: z.string().trim().min(2, 'Neighbourhood / area is required.').max(80),
    landmark: z.string().trim().max(120).optional().or(z.literal('')),
    requirementsText: z.string().trim().max(2000).optional().or(z.literal('')),
  })
  .superRefine((value, ctx) => {
    if (value.purpose === ListingPurpose.RENT && !value.rentPeriod) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['rentPeriod'],
        message: 'Choose whether the rent is monthly or yearly.',
      });
    }
    if (value.purpose === ListingPurpose.RENT && value.propertyType === PropertyType.LAND) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['propertyType'],
        message: 'Land is listed for sale, not for rent.',
      });
    }
  });

export type ListingFormValues = z.infer<typeof listingFormSchema>;

export const emptyListingForm: ListingFormValues = {
  purpose: ListingPurpose.RENT,
  propertyType: PropertyType.CHAMBER_AND_HALL,
  title: '',
  description: '',
  priceCedis: 0,
  rentPeriod: RentPeriod.MONTH,
  advanceMonths: 12,
  bedrooms: 1,
  bathrooms: 1,
  region: '',
  city: '',
  area: '',
  landmark: '',
  requirementsText: '',
};

export const fromListing = (listing: Listing): ListingFormValues => ({
  purpose: listing.purpose,
  propertyType: listing.propertyType,
  title: listing.title,
  description: listing.description,
  priceCedis: fromPesewas(listing.price),
  rentPeriod: listing.rentPeriod,
  advanceMonths: listing.advanceMonths,
  bedrooms: listing.bedrooms,
  bathrooms: listing.bathrooms,
  region: listing.location.region,
  city: listing.location.city,
  area: listing.location.area,
  landmark: listing.location.landmark ?? '',
  requirementsText: listing.requirements.join('\n'),
});

export const toUpsertPayload = (v: ListingFormValues): UpsertListingPayload => ({
  purpose: v.purpose,
  propertyType: v.propertyType,
  title: v.title.trim(),
  description: v.description.trim(),
  priceCedis: v.priceCedis,
  rentPeriod: v.purpose === ListingPurpose.RENT ? (v.rentPeriod ?? RentPeriod.MONTH) : null,
  advanceMonths: v.purpose === ListingPurpose.RENT ? (v.advanceMonths ?? null) : null,
  bedrooms: v.bedrooms ?? null,
  bathrooms: v.bathrooms ?? null,
  location: {
    region: v.region.trim(),
    city: v.city.trim(),
    area: v.area.trim(),
    landmark: v.landmark?.trim() ? v.landmark.trim() : null,
  },
  requirements: (v.requirementsText ?? '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean),
  addOns: [],
});
