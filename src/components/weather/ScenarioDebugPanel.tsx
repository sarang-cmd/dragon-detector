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

/**
 * Dev-only. Lets developers flip the mock source scenario by setting a
 * cookie that the API route reads in non-production. Rendered as a small
 * floating button with a keyboard-accessible popover.
 */
export function ScenarioDebugPanel() {
  const { mutate } = useSWRConfig();
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState<Scenario>('default');

  React.useEffect(() => {
    const current = readScenarioCookie();
    if (current && (SCENARIOS as readonly string[]).includes(current)) {
      setActive(current as Scenario);
    }
  }, []);

  if (process.env.NODE_ENV === 'production') return null;

  const choose = (scenario: Scenario) => {
    writeScenarioCookie(scenario);
    setActive(scenario);
    setOpen(false);
    // Refetch every SWR key so weather and history pick up the scenario.
    void mutate(() => true, undefined, { revalidate: true });
  };

  return (
    <section
      className="fixed bottom-5 right-5 z-50 print:hidden"
      onKeyDown={(e) => {
        if (e.key === 'Escape') setOpen(false);
      }}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls="scenario-panel"
        onClick={() => setOpen((o) => !o)}
        className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-xs font-medium text-[var(--color-text)] shadow-sm hover:border-[var(--accent)] focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
      >
        Scenario: {SCENARIO_LABELS[active]}
      </button>
      <div
        id="scenario-panel"
        role="group"
        aria-label="Mock scenario selector"
        className={
          open
            ? 'absolute bottom-full right-0 mb-2 flex min-w-[220px] flex-col gap-1 rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-sm'
            : 'hidden'
        }
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
