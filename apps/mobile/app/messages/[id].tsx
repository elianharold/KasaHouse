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
import { ErrorState, LoadingState } from '../../src/components/ui/StateViews';
import { VerifiedTick } from '../../src/components/ui/Badge';
import { colors } from '../../src/theme/tokens';
import { dayLabel, messageTime, sameDay } from '../../src/lib/format';
import { useSendMessage, useThread } from '../../src/hooks/use-chat';
import { toApiError } from '../../src/lib/api-error';

const GAP_MS = 15 * 60 * 1000;

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
  const messages = detail?.messages ?? [];

  let lastMineIdx = -1;
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i]!.mine) {
      lastMineIdx = i;
      break;
    }
  }

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
    <SafeAreaView className="flex-1 bg-surface-sunken" edges={['bottom']}>
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
          <View className="flex-row items-center gap-3 border-b border-[#E2E8E4] bg-surface px-3 py-2.5">
            <Pressable onPress={() => router.back()} className="pr-1">
              <Text className="text-2xl text-brand-dark">‹</Text>
            </Pressable>
            <View className="h-9 w-9 items-center justify-center rounded-xl bg-brand">
              <Text className="text-xs font-bold text-white">
                {initials(detail.counterparty.fullName)}
              </Text>
            </View>
            <Pressable
              className="flex-1"
              onPress={() => router.push(`/listing/${detail.listingId}`)}
            >
              <View className="flex-row items-center gap-1.5">
                <Text className="text-sm font-semibold text-ink" numberOfLines={1}>
                  {counterpartyName}
                </Text>
                <VerifiedTick verified={detail.counterparty.verified} showUnverified />
              </View>
              <Text className="text-xs text-ink-muted" numberOfLines={1}>
                {detail.listingTitle} · view listing
              </Text>
            </Pressable>
          </View>

          <FlatList
            ref={listRef}
            data={messages}
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
              const prev = messages[index - 1];
              const next = messages[index + 1];
              const gap =
                !prev ||
                !sameDay(prev.sentAt, item.sentAt) ||
                new Date(item.sentAt).getTime() -
                  new Date(prev.sentAt).getTime() >
                  GAP_MS;
              const startsRun = gap || !prev || prev.mine !== item.mine;
              const endsRun = !next || next.mine !== item.mine;
              const now = new Date().toISOString();

              return (
                <View>
                  {gap ? (
                    <View className="my-4 flex-row items-center gap-3">
                      <View className="h-px flex-1 bg-[#E2E8E4]" />
                      <Text className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
                        {sameDay(item.sentAt, now)
                          ? messageTime(item.sentAt)
                          : `${dayLabel(item.sentAt)} · ${messageTime(item.sentAt)}`}
                      </Text>
                      <View className="h-px flex-1 bg-[#E2E8E4]" />
                    </View>
                  ) : null}

                  <View
                    className={`flex-row items-end gap-2 ${
                      item.mine ? 'justify-end' : 'justify-start'
                    } ${startsRun ? 'mt-2.5' : 'mt-1'}`}
                  >
                    {!item.mine ? (
                      endsRun ? (
                        <View className="h-7 w-7 items-center justify-center rounded-lg bg-brand-light">
                          <Text className="text-[11px] font-bold text-brand-dark">
                            {initials(item.senderName)}
                          </Text>
                        </View>
                      ) : (
                        <View className="h-7 w-7" />
                      )
                    ) : null}

                    <View
                      className={`max-w-[78%] px-3.5 py-2 ${
                        item.mine
                          ? 'rounded-2xl rounded-br-md bg-brand'
                          : 'rounded-2xl rounded-bl-md border border-[#E2E8E4] bg-surface'
                      }`}
                    >
                      <Text
                        className={`text-sm leading-snug ${
                          item.mine ? 'text-white' : 'text-ink'
                        }`}
                      >
                        {item.content}
                      </Text>
                    </View>
                  </View>

                  {item.mine && index === lastMineIdx ? (
                    <View className="mt-1 flex-row justify-end pr-1">
                      {item.readAt ? (
                        <View className="rounded-full bg-brand-light px-2 py-0.5">
                          <Text className="text-[11px] font-semibold text-brand-dark">
                            👁 Seen {messageTime(item.readAt)}
                          </Text>
                        </View>
                      ) : (
                        <Text className="text-[11px] font-medium text-ink-faint">
                          ✓✓ Sent {messageTime(item.sentAt)}
                        </Text>
                      )}
                    </View>
                  ) : (
                    <View
                      className={`mt-0.5 flex-row px-1 ${
                        item.mine ? 'justify-end pr-1' : 'justify-start pl-9'
                      }`}
                    >
                      <Text className="text-[10px] text-ink-faint">
                        {messageTime(item.sentAt)}
                      </Text>
                    </View>
                  )}
                </View>
              );
            }}
          />

          {blocked ? (
            <Text className="mx-3 mb-1 rounded-xl bg-[#FDF1DC] p-3 text-xs text-[#8A5B00]">
              {blocked}
            </Text>
          ) : null}

          <View className="flex-row items-end gap-2 border-t border-[#E2E8E4] bg-surface p-2">
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Write a message…"
              placeholderTextColor={colors.inkFaint}
              maxLength={2000}
              multiline
              autoCorrect
              spellCheck
              autoCapitalize="sentences"
              className="max-h-24 flex-1 rounded-2xl border border-[#E2E8E4] bg-surface px-4 py-2.5 text-sm text-ink"
            />
            <Pressable
              onPress={submit}
              disabled={!text.trim() || send.isPending}
              className={`h-10 w-10 items-center justify-center rounded-xl ${
                !text.trim() || send.isPending ? 'bg-brand/40' : 'bg-brand'
              }`}
            >
              <Text className="text-lg text-white">↵</Text>
            </Pressable>
          </View>
          <Text className="bg-surface pb-1 text-center text-[10px] text-ink-faint">
            Messages can&apos;t be edited or deleted. Keep it on KasaHouse.
          </Text>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}
