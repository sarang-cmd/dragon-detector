import { describe, it, expect } from 'vitest';
import { calculateSunTimes, formatSunTime } from './sun';

describe('calculateSunTimes for Dresden', () => {
  const dresdenLat = 51.0504;
  const dresdenLng = 13.7373;

  it('calculates reasonable sunrise and sunset times on equinox (March 20)', () => {
    // Equinox ~06:00 sunrise and ~18:00 sunset UTC (or ~06:00/18:00 local)
    const date = new Date('2026-03-20T12:00:00Z');
    const { sunrise, sunset, isPolarDay, isPolarNight } = calculateSunTimes(
      date,
      dresdenLat,
      dresdenLng
    );

    expect(isPolarDay).toBe(false);
    expect(isPolarNight).toBe(false);
    expect(sunrise).not.toBeNull();
    expect(sunset).not.toBeNull();

    if (sunrise && sunset) {
      // In UTC, Dresden is ~1h ahead of UTC in winter/equinox (CET)
      // Sunrise ~05:15 UTC (06:15 CET), Sunset ~17:15 UTC (18:15 CET)
      const sunHours = (sunset.getTime() - sunrise.getTime()) / (1000 * 60 * 60);
      expect(sunHours).toBeGreaterThan(11.5);
      expect(sunHours).toBeLessThan(12.5);
    }
  });

  it('calculates long days on summer solstice (June 21)', () => {
    const date = new Date('2026-06-21T12:00:00Z');
    const { sunrise, sunset } = calculateSunTimes(
      date,
      dresdenLat,
      dresdenLng
    );
    expect(sunrise).not.toBeNull();
    expect(sunset).not.toBeNull();

    if (sunrise && sunset) {
      const sunHours = (sunset.getTime() - sunrise.getTime()) / (1000 * 60 * 60);
      // Dresden summer day length is around 16.5 hours
      expect(sunHours).toBeGreaterThan(16);
      expect(sunHours).toBeLessThan(17);
    }
  });

  it('formatSunTime returns formatted HH:mm string', () => {
    const d = new Date('2026-03-20T06:14:00Z');
    const str = formatSunTime(d);
    expect(str).toMatch(/^\d{2}:\d{2}$/);
    expect(formatSunTime(null)).toBe('--:--');
  });
});
