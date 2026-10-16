import { describe, it, expect } from 'vitest';
import {
  buildStatisticalOutlook,
  displayTemp,
  type ForecastHour,
} from './outlook';
import type { HistoryPoint, WeatherReading } from './types';

function reading(over: Partial<WeatherReading> = {}): WeatherReading {
  return {
    timestamp: '2026-10-16T12:00:00.000Z',
    temperatureC: 10,
    humidityPct: 70,
    pressureHpa: 1013,
    windSpeedKmh: 8,
    windGustKmh: 12,
    windDirectionDeg: 180,
    rainRateMmH: 0,
    rainTodayMm: 0,
    source: 'mock',
    ...over,
  } as WeatherReading;
}

function hist(temps: number[]): HistoryPoint[] {
  return temps.map(
    (temperatureC, i) =>
      ({
        timestamp: `2026-10-16T${String(i).padStart(2, '0')}:00:00.000Z`,
        temperatureC,
      }) as HistoryPoint
  );
}

function fcst(temps: number[], probs: number[]): ForecastHour[] {
  return temps.map((tempC, i) => ({
    time: `2026-10-16T${String(12 + i).padStart(2, '0')}:00`,
    tempC,
    precipProb: probs[i] ?? 0,
    precipMm: 0,
    windKmh: 8,
    humidityPct: 70,
  }));
}

describe('buildStatisticalOutlook', () => {
  it('detects a warming trend from the forecast', () => {
    const out = buildStatisticalOutlook(
      reading({ temperatureC: 10 }),
      hist([9, 9.2, 9.4, 9.6, 9.8, 10, 10, 10]),
      fcst([10, 10.5, 11, 11.5, 12, 12.5, 13, 13, 13, 13, 13, 13], Array(12).fill(5)),
      'metric'
    );
    expect(out.tempDirection).toBe('rising');
    expect(out.tempChange6h).toBeCloseTo(2.5, 5);
    expect(out.headline).toContain('Warming up');
    expect(out.headline).toContain('Staying dry');
  });

  it('detects rain onset and reports the hour', () => {
    const probs = [5, 10, 20, 45, 70, 60, 30, 10, 5, 0, 0, 0];
    const out = buildStatisticalOutlook(
      reading({ temperatureC: 10 }),
      hist(Array(12).fill(10)),
      fcst(Array(12).fill(10), probs),
      'metric'
    );
    expect(out.rainExpected).toBe(true);
    expect(out.maxPrecipProb).toBe(70);
    expect(out.rainOnsetInHours).toBe(3);
    expect(out.headline).toContain('in about 3 hours');
  });

  it('converts the delta to Fahrenheit in imperial mode', () => {
    const out = buildStatisticalOutlook(
      reading({ temperatureC: 10 }),
      hist(Array(12).fill(10)),
      fcst([10, 10, 10, 10, 10, 7.8, 7, 7, 7, 7, 7, 7], Array(12).fill(0)),
      'imperial'
    );
    expect(out.tempDirection).toBe('falling');
    // -2.2 °C ≈ -4 °F
    expect(out.headline).toContain('4 °F');
  });

  it('notes rain that is already falling with a dry forecast', () => {
    const out = buildStatisticalOutlook(
      reading({ temperatureC: 10, rainRateMmH: 1.2 }),
      hist(Array(12).fill(10)),
      fcst(Array(12).fill(10), Array(12).fill(0)),
      'metric'
    );
    expect(out.rainExpected).toBe(false);
    expect(out.headline).toContain('easing off');
  });

  it('handles empty history and forecast without crashing', () => {
    const out = buildStatisticalOutlook(reading(), [], [], 'metric');
    expect(out.tempDirection).toBe('steady');
    expect(out.headline.length).toBeGreaterThan(0);
  });
});

describe('displayTemp', () => {
  it('rounds and converts', () => {
    expect(displayTemp(20.4, 'metric')).toBe('20°');
    expect(displayTemp(20, 'imperial')).toBe('68°');
    expect(displayTemp(null, 'metric')).toBe(null);
  });
});
