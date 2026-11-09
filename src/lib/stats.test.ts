import { describe, it, expect } from 'vitest';
import {
  computeStationStats,
  formatHours,
  formatSpan,
  type StationStats,
} from './stats';
import type { HistoryPoint } from './types';

/**
 * History is always metric; timestamps are ISO with an explicit offset.
 * `null` is allowed here on purpose: the stats engine must survive readings
 * whose sensor reported nothing, which real payloads do contain.
 */
function point(
  timestamp: string,
  over: Partial<Record<keyof HistoryPoint, number | null>> = {}
): HistoryPoint {
  return {
    timestamp,
    temperatureC: 10,
    humidityPct: 70,
    windSpeedKmh: 5,
    rainRateMmH: 0,
    ...over,
  } as HistoryPoint;
}

/** One reading per hour, starting at `startIso`. */
function hourly(
  startIso: string,
  count: number,
  shape: (i: number) => Partial<Record<keyof HistoryPoint, number | null>> = () => ({})
): HistoryPoint[] {
  const start = Date.parse(startIso);
  const out: HistoryPoint[] = [];
  for (let i = 0; i < count; i++) {
    out.push(point(new Date(start + i * 3_600_000).toISOString(), shape(i)));
  }
  return out;
}

describe('computeStationStats — extremes', () => {
  const points = [
    point('2026-11-09T10:00:00.000Z', { temperatureC: 1 }),
    point('2026-11-09T11:00:00.000Z', { temperatureC: 5 }),
    point('2026-11-09T12:00:00.000Z', { temperatureC: 3 }),
  ];

  it('reports min, max, mean and when they happened', () => {
    const t = computeStationStats(points).temperature;
    expect(t).not.toBeNull();
    expect(t?.min).toBe(1);
    expect(t?.max).toBe(5);
    expect(t?.avg).toBeCloseTo(3, 5);
    expect(t?.minTime).toBe('2026-11-09T10:00:00.000Z');
    expect(t?.maxTime).toBe('2026-11-09T11:00:00.000Z');
    expect(t?.count).toBe(3);
  });

  it('skips readings where the sensor is missing instead of counting a zero', () => {
    const withGap = [
      point('2026-11-09T10:00:00.000Z', { temperatureC: 1 }),
      point('2026-11-09T11:00:00.000Z', { temperatureC: null }),
      point('2026-11-09T12:00:00.000Z', { temperatureC: 3 }),
    ];
    const t = computeStationStats(withGap).temperature;
    expect(t?.count).toBe(2);
    expect(t?.avg).toBe(2);
  });

  it('leaves a series null when the window has no data for it', () => {
    const stats = computeStationStats(points);
    expect(stats.uv).toBeNull();
    expect(stats.solar).toBeNull();
    expect(stats.pressure).toBeNull();
  });

  it('sorts unsorted input before comparing times', () => {
    const shuffled = [points[2], points[0], points[1]];
    const stats = computeStationStats(shuffled);
    expect(stats.temperature?.minTime).toBe('2026-11-09T10:00:00.000Z');
    expect(stats.coverage.from).toBe('2026-11-09T10:00:00.000Z');
    expect(stats.coverage.to).toBe('2026-11-09T12:00:00.000Z');
  });
});

describe('computeStationStats — coverage', () => {
  it('is 100% for a complete hourly series', () => {
    const stats = computeStationStats(hourly('2026-11-09T00:00:00.000Z', 5));
    expect(stats.coverage.points).toBe(5);
    expect(stats.coverage.stepHours).toBeCloseTo(1, 5);
    expect(stats.coverage.expected).toBe(5);
    expect(stats.coverage.percent).toBeCloseTo(100, 5);
    expect(stats.coverage.spanHours).toBeCloseTo(4, 5);
  });

  it('drops below 100% when readings are missing', () => {
    const full = hourly('2026-11-09T00:00:00.000Z', 5);
    const holed = [full[0], full[1], full[3], full[4]];
    const stats = computeStationStats(holed);
    expect(stats.coverage.points).toBe(4);
    expect(stats.coverage.expected).toBe(5);
    expect(stats.coverage.percent).toBeCloseTo(80, 5);
  });

  it('survives an empty window', () => {
    const stats = computeStationStats([]);
    expect(stats.coverage).toEqual({
      points: 0,
      expected: 0,
      percent: 0,
      stepHours: 0,
      from: null,
      to: null,
      spanHours: 0,
    });
    expect(stats.temperature).toBeNull();
    expect(stats.daily).toEqual([]);
    expect(stats.streaks.longestDryHours).toBe(0);
    expect(stats.wind.prevailingLabel).toBe('—');
  });
});

