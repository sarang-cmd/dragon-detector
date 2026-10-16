'use client';

import * as React from 'react';
import { EffectsModeControl } from './EffectsControls';
import { useEffects } from '@/context/effects-context';

export function EffectsLearnSection({
  audience,
}: {
  audience: 'kids' | 'students';
}) {
  const { isTripped, reenable } = useEffects();
  return (
    <section
      aria-labelledby="effects-heading"
      className="mt-14 border-t border-[var(--color-border)] pt-8"
    >
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,22rem)] lg:items-start">
        <div>
          <span className="label">Canvas effects</span>
          <h2
            id="effects-heading"
            className="mt-1 text-2xl font-medium tracking-tight text-[var(--color-text)]"
          >
            Weather in motion, with care
          </h2>
          {audience === 'kids' ? (
            <p className="learn-body mt-3 max-w-2xl leading-relaxed text-[var(--color-muted)]">
              Pretty rain and clouds. If the page gets slow, they turn themselves off. The numbers keep working.
            </p>
          ) : (
            <div className="mt-3 max-w-2xl space-y-3 text-sm leading-relaxed text-[var(--color-muted)]">
              <p>
                The dashboard uses real Canvas UI effects for the weather itself: clouds on the hero, rain only during rain, frost below 0 °C, and a subtle signal texture only when readings are stale.
              </p>
              <p>Why did the effects turn off?</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>An older laptop or Chromebook has limited graphics or memory.</li>
                <li>Battery saver or Save-Data asks the page to use fewer resources.</li>
                <li>The page measured a sustained slow frame rate and switched the effects off.</li>
              </ul>
              {isTripped && (
                <div role="status" className="flex flex-wrap items-center gap-3 font-medium text-[var(--color-text)]">
                  <span>The moving rain and clouds turned themselves off to keep this page fast on this laptop. The numbers still update live.</span>
                  <button type="button" onClick={reenable} className="min-h-[44px] underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-[var(--accent)]">
                    Try again
                  </button>
                </div>
              )}
              <p>
                They never change sensor readings, charts, tables, or CSV downloads. Reduced-motion preferences always keep them off.
              </p>
            </div>
          )}
        </div>
        <div className="rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <EffectsModeControl />
        </div>
      </div>
    </section>
  );
}
