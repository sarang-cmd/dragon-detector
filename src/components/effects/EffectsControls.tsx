'use client';

import * as React from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { useEffects, type EffectsMode } from '@/context/effects-context';

const MODE_ORDER: EffectsMode[] = ['auto', 'on', 'off'];

const MODE_COPY: Record<EffectsMode, string> = {
  auto: 'The laptop chooses; slow effects turn off by themselves.',
  on: 'Use moving effects when this laptop supports them.',
  off: 'Show the weather without moving effects.',
};

const MODE_LABELS: Record<EffectsMode, string> = {
  auto: 'Auto',
  on: 'On',
  off: 'Off',
};

function tierLabel(tier: string): string {
  return tier === 'full'
    ? 'Full effects available'
    : tier === 'lite'
      ? 'Light effects available'
      : 'Effects unavailable on this device';
}

export function EffectsCycleButton({ className = '' }: { className?: string }) {
  const { mode, cycleMode, isEnabled, tier } = useEffects();
  const unavailable = tier === 'off';
  return (
    <>
      {unavailable && (
        <span id="weather-effects-unavailable" className="sr-only">
          Moving effects are unavailable because this device does not support the required graphics or prefers reduced motion.
        </span>
      )}
      <Tooltip
        content={
          unavailable
            ? 'Weather effects are unavailable on this device.'
            : `Weather effects: ${MODE_LABELS[mode]}. Activate to cycle Auto, On, and Off.`
        }
        side="bottom"
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={`relative ${className}`}
          onClick={cycleMode}
          aria-label={`Weather effects: ${MODE_LABELS[mode]}. Change mode.`}
          aria-pressed={isEnabled}
          disabled={unavailable}
          aria-describedby={unavailable ? 'weather-effects-unavailable' : undefined}
        >
          <Sparkles className="h-4 w-4" strokeWidth={1.5} />
          <span className="sr-only">Mode: {MODE_LABELS[mode]}</span>
        </Button>
      </Tooltip>
    </>
  );
}

export function EffectsModeControl({
  compact = false,
}: {
  compact?: boolean;
}) {
  const { mode, setMode, tier, isTripped, reenable } = useEffects();

  return (
    <fieldset className="min-w-0 border-0 p-0">
      <legend className="label mb-2">Weather effects</legend>
      <div
        role="radiogroup"
        aria-label="Weather effects mode"
        className="flex flex-wrap gap-2"
      >
        {MODE_ORDER.map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={mode === option}
            onClick={() => setMode(option)}
            className={`min-h-[44px] rounded-[8px] border px-3 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent)] ${
              mode === option
                ? 'border-[var(--color-text)] bg-[var(--color-surface)] text-[var(--color-text)]'
                : 'border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            {MODE_LABELS[option]}
          </button>
        ))}
      </div>
      {!compact && (
        <>
          {tier === 'off' && (
            <p className="mt-2 text-xs leading-relaxed text-[var(--color-muted)]">
              Moving effects are unavailable because this device does not support the required graphics or prefers reduced motion.
            </p>
          )}
          <p className="mt-2 text-xs leading-relaxed text-[var(--color-muted)]">
            {MODE_COPY[mode]} {tierLabel(tier)}.
          </p>
          {isTripped && (
            <div
              className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[var(--color-muted)]"
              role="status"
            >
              <span>The effects paused to keep this page fast. The numbers still update live.</span>
              <Button type="button" size="sm" variant="outline" onClick={reenable}>
                Try again
              </Button>
            </div>
          )}
          <p className="mt-2 text-[11px] leading-relaxed text-[var(--color-muted)]">
            Pretty rain and clouds. If the page gets slow, they turn themselves off. The numbers keep working.
          </p>
        </>
      )}
    </fieldset>
  );
}
