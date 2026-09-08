'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button, ButtonLink } from '@/components/ui/Button';
import { useLogout, useSession } from '@/hooks/use-auth';
import { useUnreadCount } from '@/hooks/use-chat';
import { useHideOnScroll } from '@/hooks/use-hide-on-scroll';
import { Container } from './Container';
import { Avatar, UserBadge, identityLabel } from './UserBadge';

const NAV = [
  { href: '/browse', label: 'Browse' },
  { href: '/search', label: 'Search' },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { isAuthenticated, isLandlord, hydrated, user } = useSession();
  const logout = useLogout();
  const unread = useUnreadCount();
  const [open, setOpen] = useState(false);
  const hidden = useHideOnScroll(80, open);

  // Mirror the unread count into the browser tab title, so a message that
  // arrives while KasaHouse sits in a background tab still gets noticed.
  const baseTitle = useRef<string>('');
  useEffect(() => {
    if (!baseTitle.current) {
      baseTitle.current = document.title.replace(/^\(\d+\)\s*/, '') || 'KasaHouse';
    }
    document.title = unread > 0 ? `(${unread}) ${baseTitle.current}` : baseTitle.current;
  }, [unread]);

  return (
    <header
      className={cn(
        'sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur',
        'transition-transform duration-300 ease-out motion-reduce:transition-none',
        hidden ? '-translate-y-full' : 'translate-y-0',
      )}
    >
      <Container className="flex h-16 items-center justify-between">
        <Link href="/" className="text-lg font-bold tracking-tight text-brand">
          KasaHouse
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'rounded-lg px-3 py-2 text-sm font-medium text-ink-muted hover:bg-surface-sunken',
                pathname.startsWith(item.href) && 'text-brand-dark',
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {!hydrated ? null : isAuthenticated && user ? (
            <>
              {isLandlord ? (
                <ButtonLink href="/dashboard" variant="ghost" size="sm">
                  My listings
                </ButtonLink>
              ) : null}
              <Link
                href="/messages"
                className={cn(
                  'relative rounded-lg px-3 py-2 text-sm font-medium hover:bg-surface-sunken',
                  unread > 0 ? 'text-brand-dark' : 'text-ink-muted',
                )}
              >
                Messages
                {unread > 0 ? (
                  <span className="absolute -right-1 -top-0.5 grid min-w-[18px] place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-surface">
                    {unread > 9 ? '9+' : unread}
                  </span>
                ) : null}
              </Link>
              <UserBadge user={user} />
              <Button variant="secondary" size="sm" onClick={() => void logout()}>
                Sign out
              </Button>
            </>
          ) : (
            <ButtonLink href="/sign-in" size="sm">
              Sign in
            </ButtonLink>
          )}
        </div>

        {/* mobile: show the avatar next to the menu button so identity is always visible */}
        <div className="flex items-center gap-2 md:hidden">
          {hydrated && isAuthenticated && user ? (
            <Link href="/profile" aria-label={`Signed in as ${identityLabel(user)}`}>
              <Avatar user={user} className="size-8" />
            </Link>
          ) : null}
          <button
            className="relative rounded-lg p-2 text-ink-muted"
            onClick={() => setOpen((v) => !v)}
            aria-label={unread > 0 ? `Toggle menu, ${unread} unread messages` : 'Toggle menu'}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
            {!open && isAuthenticated && unread > 0 ? (
              <span className="absolute right-1 top-1 size-2.5 rounded-full bg-red-500 ring-2 ring-surface" />
            ) : null}
          </button>
        </div>
      </Container>

      {open ? (
        <div className="border-t border-line bg-surface md:hidden">
          <Container className="flex flex-col gap-1 py-3">
            {hydrated && isAuthenticated && user ? (
              <Link
                href="/profile"
                onClick={() => setOpen(false)}
                className="mb-2 flex items-center gap-3 rounded-xl bg-surface-sunken p-3"
              >
                <Avatar user={user} className="size-10 text-sm" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">
                    {identityLabel(user)}
                  </p>
                  <p className="text-xs text-ink-muted">View profile</p>
                </div>
              </Link>
            ) : null}

            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-ink-muted hover:bg-surface-sunken"
              >
                {item.label}
              </Link>
            ))}
            {isAuthenticated ? (
              <Link
                href="/messages"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-ink-muted hover:bg-surface-sunken"
              >
                Messages
                {unread > 0 ? (
                  <span className="grid min-w-[18px] place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {unread > 9 ? '9+' : unread}
                  </span>
                ) : null}
              </Link>
            ) : null}
            <div className="mt-2 flex flex-col gap-2">
              {isAuthenticated ? (
                <>
                  {isLandlord ? (
                    <ButtonLink
                      href="/dashboard"
                      variant="secondary"
                      size="sm"
                      onClick={() => setOpen(false)}
                    >
                      My listings
                    </ButtonLink>
                  ) : null}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setOpen(false);
                      void logout();
                    }}
                  >
                    Sign out
                  </Button>
                </>
              ) : (
                <ButtonLink href="/sign-in" size="sm" onClick={() => setOpen(false)}>
                  Sign in
                </ButtonLink>
              )}
            </div>
          </Container>
        </div>
      ) : null}
    </header>
  );
}
