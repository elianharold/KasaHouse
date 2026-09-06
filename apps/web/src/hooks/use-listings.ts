'use client';

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import type {
  BrowseListingsQuery,
  ListingFilters,
  ListingSummary,
  PaginatedResult,
} from '@kasahouse/shared-types';
import { queryKeys } from '@/lib/query-client';
import { listingsService } from '@/services/listings-service';

const PAGE_SIZE = 12;

export function useBrowseListings(
  filters: ListingFilters,
  initialData?: PaginatedResult<ListingSummary>,
) {
  return useInfiniteQuery({
    queryKey: queryKeys.listings.browse(filters as Record<string, unknown>),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      listingsService.browse({
        ...filters,
        page: pageParam,
        pageSize: PAGE_SIZE,
      } satisfies BrowseListingsQuery),
    getNextPageParam: (last) => (last.hasNextPage ? last.page + 1 : undefined),
    initialData:
      initialData && initialData.page === 1
        ? { pages: [initialData], pageParams: [1] }
        : undefined,
  });
}

export function useListing(id: string, initialData?: import('@kasahouse/shared-types').Listing) {
  return useQuery({
    queryKey: queryKeys.listings.detail(id),
    queryFn: () => listingsService.getById(id),
    initialData,
  });
}

export function useMyListings() {
  return useInfiniteQuery({
    queryKey: queryKeys.listings.mine({}),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      listingsService.mine({ page: pageParam, pageSize: PAGE_SIZE }),
    getNextPageParam: (last) => (last.hasNextPage ? last.page + 1 : undefined),
  });
}
