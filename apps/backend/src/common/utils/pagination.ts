import type { PaginatedResult } from '@kasahouse/shared-types';

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 50;

export interface NormalizedPage {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
}

export const normalizePage = (
  page?: number,
  pageSize?: number,
): NormalizedPage => {
  const safePage = Math.max(1, Math.floor(page ?? 1));
  const safeSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Math.floor(pageSize ?? DEFAULT_PAGE_SIZE)),
  );
  return {
    page: safePage,
    pageSize: safeSize,
    skip: (safePage - 1) * safeSize,
    take: safeSize,
  };
};

export const buildPaginatedResult = <T>(
  items: T[],
  total: number,
  page: NormalizedPage,
): PaginatedResult<T> => {
  const totalPages = Math.max(1, Math.ceil(total / page.pageSize));
  return {
    items,
    page: page.page,
    pageSize: page.pageSize,
    total,
    totalPages,
    hasNextPage: page.page < totalPages,
  };
};
