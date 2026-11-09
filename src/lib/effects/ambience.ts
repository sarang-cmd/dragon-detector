'use client';

import { useTheme } from 'next-themes';

export type EffectTheme = 'dark' | 'light';

/**
 * The Clouds shader paints *from* a base colour: it lightens the base on dark
 * surfaces and darkens it on light ones. Left on `color="auto"` it samples the
 * tile surface, so on the light theme's white surface it renders white-on-white
 * (invisible), and while the theme is switching it keeps the previous base for
 * a frame, which reads as an inverted blob. Supplying an explicit per-theme
 * base removes both the invisibility and the inversion.
 */
export const CLOUD_BASE: Record<EffectTheme, [number, number, number]> = {
  dark: [0.067, 0.067, 0.067], // #111111 surface
  light: [0.58, 0.66, 0.78], // cool mid-tone: reads as haze on white
};

/** Resolved theme for effect colour choices; defaults to dark (docs/03). */
export function useEffectTheme(): EffectTheme {
  const { resolvedTheme } = useTheme();
  return resolvedTheme === 'light' ? 'light' : 'dark';
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function round(value: number, places = 3): number {
  const f = 10 ** places;
  return Math.round(value * f) / f;
}

/** Wind tile: faster drift and stronger streaks as the wind picks up. */
export function windStreak(windSpeedKmh: number): {
  speed: number;
  wind: number;
  opacity: number;
} {
  const s = clamp(windSpeedKmh, 0, 120) / 120;
  return {
    speed: round(0.16 + s * 0.46),
    wind: round(0.28 + s * 0.52),
    opacity: round(0.05 + s * 0.09),
  };
}

/** Humidity tile: denser, slower mist as humidity rises. */
export function mistParams(humidityPct: number): { cover: number; opacity: number } {
  const h = clamp(humidityPct, 0, 100) / 100;
  return { cover: round(0.14 + h * 0.22), opacity: round(0.05 + h * 0.12) };
}

/** UV tile: warm glow that grows with the index. */
export function uvGlow(uvIndex: number): { mix: string; size: string } {
  const v = clamp(uvIndex, 0, 12) / 12;
  return {
    mix: `${round(3 + v * 9, 1)}%`,
    size: `${round(52 + v * 34, 1)}%`,
  };
}

/** Solar tile: wash strength from irradiance. */
export function solarWash(solarWm2: number): { mix: string; size: string } {
  const w = clamp(solarWm2, 0, 1000) / 1000;
  return {
    mix: `${round(2.5 + w * 9, 1)}%`,
    size: `${round(46 + w * 40, 1)}%`,
  };
}

/**
 * Pressure tile: the band sits high when pressure is rising and low when it is
 * falling, so the ambience carries the trend rather than decorating randomly.
 */
export function pressureShift(trend: 'rising' | 'falling' | 'steady'): number {
  if (trend === 'rising') return 26;
  if (trend === 'falling') return 74;
  return 50;
}
