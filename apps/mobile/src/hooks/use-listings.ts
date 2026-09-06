import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import type {
  BrowseListingsQuery,
  ListingFilters,
} from '@kasahouse/shared-types';
import { queryKeys } from '../lib/query-client';
import { listingsService } from '../services/listings-service';

const PAGE_SIZE = 12;

export function useBrowseListings(filters: ListingFilters) {
  return useInfiniteQuery({
    queryKey: queryKeys.listings.browse(filters as Record<string, unknown>),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      listingsService.browse({
        ...filters,
        page: pageParam,
        pageSize: PAGE_SIZE,
      } satisfies BrowseListingsQuery),
    getNextPageParam: (lastPage) =>
      lastPage.hasNextPage ? lastPage.page + 1 : undefined,
  });
}

export function useListing(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.listings.detail(id ?? 'none'),
    queryFn: () => listingsService.getById(id as string),
    enabled: !!id,
  });
}

export function useMyListings() {
  return useInfiniteQuery({
    queryKey: queryKeys.listings.mine({}),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      listingsService.mine({ page: pageParam, pageSize: PAGE_SIZE }),
    getNextPageParam: (lastPage) =>
      lastPage.hasNextPage ? lastPage.page + 1 : undefined,
  });
}
