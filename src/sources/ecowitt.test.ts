import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  normalizeRealTime,
  normalizeHistory,
  hasEcowittCredentials,
  missingCredentialsMessage,
  toIsoTime,
  buildHistoryQuery,
} from './ecowitt';

const T0 = 1700000000; // 2023-11-14T22:13:20Z

function realTimePayload(units: {
  temp: string;
  speed: string;
  rain: string;
  pressure: string;
  tempValue: string;
  speedValue: string;
  rainValue: string;
  pressureValue: string;
}) {
  return JSON.stringify({
    code: 0,
    msg: 'success',
    time: String(T0),
    data: {
      outdoor: {
        temperature: { time: String(T0), unit: units.temp, value: units.tempValue },
        feels_like: { time: String(T0), unit: units.temp, value: units.tempValue },
        dew_point: { time: String(T0), unit: units.temp, value: units.tempValue },
        humidity: { time: String(T0), unit: '%', value: '70' },
      },
      wind: {
        wind_speed: { time: String(T0), unit: units.speed, value: units.speedValue },
        wind_gust: { time: String(T0), unit: units.speed, value: units.speedValue },
        wind_direction: { time: String(T0), unit: 'º', value: '213' },
      },
      rainfall: {
        rain_rate: { time: String(T0), unit: `${units.rain}/h`, value: '0.0' },
        hourly: { time: String(T0), unit: units.rain, value: '0.0' },
        daily: { time: String(T0), unit: units.rain, value: units.rainValue },
        weekly: { time: String(T0), unit: units.rain, value: units.rainValue },
      },
      pressure: {
        relative: { time: String(T0), unit: units.pressure, value: units.pressureValue },
      },
      solar_and_uvi: {
        solar: { time: String(T0), unit: 'W/m2', value: '128.5' },
        uvi: { time: String(T0), unit: '', value: '1' },
      },
    },
  });
}

describe('normalizeRealTime', () => {
  it('keeps metric values as-is (unit IDs 1/3/7/12 already return metric)', () => {
    const reading = normalizeRealTime(
      realTimePayload({
        temp: '℃',
        speed: 'km/h',
        rain: 'mm',
        pressure: 'hPa',
        tempValue: '11.3',
        speedValue: '8.2',
        rainValue: '2.4',
        pressureValue: '1013.2',
      })
    );

    expect(reading.source).toBe('ecowitt');
    expect(reading.temperatureC).toBeCloseTo(11.3, 5);
    expect(reading.windSpeedKmh).toBeCloseTo(8.2, 5);
    expect(reading.pressureHpa).toBeCloseTo(1013.2, 5);
    expect(reading.rainTodayMm).toBeCloseTo(2.4, 5);
    expect(reading.humidityPct).toBe(70);
    expect(reading.windDirectionDeg).toBe(213);
  });

  it('converts imperial values when the cloud ignores the unit IDs', () => {
    const reading = normalizeRealTime(
      realTimePayload({
        temp: '℉',
        speed: 'mph',
        rain: 'in',
        pressure: 'inHg',
        tempValue: '52.34',
        speedValue: '5.1',
        rainValue: '0.09',
        pressureValue: '29.92',
      })
    );

    expect(reading.temperatureC).toBeCloseTo(11.3, 1);
    expect(reading.feelsLikeC).toBeCloseTo(11.3, 1);
    expect(reading.windSpeedKmh).toBeCloseTo(8.2, 1);
    expect(reading.pressureHpa).toBeCloseTo(1013.2, 1);
    expect(reading.rainTodayMm).toBeCloseTo(2.29, 1);
  });

  it('treats unix seconds as seconds, not milliseconds', () => {
    const reading = normalizeRealTime(
      realTimePayload({
        temp: '℃',
        speed: 'km/h',
        rain: 'mm',
        pressure: 'hPa',
        tempValue: '11.3',
        speedValue: '8.2',
        rainValue: '2.4',
        pressureValue: '1013.2',
      })
    );
    expect(reading.timestamp).toBe(new Date(T0 * 1000).toISOString());
  });

  it('throws a secret-free error on a non-zero API code', () => {
    const raw = JSON.stringify({ code: 45001, msg: 'Invalid API key', data: {} });
    expect(() => normalizeRealTime(raw)).toThrow(/45001/);
  });
});

