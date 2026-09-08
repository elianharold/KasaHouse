'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ChatThreadDetail } from '@kasahouse/shared-types';
import { chatService } from '@/services/chat-service';
import { useAuthStore } from '@/store/auth-store';
import { useSession } from './use-auth';

/**
 * Every chat query key is namespaced by the signed-in user id, so two accounts
 * open in the same browser never read each other's cached conversations.
 */
const uid = (): string => useAuthStore.getState().user?.id ?? 'anon';
const threadsKey = () => ['chat', uid(), 'threads'] as const;
const threadKey = (id: string) => ['chat', uid(), 'thread', id] as const;

export function useThreads() {
  const { isAuthenticated, user } = useSession();
  return useQuery({
    queryKey: ['chat', user?.id ?? 'anon', 'threads'],
    queryFn: () => chatService.listThreads(),
    enabled: isAuthenticated,
    // keep polling while the KasaHouse tab is in the background, so the unread
    // tag lights up even when a message arrives while the user is elsewhere.
    refetchInterval: 15_000,
    refetchIntervalInBackground: true,
  });
}

export function useUnreadCount() {
  const { data } = useThreads();
  return data?.reduce((sum, t) => sum + t.unreadCount, 0) ?? 0;
}

export function useThread(id: string | undefined) {
  const qc = useQueryClient();
  const { user } = useSession();
  return useQuery({
    queryKey: ['chat', user?.id ?? 'anon', 'thread', id ?? 'none'],
    enabled: !!id && !!user,
    refetchInterval: 5_000,
    queryFn: async () => {
      const detail = await chatService.getThread(id as string);
      if (detail.unreadCount > 0) {
        void chatService.markRead(id as string).then(() => {
          qc.invalidateQueries({ queryKey: threadsKey() });
        });
      }
      return detail;
    },
  });
}

export function useStartThread() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (listingId: string) => chatService.startThread(listingId),
    onSuccess: (detail: ChatThreadDetail) => {
      qc.setQueryData(threadKey(detail.id), detail);
      qc.invalidateQueries({ queryKey: threadsKey() });
    },
  });
}

export function useSendMessage(threadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => chatService.sendMessage(threadId, content),
    onSuccess: (message) => {
      qc.setQueryData<ChatThreadDetail>(threadKey(threadId), (prev) =>
        prev
          ? { ...prev, messages: [...prev.messages, message] }
          : prev,
      );
      qc.invalidateQueries({ queryKey: threadsKey() });
    },
  });
}
