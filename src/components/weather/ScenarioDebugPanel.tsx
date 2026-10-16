'use client';

import * as React from 'react';
import { useSWRConfig } from 'swr';
import { setMascotChoice, useMascotChoice, type MascotChoice } from '@/components/learn/Mascot';

const SCENARIOS = ['default', 'storm', 'calm', 'rain', 'offline'] as const;
type Scenario = (typeof SCENARIOS)[number];

const SCENARIO_LABELS: Record<Scenario, string> = {
  default: 'Default',
  storm: 'Storm',
  calm: 'Calm',
  rain: 'Rain',
  offline: 'Offline (old timestamp)',
};

const COOKIE_NAME = 'weather_scenario';
const UNLOCK_KEY = 'weather_scenario_unlocked';
const TRIPLE_WINDOW_MS = 800;

function readScenarioCookie(): string | null {
  const match = document.cookie
    .split('; ')
    .find((c) => c.startsWith(`${COOKIE_NAME}=`));
  return match ? decodeURIComponent(match.split('=')[1]) : null;
}

function writeScenarioCookie(scenario: Scenario) {
  document.cookie = `${COOKIE_NAME}=${scenario}; path=/; max-age=${
    scenario === 'default' ? '0' : '3600'
  }; samesite=lax`;
}

function readUnlocked(): boolean {
  try {
    return sessionStorage.getItem(UNLOCK_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * Dev-only mock scenario switcher. There is intentionally no visible button:
 * press the `d` key three times within 800ms to reveal the panel for this
 * session (sessionStorage flag, so it survives page views but not visits).
 * Esc hides it again. Still fully disabled in production.
 */
export function ScenarioDebugPanel() {
  const { mutate } = useSWRConfig();
  const [open, setOpen] = React.useState(false);
  const [unlocked, setUnlocked] = React.useState(false);
  const [active, setActive] = React.useState<Scenario>('default');
  const mascot = useMascotChoice();
  const [testEmail, setTestEmail] = React.useState('');
  const [testStatus, setTestStatus] = React.useState<string | null>(null);
  const [testBusy, setTestBusy] = React.useState(false);
  const [history, setHistory] = React.useState<
    { createdAt: string; statisticalHeadline?: string; ai?: string | null; stale?: boolean; sample?: boolean }[]
  >([]);
  const [historyState, setHistoryState] = React.useState<'idle' | 'loading' | 'done'>('idle');

  const sendTestEmail = async (kind: 'signup' | 'reset' | 'magiclink') => {
    setTestStatus(null);
    if (!testEmail.includes('@')) {
      setTestStatus('Type a valid email address first.');
      return;
    }
    setTestBusy(true);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const origin = window.location.origin;
      if (kind === 'signup') {
        const { error } = await supabase.auth.signUp({
          email: testEmail.trim(),
          password: `Test-${Math.random().toString(36).slice(2, 10)}!x`,
          options: { emailRedirectTo: `${origin}/auth/confirm` },
        });
        setTestStatus(error ? `Failed: ${error.message}` : 'Signup confirmation sent. Check the inbox (and spam).');
      } else if (kind === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(testEmail.trim(), {
          redirectTo: `${origin}/auth/confirm`,
        });
        setTestStatus(error ? `Failed: ${error.message}` : 'Password reset sent. Check the inbox (and spam).');
      } else {
        const { error } = await supabase.auth.signInWithOtp({
          email: testEmail.trim(),
          options: { emailRedirectTo: `${origin}/auth/confirm` },
        });
        setTestStatus(error ? `Failed: ${error.message}` : 'Magic link sent. Check the inbox (and spam).');
      }
    } finally {
      setTestBusy(false);
    }
  };

  React.useEffect(() => {
    const current = readScenarioCookie();
    if (current && (SCENARIOS as readonly string[]).includes(current)) {
      setActive(current as Scenario);
    }
    if (readUnlocked()) setUnlocked(true);

    let presses: number[] = [];
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        return;
      }
      const target = e.target as HTMLElement | null;
      // Don't hijack typing in inputs, textareas or contenteditable.
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.key.toLowerCase() !== 'd' || e.metaKey || e.ctrlKey || e.altKey) {
        return;
      }
      const now = Date.now();
      presses = [...presses, now].filter((t) => now - t <= TRIPLE_WINDOW_MS);
      if (presses.length >= 3) {
        presses = [];
        setUnlocked(true);
        setOpen(true);
        try {
          sessionStorage.setItem(UNLOCK_KEY, '1');
        } catch {
          // ignore write errors
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Public outlook history (no login needed). Loads when the panel opens.
  // (Above all early returns: hooks must run in the same order every render.)
  React.useEffect(() => {
    if (!open || historyState !== 'idle') return;
    setHistoryState('loading');
    fetch('/api/outlook/history?units=metric&limit=10')
      .then((r) => (r.ok ? r.json() : { entries: [] }))
      .then((j) => setHistory(Array.isArray(j.entries) ? j.entries : []))
      .catch(() => setHistory([]))
      .finally(() => setHistoryState('done'));
  }, [open, historyState]);

  if (process.env.NODE_ENV === 'production') return null;
  if (!unlocked) return null;

  const choose = (scenario: Scenario) => {
    writeScenarioCookie(scenario);
    setActive(scenario);
    setOpen(false);
    // Refetch every SWR key so weather and history pick up the scenario.
    void mutate(() => true, undefined, { revalidate: true });
  };

  const chooseMascot = (next: MascotChoice) => {
    setMascotChoice(next);
  };

  if (!open) return null;

  return (
    <section
      aria-label="Mock scenario selector"
      className="fixed bottom-5 right-5 z-50 print:hidden"
      onKeyDown={(e) => {
        if (e.key === 'Escape') setOpen(false);
      }}
    >
      <div
        id="scenario-panel"
        role="group"
        aria-label="Mock scenario selector"
        className="flex min-w-[220px] flex-col gap-1 rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-sm"
      >
        {SCENARIOS.map((scenario) => (
          <button
            key={scenario}
            type="button"
            aria-pressed={active === scenario}
            onClick={() => choose(scenario)}
            className={`rounded-[8px] px-3 py-2 text-left text-xs focus-visible:outline-2 focus-visible:outline-[var(--accent)] ${
              active === scenario
                ? 'bg-[var(--color-border)] font-medium text-[var(--color-text)]'
                : 'text-[var(--color-muted)] hover:bg-[var(--color-border)] hover:text-[var(--color-text)]'
            }`}
          >
            {SCENARIO_LABELS[scenario]}
          </button>
        ))}

        <div
          role="group"
          aria-label="Mascot selector"
          className="mt-1 border-t border-[var(--color-border)] pt-1"
        >
          <p className="px-3 pb-1 pt-1 text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
            Mascot
          </p>
          {(
            [
              ['sid', 'Sid (official)'],
              ['classic', 'Classic'],
            ] as [MascotChoice, string][]
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={mascot === value}
              onClick={() => chooseMascot(value)}
              className={`w-full rounded-[8px] px-3 py-2 text-left text-xs focus-visible:outline-2 focus-visible:outline-[var(--accent)] ${
                mascot === value
                  ? 'bg-[var(--color-border)] font-medium text-[var(--color-text)]'
                  : 'text-[var(--color-muted)] hover:bg-[var(--color-border)] hover:text-[var(--color-text)]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div
          role="group"
          aria-label="Test emails"
          className="mt-1 border-t border-[var(--color-border)] pt-1"
        >
          <p className="px-3 pb-1 pt-1 text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
            Test emails
          </p>
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="name@example.com"
            aria-label="Test recipient email"
            className="mx-3 mb-1 min-h-[36px] w-[calc(100%-24px)] rounded-[8px] border border-[var(--color-border)] bg-[var(--color-background)] px-2 text-xs text-[var(--color-text)] focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
          />
          {(
            [
              ['signup', 'Signup confirm'],
              ['reset', 'Password reset'],
              ['magiclink', 'Magic link'],
            ] as const
          ).map(([kind, label]) => (
            <button
              key={kind}
              type="button"
              disabled={testBusy}
              onClick={() => void sendTestEmail(kind)}
              className="w-full rounded-[8px] px-3 py-2 text-left text-xs text-[var(--color-muted)] hover:bg-[var(--color-border)] hover:text-[var(--color-text)] focus-visible:outline-2 focus-visible:outline-[var(--accent)] disabled:opacity-60"
            >
              {label}
            </button>
          ))}
          {testStatus && (
            <p role="status" className="px-3 py-2 text-[11px] leading-relaxed text-[var(--color-text)]">
              {testStatus}
            </p>
          )}
        </div>

        <div
          role="group"
          aria-label="Outlook history"
          className="mt-1 border-t border-[var(--color-border)] pt-1"
        >
          <p className="px-3 pb-1 pt-1 text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
            Outlook history
          </p>
          {historyState !== 'done' ? (
            <p className="px-3 py-1 text-[11px] text-[var(--color-muted)]">Loading…</p>
          ) : history.length === 0 ? (
            <p className="px-3 py-1 text-[11px] leading-relaxed text-[var(--color-muted)]">
              No stored outlooks yet. Run migration 0004 (+0005 for samples),
              then use the site once.
            </p>
          ) : (
            <ol className="max-h-48 space-y-2 overflow-y-auto px-3 py-1">
              {history.map((h, i) => (
                <li key={`${h.createdAt}-${i}`} className="text-[11px] leading-relaxed">
                  <span className="numeric text-[var(--color-muted)]">
                    {new Date(h.createdAt).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>{' '}
                  {h.stale && <span className="text-[var(--accent)]">[stale] </span>}
                  {h.sample && <span className="text-[var(--color-muted)]">[sample] </span>}
                  {h.ai ? (
                    <span className="text-[var(--color-text)]">{h.ai}</span>
                  ) : (
                    <span className="text-[var(--color-text)]">
                      {String(h.statisticalHeadline ?? '—')}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </section>
  );
}