describe('normalizeHistory', () => {
  it('parses the documented { unit, list } shape into ascending points', () => {
    const raw = JSON.stringify({
      code: 0,
      msg: 'success',
      data: {
        outdoor: {
          temperature: {
            unit: '℃',
            list: { [String(T0 + 300)]: '11.5', [String(T0)]: '11.3' },
          },
          humidity: { unit: '%', list: { [String(T0)]: '70', [String(T0 + 300)]: '69' } },
        },
        wind: {
          wind_speed: { unit: 'km/h', list: { [String(T0)]: '8.2', [String(T0 + 300)]: '9.0' } },
        },
        rainfall: {
          rain_rate: { unit: 'mm/h', list: { [String(T0)]: '0.0', [String(T0 + 300)]: '0.4' } },
        },
        pressure: {
          relative: { unit: 'hPa', list: { [String(T0)]: '1013.2', [String(T0 + 300)]: '1013.0' } },
        },
      },
    });

    const points = normalizeHistory(raw);
    expect(points).toHaveLength(2);
    expect(points[0].timestamp).toBe(new Date(T0 * 1000).toISOString());
    expect(points[1].timestamp).toBe(new Date((T0 + 300) * 1000).toISOString());
    expect(points[0].temperatureC).toBeCloseTo(11.3, 5);
    expect(points[1].temperatureC).toBeCloseTo(11.5, 5);
    expect(points[1].humidityPct).toBe(69);
    expect(points[1].windSpeedKmh).toBeCloseTo(9.0, 5);
    expect(points[0].pressureHpa).toBeCloseTo(1013.2, 5);
    expect(points[1].rainRateMmH).toBeCloseTo(0.4, 5);
  });

  it('converts imperial history series', () => {
    const raw = JSON.stringify({
      code: 0,
      data: {
        outdoor: { temperature: { unit: '℉', list: { [String(T0)]: '52.34' } } },
        wind: { wind_speed: { unit: 'mph', list: { [String(T0)]: '5.1' } } },
        pressure: { relative: { unit: 'inHg', list: { [String(T0)]: '29.92' } } },
      },
    });

    const [point] = normalizeHistory(raw);
    expect(point.temperatureC).toBeCloseTo(11.3, 1);
    expect(point.windSpeedKmh).toBeCloseTo(8.2, 1);
    expect(point.pressureHpa).toBeCloseTo(1013.2, 1);
  });

  it('still parses the legacy data.item array shape (values already metric)', () => {
    const raw = JSON.stringify({
      code: 0,
      data: {
        item: [
          {
            time: String(T0),
            temperature: '11.3',
            humidity: '70',
            wind_speed: '8.2',
            rain_rate: '0.0',
            relative_pressure: '1013.2',
          },
        ],
      },
    });

    const [point] = normalizeHistory(raw);
    expect(point.temperatureC).toBeCloseTo(11.3, 1);
    expect(point.windSpeedKmh).toBeCloseTo(8.2, 1);
    expect(point.pressureHpa).toBeCloseTo(1013.2, 1);
  });

  it('returns an empty list for an empty history response', () => {
    expect(normalizeHistory(JSON.stringify({ code: 0, data: {} }))).toEqual([]);
  });
});

describe('toIsoTime', () => {
  it('accepts seconds, milliseconds and missing values', () => {
    expect(toIsoTime(String(T0))).toBe(new Date(T0 * 1000).toISOString());
    expect(toIsoTime(T0 * 1000)).toBe(new Date(T0 * 1000).toISOString());
    expect(toIsoTime(undefined)).toBeTruthy();
  });
});

describe('credentials', () => {
  const saved = { ...process.env };

  beforeEach(() => {
    delete process.env.ECOWITT_APPLICATION_KEY;
    delete process.env.ECOWITT_API_KEY;
    delete process.env.ECOWITT_MAC;
  });

  afterEach(() => {
    process.env = { ...saved };
  });

  it('reports missing credentials without printing values', () => {
    expect(hasEcowittCredentials()).toBe(false);
    expect(missingCredentialsMessage()).toContain('ECOWITT_MAC');
  });

  it('is configured once all three vars are present', () => {
    process.env.ECOWITT_APPLICATION_KEY = 'app';
    process.env.ECOWITT_API_KEY = 'api';
    process.env.ECOWITT_MAC = 'AA:BB:CC:DD:EE:FF';
    expect(hasEcowittCredentials()).toBe(true);
  });

  it('builds a history query with datetime bounds and group call_back', () => {
    process.env.ECOWITT_APPLICATION_KEY = 'app';
    process.env.ECOWITT_API_KEY = 'api';
    process.env.ECOWITT_MAC = 'AA:BB:CC:DD:EE:FF';
    const url = new URL(buildHistoryQuery('24h', '2023-11-14 00:00:00', '2023-11-15 00:00:00'));
    expect(url.searchParams.get('start_date')).toBe('2023-11-14 00:00:00');
    expect(url.searchParams.get('cycle_type')).toBe('5min');
    expect(url.searchParams.get('call_back')).toBe('outdoor,wind,rainfall,pressure,solar_and_uvi');
    expect(url.searchParams.get('temp_unitid')).toBe('1');
    expect(url.searchParams.get('rainfall_unitid')).toBe('12');
  });
});
