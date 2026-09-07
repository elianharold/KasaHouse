'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Container } from '@/components/layout/Container';
import { Spinner, ErrorState } from '@/components/ui/States';
import { ChatConversation } from '@/components/chat/ChatConversation';
import { useSession } from '@/hooks/use-auth';
import { useThread } from '@/hooks/use-chat';

export default function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { hydrated, isAuthenticated } = useSession();
  const thread = useThread(id);

  useEffect(() => {
    if (hydrated && !isAuthenticated) router.replace(`/sign-in?next=/messages/${id}`);
  }, [hydrated, isAuthenticated, router, id]);

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

  return <ChatConversation thread={thread.data} />;
}
