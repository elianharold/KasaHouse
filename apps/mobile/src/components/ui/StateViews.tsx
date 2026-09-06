import type { ReactNode } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { ApiError } from '../../lib/api-error';
import { colors } from '../../theme/tokens';
import { Button } from './Button';

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <View className="flex-1 items-center justify-center p-8">
      <ActivityIndicator size="large" color={colors.brand} />
      <Text className="mt-3 text-ink-muted">{label}</Text>
    </View>
  );
}

export function EmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <View className="flex-1 items-center justify-center p-8">
      <Text className="text-center text-lg font-semibold text-ink">{title}</Text>
      <Text className="mt-2 max-w-xs text-center text-ink-muted">{message}</Text>
      {action ? <View className="mt-5">{action}</View> : null}
    </View>
  );
}

export function ErrorState({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry?: () => void;
}) {
  const apiError = error instanceof ApiError ? error : null;
  const title = apiError?.isNetwork
    ? 'You are offline'
    : 'Something went wrong';
  const message =
    apiError?.message ??
    (error instanceof Error ? error.message : 'Please try again in a moment.');

  return (
    <View className="flex-1 items-center justify-center p-8">
      <Text className="text-center text-lg font-semibold text-ink">{title}</Text>
      <Text className="mt-2 max-w-xs text-center text-ink-muted">{message}</Text>
      {onRetry ? (
        <View className="mt-5">
          <Button label="Try again" onPress={onRetry} variant="secondary" />
        </View>
      ) : null}
    </View>
  );
}
