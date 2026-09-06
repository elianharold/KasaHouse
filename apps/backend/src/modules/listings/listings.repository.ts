import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';

const withOwnerAndMedia = {
  owner: { select: { id: true, fullName: true, roles: true, createdAt: true } },
  media: { orderBy: { order: 'asc' } },
} satisfies Prisma.ListingInclude;

export type ListingWithRelations = Prisma.ListingGetPayload<{
  include: typeof withOwnerAndMedia;
}>;

@Injectable()
export class ListingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(
    data: Prisma.ListingCreateInput,
  ): Promise<ListingWithRelations> {
    return this.prisma.listing.create({ data, include: withOwnerAndMedia });
  }

  findById(id: string): Promise<ListingWithRelations | null> {
    return this.prisma.listing.findUnique({
      where: { id },
      include: withOwnerAndMedia,
    });
  }

  update(
    id: string,
    data: Prisma.ListingUpdateInput,
  ): Promise<ListingWithRelations> {
    return this.prisma.listing.update({
      where: { id },
      data,
      include: withOwnerAndMedia,
    });
  }

  delete(id: string): Promise<{ id: string }> {
    return this.prisma.listing.delete({ where: { id }, select: { id: true } });
  }

  async browse(
    where: Prisma.ListingWhereInput,
    orderBy: Prisma.ListingOrderByWithRelationInput,
    skip: number,
    take: number,
  ): Promise<[ListingWithRelations[], number]> {
    return this.prisma.$transaction([
      this.prisma.listing.findMany({
        where,
        orderBy,
        skip,
        take,
        include: withOwnerAndMedia,
      }),
      this.prisma.listing.count({ where }),
    ]);
  }

  async listForOwner(
    ownerId: string,
    skip: number,
    take: number,
  ): Promise<[ListingWithRelations[], number]> {
    const where: Prisma.ListingWhereInput = { ownerId };
    return this.prisma.$transaction([
      this.prisma.listing.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take,
        include: withOwnerAndMedia,
      }),
      this.prisma.listing.count({ where }),
    ]);
  }
}
