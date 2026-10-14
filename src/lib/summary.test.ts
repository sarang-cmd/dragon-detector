import { describe, it, expect } from 'vitest';
import { summarySentence, temperatureBand } from './summary';
import { compassWord, windScreenReaderText, windDirectionLabel } from './beaufort';

describe('summarySentence combinations (12+ scenarios)', () => {
  it('1. cold / dry / calm', () => {
    const res = summarySentence({
      temperatureC: 4.2,
      windSpeedKmh: 0,
      windGustKmh: 0,
      windDirectionDeg: 0,
      rainRateMmH: 0,
      rainTodayMm: 0,
      humidityPct: 45,
      pressureHpa: 1020,
    });
    expect(res.sentence).toContain('4 degrees and dry.');
    expect(res.sentence).toContain('Calm.');
    expect(res.sentence).toContain('Pressure steady.');
    expect(res.jacket).toBe('Warm coat.');
  });

  it('2. hot / humid / gusty', () => {
    const res = summarySentence({
      temperatureC: 31,
      feelsLikeC: 36,
      windSpeedKmh: 24,
      windGustKmh: 42,
      windDirectionDeg: 225, // SW
      rainRateMmH: 0,
      rainTodayMm: 0,
      humidityPct: 82,
      pressureHpa: 1008,
      pressureTrend: 'steady',
    });
    expect(res.sentence).toContain('31 degrees and humid.');
    expect(res.sentence).toContain('Feels like 36 degrees.');
    expect(res.sentence).toContain('Moderate breeze from the south-west at 24 km/h.');
    expect(res.sentence).toContain('Gusts to 42 km/h.');
    expect(res.sentence).toContain('Pressure steady.');
    expect(res.jacket).toBe('T-shirt and stay hydrated.');
  });

  it('3. storm with falling pressure', () => {
    const res = summarySentence({
      temperatureC: 11,
      windSpeedKmh: 68,
      windGustKmh: 95,
      windDirectionDeg: 270, // W
      rainRateMmH: 5,
      rainTodayMm: 12,
      humidityPct: 90,
      pressureHpa: 988,
      pressureTrend: 'falling',
    });
    expect(res.sentence).toContain('11 degrees and cool.');
    expect(res.sentence).toContain('from the west at 68 km/h.');
    expect(res.sentence).toContain('Gusts to 95 km/h.');
    expect(res.sentence).toContain('Steady rain.');
    expect(res.sentence).toContain('Pressure falling.');
    expect(res.jacket).toBe('Stay indoors if possible; severe wind.');
  });

  it('4. offline mode', () => {
    const res = summarySentence({
      temperatureC: 15,
      windSpeedKmh: 10,
      windGustKmh: 15,
      windDirectionDeg: 180,
      rainRateMmH: 0,
      rainTodayMm: 0,
      humidityPct: 60,
      isOffline: true,
    });
    expect(res.sentence).toBe('Station offline. Displaying last recorded observations.');
    expect(res.jacket).toBe('Check outdoor conditions directly.');
  });

  it('5. freezing with wind chill', () => {
    const res = summarySentence({
      temperatureC: -4,
      feelsLikeC: -10,
      windSpeedKmh: 22,
      windGustKmh: 30,
      windDirectionDeg: 45, // NE
      rainRateMmH: 0,
      rainTodayMm: 0,
      humidityPct: 70,
      pressureHpa: 1025,
    });
    expect(res.sentence).toContain('-4 degrees and freezing.');
    expect(res.sentence).toContain('Feels like -10 degrees.');
    expect(res.sentence).toContain('from the north-east at 22 km/h.');
    expect(res.sentence).toContain('Pressure steady.');
    expect(res.jacket).toBe('Coat, scarf and gloves.');
  });

  it('6. cool with steady rain', () => {
    const res = summarySentence({
      temperatureC: 13,
      windSpeedKmh: 8,
      windGustKmh: 8,
      windDirectionDeg: 180, // S
      rainRateMmH: 3.4,
      rainTodayMm: 7.2,
      humidityPct: 95,
      pressureHpa: 1005,
    });
    expect(res.sentence).toContain('13 degrees and cool.');
    expect(res.sentence).toContain('Steady rain.');
    expect(res.jacket).toBe('Rain jacket or umbrella.');
  });

  it('7. mild with rising pressure', () => {
    const res = summarySentence({
      temperatureC: 18,
      windSpeedKmh: 14,
      windGustKmh: 14,
      windDirectionDeg: 135, // SE
      rainRateMmH: 0,
      rainTodayMm: 0,
      humidityPct: 50,
      pressureHpa: 1018,
      pressureTrend: 'rising',
    });
    expect(res.sentence).toContain('18 degrees and dry.');
    expect(res.sentence).toContain('Gentle breeze from the south-east at 14 km/h.');
    expect(res.sentence).toContain('Pressure rising.');
    expect(res.jacket).toBe('No jacket needed.');
  });

  it('8. warm with drizzle', () => {
    const res = summarySentence({
      temperatureC: 24,
      windSpeedKmh: 5,
      windGustKmh: 5,
      windDirectionDeg: 90, // E
      rainRateMmH: 0.6,
      rainTodayMm: 0.6,
      humidityPct: 70,
      pressureHpa: 1014,
    });
    expect(res.sentence).toContain('24 degrees and warm.');
    expect(res.sentence).toContain('Drizzle.');
    expect(res.jacket).toBe('Rain jacket or umbrella.');
  });

  it('9. high wind without gust difference', () => {
    const res = summarySentence({
      temperatureC: 16,
      windSpeedKmh: 52,
      windGustKmh: 52,
      windDirectionDeg: 292.5, // WNW
      rainRateMmH: 0,
      rainTodayMm: 0,
      humidityPct: 45,
      pressureHpa: 1010,
    });
    expect(res.sentence).toContain('High wind from the west-northwest at 52 km/h.');
    expect(res.sentence).not.toContain('Gusts to');
  });

  it('10. gale with severe gusts', () => {
    const res = summarySentence({
      temperatureC: 8,
      windSpeedKmh: 64,
      windGustKmh: 92,
      windDirectionDeg: 315, // NW
      rainRateMmH: 0,
      rainTodayMm: 0,
      humidityPct: 60,
      pressureHpa: 995,
      pressureTrend: 'falling',
    });
    expect(res.sentence).toContain('Gale from the north-west at 64 km/h.');
    expect(res.sentence).toContain('Gusts to 92 km/h.');
    expect(res.jacket).toBe('Stay indoors if possible; severe wind.');
  });

  it('11. rain today but currently dry', () => {
    const res = summarySentence({
      temperatureC: 14,
      windSpeedKmh: 12,
      windGustKmh: 12,
      windDirectionDeg: 202.5, // SSW
      rainRateMmH: 0,
      rainTodayMm: 6.8,
      humidityPct: 68,
      pressureHpa: 1012,
    });
    expect(res.sentence).toContain('14 degrees and cool.');
    expect(res.sentence).toContain('6.8 mm of rain today.');
    expect(res.sentence).not.toContain('Steady rain.');
    expect(res.sentence).not.toContain('Drizzle.');
  });

  it('12. heavy rain storm', () => {
    const res = summarySentence({
      temperatureC: 7,
      windSpeedKmh: 35,
      windGustKmh: 50,
      windDirectionDeg: 225, // SW
      rainRateMmH: 14.2,
      rainTodayMm: 22.5,
      humidityPct: 98,
      pressureHpa: 990,
      pressureTrend: 'falling',
    });
    expect(res.sentence).toContain('7 degrees and cold.');
    expect(res.sentence).toContain('Heavy rain.');
    expect(res.sentence).toContain('Pressure falling.');
    expect(res.jacket).toBe('Warm waterproof coat and umbrella.');
  });

  it('13. missing pressure and feels-like (edge case)', () => {
    const res = summarySentence({
      temperatureC: 22,
      windSpeedKmh: 10,
      windGustKmh: 10,
      windDirectionDeg: 180,
      rainRateMmH: 0,
      rainTodayMm: 0,
      humidityPct: 55,
    });
    expect(res.sentence).toContain('22 degrees and dry.');
    expect(res.sentence).not.toContain('Feels like');
    expect(res.sentence).not.toContain('Pressure');
    expect(res.jacket).toBe('T-shirt weather.');
  });
});

