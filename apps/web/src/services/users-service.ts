import {
  API_ROUTES,
  type PublicUserProfile,
  type UpdateProfilePayload,
  type User,
} from '@kasahouse/shared-types';
import { api } from '@/lib/api/client';

export const usersService = {
  async getMe(): Promise<User> {
    const { data } = await api.get<User>(API_ROUTES.users.me);
    return data;
  },
  async updateMe(payload: UpdateProfilePayload): Promise<User> {
    const { data } = await api.patch<User>(API_ROUTES.users.updateMe, payload);
    return data;
  },
  async getPublicProfile(userId: string): Promise<PublicUserProfile> {
    const { data } = await api.get<PublicUserProfile>(API_ROUTES.users.publicProfile(userId));
    return data;
  },

  async deleteMe(): Promise<void> {
    await api.delete(API_ROUTES.users.deleteMe);
  },
};
