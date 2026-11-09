import { describe, it, expect } from 'vitest';
import { CLOUD_BASE, mistParams, pressureShift, solarWash, uvGlow, windStreak } from './ambience';

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
