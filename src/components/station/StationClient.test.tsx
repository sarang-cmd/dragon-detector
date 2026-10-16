import { describe, it, expect } from 'vitest';
import { sensors, sensorRowFor } from './StationClient';
import { mmToIn, hPaToInHg, kmhToMph, cToF } from '@/lib/units';

describe('station sensor table honors the unit toggle', () => {
  it('renders metric strings by default', () => {
    const temp = sensors.find((s) => s.name === 'Ambient Temperature')!;
    expect(sensorRowFor(temp, 'metric').range).toBe('-40 °C to +60 °C');
    expect(sensorRowFor(temp, 'metric').accuracy).toBe('±1.0 °C');
  });

  it('temperature range converts °C to °F', () => {
    const temp = sensors.find((s) => s.name === 'Ambient Temperature')!;
    const shown = sensorRowFor(temp, 'imperial');
    expect(shown.range).toBe(
      `${cToF(-40).toFixed(0)} °F to +${cToF(60).toFixed(0)} °F`
    );
    expect(shown.range).toBe('-40 °F to +140 °F');
  });

  it('rain range converts mm to in', () => {
    const rain = sensors.find((s) => s.name === 'Rainfall Accumulation')!;
    const shown = sensorRowFor(rain, 'imperial');
    expect(shown.range).toBe(`0 to ${mmToIn(9999).toFixed(2)} in`);
    expect(shown.range).toBe('0 to 393.66 in');
  });

  it('wind range converts km/h to mph', () => {
    const wind = sensors.find((s) => s.name === 'Wind Speed')!;
    const shown = sensorRowFor(wind, 'imperial');
    expect(shown.range).toBe(`0 to ${Math.round(kmhToMph(180))} mph`);
    expect(shown.range).toBe('0 to 112 mph');
  });

  it('pressure range converts hPa to inHg', () => {
    const pressure = sensors.find((s) => s.name === 'Barometric Pressure')!;
    const shown = sensorRowFor(pressure, 'imperial');
    expect(shown.range).toBe(
      `${hPaToInHg(300).toFixed(2)} to ${hPaToInHg(1100).toFixed(2)} inHg`
    );
    expect(shown.range).toBe('8.86 to 32.48 inHg');
  });

  it('dimensionless rows are identical in both systems', () => {
    for (const name of ['Relative Humidity', 'Wind Bearing', 'Solar & UV']) {
      const row = sensors.find((s) => s.name === name)!;
      expect(sensorRowFor(row, 'imperial')).toEqual(
        sensorRowFor(row, 'metric')
      );
    }
  });
});
