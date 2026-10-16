'use client';

import * as React from 'react';
import { useWeather } from '@/hooks/useWeather';
import { useUnitSystem, type UnitSystem } from '@/context/unit-context';
import { LiveDot } from '@/components/live-dot';
import { RelativeTime } from '@/components/weather/RelativeTime';
import { HeroReading } from '@/components/weather/HeroReading';
import { WindCompass } from '@/components/weather/WindCompass';
import { RainGauge } from '@/components/weather/RainGauge';
import { calculatePressureTrend } from '@/components/weather/PressureTile';
import { SkeletonTile } from '@/components/weather/SkeletonTile';
import type { HistoryPoint } from '@/lib/types';

const VIEW_CYCLE_MS = 12_000;
const BURN_IN_SHIFT_MS = 10 * 60_000;
const VIEW_ORDER = ['temp', 'wind', 'rain'] as const;
type DisplayView = (typeof VIEW_ORDER)[number];

const VIEW_LABELS: Record<DisplayView, string> = {
  temp: 'Temperature',
  wind: 'Wind',
  rain: 'Rain',
};

/**
 * Fullscreen lobby kiosk (docs/04 §6): no nav, cycles three views every
 * 12 s, Nudges content position every 10 minutes against OLED burn-in.
 */
export default function DisplayPage() {
  const { reading, history, isLoading, isStale, isOffline, secondsSinceMeasured, isMock } =
    useWeather();
  const { unitSystem } = useUnitSystem();
  const [viewIndex, setViewIndex] = React.useState(0);
  const [burnShiftPx, setBurnShiftPx] = React.useState(0);

  const h24Points: HistoryPoint[] = history?.h24 ?? [];
  const pressureTrend = calculatePressureTrend(
    reading?.pressureHpa,
    h24Points
  ).trend;

  // Cycle views every 12 s.
  React.useEffect(() => {
    const id = window.setInterval(
      () => setViewIndex((i) => (i + 1) % VIEW_ORDER.length),
      VIEW_CYCLE_MS
    );
    return () => window.clearInterval(id);
  }, []);

  // Small position shift every 10 minutes to avoid burn-in.
  React.useEffect(() => {
    const id = window.setInterval(
      () => setBurnShiftPx((px) => (px === 0 ? 6 : 0)),
      BURN_IN_SHIFT_MS
    );
    return () => window.clearInterval(id);
  }, []);

  const view: DisplayView = VIEW_ORDER[viewIndex];

  if (isLoading || !reading) {
    return (
      <main className="flex h-dvh items-center justify-center overflow-hidden bg-[var(--color-background)] p-8">
        <SkeletonTile
          className="w-full max-w-[1200px]"
          minHeightClass="min-h-[70vh]"
        />
      </main>
    );
  }

  return (
    <main
      className="flex h-dvh flex-col overflow-hidden bg-[var(--color-background)] px-6 py-6 sm:px-10"
      style={{
        transform: `translateY(${burnShiftPx}px)`,
        transitionDuration: '0ms',
      }}
    >
      {/* Slim status header: station + live state, no navigation. */}
      <div className="flex items-center justify-between text-xs text-[var(--color-muted)]">
        <span className="label">
          DIS Weather Station &middot; {VIEW_LABELS[view]}
        </span>
        <span className="inline-flex items-center gap-2">
          <LiveDot status={isOffline ? 'offline' : 'live'} />
          <RelativeTime seconds={secondsSinceMeasured} />
          <span aria-hidden="true">&middot;</span>
          <span aria-hidden="true">{VIEW_LABELS[view]}</span>
        </span>
      </div>

      <div
        key={view}
        className="flex flex-1 items-center justify-center"
        aria-live="polite"
      >
        {view === 'temp' && (
          <div className="w-full max-w-[1100px]">
            <HeroReading
              reading={reading}
              unitSystem={unitSystem as UnitSystem}
              history={h24Points}
              pressureTrend={pressureTrend}
              isOffline={isOffline}
              isStale={isStale}
              showOutlook={false}
            />
          </div>
        )}
        {view === 'wind' && (
          <div className="w-full max-w-[480px]">
            <WindCompass
              speedKmh={reading.windSpeedKmh}
              gustKmh={reading.windGustKmh}
              directionDeg={reading.windDirectionDeg}
              unitSystem={unitSystem}
              historySpeedKmh={h24Points.map((p) => p.windSpeedKmh)}
              isOffline={isOffline}
            />
          </div>
        )}
        {view === 'rain' && (
          <div className="w-full max-w-[480px]">
            <RainGauge
              rateMmH={reading.rainRateMmH}
              todayMm={reading.rainTodayMm}
              hourMm={reading.rainHourMm}
              weekMm={reading.rainWeekMm}
              unitSystem={unitSystem}
              historyRainMmH={h24Points.map((p) => p.rainRateMmH)}
              isOffline={isOffline}
              isStale={isStale}
            />
          </div>
        )}
      </div>

      <footer className="text-xs text-[var(--color-muted)]">
        <span className="label">
          {isMock
            ? 'Built by the DIS Weather Club · Demo data: simulated readings'
            : 'Built by the DIS Weather Club · measured on our school grounds, Dresden'}
        </span>
      </footer>
    </main>
  );
}
