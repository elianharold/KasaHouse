'use client';

import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Media } from '@kasahouse/shared-types';
import { toApiError } from '@/lib/api-error';
import { queryKeys } from '@/lib/query-client';
import { mediaService } from '@/services/media-service';

export interface MediaUploadItem {
  key: string;
  name: string;
  previewUrl: string;
  status: 'uploading' | 'done' | 'error';
  media?: Media;
  error?: string;
  file: File;
}

export function useListingMediaUpload(listingId: string) {
  const qc = useQueryClient();
  const [items, setItems] = useState<MediaUploadItem[]>([]);
  const [isUploading, setUploading] = useState(false);

  const patch = useCallback((key: string, next: Partial<MediaUploadItem>) => {
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, ...next } : it)));
  }, []);

  const invalidate = useCallback(async () => {
    await qc.invalidateQueries({ queryKey: queryKeys.listings.detail(listingId) });
    await qc.invalidateQueries({ queryKey: queryKeys.listings.all });
  }, [listingId, qc]);

  const uploadOne = useCallback(
    async (item: MediaUploadItem) => {
      try {
        const media = await mediaService.uploadListingFile(listingId, item.file);
        patch(item.key, { status: 'done', media });
      } catch (error) {
        patch(item.key, { status: 'error', error: toApiError(error).message });
      }
    },
    [listingId, patch],
  );

  const upload = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;
      const newItems: MediaUploadItem[] = files.map((file, i) => ({
        key: `${Date.now()}-${i}-${file.name}`,
        name: file.name,
        previewUrl: URL.createObjectURL(file),
        status: 'uploading',
        file,
      }));
      setItems((prev) => [...prev, ...newItems]);
      setUploading(true);
      for (const item of newItems) {
        await uploadOne(item);
      }
      setUploading(false);
      await invalidate();
    },
    [uploadOne, invalidate],
  );

  const retry = useCallback(
    async (key: string) => {
      const item = items.find((it) => it.key === key);
      if (!item) return;
      patch(key, { status: 'uploading', error: undefined });
      await uploadOne(item);
      await invalidate();
    },
    [items, patch, uploadOne, invalidate],
  );

  const remove = useCallback(
    async (media: Media) => {
      await mediaService.remove(media.id);
      setItems((prev) => prev.filter((it) => it.media?.id !== media.id));
      await invalidate();
    },
    [invalidate],
  );

  return { items, isUploading, upload, retry, remove };
}
