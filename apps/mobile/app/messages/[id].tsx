import { useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import type { ChatMessage } from '@kasahouse/shared-types';
import { Button } from '../../src/components/ui/Button';
import { ErrorState, LoadingState } from '../../src/components/ui/StateViews';
import { colors } from '../../src/theme/tokens';
import { dayLabel, messageTime, sameDay } from '../../src/lib/format';
import { useSendMessage, useThread } from '../../src/hooks/use-chat';
import { toApiError } from '../../src/lib/api-error';

function initials(name: string | null): string {
  if (!name?.trim()) return '·';
  const p = name.trim().split(/\s+/);
  return (p[0]![0]! + (p[1]?.[0] ?? '')).toUpperCase();
}

export default function ThreadScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const thread = useThread(id);
  const send = useSendMessage(id ?? '');
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const [text, setText] = useState('');
  const [blocked, setBlocked] = useState<string | null>(null);

  const detail = thread.data;
  const counterpartyName = detail?.counterparty.fullName ?? 'KasaHouse member';

  const submit = async () => {
    const content = text.trim();
    if (!content) return;
    setBlocked(null);
    try {
      await send.mutateAsync(content);
      setText('');
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    } catch (e) {
      setBlocked(toApiError(e).message);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['bottom']}>
      <Stack.Screen options={{ headerShown: false }} />

      {thread.isLoading ? (
        <LoadingState label="Opening conversation…" />
      ) : thread.isError || !detail ? (
        <ErrorState error={thread.error} onRetry={() => void thread.refetch()} />
      ) : (
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* header — avatar + name top-left, listing under it */}
          <View className="flex-row items-center gap-3 border-b border-[#E2E8E4] px-4 py-3">
            <Pressable onPress={() => router.back()} className="pr-1">
              <Text className="text-2xl text-brand-dark">‹</Text>
            </Pressable>
            <View className="h-9 w-9 items-center justify-center rounded-full bg-brand">
              <Text className="text-xs font-bold text-white">
                {initials(detail.counterparty.fullName)}
              </Text>
            </View>
            <Pressable
              className="flex-1"
              onPress={() => router.push(`/listing/${detail.listingId}`)}
            >
              <Text className="text-sm font-semibold text-ink" numberOfLines={1}>
                {counterpartyName}
              </Text>
              <Text className="text-xs text-ink-muted" numberOfLines={1}>
                {detail.listingTitle} · view listing
              </Text>
            </Pressable>
          </View>

          <FlatList
            ref={listRef}
            data={detail.messages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={{ padding: 12 }}
            onContentSizeChange={() =>
              listRef.current?.scrollToEnd({ animated: false })
            }
            ListEmptyComponent={
              <Text className="py-10 text-center text-sm text-ink-muted">
                Say hello — ask about viewing times, requirements, or availability.
              </Text>
            }
            renderItem={({ item, index }) => {
              const prev = detail.messages[index - 1];
              const showDay = !prev || !sameDay(prev.sentAt, item.sentAt);
              const newSpeaker = !prev || prev.mine !== item.mine || showDay;
              return (
                <View>
                  {showDay ? (
                    <View className="my-3 items-center">
                      <Text className="rounded-full bg-surface-sunken px-3 py-0.5 text-[11px] font-medium text-ink-muted">
                        {dayLabel(item.sentAt)}
                      </Text>
                    </View>
                  ) : null}

                  <View className={item.mine ? 'items-end' : 'items-start'}>
                    {newSpeaker ? (
                      <Text className="mb-0.5 px-1 text-[11px] font-medium text-ink-faint">
                        {item.mine ? 'You' : counterpartyName}
                      </Text>
                    ) : null}
                    <View
                      className={`max-w-[80%] rounded-2xl px-3 py-2 ${
                        item.mine
                          ? 'rounded-br-sm bg-brand'
                          : 'rounded-bl-sm border border-[#E2E8E4] bg-surface'
                      }`}
                    >
                      <Text
                        className={`text-sm ${item.mine ? 'text-white' : 'text-ink'}`}
                      >
                        {item.content}
                      </Text>
                    </View>
                    <Text className="mt-0.5 px-1 text-[10px] text-ink-faint">
                      {messageTime(item.sentAt)}
                      {item.mine
                        ? item.readAt
                          ? '  ✓✓ Read'
                          : '  ✓ Sent'
                        : ''}
                    </Text>
                  </View>
                </View>
              );
            }}
          />

          {blocked ? (
            <Text className="mx-3 mb-1 rounded-xl bg-[#FDF1DC] p-3 text-xs text-[#8A5B00]">
              {blocked}
            </Text>
          ) : null}

          <View className="flex-row items-center gap-2 border-t border-[#E2E8E4] p-2">
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Write a message…"
              placeholderTextColor={colors.inkFaint}
              maxLength={2000}
              className="flex-1 rounded-xl border border-[#E2E8E4] bg-surface px-3.5 py-2.5 text-sm text-ink"
            />
            <Button
              label="Send"
              fullWidth={false}
              loading={send.isPending}
              disabled={!text.trim()}
              onPress={submit}
            />
          </View>
          <Text className="pb-1 text-center text-[10px] text-ink-faint">
            Messages can&apos;t be edited or deleted. Keep it on KasaHouse.
          </Text>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}
