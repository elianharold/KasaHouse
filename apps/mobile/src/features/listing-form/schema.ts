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
    title: z
      .string()
      .trim()
      .min(6, 'Give the listing a clear title (at least 6 characters).')
      .max(120, 'Keep the title under 120 characters.'),
    description: z
      .string()
      .trim()
      .min(20, 'Describe the property in a little more detail (20+ characters).')
      .max(4000, 'That description is too long.'),
    priceCedis: z
      .number({ invalid_type_error: 'Enter the price in GH₵.' })
      .positive('Enter the price in GH₵.')
      .max(1_000_000, 'That price looks too high — enter it in GH₵.'),
    rentPeriod: z.nativeEnum(RentPeriod).nullable().optional(),
    advanceMonths: z
      .number()
      .int()
      .min(0)
      .max(24)
      .nullable()
      .optional(),
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
    if (value.purpose === ListingPurpose.SALE && value.propertyType !== PropertyType.LAND) {
      // fine — houses etc. can be for sale
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

export const toUpsertPayload = (
  values: ListingFormValues,
): UpsertListingPayload => ({
  purpose: values.purpose,
  propertyType: values.propertyType,
  title: values.title.trim(),
  description: values.description.trim(),
  priceCedis: values.priceCedis,
  rentPeriod: values.purpose === ListingPurpose.RENT ? (values.rentPeriod ?? RentPeriod.MONTH) : null,
  advanceMonths:
    values.purpose === ListingPurpose.RENT ? (values.advanceMonths ?? null) : null,
  bedrooms: values.bedrooms ?? null,
  bathrooms: values.bathrooms ?? null,
  location: {
    region: values.region.trim(),
    city: values.city.trim(),
    area: values.area.trim(),
    landmark: values.landmark?.trim() ? values.landmark.trim() : null,
  },
  requirements: (values.requirementsText ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean),
  // Add-on editing UI lands with the dashboard polish phase; send an empty set.
  addOns: [],
});
