'use client';

import * as React from 'react';
import Link from 'next/link';
import { HelpCircle } from 'lucide-react';
import { Tooltip } from '@/components/ui/tooltip';
import { ValueCrossfade } from './ValueCrossfade';
import { Outlook } from './Outlook';
import { StatusStrip } from './StatusStrip';
import { formatTemp, UnitSystem } from '@/lib/units';
import { summarySentence, PressureTrend } from '@/lib/summary';
import { HistoryPoint, WeatherReading } from '@/lib/types';
import dynamic from 'next/dynamic';

const HeroWeatherEffects = dynamic(
  () => import('@/components/effects/WeatherEffects').then((module) => module.HeroWeatherEffects),
  { ssr: false }
);

export interface HeroReadingProps {
  reading: WeatherReading;
  unitSystem: UnitSystem;
  history: HistoryPoint[];
  pressureTrend: PressureTrend;
  isOffline?: boolean;
  isStale?: boolean;
  /** Kiosk views show current conditions only; the outlook stays on Live. */
  showOutlook?: boolean;
}

/**
 * Bento Hero Tile per docs/03 and docs/04.
 * Spans 2 cols x 2 rows in desktop bento grid.
 * Features massive tabular-numeric temperature, feels-like indicator,
 * 24h min/max horizontal range bar, editorial summary sentence, jacket advice line,
 * and the live status strip with subtle radial glow.
 */
export function HeroReading({
  reading,
  unitSystem,
  history,
  pressureTrend,
  isOffline = false,
  isStale = false,
  showOutlook = true,
}: HeroReadingProps) {
  const currentTemp = reading.temperatureC;
  const formattedTemp = formatTemp(currentTemp, unitSystem);
  const formattedFeelsLike =
    reading.feelsLikeC != null
      ? formatTemp(reading.feelsLikeC, unitSystem)
      : null;

  // Compute 24h min and max temperatures
  const historyTemps = history
    .map((p) => p.temperatureC)
    .filter((t): t is number => t != null && !Number.isNaN(t));

  const allTemps = [currentTemp, ...historyTemps];
  const minTempC = Math.min(...allTemps);
  const maxTempC = Math.max(...allTemps);
  const formattedMin = formatTemp(minTempC, unitSystem);
  const formattedMax = formatTemp(maxTempC, unitSystem);

  const tempRange = maxTempC - minTempC;
  const tempPosPct =
    tempRange > 0
      ? Math.max(0, Math.min(100, ((currentTemp - minTempC) / tempRange) * 100))
      : 50;

  // Editorial summary and jacket advice
  const { sentence, jacket } = summarySentence({
    temperatureC: currentTemp,
    feelsLikeC: reading.feelsLikeC,
    windSpeedKmh: reading.windSpeedKmh,
    windGustKmh: reading.windGustKmh,
    windDirectionDeg: reading.windDirectionDeg,
    rainRateMmH: reading.rainRateMmH,
    rainTodayMm: reading.rainTodayMm,
    humidityPct: reading.humidityPct,
    pressureHpa: reading.pressureHpa,
    pressureTrend,
    isOffline,
    unitSystem,
  });

  return (
    <div
      className={`instrument-tile relative flex flex-col justify-between flex-1 p-6 sm:p-8 min-h-[380px] lg:min-h-[460px] overflow-hidden ${
        isOffline ? 'opacity-70 grayscale-[30%]' : ''
      }`}
      style={{
        // Subtle single radial glow permitted in hero only (docs/03 section 5)
        backgroundImage:
          'radial-gradient(circle at 12% 16%, color-mix(in srgb, var(--accent) 7%, transparent) 0%, transparent 60%)',
      }}
    >
      <div className="weather-effect-host absolute inset-0 z-0 overflow-hidden rounded-[inherit]" aria-hidden="true">
        <HeroWeatherEffects
          temperatureC={reading.temperatureC}
          humidityPct={reading.humidityPct}
          isStale={isStale || isOffline}
        />
      </div>
      {/* Top Bar: StatusStrip & "What is this?" */}
      <div className="relative z-10 flex items-start justify-between gap-4">
        <StatusStrip />

        <Tooltip
          content={
            <span>
              What is this? Learn about{' '}
              <span className="font-medium text-[var(--accent)]">
                Air temperature measurement
              </span>
            </span>
          }
          side="left"
        >
          <Link
            href="/learn#temperature"
            aria-label="What is air temperature? Learn more in our student guide"
            className="inline-flex h-7 w-7 min-h-[44px] min-w-[44px] sm:min-h-[28px] sm:min-w-[28px] items-center justify-center rounded-[6px] text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
          >
            <HelpCircle className="h-4 w-4 stroke-[1.5]" />
          </Link>
        </Tooltip>
      </div>

      {/* Main Temperature Hero Number */}
      <div className="my-6">
        <div className="flex items-baseline gap-2">
          <span className="display text-[clamp(5.5rem,11vw,9.5rem)] font-light leading-none tracking-[-0.04em] text-[var(--color-text)]">
            <ValueCrossfade value={formattedTemp.value} />
          </span>
          <span className="text-2xl sm:text-4xl font-light text-[var(--color-muted)] select-none">
            {formattedTemp.unit}
          </span>
        </div>

        {/* Feels Like line */}
        {formattedFeelsLike && (
          <div className="mt-2 text-sm sm:text-base text-[var(--color-muted)]">
            Feels like{' '}
            <span className="numeric font-medium text-[var(--color-text)]">
              {formattedFeelsLike.value} {formattedFeelsLike.unit}
            </span>
          </div>
        )}
      </div>

      {/* Range Bar & Editorial Sentence Footer */}
      <div className="space-y-4 pt-4 border-t border-[var(--color-border)]">
        {/* Min / Max Range Bar */}
        <div>
          <div className="flex items-center justify-between text-xs text-[var(--color-muted)] mb-1.5">
            <span>
              Min <span className="numeric text-[var(--color-text)]">{formattedMin.value}</span> {formattedMin.unit}
            </span>
            <span className="label text-[10px]">Today&apos;s Range</span>
            <span>
              Max <span className="numeric text-[var(--color-text)]">{formattedMax.value}</span> {formattedMax.unit}
            </span>
          </div>

          <div
            className="relative h-1.5 w-full rounded-full bg-[var(--color-border)] overflow-hidden"
            role="progressbar"
            aria-valuenow={currentTemp}
            aria-valuemin={minTempC}
            aria-valuemax={maxTempC}
            aria-label={`Temperature range: current ${formattedTemp.value} ${formattedTemp.unit}, between min ${formattedMin.value} and max ${formattedMax.value}`}
          >
            {/* Visual range fill */}
            <div
              style={{ width: `${tempPosPct}%` }}
              className="h-full bg-[var(--accent)] rounded-full transition-all duration-500 ease-out motion-reduce:transition-none"
            />
          </div>
        </div>

        {/* Editorial Summary Sentence & Jacket Advice */}
        <div className="space-y-1">
          <p className="text-sm sm:text-base leading-relaxed text-[var(--color-text)] font-normal">
            {sentence}
          </p>
          <p className="text-xs sm:text-sm text-[var(--color-muted)] font-normal">
            <span className="text-[var(--accent)] font-medium">Jacket advice:</span>{' '}
            {jacket}
          </p>
        </div>

        {/* 12-hour outlook: forecast graph + AI/statistical sentence.
            Hidden on kiosk views, which show current conditions only. */}
        {showOutlook && (
          <div className="border-t border-[var(--color-border)] pt-3">
            <Outlook unitSystem={unitSystem} />
          </div>
        )}
      </div>
    </div>
  );
}
