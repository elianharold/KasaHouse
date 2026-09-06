'use client';

import { useEffect, useRef } from 'react';
import type { UseInfiniteQueryResult } from '@tanstack/react-query';
import type { ListingSummary, PaginatedResult } from '@kasahouse/shared-types';
import { Spinner, EmptyState, ErrorState } from '@/components/ui/States';
import { ListingCard } from './ListingCard';

type InfiniteListings = UseInfiniteQueryResult<
  { pages: PaginatedResult<ListingSummary>[] },
  unknown
>;

export function ListingGrid({
  query,
  showStatus = false,
  emptyTitle,
  emptyMessage,
  emptyAction,
}: {
  query: InfiniteListings;
  showStatus?: boolean;
  emptyTitle: string;
  emptyMessage: string;
  emptyAction?: React.ReactNode;
}) {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = query;

  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasNextPage) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) void fetchNextPage();
      },
      { rootMargin: '600px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) return <Spinner label="Loading listings…" />;
  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;

  const items = data?.pages.flatMap((p) => p.items) ?? [];
  if (items.length === 0) {
    return <EmptyState title={emptyTitle} message={emptyMessage} action={emptyAction} />;
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((listing, i) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            showStatus={showStatus}
            priority={i < 3}
          />
        ))}
      </div>
      <div ref={sentinel} />
      {isFetchingNextPage ? <Spinner /> : null}
    </>
  );
}
