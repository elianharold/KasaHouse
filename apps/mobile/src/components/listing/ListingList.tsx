import { useCallback } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, View } from 'react-native';
import type { UseInfiniteQueryResult } from '@tanstack/react-query';
import type { ListingSummary, PaginatedResult } from '@kasahouse/shared-types';
import { colors } from '../../theme/tokens';
import { EmptyState, ErrorState, LoadingState } from '../ui/StateViews';
import { ListingCard } from './ListingCard';

type InfiniteListings = UseInfiniteQueryResult<
  { pages: PaginatedResult<ListingSummary>[] },
  unknown
>;

export function ListingList({
  query,
  showStatus = false,
  emptyTitle,
  emptyMessage,
  emptyAction,
  ListHeaderComponent,
}: {
  query: InfiniteListings;
  showStatus?: boolean;
  emptyTitle: string;
  emptyMessage: string;
  emptyAction?: React.ReactNode;
  ListHeaderComponent?: React.ReactElement;
}) {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = query;

  const items = data?.pages.flatMap((p) => p.items) ?? [];

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) return <LoadingState label="Loading listings…" />;
  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <ListingCard listing={item} showStatus={showStatus} />
      )}
      ListHeaderComponent={ListHeaderComponent}
      contentContainerStyle={{ padding: 16, flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching && !isFetchingNextPage}
          onRefresh={() => void refetch()}
          tintColor={colors.brand}
        />
      }
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      ListEmptyComponent={
        <EmptyState
          title={emptyTitle}
          message={emptyMessage}
          action={emptyAction}
        />
      }
      ListFooterComponent={
        isFetchingNextPage ? (
          <View className="py-6">
            <ActivityIndicator color={colors.brand} />
          </View>
        ) : null
      }
    />
  );
}
