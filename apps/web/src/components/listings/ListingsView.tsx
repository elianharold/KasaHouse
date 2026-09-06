'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  toPesewas,
  type ListingFilters,
  type ListingSummary,
  type PaginatedResult,
} from '@kasahouse/shared-types';
import { useBrowseListings } from '@/hooks/use-listings';
import { ListingGrid } from './ListingGrid';

function parseFilters(params: URLSearchParams): ListingFilters {
  const num = (k: string) => {
    const v = params.get(k);
    return v && !Number.isNaN(Number(v)) ? Number(v) : undefined;
  };
  return {
    sort: (params.get('sort') as ListingFilters['sort']) ?? 'newest',
    purpose: (params.get('purpose') as ListingFilters['purpose']) ?? undefined,
    propertyType: (params.get('propertyType') as ListingFilters['propertyType']) ?? undefined,
    city: params.get('city') ?? undefined,
    q: params.get('q') ?? undefined,
    minBedrooms: num('minBedrooms'),
    minPrice: num('minPrice') != null ? toPesewas(num('minPrice')!) : undefined,
    maxPrice: num('maxPrice') != null ? toPesewas(num('maxPrice')!) : undefined,
  };
}

export function ListingsView({
  initialData,
}: {
  initialData?: PaginatedResult<ListingSummary>;
}) {
  const params = useSearchParams();
  const filters = useMemo(() => parseFilters(params), [params]);
  const query = useBrowseListings(filters, initialData);

  return (
    <ListingGrid
      query={query}
      emptyTitle="No listings match"
      emptyMessage="Try removing a filter or widening your price range. New places are added daily."
    />
  );
}
