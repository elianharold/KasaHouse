import {
  ForbiddenException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  ChatMessage,
  ChatThreadDetail,
  ChatThreadSummary,
  ListMessagesQuery,
} from '@kasahouse/shared-types';
import { DomainException } from '../../common/errors/domain.exception';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ChatRepository, type ThreadWithRelations } from './chat.repository';
import { toChatMessage, toThreadSummary } from './chat.mapper';
import {
  OFF_PLATFORM_EXPLAINER,
  scanForOffPlatform,
} from './message-scanner';

const PAGE = 30;

@Injectable()
export class ChatService {
  constructor(
    private readonly repo: ChatRepository,
    private readonly prisma: PrismaService,
  ) {}

  async startThread(userId: string, listingId: string): Promise<ChatThreadDetail> {
    const listing = await this.repo.listingForChat(listingId);
    if (!listing) throw new NotFoundException('This listing is no longer available.');
    if (listing.ownerId === userId) {
      throw new DomainException(
        'CANNOT_MESSAGE_OWN_LISTING',
        'This is your own listing.',
      );
    }
    if (listing.status !== 'PUBLISHED') {
      throw new DomainException('LISTING_UNAVAILABLE', 'This listing is not open for enquiries.');
    }

    await this.assertKycVerified(userId);

    const existing = await this.repo.findThreadByListingAndTenant(listingId, userId);
    const thread =
      existing ??
      (await this.repo.createThread({
        listingId,
        landlordId: listing.ownerId,
        tenantId: userId,
      }));

    return this.buildDetail(thread, userId, {});
  }

  async listThreads(userId: string): Promise<ChatThreadSummary[]> {
    const threads = await this.repo.listThreadsForUser(userId);
    return Promise.all(
      threads.map(async (t) => {
        const [unread, last] = await Promise.all([
          this.repo.countUnread(t.id, userId),
          this.repo.listMessages(t.id, { take: 1 }),
        ]);
        return toThreadSummary(t, userId, unread, last[0]?.content ?? null);
      }),
    );
  }

  async getThread(
    userId: string,
    threadId: string,
    query: ListMessagesQuery,
  ): Promise<ChatThreadDetail> {
    const thread = await this.repo.findThreadById(threadId);
    if (!thread) throw new NotFoundException('Conversation not found.');
    this.assertParticipant(thread, userId);
    return this.buildDetail(thread, userId, query);
  }

  async sendMessage(
    userId: string,
    threadId: string,
    content: string,
  ): Promise<ChatMessage> {
    const thread = await this.repo.findThreadById(threadId);
    if (!thread) throw new NotFoundException('Conversation not found.');
    this.assertParticipant(thread, userId);

    // The tenant/buyer side must stay verified to keep messaging.
    if (thread.tenantId === userId) await this.assertKycVerified(userId);

    const trimmed = content.trim();
    if (!trimmed) {
      throw new DomainException('EMPTY_MESSAGE', 'Type a message first.');
    }

    const scan = scanForOffPlatform(trimmed);
    if (scan.blocked) {
      throw new DomainException(
        'MESSAGE_BLOCKED',
        OFF_PLATFORM_EXPLAINER,
        HttpStatus.UNPROCESSABLE_ENTITY,
        { matched: scan.matched },
      );
    }

    const message = await this.repo.createMessage(threadId, userId, trimmed);
    return toChatMessage(message, userId);
  }

  async markRead(userId: string, threadId: string): Promise<{ updated: number }> {
    const thread = await this.repo.findThreadById(threadId);
    if (!thread) throw new NotFoundException('Conversation not found.');
    this.assertParticipant(thread, userId);
    const result = await this.repo.markRead(threadId, userId);
    return { updated: result.count };
  }

  // ─────────────────────────── internals ───────────────────────────

  private async buildDetail(
    thread: ThreadWithRelations,
    userId: string,
    query: ListMessagesQuery,
  ): Promise<ChatThreadDetail> {
    const after = query.after ? new Date(query.after) : undefined;
    const rows = await this.repo.listMessages(thread.id, { take: PAGE + 1, after });

    let messages = rows;
    let hasMore = false;
    if (!after && rows.length > PAGE) {
      hasMore = true;
      messages = rows.slice(0, PAGE);
    }
    // Newest-last for the UI.
    const ordered = after ? messages : [...messages].reverse();
    const unread = await this.repo.countUnread(thread.id, userId);

    return {
      ...toThreadSummary(thread, userId, unread, ordered.at(-1)?.content ?? null),
      messages: ordered.map((m) => toChatMessage(m, userId)),
      hasMoreMessages: hasMore,
    };
  }

  private assertParticipant(thread: ThreadWithRelations, userId: string): void {
    if (thread.landlordId !== userId && thread.tenantId !== userId) {
      throw new ForbiddenException('This conversation is not yours.');
    }
  }

  private async assertKycVerified(userId: string): Promise<void> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { kycStatus: true },
    });
    if (user.kycStatus !== 'VERIFIED') {
      throw new DomainException(
        'KYC_REQUIRED',
        'Verify your Ghana Card to message owners. It keeps everyone on KasaHouse safe.',
        HttpStatus.FORBIDDEN,
        { kycStatus: user.kycStatus },
      );
    }
  }
}
