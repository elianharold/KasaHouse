import * as ImageManipulator from 'expo-image-manipulator';
import {
  API_ROUTES,
  MediaType,
  type CloudinaryUploadSignature,
  type Media,
  type RegisterMediaPayload,
} from '@kasahouse/shared-types';
import { api } from '../api/client';
import { ApiError } from '../lib/api-error';

interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  resource_type: 'image' | 'video';
  width?: number;
  height?: number;
  duration?: number;
  eager?: Array<{ secure_url: string }>;
}

export interface LocalAsset {
  uri: string;
  type: MediaType;
  width?: number;
  height?: number;
  durationSeconds?: number;
  /** file name hint, optional */
  fileName?: string;
}

/**
 * Compress an image on-device before upload. Ghana's mobile bandwidth is
 * variable — we never send the camera original. Video is passed through
 * (Cloudinary transcodes it via the signed `eager` transformation) but capped
 * by the picker's quality setting.
 */
async function compressImage(uri: string): Promise<{ uri: string; width: number; height: number }> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1600 } }],
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG },
  );
  return { uri: result.uri, width: result.width, height: result.height };
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
  fileUri: string,
): Promise<CloudinaryUploadResponse> {
  const form = new FormData();
  // The signed params must be sent back exactly as signed.
  form.append('api_key', sig.apiKey);
  form.append('timestamp', String(sig.timestamp));
  form.append('signature', sig.signature);
  form.append('folder', sig.folder);
  form.append('eager', sig.eager);
  form.append('file', {
    uri: fileUri,
    type: sig.resourceType === 'video' ? 'video/mp4' : 'image/jpeg',
    name: sig.resourceType === 'video' ? 'upload.mp4' : 'upload.jpg',
  } as unknown as Blob);

  const res = await fetch(sig.uploadUrl, { method: 'POST', body: form });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(
      'MEDIA_UPLOAD_FAILED',
      'That photo or video could not be uploaded. Please try again.',
      res.status,
      text ? { _: [text] } : undefined,
    );
  }
  return (await res.json()) as CloudinaryUploadResponse;
}

async function registerMedia(payload: RegisterMediaPayload): Promise<Media> {
  const { data } = await api.post<Media>(API_ROUTES.media.register, payload);
  return data;
}

export const mediaService = {
  /**
   * Full pipeline for one asset: compress -> sign -> upload to Cloudinary ->
   * register with the KasaHouse API. Returns the persisted Media row.
   */
  async uploadListingAsset(listingId: string, asset: LocalAsset): Promise<Media> {
    const resourceType: 'image' | 'video' =
      asset.type === MediaType.VIDEO ? 'video' : 'image';

    let uploadUri = asset.uri;
    let width = asset.width;
    let height = asset.height;

    if (resourceType === 'image') {
      const compressed = await compressImage(asset.uri);
      uploadUri = compressed.uri;
      width = compressed.width;
      height = compressed.height;
    }

    const sig = await getSignature(listingId, resourceType);
    const uploaded = await uploadToCloudinary(sig, uploadUri);

    const eagerUrl = uploaded.eager?.[0]?.secure_url;
    const deliveredUrl = eagerUrl ?? uploaded.secure_url;
    const thumbnailUrl = buildThumbnailUrl(uploaded.secure_url, resourceType);

    return registerMedia({
      listingId,
      type: asset.type,
      storageKey: uploaded.public_id,
      url: deliveredUrl,
      thumbnailUrl,
      width: uploaded.width ?? width,
      height: uploaded.height ?? height,
      durationSeconds:
        uploaded.duration != null
          ? Math.round(uploaded.duration)
          : asset.durationSeconds,
    });
  },

  async remove(mediaId: string): Promise<void> {
    await api.delete(API_ROUTES.media.remove(mediaId));
  },

  async reorder(listingId: string, orderedIds: string[]): Promise<Media[]> {
    const { data } = await api.patch<Media[]>(
      API_ROUTES.media.reorder(listingId),
      { orderedIds },
    );
    return data;
  },
};

/** Insert a Cloudinary delivery transformation for a small card thumbnail. */
function buildThumbnailUrl(
  secureUrl: string,
  resourceType: 'image' | 'video',
): string {
  const marker = '/upload/';
  const idx = secureUrl.indexOf(marker);
  if (idx === -1) return secureUrl;
  const head = secureUrl.slice(0, idx + marker.length);
  let tail = secureUrl.slice(idx + marker.length);
  if (resourceType === 'video') {
    // A still frame from the video as a JPEG.
    tail = tail.replace(/\.[a-z0-9]+$/i, '.jpg');
    return `${head}so_0,c_fill,w_400,h_300,q_auto/${tail}`;
  }
  return `${head}c_fill,w_400,h_300,q_auto,f_auto/${tail}`;
}
