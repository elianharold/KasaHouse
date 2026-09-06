import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import {
  MediaType,
  type CloudinaryUploadSignature,
  type Media,
  type RegisterMediaPayload,
} from '@kasahouse/shared-types';
import { DomainException } from '../../common/errors/domain.exception';
import { toMedia } from '../listings/listing.mapper';
import { CloudinaryService } from './cloudinary.service';
import { MediaRepository } from './media.repository';

const MAX_MEDIA_PER_LISTING = 20;

@Injectable()
export class MediaService {
  constructor(
    private readonly repo: MediaRepository,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async createUploadSignature(
    userId: string,
    input: { listingId: string; resourceType: 'image' | 'video' },
  ): Promise<CloudinaryUploadSignature> {
    await this.assertOwnsListing(userId, input.listingId);

    const count = await this.repo.countForListing(input.listingId);
    if (count >= MAX_MEDIA_PER_LISTING) {
      throw new DomainException(
        'MEDIA_LIMIT_REACHED',
        `A listing can have at most ${MAX_MEDIA_PER_LISTING} photos and videos.`,
      );
    }

    const sig = this.cloudinary.buildSignature(input);
    return {
      cloudName: sig.cloudName,
      apiKey: sig.apiKey,
      timestamp: sig.timestamp,
      signature: sig.signature,
      folder: sig.folder,
      uploadPreset: sig.uploadPreset,
      eager: sig.eager,
      resourceType: sig.resourceType,
      uploadUrl: sig.uploadUrl,
    };
  }

  async register(userId: string, payload: RegisterMediaPayload): Promise<Media> {
    await this.assertOwnsListing(userId, payload.listingId);

    const existing = await this.repo.listForListing(payload.listingId);
    if (existing.length >= MAX_MEDIA_PER_LISTING) {
      throw new DomainException(
        'MEDIA_LIMIT_REACHED',
        `A listing can have at most ${MAX_MEDIA_PER_LISTING} photos and videos.`,
      );
    }

    const row = await this.repo.create({
      listingId: payload.listingId,
      type: payload.type,
      url: payload.url,
      thumbnailUrl: payload.thumbnailUrl,
      storageKey: payload.storageKey,
      width: payload.width ?? null,
      height: payload.height ?? null,
      durationSeconds: payload.durationSeconds ?? null,
      order: existing.length,
    });
    return toMedia(row);
  }

  async reorder(
    userId: string,
    listingId: string,
    orderedIds: string[],
  ): Promise<Media[]> {
    await this.assertOwnsListing(userId, listingId);

    const current = await this.repo.listForListing(listingId);
    const currentIds = new Set(current.map((m) => m.id));
    if (
      orderedIds.length !== current.length ||
      !orderedIds.every((id) => currentIds.has(id))
    ) {
      throw new DomainException(
        'MEDIA_REORDER_MISMATCH',
        'The reorder request does not match this listing\'s current media.',
      );
    }

    await this.repo.reorder(listingId, orderedIds);
    const updated = await this.repo.listForListing(listingId);
    return updated.map(toMedia);
  }

  async remove(userId: string, mediaId: string): Promise<{ id: string }> {
    const media = await this.repo.findById(mediaId);
    if (!media) throw new NotFoundException('Media not found.');
    if (media.listing.ownerId !== userId) {
      throw new ForbiddenException('This media belongs to another account.');
    }

    await this.repo.delete(mediaId);
    await this.cloudinary.destroy(
      media.storageKey,
      media.type === MediaType.VIDEO ? 'video' : 'image',
    );
    return { id: mediaId };
  }

  private async assertOwnsListing(
    userId: string,
    listingId: string,
  ): Promise<void> {
    const listing = await this.repo.listingOwner(listingId);
    if (!listing) throw new NotFoundException('Listing not found.');
    if (listing.ownerId !== userId) {
      throw new ForbiddenException('This listing belongs to another account.');
    }
  }
}
