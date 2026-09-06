'use client';

import { Loader2, WifiOff, AlertTriangle, Inbox } from 'lucide-react';
import { ApiError } from '@/lib/api-error';
import { Button } from './Button';

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-ink-muted">
      <Loader2 className="size-6 animate-spin text-brand" />
      {label ? <p className="text-sm">{label}</p> : null}
    </div>
  );
}

export function EmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      <Inbox className="size-8 text-ink-faint" />
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      <p className="max-w-sm text-sm text-ink-muted">{message}</p>
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const apiError = error instanceof ApiError ? error : null;
  const offline = apiError?.isNetwork;
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      {offline ? (
        <WifiOff className="size-8 text-ink-faint" />
      ) : (
        <AlertTriangle className="size-8 text-ink-faint" />
      )}
      <h3 className="text-lg font-semibold text-ink">
        {offline ? 'You are offline' : 'Something went wrong'}
      </h3>
      <p className="max-w-sm text-sm text-ink-muted">
        {apiError?.message ??
          (error instanceof Error ? error.message : 'Please try again in a moment.')}
      </p>
      {onRetry ? (
        <div className="mt-3">
          <Button variant="secondary" size="sm" onClick={onRetry}>
            Try again
          </Button>
        </div>
      ) : null}
    </div>
  );
}
