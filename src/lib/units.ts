export const pressureFactor = 33.8639; // inHg -> hPa
export const temperatureFactor = 5 / 9; // F -> C core formula
export const temperatureOffset = -32; // F -> C
export const speedFactor = 1.609344; // mph -> km/h
export const rainFactor = 25.4; // in -> mm
export function fToC(f: number): number {
  return (Number(f) + temperatureOffset) * temperatureFactor;
}
export function cToF(c: number): number {
  return Number(c) * (1 / temperatureFactor) - temperatureOffset;
}
export function mphToKmh(mph: number): number {
  return Number(mph) * speedFactor;
}
export function kmhToMph(kmh: number): number {
  return Number(kmh) / speedFactor;
}
export function kmhToMs(kmh: number): number {
  return Number(kmh) / 3.6;
}
export function inToMm(inches: number): number {
  return Number(inches) * rainFactor;
}
export function mmToIn(mm: number): number {
  return Number(mm) / rainFactor;
}
export function inHgToHpa(inHg: number): number {
  return Number(inHg) * pressureFactor;
}
export function hPaToInHg(hpa: number): number {
  return Number(hpa) / pressureFactor;
}
export function roundTemp(celsius: number): number {
  return Math.round(celsius * 10) / 10;
}
export function roundWind(kmh: number): number {
  return Math.round(kmh * 10) / 10;
}
export function roundRain(mm: number): number {
  return Math.round(mm * 100) / 100;
}
export function roundPressure(hpa: number): number {
  return Math.round(hpa * 10) / 10;
}

export type UnitSystem = 'metric' | 'imperial';

export interface FormattedValue {
  value: string;
  unit: string;
}

export function formatTemp(celsius: number, system: UnitSystem): FormattedValue {
  if (system === 'metric') {
    return { value: celsius.toFixed(1), unit: '°C' };
  }
  const f = cToF(celsius);
  return { value: f.toFixed(1), unit: '°F' };
}

export function formatSpeed(kmh: number, system: UnitSystem): FormattedValue {
  if (system === 'metric') {
    return { value: Math.round(kmh).toString(), unit: 'km/h' };
  }
  const mph = kmhToMph(kmh);
  return { value: Math.round(mph).toString(), unit: 'mph' };
}

export function formatRain(mm: number, system: UnitSystem): FormattedValue {
  if (system === 'metric') {
    return { value: mm.toFixed(1), unit: 'mm' };
  }
  const inches = mmToIn(mm);
  return { value: inches.toFixed(2), unit: 'in' };
}

export function formatPressure(hpa: number | undefined, system: UnitSystem): FormattedValue {
  if (hpa == null) {
    return { value: '--', unit: system === 'metric' ? 'hPa' : 'inHg' };
  }
  if (system === 'metric') {
    return { value: hpa.toFixed(1), unit: 'hPa' };
  }
  const inHg = hPaToInHg(hpa);
  return { value: inHg.toFixed(2), unit: 'inHg' };
}
