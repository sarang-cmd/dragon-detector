'use client';

import * as React from 'react';
import { useSWRConfig } from 'swr';

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

  if (process.env.NODE_ENV === 'production') return null;
  if (!unlocked) return null;

  const choose = (scenario: Scenario) => {
    writeScenarioCookie(scenario);
    setActive(scenario);
    setOpen(false);
    // Refetch every SWR key so weather and history pick up the scenario.
    void mutate(() => true, undefined, { revalidate: true });
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
      </div>
    </section>
  );
}
