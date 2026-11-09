'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { useAmbientEffect, useEffects } from '@/context/effects-context';
import { EffectBoundary } from './EffectBoundary';
import {
  CLOUD_BASE,
  mistParams,
  pressureShift,
  solarWash,
  useEffectTheme,
  uvGlow,
  windStreak,
} from '@/lib/effects/ambience';

const Clouds = dynamic(
  () => import('@/components/canvasui/Clouds').then((module) => module.Clouds),
  { ssr: false },
);

/**
 * Shared host for a tile's ambience layer. Uses the existing
 * `.weather-effect-host` class so the tile's content stays above it
 * (see globals.css) and the layer is clipped to the tile radius.
 */
function AmbienceHost({
  label,
  variant,
  style,
}: React.PropsWithChildren<{
  label: string;
  variant: string;
  style?: React.CSSProperties;
}>) {
  return (
    <div
      className={`weather-effect-host ambience-host ambience-${variant} pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[inherit]`}
      data-ambience={label}
      aria-hidden="true"
      style={style}
    />
  );
}

/**
 * Wind tile: high-wind, thin wisps that drift faster as the wind rises —
 * closer to streaks than to the hero's slow cloud field.
 */
export function WindAmbience({
  windSpeedKmh,
  isStale = false,
}: {
  windSpeedKmh: number;
  isStale?: boolean;
}) {
  const { tier } = useEffects();
  const theme = useEffectTheme();
  const enabled = useAmbientEffect(!isStale && tier !== 'off' && windSpeedKmh > 0);
  if (!enabled) return null;

  const { speed, wind, opacity } = windStreak(windSpeedKmh);
  const lite = tier === 'lite';

  return (
    <div
      className="weather-effect-host ambience-host ambience-wind pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[inherit]"
      data-ambience="wind"
      aria-hidden="true"
    >
      <EffectBoundary fallback={null}>
        <Clouds
          key={theme}
          className="h-full w-full"
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
          color={CLOUD_BASE[theme]}
          scale={1.7}
          speed={lite ? 0 : speed}
          cover={0.012}
          density={1.1}
          shading={theme === 'light' ? 0.2 : 0.12}
          opacity={opacity}
          shadow={0}
          wind={lite ? 0 : wind}
          windRadius={280}
          refraction={0}
          fogBlur={0}
          quality={lite ? 0.28 : 0.5}
        >
          <div className="h-full w-full bg-transparent" />
        </Clouds>
      </EffectBoundary>
    </div>
  );
}

/**
 * Humidity tile: slow, windless mist that thickens with humidity. Same
 * primitive as the hero, opposite personality — dense and still.
 */
export function HumidityAmbience({
  humidityPct,
  isStale = false,
}: {
  humidityPct: number;
  isStale?: boolean;
}) {
  const { tier } = useEffects();
  const theme = useEffectTheme();
  const enabled = useAmbientEffect(!isStale && tier !== 'off');
  if (!enabled) return null;

  const { cover, opacity } = mistParams(humidityPct);
  const lite = tier === 'lite';

  return (
    <div
      className="weather-effect-host ambience-host ambience-mist pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[inherit]"
      data-ambience="humidity"
      aria-hidden="true"
    >
      <EffectBoundary fallback={null}>
        <Clouds
          key={theme}
          className="h-full w-full"
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
          color={CLOUD_BASE[theme]}
          scale={0.9}
          speed={lite ? 0 : 0.03}
          cover={cover}
          density={3.2}
          shading={theme === 'light' ? 0.14 : 0.08}
          opacity={opacity}
          shadow={0}
          wind={0}
          windRadius={160}
          refraction={0}
          fogBlur={0.35}
          quality={lite ? 0.28 : 0.45}
        >
          <div className="h-full w-full bg-transparent" />
        </Clouds>
      </EffectBoundary>
    </div>
  );
}

/**
 * Pressure tile: no canvas at all — a single soft band that sits high when
 * pressure is rising and low when it is falling, drifting slowly.
 */
export function PressureAmbience({
  trend,
  isStale = false,
}: {
  trend: 'rising' | 'falling' | 'steady';
  isStale?: boolean;
}) {
  const { isEnabled } = useEffects();
  if (!isEnabled || isStale) return null;

  return (
    <AmbienceHost
      label="pressure"
      variant="pressure"
      style={{ ['--ambience-shift' as string]: `${pressureShift(trend)}%` }}
    />
  );
}

/** UV tile: warm glow from the top-right corner, scaled by the index. */
export function UvAmbience({ uvIndex }: { uvIndex?: number }) {
  const { isEnabled } = useEffects();
  if (!isEnabled || uvIndex == null) return null;

  const { mix, size } = uvGlow(uvIndex);
  return (
    <AmbienceHost
      label="uv"
      variant="uv"
      style={{
        ['--ambience-mix' as string]: mix,
        ['--ambience-size' as string]: size,
      }}
    />
  );
}

/** Solar tile: broader warm wash with a slow breathing pulse. */
export function SolarAmbience({ solarWm2 }: { solarWm2?: number }) {
  const { isEnabled } = useEffects();
  if (!isEnabled || solarWm2 == null) return null;

  const { mix, size } = solarWash(solarWm2);
  return (
    <AmbienceHost
      label="solar"
      variant="solar"
      style={{
        ['--ambience-mix' as string]: mix,
        ['--ambience-size' as string]: size,
      }}
    />
  );
}

/**
 * Sun & Moon tile: cool moonlight at night, warm daylight by day — the one
 * tile whose ambience is driven by time rather than by a reading.
 */
export function CelestialAmbience({ isDay }: { isDay: boolean }) {
  const { isEnabled } = useEffects();
  if (!isEnabled) return null;

  return <AmbienceHost label="celestial" variant={isDay ? 'celestial-day' : 'celestial-night'} />;
}
