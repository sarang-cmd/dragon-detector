import { describe, it, expect } from 'vitest';
import {
  celestialHaze,
  CLOUD_BASE,
  dropletParams,
  mistParams,
  pressureHaze,
  pressureShift,
  solarHaze,
  solarWash,
  TILE_CLOUD_BASE,
  uvGlow,
  uvHaze,
  wetHaze,
  wetness,
  wetWash,
  windStreak,
} from './ambience';

describe('CLOUD_BASE', () => {
  it('stays dark on the dark theme and mid-tone on the light theme', () => {
    const lum = ([r, g, b]: [number, number, number]) => 0.299 * r + 0.587 * g + 0.114 * b;
    // The shader darkens bases with luminance > 0.5 and lightens the rest.
    expect(lum(CLOUD_BASE.dark)).toBeLessThan(0.5);
    expect(lum(CLOUD_BASE.light)).toBeGreaterThan(0.5);
    // A white surface would have made the light theme invisible.
    expect(CLOUD_BASE.light).not.toEqual([1, 1, 1]);
  });
});

describe('windStreak', () => {
  it('drifts faster and brighter as the wind rises', () => {
    const calm = windStreak(2);
    const gale = windStreak(90);
    expect(gale.speed).toBeGreaterThan(calm.speed);
    expect(gale.wind).toBeGreaterThan(calm.wind);
    expect(gale.opacity).toBeGreaterThan(calm.opacity);
  });

  it('clamps out-of-range input', () => {
    expect(windStreak(-20)).toEqual(windStreak(0));
    expect(windStreak(500)).toEqual(windStreak(120));
    const { opacity } = windStreak(1000);
    expect(opacity).toBeLessThanOrEqual(0.15);
  });
});

describe('mistParams', () => {
  it('thickens with humidity and stays subtle', () => {
    const dry = mistParams(20);
    const muggy = mistParams(95);
    expect(muggy.cover).toBeGreaterThan(dry.cover);
    expect(muggy.opacity).toBeGreaterThan(dry.opacity);
    expect(muggy.opacity).toBeLessThanOrEqual(0.18);
  });

  it('handles missing readings', () => {
    expect(mistParams(Number.NaN).cover).toBeCloseTo(mistParams(0).cover, 5);
  });
});

describe('uvGlow / solarWash', () => {
  it('grows with the reading and returns CSS-ready values', () => {
    expect(uvGlow(0).mix).toBe('3%');
    expect(parseFloat(uvGlow(11).mix)).toBeGreaterThan(parseFloat(uvGlow(1).mix));
    expect(parseFloat(solarWash(900).size)).toBeGreaterThan(parseFloat(solarWash(50).size));
    expect(solarWash(-5).mix).toBe(solarWash(0).mix);
  });
});

describe('pressureShift', () => {
  it('rides high when rising and low when falling', () => {
    expect(pressureShift('rising')).toBeLessThan(pressureShift('steady'));
    expect(pressureShift('falling')).toBeGreaterThan(pressureShift('steady'));
  });
});

describe('TILE_CLOUD_BASE', () => {
  it('keeps the light-theme tints above mid-luminance so they stay visible', () => {
    const lum = ([r, g, b]: [number, number, number]) => 0.299 * r + 0.587 * g + 0.114 * b;
    for (const tint of ['neutral', 'warm', 'cool'] as const) {
      expect(lum(TILE_CLOUD_BASE[tint].dark)).toBeLessThan(0.5);
      expect(lum(TILE_CLOUD_BASE[tint].light)).toBeGreaterThan(0.5);
    }
  });
});

describe('tile haze presets', () => {
  it('scale with their reading', () => {
    expect(uvHaze(11).opacity).toBeGreaterThan(uvHaze(0).opacity);
    expect(uvHaze(11).cover).toBeGreaterThan(uvHaze(0).cover);
    expect(solarHaze(900).opacity).toBeGreaterThan(solarHaze(50).opacity);
  });

  it('give each tile a different character', () => {
    const day = celestialHaze(true);
    const night = celestialHaze(false);
    expect(day.tint).toBe('warm');
    expect(night.tint).toBe('cool');
    expect(night.speed).toBeLessThan(day.speed);
    // The pressure veil is the widest and the stillest of the set.
    expect(pressureHaze('steady').scale).toBeGreaterThan(day.scale);
  });

  it('make a falling pressure move faster and cooler than a rising one', () => {
    const rising = pressureHaze('rising');
    const falling = pressureHaze('falling');
    expect(falling.wind).toBeGreaterThan(rising.wind);
    expect(falling.tint).toBe('cool');
    expect(rising.tint).toBe('warm');
  });

  it('clamp out-of-range input', () => {
    expect(uvHaze(-3)).toEqual(uvHaze(0));
    expect(uvHaze(400)).toEqual(uvHaze(12));
    expect(solarHaze(9000)).toEqual(solarHaze(1000));
  });
});

describe('rain tile wetness', () => {
  it('counts a wet night as well as a live downpour', () => {
    // Either signal on its own has to register: 15 mm already fallen, or a
    // rate of 12 mm/h right now.
    expect(wetness(15, 0)).toBeCloseTo(1, 5);
    expect(wetness(0, 12)).toBeCloseTo(1, 5);
    expect(wetness(0, 0)).toBe(0);
    expect(wetness(60, 0)).toBe(1);
  });

  it('thickens and speeds up the haze with the wetness', () => {
    const dry = wetHaze(0, 0);
    const soaked = wetHaze(18, 9);
    expect(soaked.opacity).toBeGreaterThan(dry.opacity);
    expect(soaked.cover).toBeGreaterThan(dry.cover);
    expect(soaked.wind).toBeGreaterThan(dry.wind);
    // A dry tile still gets a haze, otherwise it is the bare card again.
    expect(dry.opacity).toBeGreaterThan(0.03);
  });

  it('returns a CSS-ready wash percentage', () => {
    expect(wetWash(0, 0)).toBe('4%');
    expect(parseFloat(wetWash(18, 9))).toBeGreaterThan(parseFloat(wetWash(1, 0)));
  });
});

describe('dropletParams', () => {
  it('gets heavier with the rain rate and stays capped', () => {
    const drizzle = dropletParams(0.5);
    const downpour = dropletParams(24);
    expect(downpour.intensity).toBeGreaterThan(drizzle.intensity);
    expect(downpour.fallSpeed).toBeGreaterThan(drizzle.fallSpeed);
    expect(dropletParams(500)).toEqual(dropletParams(30));
    expect(downpour.intensity).toBeLessThanOrEqual(0.75);
    // A drizzle still has to be visible.
    expect(drizzle.intensity).toBeGreaterThan(0.25);
  });
});
