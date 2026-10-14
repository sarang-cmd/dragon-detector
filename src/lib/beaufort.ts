export const beaufortThresholdsKmH = [
  0, 1, 6, 12, 20, 29, 39, 50, 62, 75, 89, 103, 118,
];

export function beaufortIndex(kmh: number): 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 {
  const k = Number(kmh);
  for (let i = beaufortThresholdsKmH.length - 1; i >= 0; i--) {
    if (k >= beaufortThresholdsKmH[i]) return i as any;
  }
  return 0;
}

export const beaufortNames: Record<number, string> = {
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

export function windDirectionLabel(deg: number): string {
  const dir = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const i = Math.round(Number(deg) / 22.5) % 16;
  return dir[i];
}

export function windDirectionDegFromLabel(label: string): number | null {
  const dir: Record<string, number> = {
    N: 0, NNE: 22.5, NE: 45, ENE: 67.5, E: 90, ESE: 112.5, SE: 135, SSE: 157.5,
    S: 180, SSW: 202.5, SW: 225, WSW: 247.5, W: 270, WNW: 292.5, NW: 315, NNW: 337.5,
  };
  return dir[label] ?? null;
}
