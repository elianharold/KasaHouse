import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ChatThreadDetail } from '@kasahouse/shared-types';
import { chatService } from '../services/chat-service';
import { useSession } from './use-auth';

const threadsKey = ['chat', 'threads'] as const;
const threadKey = (id: string) => ['chat', 'thread', id] as const;

export function useThreads() {
  const { isAuthenticated } = useSession();
  return useQuery({
    queryKey: threadsKey,
    queryFn: () => chatService.listThreads(),
    enabled: isAuthenticated,
    refetchInterval: 15_000,
  });
}

export function useUnreadCount() {
  const { data } = useThreads();
  return data?.reduce((sum, t) => sum + t.unreadCount, 0) ?? 0;
}

export function useThread(id: string | undefined) {
  const qc = useQueryClient();
  return useQuery({
    queryKey: threadKey(id ?? 'none'),
    enabled: !!id,
    refetchInterval: 5_000,
    queryFn: async () => {
      const detail = await chatService.getThread(id as string);
      if (detail.unreadCount > 0) {
        void chatService.markRead(id as string).then(() => {
          qc.invalidateQueries({ queryKey: threadsKey });
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
      qc.invalidateQueries({ queryKey: threadsKey });
    },
  });
}

export function useSendMessage(threadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => chatService.sendMessage(threadId, content),
    onSuccess: (message) => {
      qc.setQueryData<ChatThreadDetail>(threadKey(threadId), (prev) =>
        prev ? { ...prev, messages: [...prev.messages, message] } : prev,
      );
      qc.invalidateQueries({ queryKey: threadsKey });
    },
  });
}
