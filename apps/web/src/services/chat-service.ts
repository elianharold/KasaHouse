import {
  API_ROUTES,
  type ChatMessage,
  type ChatThreadDetail,
  type ChatThreadSummary,
} from '@kasahouse/shared-types';
import { api } from '@/lib/api/client';

export const chatService = {
  async listThreads(): Promise<ChatThreadSummary[]> {
    const { data } = await api.get<ChatThreadSummary[]>(API_ROUTES.chat.threads);
    return data;
  },
  async startThread(listingId: string): Promise<ChatThreadDetail> {
    const { data } = await api.post<ChatThreadDetail>(API_ROUTES.chat.start, { listingId });
    return data;
  },
  async getThread(id: string, after?: string): Promise<ChatThreadDetail> {
    const { data } = await api.get<ChatThreadDetail>(API_ROUTES.chat.thread(id), {
      params: after ? { after } : undefined,
    });
    return data;
  },
  async sendMessage(id: string, content: string): Promise<ChatMessage> {
    const { data } = await api.post<ChatMessage>(API_ROUTES.chat.messages(id), { content });
    return data;
  },
  async markRead(id: string): Promise<void> {
    await api.post(API_ROUTES.chat.read(id));
  },
};
