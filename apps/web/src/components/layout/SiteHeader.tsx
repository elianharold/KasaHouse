'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button, ButtonLink } from '@/components/ui/Button';
import { useLogout, useSession } from '@/hooks/use-auth';
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
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur">
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
            className="rounded-lg p-2 text-ink-muted"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
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
