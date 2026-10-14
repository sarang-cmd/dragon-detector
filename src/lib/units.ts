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

export function inToMm(inches: number): number {
  return Number(inches) * rainFactor;
}

export function mmToIn(mm: number): number {
  return Number(mm) / rainFactor;
}

export function inHgToHpa(inHg: number): number {
  return Number(inHg) * pressureFactor;
}

export function hpaToInHg(hpa: number): number {
  return Number(hpa) / pressureFactor;
}
