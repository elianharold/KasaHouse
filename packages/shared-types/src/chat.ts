import type { ISODateString, PaginationQuery } from './common';
import type { ListingPurpose } from './listing';
import type { PublicUserProfile } from './user';

export interface ChatMessage {
  id: string;
  threadId: string;
  senderId: string;
  /** Display name of whoever sent it — resolved server-side, authoritative. */
  senderName: string | null;
  content: string;
  sentAt: ISODateString;
  readAt: ISODateString | null;
  /** True if the viewer sent this message. */
  mine: boolean;
}

export interface ChatThreadSummary {
  id: string;
  listingId: string;
  listingTitle: string;
  listingPurpose: ListingPurpose;
  listingCoverUrl: string | null;
  /** The person on the other side of this thread. */
  counterparty: PublicUserProfile;
  /** "landlord" if you own the listing, "tenant" otherwise. */
  yourRole: 'landlord' | 'tenant';
  lastMessage: string | null;
  lastMessageAt: ISODateString;
  unreadCount: number;
}

export interface ChatThreadDetail extends ChatThreadSummary {
  messages: ChatMessage[];
  hasMoreMessages: boolean;
}

export interface StartChatPayload {
  listingId: string;
}

export interface SendMessagePayload {
  content: string;
}

export type ListMessagesQuery = PaginationQuery & {
  /** Return messages sent after this ISO timestamp (for polling). */
  after?: ISODateString;
};

/**
 * Returned as the error body (HTTP 422) when a message is soft-blocked for
 * trying to move the deal off-platform.
 */
export interface MessageBlockedError {
  error: 'MESSAGE_BLOCKED';
  message: string;
  /** The categories that tripped the filter, e.g. ["phone_number", "keyword:momo"]. */
  matched: string[];
}