describe('computeStationStats — daily table', () => {
  // 21:00Z and 22:00Z are still 9 November in Berlin (UTC+1);
  // 23:00Z has already crossed into 10 November.
  const points = [
    point('2026-11-09T21:00:00.000Z', { temperatureC: 4, rainRateMmH: 1.2 }),
    point('2026-11-09T22:00:00.000Z', { temperatureC: 8, rainRateMmH: 0 }),
    point('2026-11-09T23:00:00.000Z', { temperatureC: 2, rainRateMmH: 2 }),
  ];

  it('groups by Berlin calendar day, not UTC day', () => {
    const { daily } = computeStationStats(points);
    expect(daily.map((d) => d.date)).toEqual(['2026-11-09', '2026-11-10']);
    expect(daily[0].points).toBe(2);
    expect(daily[1].points).toBe(1);
  });

  it('summarises each day', () => {
    const { daily } = computeStationStats(points);
    expect(daily[0].min).toBe(4);
    expect(daily[0].max).toBe(8);
    expect(daily[0].avg).toBe(6);
    expect(daily[0].rainMm).toBeCloseTo(1.2, 5);
    expect(daily[1].rainMm).toBeCloseTo(2, 5);
  });

  it('picks the wettest day and counts wet/dry days', () => {
    const { rain } = computeStationStats(points);
    expect(rain.wettestDay?.date).toBe('2026-11-10');
    expect(rain.wetDays).toBe(2);
    expect(rain.dryDays).toBe(0);
    expect(rain.windowMm).toBeCloseTo(3.2, 5);
  });
});

describe('computeStationStats — hourly profile', () => {
  it('averages by Berlin hour of day over the whole window', () => {
    // Two days, same clock time (12:00 Berlin = 11:00Z in November).
    const points = [
      point('2026-11-09T11:00:00.000Z', { temperatureC: 10 }),
      point('2026-11-10T11:00:00.000Z', { temperatureC: 20 }),
    ];
    const { hourly } = computeStationStats(points);
    const noon = hourly.find((h) => h.hour === 12);
    expect(noon?.avgTemp).toBeCloseTo(15, 5);
    expect(noon?.count).toBe(2);
    // Every other hour band has no samples.
    expect(hourly.filter((h) => h.count > 0)).toHaveLength(1);
  });

  it('always returns 24 bands so the chart has a stable axis', () => {
    expect(computeStationStats([]).hourly).toHaveLength(24);
  });
});

describe('computeStationStats — wind', () => {
  it('splits directions into eight compass sectors', () => {
    const dirs = [0, 45, 90, 135, 180, 225, 270, 315];
    const points = dirs.map((d, i) =>
      point(`2026-11-09T${String(i).padStart(2, '0')}:00:00.000Z`, {
        windDirectionDeg: d,
      })
    );
    const { sectors } = computeStationStats(points).wind;
    expect(sectors.map((s) => s.label)).toEqual([
      'N',
      'NE',
      'E',
      'SE',
      'S',
      'SW',
      'W',
      'NW',
    ]);
    expect(sectors.every((s) => Math.abs(s.percent - 12.5) < 1e-9)).toBe(true);
  });

  it('wraps 350° into the north sector', () => {
    const points = [
      point('2026-11-09T10:00:00.000Z', { windDirectionDeg: 350 }),
      point('2026-11-09T11:00:00.000Z', { windDirectionDeg: 10 }),
    ];
    const { sectors } = computeStationStats(points).wind;
    expect(sectors[0].count).toBe(2);
  });

  it('counts calm readings and keeps the strongest gust', () => {
    const points = [
      point('2026-11-09T10:00:00.000Z', { windSpeedKmh: 0.2, windGustKmh: 3 }),
      point('2026-11-09T11:00:00.000Z', { windSpeedKmh: 12, windGustKmh: 31 }),
      point('2026-11-09T12:00:00.000Z', { windSpeedKmh: 8, windGustKmh: 20 }),
    ];
    const { wind } = computeStationStats(points);
    expect(wind.calmPercent).toBeCloseTo(100 / 3, 5);
    expect(wind.maxGust).toBe(31);
    expect(wind.maxGustTime).toBe('2026-11-09T11:00:00.000Z');
    expect(wind.avgSpeed).toBeCloseTo((0.2 + 12 + 8) / 3, 5);
  });
});

