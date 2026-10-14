export const beaufortThresholdsKmH = [
  0, 1, 6, 12, 20, 29, 39, 50, 62, 75, 89, 103, 118,
] as const;

export type BeaufortScale = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export const beaufortNames: Record<BeaufortScale, string> = {
  0: 'Calm',
  1: 'Light air',
  2: 'Light breeze',
  3: 'Gentle breeze',
  4: 'Moderate breeze',
  5: 'Fresh breeze',
  6: 'Strong breeze',
  7: 'High wind',
  8: 'Gale',
  9: 'Strong gale',
  10: 'Storm',
  11: 'Violent storm',
  12: 'Hurricane',
};

export const beaufortKidNames: Record<BeaufortScale, string> = {
  0: 'Calm',
  1: 'Very light',
  2: 'Light',
  3: 'Gentle',
  4: 'Moderate',
  5: 'Fresh',
  6: 'Strong',
  7: 'High wind',
  8: 'Gale',
  9: 'Strong gale',
  10: 'Storm',
  11: 'Very stormy',
  12: 'Hurricane',
};

export interface BeaufortResult {
  scale: BeaufortScale;
  name: string;
  kidName: string;
}

export function beaufort(kmh: number): BeaufortResult {
  const k = Math.max(0, Number(kmh));
  let scale: BeaufortScale = 0;
  for (let i = beaufortThresholdsKmH.length - 1; i >= 0; i--) {
    if (k >= beaufortThresholdsKmH[i]) {
      scale = i as BeaufortScale;
      break;
    }
  }
  return {
    scale,
    name: beaufortNames[scale],
    kidName: beaufortKidNames[scale],
  };
}

const COMPASS_POINTS = [
  'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
  'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW',
] as const;

export function windDirectionLabel(deg: number): string {
  const d = ((Number(deg) % 360) + 360) % 360;
  const i = Math.round(d / 22.5) % 16;
  return COMPASS_POINTS[i];
}

export function windDirectionDegFromLabel(label: string): number | null {
  const dir: Record<string, number> = {
    N: 0, NNE: 22.5, NE: 45, ENE: 67.5, E: 90, ESE: 112.5,
    SE: 135, SSE: 157.5, S: 180, SSW: 202.5, SW: 225, WSW: 247.5,
    W: 270, WNW: 292.5, NW: 315, NNW: 337.5,
  };
  return dir[label] ?? null;
}

// Average two circular directions without jumping across the 0/360 boundary.
export function averageWindDirection(anglesDeg: number[]): number {
  if (anglesDeg.length === 0) return 0;
  let sinSum = 0;
  let cosSum = 0;
  for (const a of anglesDeg) {
    const rad = wrapDeg(a) * (Math.PI / 180);
    sinSum += Math.sin(rad);
    cosSum += Math.cos(rad);
  }
  const avgRad = Math.atan2(sinSum, cosSum);
  let deg = (avgRad * 180) / Math.PI;
  if (deg < 0) deg += 360;
  return Math.round(deg * 10) / 10;
}

// Wrap a degree value into [0, 360).
export function wrapDeg(deg: number): number {
  return ((deg % 360) + 360) % 360;
}
