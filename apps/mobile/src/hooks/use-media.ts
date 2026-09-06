import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Media } from '@kasahouse/shared-types';
import { toApiError } from '../lib/api-error';
import { queryKeys } from '../lib/query-client';
import { mediaService, type LocalAsset } from '../services/media-service';

export interface MediaUploadItem {
  localUri: string;
  status: 'uploading' | 'done' | 'error';
  media?: Media;
  error?: string;
}

/**
 * Sequential upload queue for a listing's photos/videos, with per-item
 * progress state the dashboard can render. Sequential (not parallel) keeps
 * memory and bandwidth predictable on low-end devices.
 */
export function useListingMediaUpload(listingId: string) {
  const qc = useQueryClient();
  const [items, setItems] = useState<MediaUploadItem[]>([]);
  const [isUploading, setUploading] = useState(false);

  const patch = useCallback((uri: string, next: Partial<MediaUploadItem>) => {
    setItems((prev) =>
      prev.map((it) => (it.localUri === uri ? { ...it, ...next } : it)),
    );
  }, []);

  const upload = useCallback(
    async (assets: LocalAsset[]) => {
      if (assets.length === 0) return;
      setUploading(true);
      setItems((prev) => [
        ...prev,
        ...assets.map<MediaUploadItem>((a) => ({
          localUri: a.uri,
          status: 'uploading',
        })),
      ]);

      for (const asset of assets) {
        try {
          const media = await mediaService.uploadListingAsset(listingId, asset);
          patch(asset.uri, { status: 'done', media });
        } catch (error) {
          patch(asset.uri, {
            status: 'error',
            error: toApiError(error).message,
          });
        }
      }

      setUploading(false);
      await qc.invalidateQueries({
        queryKey: queryKeys.listings.detail(listingId),
      });
      await qc.invalidateQueries({ queryKey: queryKeys.listings.all });
    },
    [listingId, patch, qc],
  );

  const retry = useCallback(
    async (uri: string, asset: LocalAsset) => {
      patch(uri, { status: 'uploading', error: undefined });
      try {
        const media = await mediaService.uploadListingAsset(listingId, asset);
        patch(uri, { status: 'done', media });
        await qc.invalidateQueries({
          queryKey: queryKeys.listings.detail(listingId),
        });
      } catch (error) {
        patch(uri, { status: 'error', error: toApiError(error).message });
      }
    },
    [listingId, patch, qc],
  );

  const remove = useCallback(
    async (media: Media) => {
      await mediaService.remove(media.id);
      setItems((prev) => prev.filter((it) => it.media?.id !== media.id));
      await qc.invalidateQueries({
        queryKey: queryKeys.listings.detail(listingId),
      });
      await qc.invalidateQueries({ queryKey: queryKeys.listings.all });
    },
    [listingId, qc],
  );

  const reset = useCallback(() => setItems([]), []);

  return { items, isUploading, upload, retry, remove, reset };
}
