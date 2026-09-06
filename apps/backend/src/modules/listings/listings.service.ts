import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  ListingStatus,
  toPesewas,
  type BrowseListingsQuery,
  type Listing,
  type ListingSummary,
  type PaginatedResult,
  type UpsertListingPayload,
} from '@kasahouse/shared-types';
import { DomainException } from '../../common/errors/domain.exception';
import {
  buildPaginatedResult,
  normalizePage,
} from '../../common/utils/pagination';
import { toListing, toListingSummary } from './listing.mapper';
import { ListingsRepository } from './listings.repository';

@Injectable()
export class ListingsService {
  constructor(private readonly repo: ListingsRepository) {}

  async browse(
    query: BrowseListingsQuery,
  ): Promise<PaginatedResult<ListingSummary>> {
    const page = normalizePage(query.page, query.pageSize);

    const where: Prisma.ListingWhereInput = {
      status: ListingStatus.PUBLISHED,
      ...(query.purpose ? { purpose: query.purpose } : {}),
      ...(query.propertyType ? { propertyType: query.propertyType } : {}),
      ...(query.city
        ? { city: { equals: query.city, mode: 'insensitive' } }
        : {}),
      ...(query.area
        ? { area: { contains: query.area, mode: 'insensitive' } }
        : {}),
      ...(query.minBedrooms ? { bedrooms: { gte: query.minBedrooms } } : {}),
      ...(query.minPrice || query.maxPrice
        ? {
            price: {
              ...(query.minPrice ? { gte: query.minPrice } : {}),
              ...(query.maxPrice ? { lte: query.maxPrice } : {}),
            },
          }
        : {}),
      ...(query.q
        ? {
            OR: [
              { title: { contains: query.q, mode: 'insensitive' } },
              { description: { contains: query.q, mode: 'insensitive' } },
              { area: { contains: query.q, mode: 'insensitive' } },
              { city: { contains: query.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const orderBy: Prisma.ListingOrderByWithRelationInput =
      query.sort === 'price_asc'
        ? { price: 'asc' }
        : query.sort === 'price_desc'
          ? { price: 'desc' }
          : { publishedAt: 'desc' };

    const [rows, total] = await this.repo.browse(
      where,
      orderBy,
      page.skip,
      page.take,
    );
    return buildPaginatedResult(rows.map(toListingSummary), total, page);
  }

  async getById(id: string): Promise<Listing> {
    const row = await this.repo.findById(id);
    if (!row) throw new NotFoundException('This listing is no longer available.');
    return toListing(row);
  }

  /** Owner view — includes drafts/unlisted, forbids other owners. */
  async getOwnedById(id: string, ownerId: string): Promise<Listing> {
    const row = await this.repo.findById(id);
    if (!row) throw new NotFoundException('Listing not found.');
    if (row.ownerId !== ownerId) {
      throw new ForbiddenException('This listing belongs to another account.');
    }
    return toListing(row);
  }

  async listMine(
    ownerId: string,
    query: { page?: number; pageSize?: number },
  ): Promise<PaginatedResult<ListingSummary>> {
    const page = normalizePage(query.page, query.pageSize);
    const [rows, total] = await this.repo.listForOwner(
      ownerId,
      page.skip,
      page.take,
    );
    return buildPaginatedResult(rows.map(toListingSummary), total, page);
  }

  async create(ownerId: string, payload: UpsertListingPayload): Promise<Listing> {
    this.assertPurposeConsistency(payload);
    const row = await this.repo.create({
      owner: { connect: { id: ownerId } },
      purpose: payload.purpose,
      propertyType: payload.propertyType,
      title: payload.title.trim(),
      description: payload.description.trim(),
      price: toPesewas(payload.priceCedis),
      rentPeriod: payload.purpose === 'RENT' ? (payload.rentPeriod ?? 'MONTH') : null,
      advanceMonths: payload.purpose === 'RENT' ? (payload.advanceMonths ?? null) : null,
      bedrooms: payload.bedrooms ?? null,
      bathrooms: payload.bathrooms ?? null,
      region: payload.location.region.trim(),
      city: payload.location.city.trim(),
      area: payload.location.area.trim(),
      landmark: payload.location.landmark?.trim() || null,
      latitude: payload.location.latitude ?? null,
      longitude: payload.location.longitude ?? null,
      requirements: payload.requirements.map((r) => r.trim()).filter(Boolean),
      addOns: payload.addOns as unknown as Prisma.InputJsonValue,
      status: ListingStatus.DRAFT,
    });
    return toListing(row);
  }

  async update(
    id: string,
    ownerId: string,
    payload: UpsertListingPayload,
  ): Promise<Listing> {
    await this.getOwnedById(id, ownerId);
    this.assertPurposeConsistency(payload);
    const row = await this.repo.update(id, {
      purpose: payload.purpose,
      propertyType: payload.propertyType,
      title: payload.title.trim(),
      description: payload.description.trim(),
      price: toPesewas(payload.priceCedis),
      rentPeriod: payload.purpose === 'RENT' ? (payload.rentPeriod ?? 'MONTH') : null,
      advanceMonths: payload.purpose === 'RENT' ? (payload.advanceMonths ?? null) : null,
      bedrooms: payload.bedrooms ?? null,
      bathrooms: payload.bathrooms ?? null,
      region: payload.location.region.trim(),
      city: payload.location.city.trim(),
      area: payload.location.area.trim(),
      landmark: payload.location.landmark?.trim() || null,
      latitude: payload.location.latitude ?? null,
      longitude: payload.location.longitude ?? null,
      requirements: payload.requirements.map((r) => r.trim()).filter(Boolean),
      addOns: payload.addOns as unknown as Prisma.InputJsonValue,
    });
    return toListing(row);
  }

  async changeStatus(
    id: string,
    ownerId: string,
    status: 'PUBLISHED' | 'UNLISTED' | 'DRAFT',
  ): Promise<Listing> {
    const listing = await this.getOwnedById(id, ownerId);

    if (status === 'PUBLISHED') {
      if (listing.media.length === 0) {
        throw new DomainException(
          'LISTING_NEEDS_MEDIA',
          'Add at least one photo before publishing.',
        );
      }
      if (listing.status === 'TAKEN') {
        throw new DomainException(
          'LISTING_TAKEN',
          'This listing is marked as taken and cannot be re-published from here.',
        );
      }
    }

    const row = await this.repo.update(id, {
      status,
      publishedAt:
        status === 'PUBLISHED' && !listing.publishedAt ? new Date() : undefined,
    });
    return toListing(row);
  }

  async remove(id: string, ownerId: string): Promise<{ id: string }> {
    await this.getOwnedById(id, ownerId);
    return this.repo.delete(id);
  }

  private assertPurposeConsistency(payload: UpsertListingPayload): void {
    if (payload.purpose === 'RENT' && payload.propertyType === 'LAND') {
      throw new DomainException(
        'INVALID_LISTING',
        'Land is listed for sale, not for rent.',
      );
    }
  }
}
