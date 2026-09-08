'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Container } from '@/components/layout/Container';
import { Spinner, EmptyState, ErrorState } from '@/components/ui/States';
import { PurposeBadge, VerifiedTick } from '@/components/ui/Badge';
import { ButtonLink } from '@/components/ui/Button';
import { relativeTime } from '@/lib/format';
import { useSession } from '@/hooks/use-auth';
import { useThreads } from '@/hooks/use-chat';

export default function MessagesPage() {
  const router = useRouter();
  const { hydrated, isAuthenticated } = useSession();
  const threads = useThreads();

  useEffect(() => {
    if (hydrated && !isAuthenticated) router.replace('/sign-in?next=/messages');
  }, [hydrated, isAuthenticated, router]);

  if (!hydrated || threads.isLoading) {
    return (
      <Container className="py-10">
        <Spinner label="Loading your messages…" />
      </Container>
    );
  }
  if (threads.isError) {
    return (
      <Container className="py-10">
        <ErrorState error={threads.error} onRetry={() => void threads.refetch()} />
      </Container>
    );
  }

  const list = threads.data ?? [];

  return (
    <Container size="narrow" className="py-8">
      <h1 className="mb-4 text-2xl font-semibold text-ink">Messages</h1>

      {list.length === 0 ? (
        <EmptyState
          title="No conversations yet"
          message="When you message an owner about a listing, the conversation shows up here."
          action={<ButtonLink href="/browse">Browse listings</ButtonLink>}
        />
      ) : (
        <ul className="divide-y divide-line rounded-2xl border border-line">
          {list.map((t) => (
            <li key={t.id}>
              <Link
                href={`/messages/${t.id}`}
                className="flex items-center gap-3 p-3 hover:bg-surface-sunken"
              >
                <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-surface-sunken">
                  {t.listingCoverUrl ? (
                    <Image src={t.listingCoverUrl} alt="" fill sizes="48px" className="object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-ink">
                      {t.counterparty.fullName ?? 'KasaHouse member'}
                    </p>
                    {t.counterparty.verified ? (
                      <VerifiedTick verified size="xs" />
                    ) : null}
                    <PurposeBadge purpose={t.listingPurpose} className="scale-90" />
                  </div>
                  <p className="truncate text-xs text-ink-muted">{t.listingTitle}</p>
                  <p className="truncate text-xs text-ink-faint">
                    {t.lastMessage ?? 'No messages yet'}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-[11px] text-ink-faint">
                    {relativeTime(t.lastMessageAt)}
                  </span>
                  {t.unreadCount > 0 ? (
                    <span className="grid size-5 place-items-center rounded-full bg-brand text-[11px] font-bold text-white">
                      {t.unreadCount}
                    </span>
                  ) : null}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
