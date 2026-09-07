'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Goes back in history, or to `fallbackHref` when the page was opened directly
 * (deep link / new tab) so it never navigates off the site.
 */
export function BackButton({
  fallbackHref = '/browse',
  label = 'Back',
  className,
}: {
  fallbackHref?: string;
  label?: string;
  className?: string;
}) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        if (typeof window !== 'undefined' && window.history.length > 1) router.back();
        else router.push(fallbackHref);
      }}
      className={cn(
        'inline-flex items-center gap-1 rounded-lg py-1.5 pr-2 text-sm font-medium text-ink-muted transition-colors hover:text-ink',
        className,
      )}
    >
      <ChevronLeft className="size-4" />
      {label}
    </button>
  );
}
