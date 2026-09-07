'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Check, CheckCheck, Lock, ShieldAlert } from 'lucide-react';
import type { ChatMessage, ChatThreadDetail } from '@kasahouse/shared-types';
import { Button } from '@/components/ui/Button';
import { BackButton } from '@/components/ui/BackButton';
import { Container } from '@/components/layout/Container';
import { cn } from '@/lib/utils';
import { dayLabel, messageTime, sameDay } from '@/lib/format';
import { useSendMessage } from '@/hooks/use-chat';
import { toApiError } from '@/lib/api-error';

function initialsFromName(name: string | null): string {
  if (!name?.trim()) return '·';
  const p = name.trim().split(/\s+/);
  return (p[0]![0]! + (p[1]?.[0] ?? '')).toUpperCase();
}

export function ChatConversation({ thread }: { thread: ChatThreadDetail }) {
  const send = useSendMessage(thread.id);
  const [text, setText] = useState('');
  const [blocked, setBlocked] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [thread.messages]);

  const counterpartyName = thread.counterparty.fullName ?? 'KasaHouse member';

  const submit = async () => {
    const content = text.trim();
    if (!content) return;
    setBlocked(null);
    try {
      await send.mutateAsync(content);
      setText('');
    } catch (e) {
      setBlocked(toApiError(e).message);
    }
  };

  return (
    <Container size="narrow" className="flex h-[calc(100dvh-4rem)] flex-col py-4">
      <BackButton fallbackHref="/messages" label="Messages" className="mb-2" />

      {/* header — name top-left, listing under it */}
      <div className="mb-3 flex items-center gap-3 rounded-xl border border-line bg-surface p-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand text-sm font-bold text-white">
          {initialsFromName(thread.counterparty.fullName)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{counterpartyName}</p>
          <Link
            href={`/listings/${thread.listingId}`}
            className="truncate text-xs text-brand-dark hover:underline"
          >
            {thread.listingTitle} · view listing
          </Link>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 space-y-1 overflow-y-auto rounded-xl bg-surface-sunken p-3"
      >
        {thread.messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-muted">
            Say hello — ask about viewing times, requirements, or availability.
          </p>
        ) : (
          thread.messages.map((m, i) => {
            const prev = thread.messages[i - 1];
            const showDay = !prev || !sameDay(prev.sentAt, m.sentAt);
            const newSpeaker = !prev || prev.mine !== m.mine || showDay;
            return (
              <div key={m.id}>
                {showDay ? (
                  <div className="my-3 flex justify-center">
                    <span className="rounded-full bg-surface px-3 py-0.5 text-[11px] font-medium text-ink-muted">
                      {dayLabel(m.sentAt)}
                    </span>
                  </div>
                ) : null}

                <div className={cn('flex flex-col', m.mine ? 'items-end' : 'items-start')}>
                  {newSpeaker ? (
                    <span className="mb-0.5 px-1 text-[11px] font-medium text-ink-faint">
                      {m.mine ? 'You' : counterpartyName}
                    </span>
                  ) : null}
                  <div
                    className={cn(
                      'max-w-[80%] rounded-2xl px-3 py-2 text-sm',
                      m.mine
                        ? 'rounded-br-sm bg-brand text-white'
                        : 'rounded-bl-sm border border-line bg-surface text-ink',
                    )}
                  >
                    {m.content}
                  </div>
                  <MessageMeta message={m} />
                </div>
              </div>
            );
          })
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
      <p className="mt-1 flex items-center justify-center gap-1 text-center text-[11px] text-ink-faint">
        <Lock className="size-3" />
        Messages can&apos;t be edited or deleted. Keep it on KasaHouse.
      </p>
    </Container>
  );
}

function MessageMeta({ message }: { message: ChatMessage }) {
  return (
    <span className="mt-0.5 flex items-center gap-1 px-1 text-[10px] text-ink-faint">
      {messageTime(message.sentAt)}
      {message.mine ? (
        message.readAt ? (
          <span className="flex items-center gap-0.5 text-brand">
            <CheckCheck className="size-3" /> Read
          </span>
        ) : (
          <span className="flex items-center gap-0.5">
            <Check className="size-3" /> Sent
          </span>
        )
      ) : null}
    </span>
  );
}
