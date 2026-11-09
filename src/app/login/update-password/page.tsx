'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/auth-context';

/** Set a new password after clicking a recovery link (recovery session). */
export default function UpdatePasswordPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const supabase = createClient();
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) setError(err.message);
      else {
        setDone(true);
        setTimeout(() => router.replace('/learn'), 1500);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[480px] px-4 py-12 sm:py-16">
      <span className="label">Accounts</span>
      <h1 className="display mt-1 text-[var(--color-text)]">New password</h1>
      <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)] sm:text-base">
        {loading
          ? 'Checking your recovery link…'
          : user
            ? `Signed in as ${user.email ?? 'you'}. Choose a new password below.`
            : 'This link is invalid or expired. Request a fresh reset email from the sign-in page.'}
      </p>

      {user && !done && (
        <form onSubmit={submit} className="mt-6 space-y-3 rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <div>
            <label htmlFor="new-password" className="label text-[10px]">
              New password
            </label>
            <input
              id="new-password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 min-h-[44px] w-full rounded-[8px] border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm text-[var(--color-text)] focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
            />
          </div>
          {error && (
            <p role="alert" className="text-xs leading-relaxed text-red-500">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="inline-flex min-h-[44px] w-full items-center justify-center rounded-[12px] bg-[var(--accent)] px-3 py-2 text-sm font-medium text-[var(--accent-foreground)] transition-opacity disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
          >
            {busy ? 'Saving…' : 'Save new password'}
          </button>
        </form>
      )}

      {done && (
        <p role="status" className="mt-6 rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-sm text-[var(--color-text)]">
          Password updated. Taking you to Learn…
        </p>
      )}

      {!loading && !user && !done && (
        <Link
          href="/login"
          className="mt-6 inline-block text-[var(--accent)] underline"
        >
          Back to sign in
        </Link>
      )}
    </div>
  );
}
