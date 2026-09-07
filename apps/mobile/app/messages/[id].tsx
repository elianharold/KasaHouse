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
import {
  ErrorState,
  LoadingState,
} from '../../src/components/ui/StateViews';
import { colors } from '../../src/theme/tokens';
import { useSendMessage, useThread } from '../../src/hooks/use-chat';
import { toApiError } from '../../src/lib/api-error';

export default function ThreadScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const thread = useThread(id);
  const send = useSendMessage(id ?? '');
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const [text, setText] = useState('');
  const [blocked, setBlocked] = useState<string | null>(null);

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
      <Stack.Screen
        options={{ title: thread.data?.counterparty.fullName ?? 'Conversation' }}
      />
      {thread.isLoading ? (
        <LoadingState label="Opening conversation…" />
      ) : thread.isError || !thread.data ? (
        <ErrorState error={thread.error} onRetry={() => void thread.refetch()} />
      ) : (
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable
            onPress={() => router.push(`/listing/${thread.data!.listingId}`)}
            className="border-b border-[#E2E8E4] px-4 py-2"
          >
            <Text className="text-xs text-ink-muted" numberOfLines={1}>
              {thread.data.listingTitle} · view listing
            </Text>
          </Pressable>

          <FlatList
            ref={listRef}
            data={thread.data.messages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={{ padding: 12, gap: 8 }}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={
              <Text className="py-10 text-center text-sm text-ink-muted">
                Say hello — ask about viewing times, requirements, or availability.
              </Text>
            }
            renderItem={({ item }) => (
              <View className={item.mine ? 'items-end' : 'items-start'}>
                <View
                  className={`max-w-[80%] rounded-2xl px-3 py-2 ${
                    item.mine
                      ? 'rounded-br-sm bg-brand'
                      : 'rounded-bl-sm bg-surface-sunken'
                  }`}
                >
                  <Text
                    className={`text-sm ${item.mine ? 'text-white' : 'text-ink'}`}
                  >
                    {item.content}
                  </Text>
                </View>
              </View>
            )}
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
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}