describe('computeStationStats — streaks', () => {
  const points = [
    point('2026-11-09T10:00:00.000Z', { rainRateMmH: 0, temperatureC: -1 }),
    point('2026-11-09T11:00:00.000Z', { rainRateMmH: 0, temperatureC: -2 }),
    point('2026-11-09T12:00:00.000Z', { rainRateMmH: 0, temperatureC: 1 }),
    point('2026-11-09T13:00:00.000Z', { rainRateMmH: 2, temperatureC: 3 }),
    point('2026-11-09T14:00:00.000Z', { rainRateMmH: 2, temperatureC: 0.5 }),
    point('2026-11-09T15:00:00.000Z', { rainRateMmH: 0, temperatureC: -3 }),
  ];

  it('measures dry and wet runs in hours', () => {
    const { streaks } = computeStationStats(points);
    expect(streaks.dryHours).toBe(4);
    expect(streaks.longestDryHours).toBe(3);
    expect(streaks.currentDryHours).toBe(1);
    expect(streaks.wetHours).toBe(2);
    expect(streaks.longestWetHours).toBe(2);
    expect(streaks.currentWetHours).toBe(0);
  });

  it('measures frost runs', () => {
    const { streaks } = computeStationStats(points);
    expect(streaks.frostHours).toBe(3);
    expect(streaks.longestFrostHours).toBe(2);
    expect(streaks.currentFrostHours).toBe(1);
  });

  it('breaks a streak at a missing sensor instead of bridging it', () => {
    const holed = [
      point('2026-11-09T10:00:00.000Z', { temperatureC: -1 }),
      point('2026-11-09T11:00:00.000Z', { temperatureC: null }),
      point('2026-11-09T12:00:00.000Z', { temperatureC: -2 }),
    ];
    const { streaks } = computeStationStats(holed);
    expect(streaks.frostHours).toBe(2);
    expect(streaks.longestFrostHours).toBe(1);
  });
});

describe('formatting helpers', () => {
  it('formats spans', () => {
    expect(formatSpan(0)).toBe('no data');
    expect(formatSpan(0.5)).toBe('30 min');
    expect(formatSpan(18)).toBe('18 h');
    expect(formatSpan(72)).toBe('3.0 days');
  });

  it('formats durations', () => {
    expect(formatHours(0)).toBe('0 min');
    expect(formatHours(0.5)).toBe('30 min');
    expect(formatHours(2)).toBe('2 h');
    expect(formatHours(2.5)).toBe('2 h 30 min');
  });
});

describe('station stats shape', () => {
  it('exposes every series the page renders', () => {
    const stats: StationStats = computeStationStats(
      hourly('2026-11-09T00:00:00.000Z', 3, (i) => ({
        feelsLikeC: i,
        dewPointC: i,
        humidityPct: 60 + i,
        pressureHpa: 1000 + i,
        windGustKmh: 10 + i,
        uvIndex: i,
        solarWm2: 100 * i,
      }))
    );
    expect(stats.feelsLike?.max).toBe(2);
    expect(stats.dewPoint?.max).toBe(2);
    expect(stats.humidity?.min).toBe(60);
    expect(stats.pressure?.max).toBe(1002);
    expect(stats.gust?.max).toBe(12);
    expect(stats.uv?.max).toBe(2);
    expect(stats.solar?.max).toBe(200);
  });
});
