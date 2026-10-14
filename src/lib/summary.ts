import { beaufort, beaufortNames, windDirectionLabel } from './beaufort';

type Band = 'freezing' | 'cold' | 'cool' | 'mild' | 'warm' | 'hot';
const bandMap: Record<Band, { from: number; to: number; label: string }> = {
  freezing: { from: -Infinity, to: 0, label: 'freezing' },
  cold: { from: 0, to: 8, label: 'cold' },
  cool: { from: 8, to: 15, label: 'cool' },
  mild: { from: 15, to: 21, label: 'mild' },
  warm: { from: 21, to: 27, label: 'warm' },
  hot: { from: 27, to: Infinity, label: 'warm' as string as Band },
} as const;

function temperatureBand(c: number): string {
  for (const b of Object.values(bandMap) as { from: number; to: number; label: string }[]) {
    if (c >= b.from && c < b.to) return b.label;
  }
  return 'hot';
}

export function summarySentence(r: {
  temperatureC: number;
  feelsLikeC?: number;
  windSpeedKmh: number;
  windGustKmh: number;
  windDirectionDeg: number;
  rainRateMmH: number;
  pressureHpa?: number;
  rainTodayMm: number;
  humidityPct: number;
}): { sentence: string; jacket: string } {
  const t = r.temperatureC;
  const feels = r.feelsLikeC;
  const windDir = windDirectionLabel(r.windDirectionDeg);
  const wind = r.windSpeedKmh;
  const gust = r.windGustKmh;
  const band = temperatureBand(t);
  const bIndex = beaufort(wind).scale;
  const gustIndex = beaufort(gust).scale;

  const parts: string[] = [];
  parts.push(`${Math.round(t)} degrees and ${band}.`);

  if (feels != null && Math.abs(feels - t) >= 2) {
    parts.push(`Feels like ${Math.round(feels)} degrees.`);
  }

  if (band === 'freezing' && feels != null && feels <= 0) {
    parts.push('Freezing.');
  }

  if (wind >= 1) {
    parts.push(`${beaufort(wind).name.toLowerCase()} from the ${windDir} at ${Math.round(wind)} km/h.`);
    if (gustIndex > bIndex) {
      parts.push(`Gusts to ${Math.round(gust)} km/h.`);
    }
  } else if (wind === 0) {
    parts.push('Calm.');
  }

  if (r.rainRateMmH > 0) {
    parts.push('Drizzle' + (r.rainRateMmH > 2 ? ', steady rain' : '') + '.');
  } else if (r.rainTodayMm > 0) {
    parts.push(`${r.rainTodayMm} mm of rain today.`);
  }
  if (r.pressureHpa != null) {
    parts.push('Pressure steady.');
  }

  const jacket: string =
    band === 'freezing'
      ? 'Coat, scarf and gloves.'
      : band === 'cold'
      ? 'Warm coat.'
      : band === 'cool'
      ? 'Light jacket or layers.'
      : band === 'mild'
      ? 'No jacket needed.'
      : band === 'warm'
      ? 'T-shirt weather.'
      : 'T-shirt, but bring a layer for the evening.';

  return { sentence: parts.join(' '), jacket };
}
