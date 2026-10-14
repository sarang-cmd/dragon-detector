'use client';

import * as React from 'react';
import Link from 'next/link';
import { HelpCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Tooltip } from '@/components/ui/tooltip';
import { Sparkline } from './Sparkline';
import { ValueCrossfade } from './ValueCrossfade';
import { formatPressure, UnitSystem, hPaToInHg } from '@/lib/units';
import { HistoryPoint } from '@/lib/types';

export interface PressureTileProps {
  pressureHpa?: number;
  unitSystem: UnitSystem;
  history?: HistoryPoint[];
  isOffline?: boolean;
}

export type TrendDirection = 'rising' | 'steady' | 'falling';

export function calculatePressureTrend(
  currentHpa: number | undefined,
  history: HistoryPoint[] | undefined
): { trend: TrendDirection; deltaHpa: number } {
  if (currentHpa == null || !history || history.length < 2) {
    return { trend: 'steady', deltaHpa: 0 };
  }

  // Find a point approximately 3 hours ago (~180 minutes)
  const now = Date.now();
  const threeHoursAgoMs = now - 3 * 60 * 60 * 1000;

  let targetPoint: HistoryPoint | null = null;
  let minDiff = Infinity;

  for (const p of history) {
    if (p.pressureHpa != null) {
      const pTime = new Date(p.timestamp).getTime();
      const diff = Math.abs(pTime - threeHoursAgoMs);
      if (diff < minDiff) {
        minDiff = diff;
        targetPoint = p;
      }
    }
  }

  if (!targetPoint || targetPoint.pressureHpa == null) {
    return { trend: 'steady', deltaHpa: 0 };
  }

  const deltaHpa = currentHpa - targetPoint.pressureHpa;
  let trend: TrendDirection = 'steady';
  if (deltaHpa > 1.0) trend = 'rising';
  else if (deltaHpa < -1.0) trend = 'falling';

  return { trend, deltaHpa: Math.round(deltaHpa * 10) / 10 };
}

/**
 * Relative Barometric Pressure instrument tile per docs/03 and docs/04.
 * Displays sea-level corrected pressure in hPa/inHg, 3-hour trend arrow + human words,
 * and 24-hour pressure trend sparkline.
 */
export function PressureTile({
  pressureHpa,
  unitSystem,
  history = [],
  isOffline = false,
}: PressureTileProps) {
  if (pressureHpa == null) {
    return null; // Hide if field is undefined per implementation rules
  }

  const formatted = formatPressure(pressureHpa, unitSystem);
  const { trend, deltaHpa } = calculatePressureTrend(pressureHpa, history);

  const historyPressures = history
    .map((p) => p.pressureHpa)
    .filter((v): v is number => v != null);

  const trendIcon =
    trend === 'rising' ? (
      <TrendingUp className="h-4 w-4 stroke-[1.5] text-[var(--accent)]" />
    ) : trend === 'falling' ? (
      <TrendingDown className="h-4 w-4 stroke-[1.5] text-[var(--color-muted)]" />
    ) : (
      <Minus className="h-4 w-4 stroke-[1.5] text-[var(--color-muted)]" />
    );

  const deltaText =
    unitSystem === 'metric'
      ? `${deltaHpa > 0 ? '+' : ''}${deltaHpa} hPa`
      : `${deltaHpa > 0 ? '+' : ''}${hPaToInHg(deltaHpa).toFixed(2)} inHg`;

  return (
    <div
      className={`instrument-tile flex flex-col justify-between p-5 sm:p-6 min-h-[220px] ${
        isOffline ? 'opacity-70 grayscale-[30%]' : ''
      }`}
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="label select-none">Relative Pressure</span>
          <Tooltip
            content={
              <span>
                What is this? Learn about{' '}
                <span className="font-medium text-[var(--accent)]">
                  Barometric pressure &amp; weather fronts
                </span>
              </span>
            }
            side="left"
          >
            <Link
              href="/learn#pressure"
              aria-label="What is relative barometric pressure? Learn more in our student guide"
              className="inline-flex h-7 w-7 min-h-[44px] min-w-[44px] sm:min-h-[28px] sm:min-w-[28px] items-center justify-center rounded-[6px] text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
            >
              <HelpCircle className="h-4 w-4 stroke-[1.5]" />
            </Link>
          </Tooltip>
        </div>

        {/* Primary Pressure Readout */}
        <div className="flex items-baseline gap-2">
          <ValueCrossfade
            value={formatted.value}
            className="text-3xl sm:text-4xl font-light tracking-tight text-[var(--color-text)]"
          />
          <span className="text-sm text-[var(--color-muted)] select-none">
            {formatted.unit}
          </span>
        </div>

        {/* 3-hour trend arrow with words */}
        <div className="mt-2 flex items-center gap-2 text-xs text-[var(--color-muted)]">
          {trendIcon}
          <span className="font-medium capitalize text-[var(--color-text)]">
            {trend}
          </span>
          <span className="numeric text-[11px] text-[var(--color-muted)]">
            ({deltaText} / 3h)
          </span>
        </div>
      </div>

      {/* Sparkline */}
      <div className="pt-3 border-t border-[var(--color-border)]">
        <Sparkline
          data={historyPressures}
          unit={formatted.unit}
          label="24h Barometric Pressure"
          height={28}
        />
      </div>
    </div>
  );
}
