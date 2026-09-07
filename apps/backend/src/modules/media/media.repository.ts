import { Injectable } from '@nestjs/common';
import type { Media, Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class MediaRepository {
  constructor(private readonly prisma: PrismaService) {}

  listingOwner(listingId: string): Promise<{ ownerId: string } | null> {
    return this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { ownerId: true },
    });
  }

  countForListing(listingId: string): Promise<number> {
    return this.prisma.media.count({ where: { listingId } });
  }

  listByOwner(ownerId: string): Promise<Array<Pick<Media, 'storageKey' | 'type'>>> {
    return this.prisma.media.findMany({
      where: { listing: { ownerId } },
      select: { storageKey: true, type: true },
    });
  }

  create(data: Prisma.MediaUncheckedCreateInput): Promise<Media> {
    return this.prisma.media.create({ data });
  }

  findById(id: string) {
    return this.prisma.media.findUnique({
      where: { id },
      include: { listing: { select: { ownerId: true } } },
    });
  }

  listForListing(listingId: string): Promise<Media[]> {
    return this.prisma.media.findMany({
      where: { listingId },
      orderBy: { order: 'asc' },
    });
  }

  delete(id: string): Promise<Media> {
    return this.prisma.media.delete({ where: { id } });
  }

  reorder(listingId: string, orderedIds: string[]): Promise<unknown> {
    return this.prisma.$transaction(
      orderedIds.map((id, index) =>
        this.prisma.media.updateMany({
          where: { id, listingId },
          data: { order: index },
        }),
      ),
    );
  }
}
