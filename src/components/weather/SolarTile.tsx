'use client';

import * as React from 'react';
import Link from 'next/link';
import { HelpCircle } from 'lucide-react';
import { Tooltip } from '@/components/ui/tooltip';
import { ValueCrossfade } from './ValueCrossfade';

export interface SolarTileProps {
  solarWm2?: number;
  isOffline?: boolean;
}

/**
 * Solar radiation / light instrument tile per docs/03 and docs/04.
 * Returns null (hides completely) if solarWm2 is absent or undefined.
 */
export function SolarTile({ solarWm2, isOffline = false }: SolarTileProps) {
  if (solarWm2 == null) {
    return null; // Hide if absent per spec
  }

  const val = Math.max(0, Math.round(solarWm2));

  return (
    <div
      className={`instrument-tile flex flex-col justify-between flex-1 p-5 sm:p-6 min-h-[220px] ${
        isOffline ? 'opacity-70 grayscale-[30%]' : ''
      }`}
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="label select-none">Solar Radiation</span>
          <Tooltip
            content={
              <span>
                What is this? Learn about{' '}
                <span className="font-medium text-[var(--accent)]">
                  Solar irradiance &amp; photovoltaic potential
                </span>
              </span>
            }
            side="left"
          >
            <Link
              href="/learn#solar"
              aria-label="What is solar radiation? Learn more in our student guide"
              className="inline-flex h-7 w-7 min-h-[44px] min-w-[44px] sm:min-h-[28px] sm:min-w-[28px] items-center justify-center rounded-[6px] text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
            >
              <HelpCircle className="h-4 w-4 stroke-[1.5]" />
            </Link>
          </Tooltip>
        </div>

        {/* Primary Readout */}
        <div className="flex items-baseline gap-2">
          <ValueCrossfade
            value={val}
            className="text-3xl sm:text-4xl font-light tracking-tight text-[var(--color-text)]"
          />
          <span className="text-sm text-[var(--color-muted)] select-none">
            W/m&sup2;
          </span>
        </div>

        <p className="mt-2 text-xs text-[var(--color-muted)]">
          {val < 10
            ? 'Nighttime or dusk. Minimal sunlight.'
            : val < 200
            ? 'Overcast or low sun angle.'
            : val < 600
            ? 'Moderate sunlight; active solar generation.'
            : 'Intense direct sunlight.'}
        </p>
      </div>

      <div className="pt-3 border-t border-[var(--color-border)] text-[11px] text-[var(--color-muted)]">
        Silicon photodiode on outdoor array
      </div>
    </div>
  );
}
