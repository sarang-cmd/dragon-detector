'use client';

import * as React from 'react';
import Link from 'next/link';
import { HelpCircle } from 'lucide-react';
import { Tooltip } from '@/components/ui/tooltip';
import { ValueCrossfade } from './ValueCrossfade';

export interface UVTileProps {
  uvIndex?: number;
  isOffline?: boolean;
}

const UV_BANDS = [
  { key: 'low', label: 'Low', min: 0, max: 2.9 },
  { key: 'moderate', label: 'Mod', min: 3, max: 5.9 },
  { key: 'high', label: 'High', min: 6, max: 7.9 },
  { key: 'very_high', label: 'Very High', min: 8, max: 10.9 },
  { key: 'extreme', label: 'Extreme', min: 11, max: Infinity },
];

export function getUvBand(uv: number): { label: string; key: string } {
  for (const b of UV_BANDS) {
    if (uv >= b.min && uv <= b.max) {
      return { label: b.label === 'Mod' ? 'Moderate' : b.label, key: b.key };
    }
  }
  return { label: 'Low', key: 'low' };
}

/**
 * UV Index instrument tile per docs/03 and docs/04.
 * Features numeric value, band name (Low...Extreme), and an accessible,
 * color-independent segmented bar where every segment has an explicit text label.
 */
export function UVTile({ uvIndex, isOffline = false }: UVTileProps) {
  if (uvIndex == null) {
    return null; // Hide if absent
  }

  const uv = Math.max(0, uvIndex);
  const band = getUvBand(uv);

  return (
    <div
      className={`instrument-tile flex flex-col justify-between p-5 sm:p-6 min-h-[220px] ${
        isOffline ? 'opacity-70 grayscale-[30%]' : ''
      }`}
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="label select-none">UV Index</span>
          <Tooltip
            content={
              <span>
                What is this? Learn about{' '}
                <span className="font-medium text-[var(--accent)]">
                  UV radiation &amp; sun protection
                </span>
              </span>
            }
            side="left"
          >
            <Link
              href="/learn#uv-index"
              aria-label="What is UV index? Learn more in our student guide"
              className="inline-flex h-7 w-7 min-h-[44px] min-w-[44px] sm:min-h-[28px] sm:min-w-[28px] items-center justify-center rounded-[6px] text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
            >
              <HelpCircle className="h-4 w-4 stroke-[1.5]" />
            </Link>
          </Tooltip>
        </div>

        {/* Primary UV Readout */}
        <div className="flex items-baseline gap-2">
          <ValueCrossfade
            value={uv.toFixed(1)}
            className="text-3xl sm:text-4xl font-light tracking-tight text-[var(--color-text)]"
          />
          <span className="text-sm font-medium text-[var(--color-text)] ml-1 select-none">
            {band.label}
          </span>
        </div>

        <p className="mt-1 text-xs text-[var(--color-muted)]">
          {uv < 3
            ? 'No protection needed. Safe for outdoor activities.'
            : uv < 8
            ? 'Seek shade during midday; wear hat and sunscreen.'
            : 'Take extra precautions; avoid prolonged midday sun.'}
        </p>
      </div>

      {/* Colour-Independent Segmented Indicator Bar */}
      <div className="my-3">
        <div
          className="grid grid-cols-5 gap-1.5"
          role="group"
          aria-label={`UV exposure category: ${band.label} (${uv.toFixed(1)})`}
        >
          {UV_BANDS.map((b) => {
            const isActive = uv >= b.min && uv <= b.max;
            return (
              <div
                key={b.key}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-[6px] border text-center transition-all ${
                  isActive
                    ? 'border-[var(--accent)] bg-[var(--color-background)] font-medium text-[var(--color-text)] shadow-none'
                    : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] opacity-60'
                }`}
                aria-current={isActive ? 'true' : undefined}
              >
                <span className="text-[10px] tracking-tight leading-none">
                  {b.label}
                </span>
                <span className="numeric text-[9px] text-[var(--color-muted)] mt-1">
                  {b.max === Infinity ? '11+' : `${b.min}-${Math.floor(b.max)}`}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-2 text-[11px] text-[var(--color-muted)] border-t border-[var(--color-border)]">
        Solar radiation sensor &middot; WHO standard scale
      </div>
    </div>
  );
}
