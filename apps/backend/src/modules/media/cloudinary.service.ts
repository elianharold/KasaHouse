import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import type { AppConfig } from '../../common/config/configuration';
import { DomainException } from '../../common/errors/domain.exception';

/**
 * Thin wrapper over the official Cloudinary Node SDK. All uploads are performed
 * directly from the device using a signature this service generates — the API
 * never receives the file bytes. Signing uses the SDK's own
 * `api_sign_request` helper so the hash algorithm and parameter ordering match
 * Cloudinary's server exactly.
 */
@Injectable()
export class CloudinaryService implements OnModuleInit {
  private readonly logger = new Logger(CloudinaryService.name);
  private configured = false;

  constructor(private readonly config: ConfigService<AppConfig, true>) {}

  onModuleInit(): void {
    const c = this.config.get('cloudinary', { infer: true });
    if (!c.cloudName || !c.apiKey || !c.apiSecret) {
      this.logger.warn(
        'Cloudinary is not configured — media upload endpoints will return 503 until CLOUDINARY_* env vars are set.',
      );
      return;
    }
    cloudinary.config({
      cloud_name: c.cloudName,
      api_key: c.apiKey,
      api_secret: c.apiSecret,
      secure: true,
    });
    this.configured = true;
    this.logger.log(`Cloudinary configured for cloud "${c.cloudName}"`);
  }

  private assertConfigured(): void {
    if (!this.configured) {
      throw new DomainException(
        'MEDIA_UNAVAILABLE',
        'Media uploads are temporarily unavailable. Please try again later.',
        503,
      );
    }
  }

  buildSignature(input: {
    listingId: string;
    resourceType: 'image' | 'video';
  }): {
    cloudName: string;
    apiKey: string;
    timestamp: number;
    signature: string;
    folder: string;
    uploadPreset: string;
    resourceType: 'image' | 'video';
    uploadUrl: string;
    eager: string;
  } {
    this.assertConfigured();
    const c = this.config.get('cloudinary', { infer: true });
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = `kasahouse/listings/${input.listingId}`;

    // Eager (pre-generated) compressed rendition + poster for video.
    const eager =
      input.resourceType === 'image'
        ? 'c_limit,w_1600,h_1600,q_auto:good,f_auto'
        : 'c_limit,w_1280,h_1280,q_auto,f_mp4';

    const paramsToSign: Record<string, string | number> = {
      folder,
      timestamp,
      eager,
    };

    const signature = cloudinary.utils.api_sign_request(paramsToSign, c.apiSecret);

    return {
      cloudName: c.cloudName,
      apiKey: c.apiKey,
      timestamp,
      signature,
      folder,
      uploadPreset:
        input.resourceType === 'image' ? c.imagePreset : c.videoPreset,
      resourceType: input.resourceType,
      uploadUrl: `https://api.cloudinary.com/v1_1/${c.cloudName}/${input.resourceType}/upload`,
      eager,
    };
  }

  async destroy(storageKey: string, resourceType: 'image' | 'video'): Promise<void> {
    if (!this.configured) return;
    try {
      await cloudinary.uploader.destroy(storageKey, {
        resource_type: resourceType,
        invalidate: true,
      });
    } catch (error) {
      this.logger.error(
        `Failed to delete Cloudinary asset ${storageKey}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
