import { describe, it, expect } from 'vitest';
import {
  computeStats,
  buildHistoryCsv,
  csvFileName,
  paddedDomain,
  CSV_UNITS_COMMENT,
} from './history';
import type { HistoryPoint } from './types';

function point(over: Partial<HistoryPoint> & { timestamp: string }): HistoryPoint {
  return {
    temperatureC: 10,
    humidityPct: 60,
    windSpeedKmh: 8,
    rainRateMmH: 0,
    ...over,
  };
}

describe('computeStats', () => {
  it('returns min/max/avg/change with timestamps', () => {
    const stats = computeStats([
      { timestamp: '2026-01-01T00:00:00.000Z', value: 10 },
      { timestamp: '2026-01-01T01:00:00.000Z', value: 12 },
      { timestamp: '2026-01-01T02:00:00.000Z', value: 8 },
    ]);
    expect(stats).not.toBeNull();
    expect(stats!.min).toBe(8);
    expect(stats!.max).toBe(12);
    expect(stats!.avg).toBeCloseTo(10, 5);
    expect(stats!.change).toBe(-2);
    expect(stats!.minTime).toBe('2026-01-01T02:00:00.000Z');
    expect(stats!.maxTime).toBe('2026-01-01T01:00:00.000Z');
    expect(stats!.count).toBe(3);
  });

  it('skips null/NaN values', () => {
    const stats = computeStats([
      { timestamp: '2026-01-01T00:00:00.000Z', value: null },
      { timestamp: '2026-01-01T01:00:00.000Z', value: Number.NaN },
      { timestamp: '2026-01-01T02:00:00.000Z', value: 5 },
      { timestamp: '2026-01-01T03:00:00.000Z', value: 7 },
    ]);
    expect(stats!.count).toBe(2);
    expect(stats!.min).toBe(5);
    expect(stats!.max).toBe(7);
    expect(stats!.avg).toBe(6);
  });

  it('returns null for empty input', () => {
    expect(computeStats([])).toBeNull();
    expect(
      computeStats([{ timestamp: '2026-01-01T00:00:00.000Z', value: null }])
    ).toBeNull();
  });
});

describe('paddedDomain', () => {
  it('pads a flat series so tiny changes are visible', () => {
    const [lo, hi] = paddedDomain([1013.1, 1013.2, 1013.15]);
    expect(lo).toBeLessThan(1013.1);
    expect(hi).toBeGreaterThan(1013.2);
  });

  it('falls back for empty input', () => {
    expect(paddedDomain([])).toEqual([0, 1]);
  });
});

describe('buildHistoryCsv', () => {
  it('writes the units comment, header and one row per point', () => {
    const csv = buildHistoryCsv([
      point({
        timestamp: '2026-01-02T10:00:00.000Z',
        temperatureC: 12.5,
        humidityPct: 70,
        pressureHpa: 1013.2,
        windSpeedKmh: 14,
        windGustKmh: 20,
        windDirectionDeg: 220,
        rainRateMmH: 0.5,
        rainTodayMm: 2.1,
        uvIndex: 1.2,
        solarWm2: 150,
      }),
    ]);
    const lines = csv.trim().split('\n');
    expect(lines[0]).toBe(CSV_UNITS_COMMENT);
    expect(lines[1]).toBe(
      'timestamp_iso,temperature_c,humidity_pct,pressure_hpa,wind_kmh,gust_kmh,wind_dir_deg,rain_rate_mm_h,rain_today_mm,uv,solar_w_m2'
    );
    expect(lines[2]).toBe(
      '2026-01-02T10:00:00.000Z,12.5,70,1013.2,14,20,220,0.5,2.1,1.2,150'
    );
  });

  it('leaves empty cells for missing optional fields', () => {
    const csv = buildHistoryCsv([point({ timestamp: '2026-01-02T10:00:00.000Z' })]);
    const row = csv.trim().split('\n')[2];
    // timestamp + temp/humidity/wind/rain present; optionals empty.
    expect(row).toBe('2026-01-02T10:00:00.000Z,10,60,,8,,,0,,,');
    const cells = row.split(',');
    expect(cells).toHaveLength(11);
    expect(cells[3]).toBe(''); // pressure_hpa
    expect(cells[5]).toBe(''); // gust_kmh
    expect(cells[6]).toBe(''); // wind_dir_deg
    expect(cells[8]).toBe(''); // rain_today_mm
    expect(cells[9]).toBe(''); // uv
    expect(cells[10]).toBe(''); // solar_w_m2
  });

  it('orders rows by timestamp ascending', () => {
    const csv = buildHistoryCsv([
      point({ timestamp: '2026-01-02T12:00:00.000Z', temperatureC: 14 }),
      point({ timestamp: '2026-01-02T10:00:00.000Z', temperatureC: 10 }),
    ]);
    const rows = csv.trim().split('\n').slice(2);
    expect(rows[0].startsWith('2026-01-02T10:00:00.000Z,10')).toBe(true);
    expect(rows[1].startsWith('2026-01-02T12:00:00.000Z,14')).toBe(true);
  });

  it('escapes commas, quotes and newlines in cells', () => {
    const csv = buildHistoryCsv([
      point({ timestamp: '2026-01-02T10:00:00.000Z",with,comma' }),
    ]);
    const row = csv.trim().split('\n')[2];
    expect(row.startsWith('"2026-01-02T10:00:00.000Z"",with,comma"')).toBe(true);
  });
});

describe('csvFileName', () => {
  it('uses the dis-weather_<range>_<date>.csv pattern', () => {
    expect(csvFileName('24h', '2026-10-15')).toBe('dis-weather_24h_2026-10-15.csv');
    expect(csvFileName('7d', '2026-10-15')).toBe('dis-weather_7d_2026-10-15.csv');
  });
});
