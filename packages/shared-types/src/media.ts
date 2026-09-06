import type { ISODateString } from './common';

export const MediaType = {
  IMAGE: 'IMAGE',
  VIDEO: 'VIDEO',
} as const;
export type MediaType = (typeof MediaType)[keyof typeof MediaType];

export interface Media {
  id: string;
  listingId: string;
  type: MediaType;
  /** Delivery URL (already transformed/compressed by Cloudinary). */
  url: string;
  /** Small poster/thumbnail URL for cards and galleries on low bandwidth. */
  thumbnailUrl: string;
  /** Cloudinary public_id, kept so the asset can be deleted/replaced. */
  storageKey: string;
  width: number | null;
  height: number | null;
  /** Video length in seconds, null for images. */
  durationSeconds: number | null;
  order: number;
  createdAt: ISODateString;
}

/**
 * Params the client must use when uploading directly to Cloudinary with a
 * signed (not unsigned) upload. The backend never proxies the file bytes.
 */
export interface CloudinaryUploadSignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  /** Folder the asset must be placed in, e.g. "kasahouse/listings/<listingId>". */
  folder: string;
  /** Named transformation/eager preset the signature was computed with. */
  uploadPreset: string;
  /**
   * The exact `eager` transformation string the signature was computed with.
   * The client MUST send this back verbatim in the multipart upload or the
   * signature check fails.
   */
  eager: string;
  /** Allowed resource type for this signature. */
  resourceType: 'image' | 'video';
  /** Absolute Cloudinary endpoint to POST the multipart form to. */
  uploadUrl: string;
}

export interface RequestUploadSignaturePayload {
  listingId: string;
  resourceType: 'image' | 'video';
}

/** Sent back to the backend after a successful direct upload to register the asset. */
export interface RegisterMediaPayload {
  listingId: string;
  type: MediaType;
  storageKey: string;
  url: string;
  thumbnailUrl: string;
  width?: number;
  height?: number;
  durationSeconds?: number;
}

export interface ReorderMediaPayload {
  /** Media ids in the desired display order. */
  orderedIds: string[];
}
