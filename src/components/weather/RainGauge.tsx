'use client';

import * as React from 'react';
import Link from 'next/link';
import { HelpCircle } from 'lucide-react';
import { Tooltip } from '@/components/ui/tooltip';
import { Sparkline } from './Sparkline';
import { ValueCrossfade } from './ValueCrossfade';
import { formatRain, UnitSystem, mmToIn } from '@/lib/units';

export interface RainGaugeProps {
  rateMmH: number;
  todayMm: number;
  hourMm?: number;
  weekMm?: number;
  unitSystem: UnitSystem;
  historyRainMmH?: number[];
  isOffline?: boolean;
}

/**
 * Rain gauge tile per docs/03 and docs/04.
 * Features a dynamic vertical fill gauge (0-10mm base, expands if exceeded),
 * rate, hour, day, week readouts, and a dry message.
 */
export function RainGauge({
  rateMmH,
  todayMm,
  hourMm,
  weekMm,
  unitSystem,
  historyRainMmH = [],
  isOffline = false,
}: RainGaugeProps) {
  const formattedToday = formatRain(todayMm, unitSystem);
  const formattedRate = formatRain(rateMmH, unitSystem);
  const formattedHour = hourMm != null ? formatRain(hourMm, unitSystem) : null;
  const formattedWeek = weekMm != null ? formatRain(weekMm, unitSystem) : null;

  // Base scale 10 mm, expanding dynamically when exceeded
  const baseScaleMm = 10;
  const maxScaleMm = todayMm > baseScaleMm ? Math.ceil(todayMm / 10) * 10 : baseScaleMm;
  const fillPct = Math.min(100, Math.max(0, (todayMm / maxScaleMm) * 100));

  const isDry = todayMm === 0 && rateMmH === 0;

  return (
    <div
      className={`instrument-tile flex flex-col justify-between p-5 sm:p-6 min-h-[220px] ${
        isOffline ? 'opacity-70 grayscale-[30%]' : ''
      }`}
    >
      {/* Header */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="label select-none">Precipitation</span>
          <Tooltip
            content={
              <span>
                What is this? Learn about{' '}
                <span className="font-medium text-[var(--accent)]">
                  Rain measurement
                </span>
              </span>
            }
            side="left"
          >
            <Link
              href="/learn#rain"
              aria-label="What is precipitation? Learn more in our student guide"
              className="inline-flex h-7 w-7 min-h-[44px] min-w-[44px] sm:min-h-[28px] sm:min-w-[28px] items-center justify-center rounded-[6px] text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
            >
              <HelpCircle className="h-4 w-4 stroke-[1.5]" />
            </Link>
          </Tooltip>
        </div>

        {/* Primary Today Readout */}
        <div className="flex items-baseline gap-2">
          <ValueCrossfade
            value={formattedToday.value}
            className="text-3xl sm:text-4xl font-light tracking-tight text-[var(--color-text)]"
          />
          <span className="text-sm text-[var(--color-muted)] select-none">
            {formattedToday.unit} today
          </span>
        </div>

        {/* Dry message or current rate */}
        <p className="mt-1 text-xs text-[var(--color-muted)]">
          {isDry ? (
            <span className="text-[var(--color-muted)]">No rain today.</span>
          ) : (
            <span>
              Rate: <span className="numeric font-medium text-[var(--color-text)]">{formattedRate.value}</span> {formattedRate.unit}/h
            </span>
          )}
        </p>
      </div>

      {/* Middle row: Vertical fill gauge + Period stats */}
      <div className="my-3 flex items-center justify-between gap-4">
        {/* Vertical Liquid Fill Cylinder */}
        <div className="flex items-center gap-2">
          <div
            className="relative h-20 w-5 rounded-[4px] border border-[var(--color-border)] bg-[var(--color-background)] overflow-hidden flex flex-col justify-end p-0.5"
            role="progressbar"
            aria-valuenow={todayMm}
            aria-valuemin={0}
            aria-valuemax={maxScaleMm}
            aria-label={`Rain gauge: ${formattedToday.value} ${formattedToday.unit} of ${unitSystem === 'metric' ? maxScaleMm : mmToIn(maxScaleMm).toFixed(1)} ${formattedToday.unit} capacity`}
          >
            {/* Liquid level fill */}
            <div
              style={{ height: `${fillPct}%` }}
              className="w-full rounded-[2px] bg-[var(--accent)] transition-all duration-500 ease-out motion-reduce:transition-none"
            />
          </div>
          <div className="flex flex-col justify-between h-20 text-[10px] text-[var(--color-muted)] numeric select-none">
            <span>{unitSystem === 'metric' ? `${maxScaleMm}mm` : `${mmToIn(maxScaleMm).toFixed(1)}in`}</span>
            <span>{unitSystem === 'metric' ? `${maxScaleMm / 2}mm` : `${(mmToIn(maxScaleMm) / 2).toFixed(1)}in`}</span>
            <span>0</span>
          </div>
        </div>

        {/* Secondary intervals */}
        <div className="flex flex-col gap-1.5 text-xs text-right">
          {formattedHour && (
            <div>
              <span className="text-[var(--color-muted)] mr-2">Last hour</span>
              <span className="numeric text-[var(--color-text)] font-medium">
                {formattedHour.value} {formattedHour.unit}
              </span>
            </div>
          )}
          {formattedWeek && (
            <div>
              <span className="text-[var(--color-muted)] mr-2">This week</span>
              <span className="numeric text-[var(--color-text)] font-medium">
                {formattedWeek.value} {formattedWeek.unit}
              </span>
            </div>
          )}
          <div className="text-[11px] text-[var(--color-muted)]">
            Reset 00:00 Europe/Berlin
          </div>
        </div>
      </div>

      {/* Sparkline */}
      <div className="pt-3 border-t border-[var(--color-border)]">
        <Sparkline
          data={
            unitSystem === 'imperial'
              ? historyRainMmH.map(mmToIn)
              : historyRainMmH
          }
          unit={`${formattedRate.unit}/h`}
          label="24h Rain Rate"
          height={28}
        />
      </div>
    </div>
  );
}
