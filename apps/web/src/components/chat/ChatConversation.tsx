'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { CheckCheck, CornerDownLeft, Eye, Lock, ShieldAlert } from 'lucide-react';
import type { ChatMessage, ChatThreadDetail } from '@kasahouse/shared-types';
import { BackButton } from '@/components/ui/BackButton';
import { Container } from '@/components/layout/Container';
import { cn } from '@/lib/utils';
import { dayLabel, messageTime, sameDay } from '@/lib/format';
import { useSendMessage } from '@/hooks/use-chat';
import { toApiError } from '@/lib/api-error';

const GAP_MS = 15 * 60 * 1000;

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
  const taRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [thread.messages]);

  const counterpartyName = thread.counterparty.fullName ?? 'KasaHouse member';
  const messages = thread.messages;

  // index of the last message the viewer sent (for the single "Seen" summary)
  let lastMineIdx = -1;
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i]!.mine) {
      lastMineIdx = i;
      break;
    }
  }

  const grow = () => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  const submit = async () => {
    const content = text.trim();
    if (!content) return;
    setBlocked(null);
    try {
      await send.mutateAsync(content);
      setText('');
      requestAnimationFrame(grow);
    } catch (e) {
      setBlocked(toApiError(e).message);
    }
  };

  return (
    <Container size="narrow" className="flex h-[calc(100dvh-4rem)] flex-col py-4">
      <BackButton fallbackHref="/messages" label="Messages" className="mb-2" />

      {/* header */}
      <div className="mb-2 flex items-center gap-3 rounded-2xl border border-line bg-surface p-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand text-sm font-bold text-white">
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

      {/* transcript */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto rounded-2xl border border-line bg-surface-sunken px-3 py-4"
      >
        {messages.length === 0 ? (
          <p className="py-10 text-center text-sm text-ink-muted">
            Say hello — ask about viewing times, requirements, or availability.
          </p>
        ) : (
          messages.map((m, i) => {
            const prev = messages[i - 1];
            const next = messages[i + 1];
            const gap =
              !prev ||
              !sameDay(prev.sentAt, m.sentAt) ||
              new Date(m.sentAt).getTime() - new Date(prev.sentAt).getTime() > GAP_MS;
            const startsRun = gap || !prev || prev.mine !== m.mine;
            const endsRun = !next || next.mine !== m.mine;

            return (
              <div key={m.id}>
                {gap ? (
                  <div className="my-4 flex items-center gap-3">
                    <span className="h-px flex-1 bg-line" />
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
                      {sameDay(m.sentAt, new Date().toISOString())
                        ? messageTime(m.sentAt)
                        : `${dayLabel(m.sentAt)} · ${messageTime(m.sentAt)}`}
                    </span>
                    <span className="h-px flex-1 bg-line" />
                  </div>
                ) : null}

                <div
                  className={cn(
                    'flex items-end gap-2',
                    m.mine ? 'justify-end' : 'justify-start',
                    startsRun ? 'mt-2.5' : 'mt-1',
                  )}
                >
                  {!m.mine ? (
                    endsRun ? (
                      <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-brand/15 text-[11px] font-bold text-brand-dark">
                        {initialsFromName(m.senderName)}
                      </span>
                    ) : (
                      <span className="size-7 shrink-0" />
                    )
                  ) : null}

                  <div
                    className={cn(
                      'max-w-[78%] px-3.5 py-2 text-sm leading-snug shadow-sm',
                      m.mine
                        ? 'rounded-2xl rounded-br-md bg-brand text-white'
                        : 'rounded-2xl rounded-bl-md border border-line bg-surface text-ink',
                    )}
                  >
                    <span className="whitespace-pre-wrap break-words">{m.content}</span>
                  </div>
                </div>

                {m.mine && i === lastMineIdx ? (
                  /* potent read status — once, under the viewer's latest message */
                  <div className="mt-1 flex justify-end pr-1">
                    {m.readAt ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-brand/12 px-2 py-0.5 text-[11px] font-semibold text-brand-dark">
                        <Eye className="size-3.5" />
                        Seen {messageTime(m.readAt)}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-ink-faint">
                        <CheckCheck className="size-3.5" />
                        Sent {messageTime(m.sentAt)}
                      </span>
                    )}
                  </div>
                ) : (
                  /* every other message carries its own send time */
                  <div
                    className={cn(
                      'mt-0.5 flex px-1',
                      m.mine ? 'justify-end pr-1' : 'justify-start pl-9',
                    )}
                  >
                    <span className="text-[10px] tabular-nums text-ink-faint">
                      {messageTime(m.sentAt)}
                    </span>
                  </div>
                )}
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

      {/* composer */}
      <form
        className="mt-2 flex items-end gap-2 rounded-2xl border border-line bg-surface p-1.5"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <textarea
          ref={taRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            grow();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void submit();
            }
          }}
          rows={1}
          placeholder="Write a message…"
          maxLength={2000}
          spellCheck
          autoCapitalize="sentences"
          autoCorrect="on"
          className="max-h-[120px] flex-1 resize-none bg-transparent px-3 py-2 text-sm focus:outline-none"
        />
        <button
          type="submit"
          disabled={!text.trim() || send.isPending}
          aria-label="Send"
          className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand text-white transition-colors hover:bg-brand-dark disabled:opacity-40"
        >
          <CornerDownLeft className="size-4" />
        </button>
      </form>
      <p className="mt-1 flex items-center justify-center gap-1 text-center text-[11px] text-ink-faint">
        <Lock className="size-3" />
        Messages can&apos;t be edited or deleted. Enter to send, Shift+Enter for a new line.
      </p>
    </Container>
  );
}
