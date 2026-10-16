'use client';

import Link from 'next/link';
import { LogOut, UserRound } from 'lucide-react';
import { useAuth } from '@/context/auth-context';

/** Header account control: sign-in link, or initials + sign out. */
export function AuthButton() {
  const { user, loading, configured, signOut } = useAuth();
  if (!configured) return null;

  if (loading) {
    return (
      <span
        aria-hidden="true"
        className="inline-block h-9 w-9 rounded-full bg-[var(--color-border)]"
      />
    );
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="inline-flex min-h-[44px] items-center gap-2 rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] transition-colors hover:border-[var(--color-text)] focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
      >
        <UserRound aria-hidden="true" className="h-4 w-4 stroke-[1.5]" />
        <span className="hidden sm:inline">Sign in</span>
      </Link>
    );
  }

  const initial = (user.email?.[0] ?? 'U').toUpperCase();
  return (
    <span className="inline-flex items-center gap-2">
      <span
        title={user.email ?? 'Signed in'}
        aria-label={user.email ? `Signed in as ${user.email}` : 'Signed in'}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-sm font-medium text-[var(--color-text)]"
      >
        {initial}
      </span>
      <button
        type="button"
        onClick={() => void signOut()}
        aria-label="Sign out"
        title="Sign out"
        className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[8px] text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)] focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
      >
        <LogOut aria-hidden="true" className="h-4 w-4 stroke-[1.5]" />
      </button>
    </span>
  );
}
