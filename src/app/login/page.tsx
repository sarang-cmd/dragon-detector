'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.4c-.2 1.4-1.5 4.1-5.4 4.1-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.9 1.5l2.6-2.6C16.9 3.5 14.7 2.5 12 2.5 6.9 2.5 2.8 6.6 2.8 12s4.1 9.5 9.2 9.5c5.3 0 8.8-3.7 8.8-9 0-.3 0-.6-.1-.9H12z"
      />
    </svg>
  );
}

/** Sign-in page: Google OAuth + email/password (sign in or create account). */
export default function LoginPage() {
  const { user, loading, configured, signInWithGoogle, signInWithEmail, signUpWithEmail } =
    useAuth();
  const router = useRouter();
  const [mode, setMode] = React.useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (!loading && user) router.replace('/learn');
  }, [loading, user, router]);

  if (!configured) {
    return (
      <div className="mx-auto w-full max-w-[480px] px-4 py-16">
        <p className="rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-sm text-[var(--color-text)]">
          Sign-in is not configured on this deployment yet. Weather, Learn and
          Data all work without an account.{' '}
          <Link href="/learn" className="text-[var(--accent)] underline">
            Continue to Learn
          </Link>
        </p>
      </div>
    );
  }

  const submitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      if (mode === 'signin') {
        const { error: err } = await signInWithEmail(email.trim(), password);
        if (err) setError(err);
        else router.replace('/learn');
      } else {
        const { error: err, confirmEmail } = await signUpWithEmail(
          email.trim(),
          password
        );
        if (err) setError(err);
        else if (confirmEmail)
          setNotice('Account created — check your inbox for the confirmation email, then sign in.');
        else router.replace('/learn');
      }
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setError(null);
    const { error: err } = await signInWithGoogle();
    if (err) setError(err);
  };

  return (
    <div className="mx-auto w-full max-w-[480px] px-4 py-12 sm:py-16">
      <span className="label">Accounts</span>
      <h1 className="display mt-1 text-[var(--color-text)]">Sign in</h1>
      <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)] sm:text-base">
        Accounts only save your learning-track progress. Everything else works
        without one.
      </p>

      <div className="mt-8 space-y-4 rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <button
          type="button"
          onClick={google}
          className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-[12px] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm font-medium text-[var(--color-text)] transition-colors hover:border-[var(--color-text)] focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
        >
          <GoogleIcon />
          Continue with Google
        </button>

        <div className="flex items-center gap-3 text-xs text-[var(--color-muted)]" aria-hidden="true">
          <span className="h-px flex-1 bg-[var(--color-border)]" />
          or with email
          <span className="h-px flex-1 bg-[var(--color-border)]" />
        </div>

        <div role="group" aria-label="Mode" className="flex gap-2">
          {(['signin', 'signup'] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => {
                setMode(m);
                setError(null);
                setNotice(null);
              }}
              className={`min-h-[44px] flex-1 rounded-[8px] px-3 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent)] ${
                mode === m
                  ? 'bg-[var(--color-border)] font-medium text-[var(--color-text)]'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              {m === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          ))}
        </div>

        <form onSubmit={submitEmail} className="space-y-3">
          <div>
            <label htmlFor="login-email" className="label text-[10px]">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 min-h-[44px] w-full rounded-[8px] border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm text-[var(--color-text)] focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
            />
          </div>
          <div>
            <label htmlFor="login-password" className="label text-[10px]">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              required
              minLength={6}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
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
          {notice && (
            <p role="status" className="text-xs leading-relaxed text-[var(--color-text)]">
              {notice}
            </p>
          )}
          <button
            type="submit"
            disabled={busy || loading}
            className="inline-flex min-h-[44px] w-full items-center justify-center rounded-[12px] bg-[var(--accent)] px-3 py-2 text-sm font-medium text-[var(--accent-foreground)] transition-opacity disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
          >
            {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  );
}
