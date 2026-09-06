'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  ChangeListingStatusPayload,
  Listing,
  UpsertListingPayload,
} from '@kasahouse/shared-types';
import { queryKeys } from '@/lib/query-client';
import { listingsService } from '@/services/listings-service';

export function useCreateListing() {
  const qc = useQueryClient();
  return useMutation<Listing, Error, UpsertListingPayload>({
    mutationFn: (payload) => listingsService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.listings.all }),
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
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => listingsService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.listings.all }),
  });
}
