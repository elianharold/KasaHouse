import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  ChangeListingStatusPayload,
  Listing,
  UpsertListingPayload,
} from '@kasahouse/shared-types';
import { queryKeys } from '../lib/query-client';
import { listingsService } from '../services/listings-service';

function useInvalidateListings() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: queryKeys.listings.all });
}

export function useCreateListing() {
  const invalidate = useInvalidateListings();
  return useMutation<Listing, Error, UpsertListingPayload>({
    mutationFn: (payload) => listingsService.create(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateListing(id: string) {
  const qc = useQueryClient();
  return useMutation<Listing, Error, UpsertListingPayload>({
    mutationFn: (payload) => listingsService.update(id, payload),
    onSuccess: (listing) => {
      qc.setQueryData(queryKeys.listings.detail(id), listing);
      void qc.invalidateQueries({ queryKey: queryKeys.listings.all });
    },
  });
}

export function useChangeListingStatus(id: string) {
  const qc = useQueryClient();
  return useMutation<Listing, Error, ChangeListingStatusPayload>({
    mutationFn: (payload) => listingsService.changeStatus(id, payload),
    onSuccess: (listing) => {
      qc.setQueryData(queryKeys.listings.detail(id), listing);
      void qc.invalidateQueries({ queryKey: queryKeys.listings.all });
    },
  });
}

export function useDeleteListing() {
  const invalidate = useInvalidateListings();
  return useMutation<void, Error, string>({
    mutationFn: (id) => listingsService.remove(id),
    onSuccess: invalidate,
  });
}
