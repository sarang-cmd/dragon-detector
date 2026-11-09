import { describe, it, expect } from 'vitest';
import {
  berlinHourKey,
  currentHourIndex,
  mapCurrentReading,
  mapHourlyToHistory,
  type OpenMeteoResponse,
} from './openmeteo';
import { WeatherReadingSchema } from '@/lib/types';

function fixture(): OpenMeteoResponse {
  const base = '2026-10-16T';
  const hours = Array.from({ length: 24 }, (_, i) => `${base}${String(i).padStart(2, '0')}:00`);
  const val = (v: number) => hours.map(() => v);
  const ramp = hours.map((_, i) => 8 + i * 0.3);
  return {
    current: {
      time: '2026-10-16T14:20',
      temperature_2m: 14.5,
      relative_humidity_2m: 68,
      apparent_temperature: 13.0,
      precipitation: 0.4,
      pressure_msl: 1013.2,
      wind_speed_10m: 12.5,
      wind_direction_10m: 225,
      wind_gusts_10m: 20.1,
    },
    hourly: {
      time: hours,
      temperature_2m: ramp,
      relative_humidity_2m: val(68),
      dew_point_2m: val(8.5),
      precipitation: hours.map((_, i) => (i < 14 ? 0.1 : 0)),
      precipitation_probability: val(20),
      pressure_msl: val(1013.2),
      wind_speed_10m: val(12.5),
      wind_direction_10m: val(225),
      wind_gusts_10m: val(20.1),
      uv_index: val(2.5),
      shortwave_radiation: val(310),
    },
  };
}

describe('berlinHourKey / currentHourIndex', () => {
  it('picks the slot at or before now', () => {
    const times = ['2026-10-16T12:00', '2026-10-16T13:00', '2026-10-16T14:00'];
    expect(currentHourIndex(times, '2026-10-16T13:30')).toBe(1);
    expect(currentHourIndex(times, '2026-10-16T14:00')).toBe(2);
    expect(currentHourIndex(times, '2026-10-16T11:00')).toBe(0);
  });

  it('formats Berlin time as YYYY-MM-DDTHH', () => {
    // 12:00 UTC in October = 14:00 in Berlin (CEST).
    expect(berlinHourKey(new Date('2026-10-16T12:00:00Z'))).toBe('2026-10-16T14');
  });
});

describe('mapCurrentReading', () => {
  it('maps fields and validates against the reading schema', () => {
    const r = mapCurrentReading(fixture(), new Date('2026-10-16T12:25:00Z'));
    expect(() => WeatherReadingSchema.parse(r)).not.toThrow();
    expect(r.source).toBe('openmeteo');
    expect(r.temperatureC).toBe(14.5);
    expect(r.feelsLikeC).toBe(13);
    expect(r.humidityPct).toBe(68);
    expect(r.pressureHpa).toBe(1013.2);
    expect(r.windSpeedKmh).toBe(12.5);
    expect(r.windDirectionDeg).toBe(225);
    expect(r.rainRateMmH).toBe(0.4);
    expect(r.uvIndex).toBe(2.5);
    expect(r.solarWm2).toBe(310);
    expect(r.dewPointC).toBe(8.5);
  });

  it('sums today hourly precipitation for the today total', () => {
    // 14 hours at 0.1mm each up to 14:00 Berlin.
    const r = mapCurrentReading(fixture(), new Date('2026-10-16T12:25:00Z'));
    expect(r.rainTodayMm).toBeCloseTo(1.4, 5);
  });

  it('falls back to hourly values when current block is missing', () => {
    const f = fixture();
    delete f.current;
    const r = mapCurrentReading(f, new Date('2026-10-16T12:25:00Z'));
    expect(() => WeatherReadingSchema.parse(r)).not.toThrow();
    expect(r.temperatureC).toBeCloseTo(8 + 14 * 0.3, 5);
  });
});

describe('mapHourlyToHistory', () => {
  it('filters to the window and maps fields', () => {
    const from = Date.parse('2026-10-16T10:00:00');
    const to = Date.parse('2026-10-16T12:00:00');
    const pts = mapHourlyToHistory(fixture(), from, to);
    expect(pts).toHaveLength(3);
    expect(pts[0].timestamp).toBe(new Date(Date.parse('2026-10-16T10:00:00')).toISOString());
    expect(pts[0].temperatureC).toBeCloseTo(11, 5);
    expect(pts[0].uvIndex).toBe(2.5);
  });

  it('skips slots with missing required fields', () => {
    const f = fixture();
    f.hourly!.temperature_2m![11] = null;
    const pts = mapHourlyToHistory(
      f,
      Date.parse('2026-10-16T10:00:00'),
      Date.parse('2026-10-16T12:00:00')
    );
    expect(pts.map((p) => p.timestamp)).not.toContain(
      new Date(Date.parse('2026-10-16T11:00:00')).toISOString()
    );
  });
});
