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

/**
 * Wind tile: faster drift and stronger streaks as the wind picks up.
 *
 * `cover` is returned here rather than hardcoded at the call site because it
 * is what made this tile read as bare — at 0.012 it was a tenth of what the
 * other tiles use, so next to them the wind card looked like it had no
 * background at all.
 */
export function windStreak(windSpeedKmh: number): {
  speed: number;
  wind: number;
  opacity: number;
  cover: number;
} {
  const s = clamp(windSpeedKmh, 0, 120) / 120;
  return {
    speed: round(0.16 + s * 0.46),
    wind: round(0.28 + s * 0.52),
    opacity: round(0.055 + s * 0.085),
    cover: round(0.035 + s * 0.055),
  };
}

/**
 * Humidity tile: denser, slower mist as humidity rises. It stays windless —
 * `wind` is 0 by design, which is what makes it read as still rather than as a
 * slow version of the wind tile — but it has to boil visibly, so `speed` is
 * now in the same range as the other tiles instead of the 0.03 it started at.
 */
export function mistParams(humidityPct: number): {
  cover: number;
  opacity: number;
  speed: number;
} {
  const h = clamp(humidityPct, 0, 100) / 100;
  return {
    cover: round(0.14 + h * 0.22),
    opacity: round(0.05 + h * 0.12),
    speed: round(0.12 + h * 0.16),
  };
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

export type CloudTint = 'neutral' | 'warm' | 'cool';

/**
 * Per-tile base colours for the Clouds shader, with the same caveat as
 * `CLOUD_BASE`: the shader lifts *from* the base on dark surfaces and darkens
 * *from* it on light ones, so every theme needs its own mid-tone. The tints
 * stay near the surface colour — the point is a hazy tile, not a coloured one.
 */
export const TILE_CLOUD_BASE: Record<CloudTint, Record<EffectTheme, [number, number, number]>> = {
  neutral: { dark: [0.067, 0.067, 0.067], light: [0.58, 0.66, 0.78] },
  warm: { dark: [0.104, 0.078, 0.056], light: [0.79, 0.71, 0.6] },
  cool: { dark: [0.052, 0.066, 0.098], light: [0.56, 0.63, 0.8] },
};

/**
 * How fast the tiles drift, for reference. The shader advances by
 * `delta * speed * 0.03` each frame, so anything much below ~0.15 reads as
 * frozen next to the wind tile — which is what went wrong: the per-tile
 * presets started at 0.015–0.14 while wind ran at 0.16–0.62. The personalities
 * are kept by the *spread* (UV quickest, pressure stillest, humidity the only
 * windless one) rather than by being uniformly slow.
 *
 * The subset of `CloudsOptions` a tile may vary. `quality`, `shadow` and
 * `refraction` are fixed by the caller: tiles never want the drop shadow, and
 * refraction reads as a smeared lens at tile size.
 */
export interface TileCloudPreset {
  tint: CloudTint;
  scale: number;
  speed: number;
  cover: number;
  density: number;
  shading: number;
  opacity: number;
  wind: number;
  windRadius: number;
  fogBlur: number;
}

/** UV tile: thin, high, quick haze that thickens with the index. */
export function uvHaze(uvIndex: number): TileCloudPreset {
  const v = clamp(uvIndex, 0, 12) / 12;
  return {
    tint: 'warm',
    scale: round(1.5 - v * 0.35),
    speed: round(0.18 + v * 0.34),
    cover: round(0.016 + v * 0.05),
    density: round(1 - v * 0.3, 2),
    shading: 0.22,
    opacity: round(0.05 + v * 0.09),
    wind: round(0.18 + v * 0.34),
    windRadius: 260,
    fogBlur: round(0.1 + v * 0.25),
  };
}

/** Solar tile: broad, slow, bright haze that builds with irradiance. */
export function solarHaze(solarWm2: number): TileCloudPreset {
  const w = clamp(solarWm2, 0, 1000) / 1000;
  return {
    tint: 'warm',
    scale: round(0.95 - w * 0.2),
    speed: round(0.14 + w * 0.26),
    cover: round(0.02 + w * 0.06),
    density: round(1.5 + w * 0.9),
    shading: 0.2,
    opacity: round(0.045 + w * 0.1),
    wind: round(0.12 + w * 0.22),
    windRadius: 200,
    fogBlur: round(0.25 + w * 0.3),
  };
}

/** Sun & moon tile: warm haze by day, a cooler and stiller veil after dark. */
export function celestialHaze(isDay: boolean): TileCloudPreset {
  if (isDay) {
    return {
      tint: 'warm',
      scale: 1.15,
      speed: 0.2,
      cover: 0.035,
      density: 1.4,
      shading: 0.18,
      opacity: 0.07,
      wind: 0.18,
      windRadius: 230,
      fogBlur: 0.3,
    };
  }
  return {
    tint: 'cool',
    scale: 1.6,
    speed: 0.11,
    cover: 0.04,
    density: 2.1,
    shading: 0.14,
    opacity: 0.085,
    wind: 0.08,
    windRadius: 180,
    fogBlur: 0.45,
  };
}

/**
 * Pressure tile: a wide, near-still veil. The trend picks the tint as well as
 * the pace — rising pressure warms and settles, falling pressure cools and
 * moves, which is the same story the CSS band underneath tells.
 */
export function pressureHaze(trend: 'rising' | 'falling' | 'steady'): TileCloudPreset {
  return {
    tint: trend === 'falling' ? 'cool' : 'warm',
    scale: 2.3,
    speed: trend === 'steady' ? 0.12 : trend === 'rising' ? 0.18 : 0.24,
    cover: 0.018,
    density: 0.9,
    shading: 0.12,
    opacity: trend === 'steady' ? 0.055 : 0.075,
    wind: trend === 'falling' ? 0.3 : trend === 'rising' ? 0.16 : 0.08,
    windRadius: 320,
    fogBlur: 0.6,
  };
}

/**
 * Rain tile: wetness from what has fallen today and what is falling now.
 * Whichever is higher wins, so a dry morning after a wet night still reads as
 * damp, and a sudden downpour registers before it has filled the gauge.
 */
export function wetness(todayMm: number, rateMmH: number): number {
  return clamp(Math.max(todayMm / 15, rateMmH / 12), 0, 1);
}

/**
 * Rain tile: the standing haze behind the droplets. Droplets only run while it
 * is actually raining, so without this the tile is the one bare card on a dry
 * day. Cool and slow-moving, thickening with how wet it has been.
 */
export function wetHaze(todayMm: number, rateMmH: number): TileCloudPreset {
  const wet = wetness(todayMm, rateMmH);
  return {
    tint: 'cool',
    scale: round(1.35 - wet * 0.3),
    speed: round(0.16 + wet * 0.32),
    cover: round(0.02 + wet * 0.07),
    density: round(1.6 + wet * 1.2),
    shading: 0.16,
    opacity: round(0.05 + wet * 0.09),
    wind: round(0.16 + wet * 0.34),
    windRadius: 240,
    fogBlur: round(0.3 + wet * 0.35),
  };
}

/**
 * Rain tile: the CSS half of the ambience — a damp wash that rises from the
 * bottom edge, so the tile still reads as the rain card on devices that never
 * get the canvas.
 */
export function wetWash(todayMm: number, rateMmH: number): string {
  const wet = wetness(todayMm, rateMmH);
  return `${round(4 + wet * 10, 1)}%`;
}

/**
 * Rain tile: how hard the Canvas UI droplets run. A curve rather than a
 * straight scale, so a drizzle is still visible and a cloudburst stops short
 * of covering the numbers.
 */
export function dropletParams(rateMmH: number): {
  intensity: number;
  fallSpeed: number;
  scale: number;
} {
  const r = clamp(rateMmH, 0, 30) / 30;
  return {
    intensity: round(0.3 + r * 0.45),
    fallSpeed: round(0.5 + r * 0.7),
    scale: round(0.5 + r * 0.25),
  };
}