describe('temperatureBand thresholds', () => {
  it('classifies temperature correctly across boundaries', () => {
    expect(temperatureBand(-5)).toBe('freezing');
    expect(temperatureBand(0)).toBe('cold');
    expect(temperatureBand(7.9)).toBe('cold');
    expect(temperatureBand(8)).toBe('cool');
    expect(temperatureBand(14.9)).toBe('cool');
    expect(temperatureBand(15)).toBe('mild');
    expect(temperatureBand(20.9)).toBe('mild');
    expect(temperatureBand(21)).toBe('warm');
    expect(temperatureBand(26.9)).toBe('warm');
    expect(temperatureBand(27)).toBe('hot');
    expect(temperatureBand(35)).toBe('hot');
  });
});

describe('compass word helper and screen reader text', () => {
  it('converts degrees to cardinal and ordinal words', () => {
    expect(compassWord(0)).toBe('North');
    expect(compassWord(22.5)).toBe('North-northeast');
    expect(compassWord(45)).toBe('North-east');
    expect(compassWord(67.5)).toBe('East-northeast');
    expect(compassWord(90)).toBe('East');
    expect(compassWord(112.5)).toBe('East-southeast');
    expect(compassWord(135)).toBe('South-east');
    expect(compassWord(157.5)).toBe('South-southeast');
    expect(compassWord(180)).toBe('South');
    expect(compassWord(202.5)).toBe('South-southwest');
    expect(compassWord(225)).toBe('South-west');
    expect(compassWord(247.5)).toBe('West-southwest');
    expect(compassWord(270)).toBe('West');
    expect(compassWord(292.5)).toBe('West-northwest');
    expect(compassWord(315)).toBe('North-west');
    expect(compassWord(337.5)).toBe('North-northwest');
    expect(compassWord(360)).toBe('North');
  });

  it('generates exact screen reader text required by docs/03', () => {
    const text = windScreenReaderText({
      directionDeg: 225,
      speed: 14,
      gust: 24,
      speedUnit: 'km/h',
    });
    expect(text).toBe(
      'Wind from the south-west, 14 kilometres per hour, gusting 24.'
    );
  });

  it('handles calm and steady wind screen reader text', () => {
    expect(
      windScreenReaderText({
        directionDeg: 180,
        speed: 0.4,
        gust: 0.5,
      })
    ).toBe('Calm wind, less than 1 kilometre per hour.');

    expect(
      windScreenReaderText({
        directionDeg: 90,
        speed: 15,
        gust: 15,
        speedUnit: 'km/h',
      })
    ).toBe('Wind from the east, 15 kilometres per hour.');
  });
});
