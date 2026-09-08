import { FlatList, Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Screen } from '../../src/components/ui/Screen';
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '../../src/components/ui/StateViews';
import { relativeTime } from '../../src/lib/format';
import { VerifiedTick } from '../../src/components/ui/Badge';
import { useThreads } from '../../src/hooks/use-chat';

export default function MessagesScreen() {
  const router = useRouter();
  const threads = useThreads();

  if (threads.isLoading) {
    return (
      <Screen>
        <LoadingState label="Loading messages…" />
      </Screen>
    );
  }
  if (threads.isError) {
    return (
      <Screen>
        <ErrorState error={threads.error} onRetry={() => void threads.refetch()} />
      </Screen>
    );
  }

  const list = threads.data ?? [];

  return (
    <View className="flex-1 bg-surface">
      <FlatList
        data={list}
        keyExtractor={(t) => t.id}
        contentContainerStyle={{ padding: 12, flexGrow: 1 }}
        ListEmptyComponent={
          <EmptyState
            title="No conversations yet"
            message="When you message an owner about a listing, it shows up here."
          />
        }
        ItemSeparatorComponent={() => <View className="h-px bg-[#EEF2F0]" />}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/messages/${item.id}`)}
            className="flex-row items-center gap-3 py-3 active:opacity-80"
          >
            <View className="h-12 w-12 overflow-hidden rounded-lg bg-surface-sunken">
              {item.listingCoverUrl ? (
                <Image
                  source={{ uri: item.listingCoverUrl }}
                  style={{ flex: 1 }}
                  contentFit="cover"
                />
              ) : null}
            </View>
            <View className="flex-1">
              <View className="flex-row items-center gap-1.5">
                <Text
                  className="flex-shrink text-sm font-semibold text-ink"
                  numberOfLines={1}
                >
                  {item.counterparty.fullName ?? 'KasaHouse member'}
                </Text>
                <VerifiedTick verified={item.counterparty.verified} showUnverified />
              </View>
              <Text className="text-xs text-ink-muted" numberOfLines={1}>
                {item.listingTitle}
              </Text>
              <Text className="text-xs text-ink-faint" numberOfLines={1}>
                {item.lastMessage ?? 'No messages yet'}
              </Text>
            </View>
            <View className="items-end gap-1">
              <Text className="text-[11px] text-ink-faint">
                {relativeTime(item.lastMessageAt)}
              </Text>
              {item.unreadCount > 0 ? (
                <View className="h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1">
                  <Text className="text-[11px] font-bold text-white">
                    {item.unreadCount}
                  </Text>
                </View>
              ) : null}
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}
