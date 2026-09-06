import {
  API_ROUTES,
  MediaType,
  type CloudinaryUploadSignature,
  type Media,
  type RegisterMediaPayload,
} from '@kasahouse/shared-types';
import { api } from '@/lib/api/client';
import { ApiError } from '@/lib/api-error';

interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  width?: number;
  height?: number;
  duration?: number;
  eager?: Array<{ secure_url: string }>;
}

const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.72;

/** Downscale + re-encode an image File in the browser before upload. */
async function compressImage(file: File): Promise<Blob> {
  if (!file.type.startsWith('image/')) return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  return new Promise<Blob>((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob ?? file),
      'image/jpeg',
      JPEG_QUALITY,
    );
  });
}

async function getSignature(
  listingId: string,
  resourceType: 'image' | 'video',
): Promise<CloudinaryUploadSignature> {
  const { data } = await api.post<CloudinaryUploadSignature>(
    API_ROUTES.media.uploadSignature,
    { listingId, resourceType },
  );
  return data;
}

async function uploadToCloudinary(
  sig: CloudinaryUploadSignature,
  file: Blob,
): Promise<CloudinaryUploadResponse> {
  const form = new FormData();
  form.append('api_key', sig.apiKey);
  form.append('timestamp', String(sig.timestamp));
  form.append('signature', sig.signature);
  form.append('folder', sig.folder);
  form.append('eager', sig.eager);
  form.append('file', file);

  const res = await fetch(sig.uploadUrl, { method: 'POST', body: form });
  if (!res.ok) {
    throw new ApiError(
      'MEDIA_UPLOAD_FAILED',
      'That file could not be uploaded. Please try again.',
      res.status,
    );
  }
  return (await res.json()) as CloudinaryUploadResponse;
}

function buildThumbnailUrl(secureUrl: string, resourceType: 'image' | 'video'): string {
  const marker = '/upload/';
  const idx = secureUrl.indexOf(marker);
  if (idx === -1) return secureUrl;
  const head = secureUrl.slice(0, idx + marker.length);
  let tail = secureUrl.slice(idx + marker.length);
  if (resourceType === 'video') {
    tail = tail.replace(/\.[a-z0-9]+$/i, '.jpg');
    return `${head}so_0,c_fill,w_400,h_300,q_auto/${tail}`;
  }
  return `${head}c_fill,w_400,h_300,q_auto,f_auto/${tail}`;
}

async function registerMedia(payload: RegisterMediaPayload): Promise<Media> {
  const { data } = await api.post<Media>(API_ROUTES.media.register, payload);
  return data;
}

export const mediaService = {
  async uploadListingFile(listingId: string, file: File): Promise<Media> {
    const isVideo = file.type.startsWith('video/');
    const resourceType: 'image' | 'video' = isVideo ? 'video' : 'image';

    const payload: Blob = isVideo ? file : await compressImage(file);
    const sig = await getSignature(listingId, resourceType);
    const uploaded = await uploadToCloudinary(sig, payload);

    const eagerUrl = uploaded.eager?.[0]?.secure_url;
    return registerMedia({
      listingId,
      type: isVideo ? MediaType.VIDEO : MediaType.IMAGE,
      storageKey: uploaded.public_id,
      url: eagerUrl ?? uploaded.secure_url,
      thumbnailUrl: buildThumbnailUrl(uploaded.secure_url, resourceType),
      width: uploaded.width,
      height: uploaded.height,
      durationSeconds:
        uploaded.duration != null ? Math.round(uploaded.duration) : undefined,
    });
  },

  async remove(mediaId: string): Promise<void> {
    await api.delete(API_ROUTES.media.remove(mediaId));
  },

  async reorder(listingId: string, orderedIds: string[]): Promise<Media[]> {
    const { data } = await api.patch<Media[]>(API_ROUTES.media.reorder(listingId), {
      orderedIds,
    });
    return data;
  },
};
