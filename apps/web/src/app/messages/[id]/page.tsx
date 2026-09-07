'use client';

import { use, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';
import { Container } from '@/components/layout/Container';
import { BackButton } from '@/components/ui/BackButton';
import { Button } from '@/components/ui/Button';
import { Spinner, ErrorState } from '@/components/ui/States';
import { cn } from '@/lib/utils';
import { useSession } from '@/hooks/use-auth';
import { useSendMessage, useThread } from '@/hooks/use-chat';
import { toApiError } from '@/lib/api-error';

export default function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { hydrated, isAuthenticated } = useSession();
  const thread = useThread(id);
  const send = useSendMessage(id);

  const [text, setText] = useState('');
  const [blocked, setBlocked] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hydrated && !isAuthenticated) router.replace(`/sign-in?next=/messages/${id}`);
  }, [hydrated, isAuthenticated, router, id]);

  const messages = thread.data?.messages;
  useLayoutEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  if (!hydrated || thread.isLoading) {
    return (
      <Container className="py-10">
        <Spinner label="Opening conversation…" />
      </Container>
    );
  }
  if (thread.isError || !thread.data) {
    return (
      <Container className="py-10">
        <ErrorState error={thread.error} onRetry={() => void thread.refetch()} />
      </Container>
    );
  }

  const t = thread.data;

  const submit = async () => {
    const content = text.trim();
    if (!content) return;
    setBlocked(null);
    try {
      await send.mutateAsync(content);
      setText('');
    } catch (e) {
      const err = toApiError(e);
      if (err.code === 'MESSAGE_BLOCKED') setBlocked(err.message);
      else setBlocked(err.message);
    }
  };

  return (
    <Container size="narrow" className="flex h-[calc(100dvh-4rem)] flex-col py-4">
      <BackButton fallbackHref="/messages" label="Messages" className="mb-2" />

      <Link
        href={`/listings/${t.listingId}`}
        className="mb-3 rounded-xl border border-line bg-surface p-3 hover:bg-surface-sunken"
      >
        <p className="text-sm font-semibold text-ink">
          {t.counterparty.fullName ?? 'KasaHouse member'}
        </p>
        <p className="truncate text-xs text-ink-muted">
          {t.listingTitle} · view listing
        </p>
      </Link>

      <div
        ref={scrollRef}
        className="flex-1 space-y-2 overflow-y-auto rounded-xl bg-surface-sunken p-3"
      >
        {t.messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-muted">
            Say hello — ask about viewing times, requirements, or availability.
          </p>
        ) : (
          t.messages.map((m) => (
            <div
              key={m.id}
              className={cn('flex', m.mine ? 'justify-end' : 'justify-start')}
            >
              <div
                className={cn(
                  'max-w-[80%] rounded-2xl px-3 py-2 text-sm',
                  m.mine
                    ? 'rounded-br-sm bg-brand text-white'
                    : 'rounded-bl-sm bg-surface text-ink',
                )}
              >
                {m.content}
              </div>
            </div>
          ))
        )}
      </div>

      {blocked ? (
        <div className="mt-2 flex gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
          <ShieldAlert className="size-4 shrink-0" />
          <span>{blocked}</span>
        </div>
      ) : null}

      <form
        className="mt-2 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a message…"
          maxLength={2000}
          className="flex-1 rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
        />
        <Button type="submit" loading={send.isPending} disabled={!text.trim()}>
          Send
        </Button>
      </form>
      <p className="mt-1 text-center text-[11px] text-ink-faint">
        Keep it on KasaHouse — sharing phone numbers or paying off-app isn&apos;t allowed.
      </p>
    </Container>
  );
}
