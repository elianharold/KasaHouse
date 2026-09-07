import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';

const threadInclude = {
  listing: {
    select: {
      id: true,
      title: true,
      purpose: true,
      media: { orderBy: { order: 'asc' }, take: 1, select: { thumbnailUrl: true } },
    },
  },
  landlord: { select: { id: true, fullName: true, roles: true, createdAt: true } },
  tenant: { select: { id: true, fullName: true, roles: true, createdAt: true } },
} satisfies Prisma.ChatThreadInclude;

export type ThreadWithRelations = Prisma.ChatThreadGetPayload<{
  include: typeof threadInclude;
}>;

@Injectable()
export class ChatRepository {
  constructor(private readonly prisma: PrismaService) {}

  findThreadById(id: string): Promise<ThreadWithRelations | null> {
    return this.prisma.chatThread.findUnique({ where: { id }, include: threadInclude });
  }

  findThreadByListingAndTenant(
    listingId: string,
    tenantId: string,
  ): Promise<ThreadWithRelations | null> {
    return this.prisma.chatThread.findUnique({
      where: { listingId_tenantId: { listingId, tenantId } },
      include: threadInclude,
    });
  }

  createThread(data: {
    listingId: string;
    landlordId: string;
    tenantId: string;
  }): Promise<ThreadWithRelations> {
    return this.prisma.chatThread.create({ data, include: threadInclude });
  }

  listThreadsForUser(userId: string): Promise<ThreadWithRelations[]> {
    return this.prisma.chatThread.findMany({
      where: { OR: [{ landlordId: userId }, { tenantId: userId }] },
      include: threadInclude,
      orderBy: { lastMessageAt: 'desc' },
      take: 100,
    });
  }

  listMessages(
    threadId: string,
    opts: { take: number; before?: Date; after?: Date },
  ) {
    return this.prisma.message.findMany({
      where: {
        threadId,
        ...(opts.before ? { sentAt: { lt: opts.before } } : {}),
        ...(opts.after ? { sentAt: { gt: opts.after } } : {}),
      },
      orderBy: { sentAt: opts.after ? 'asc' : 'desc' },
      take: opts.take,
    });
  }

  countUnread(threadId: string, forUserId: string): Promise<number> {
    return this.prisma.message.count({
      where: { threadId, senderId: { not: forUserId }, readAt: null },
    });
  }

  async createMessage(threadId: string, senderId: string, content: string) {
    const [message] = await this.prisma.$transaction([
      this.prisma.message.create({ data: { threadId, senderId, content } }),
      this.prisma.chatThread.update({
        where: { id: threadId },
        data: { lastMessageAt: new Date() },
      }),
    ]);
    return message;
  }

  markRead(threadId: string, readerId: string): Promise<Prisma.BatchPayload> {
    return this.prisma.message.updateMany({
      where: { threadId, senderId: { not: readerId }, readAt: null },
      data: { readAt: new Date() },
    });
  }

  listingForChat(listingId: string) {
    return this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true, ownerId: true, status: true },
    });
  }
}
