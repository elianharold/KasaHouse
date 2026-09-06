import {
  API_ROUTES,
  type BrowseListingsQuery,
  type ChangeListingStatusPayload,
  type Listing,
  type ListingSummary,
  type PaginatedResult,
  type UpsertListingPayload,
} from '@kasahouse/shared-types';
import { api } from '../api/client';

const cleanParams = (query: object): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(query).filter(
      ([, v]) => v !== undefined && v !== null && v !== '',
    ),
  );

export const listingsService = {
  async browse(
    query: BrowseListingsQuery,
  ): Promise<PaginatedResult<ListingSummary>> {
    const { data } = await api.get<PaginatedResult<ListingSummary>>(
      API_ROUTES.listings.browse,
      { params: cleanParams(query) },
    );
    return data;
  },

  async mine(query: {
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResult<ListingSummary>> {
    const { data } = await api.get<PaginatedResult<ListingSummary>>(
      API_ROUTES.listings.mine,
      { params: cleanParams(query) },
    );
    return data;
  },

  async getById(id: string): Promise<Listing> {
    const { data } = await api.get<Listing>(API_ROUTES.listings.byId(id));
    return data;
  },

  async create(payload: UpsertListingPayload): Promise<Listing> {
    const { data } = await api.post<Listing>(API_ROUTES.listings.create, payload);
    return data;
  },

  async update(id: string, payload: UpsertListingPayload): Promise<Listing> {
    const { data } = await api.put<Listing>(
      API_ROUTES.listings.update(id),
      payload,
    );
    return data;
  },

  async changeStatus(
    id: string,
    payload: ChangeListingStatusPayload,
  ): Promise<Listing> {
    const { data } = await api.patch<Listing>(
      API_ROUTES.listings.changeStatus(id),
      payload,
    );
    return data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(API_ROUTES.listings.remove(id));
  },
};
