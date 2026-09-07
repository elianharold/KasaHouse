import type { Message as PrismaMessage } from '@prisma/client';
import type {
  ChatMessage,
  ChatThreadSummary,
  ListingPurpose,
} from '@kasahouse/shared-types';
import { toPublicUserProfile } from '../users/user.mapper';
import type { ThreadWithRelations } from './chat.repository';

export const toChatMessage = (row: PrismaMessage, viewerId: string): ChatMessage => ({
  id: row.id,
  threadId: row.threadId,
  senderId: row.senderId,
  content: row.content,
  sentAt: row.sentAt.toISOString(),
  readAt: row.readAt ? row.readAt.toISOString() : null,
  mine: row.senderId === viewerId,
});

export const toThreadSummary = (
  thread: ThreadWithRelations,
  viewerId: string,
  unreadCount: number,
  lastMessage: string | null,
): ChatThreadSummary => {
  const isLandlord = thread.landlordId === viewerId;
  const counterparty = isLandlord ? thread.tenant : thread.landlord;
  return {
    id: thread.id,
    listingId: thread.listing.id,
    listingTitle: thread.listing.title,
    listingPurpose: thread.listing.purpose as ListingPurpose,
    listingCoverUrl: thread.listing.media[0]?.thumbnailUrl ?? null,
    counterparty: toPublicUserProfile(counterparty),
    yourRole: isLandlord ? 'landlord' : 'tenant',
    lastMessage,
    lastMessageAt: thread.lastMessageAt.toISOString(),
    unreadCount,
  };
};
