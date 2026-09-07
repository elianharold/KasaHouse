'use client';

import Link from 'next/link';
import type { User } from '@kasahouse/shared-types';
import { cn } from '@/lib/utils';

export function identityLabel(user: User): string {
  if (user.fullName?.trim()) return user.fullName.trim();
  if (user.email) return user.email;
  if (user.phone) return user.phone;
  return 'Your account';
}

export function initials(user: User): string {
  const name = user.fullName?.trim();
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean);
    return (parts[0]![0]! + (parts[1]?.[0] ?? '')).toUpperCase();
  }
  if (user.email) return user.email[0]!.toUpperCase();
  if (user.phone) return user.phone.slice(-2);
  return '·';
}

export function Avatar({ user, className }: { user: User; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'grid shrink-0 place-items-center rounded-full bg-brand text-xs font-bold text-white',
        className,
      )}
    >
      {initials(user)}
    </span>
  );
}

/**
 * The always-visible identity chip in the header — avatar + name/email — so a
 * signed-in user can see who they are without opening a menu. Links to /profile.
 */
export function UserBadge({
  user,
  onClick,
  compact = false,
}: {
  user: User;
  onClick?: () => void;
  compact?: boolean;
}) {
  return (
    <Link
      href="/profile"
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 rounded-full border border-line py-1 pl-1 pr-3 text-sm font-medium text-ink hover:bg-surface-sunken',
        compact && 'border-0 p-0',
      )}
      title={identityLabel(user)}
    >
      <Avatar user={user} className="size-7" />
      <span className="max-w-[9rem] truncate">{identityLabel(user)}</span>
    </Link>
  );
}
