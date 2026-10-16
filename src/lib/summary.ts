import { beaufort, windDirectionLabel, compassWord } from './beaufort';
import { cToF, kmhToMph, formatRain, type UnitSystem } from './units';

export type Band = 'freezing' | 'cold' | 'cool' | 'mild' | 'warm' | 'hot';

export const bandMap: Record<Band, { from: number; to: number; label: Band }> = {
  freezing: { from: -Infinity, to: 0, label: 'freezing' },
  cold: { from: 0, to: 8, label: 'cold' },
  cool: { from: 8, to: 15, label: 'cool' },
  mild: { from: 15, to: 21, label: 'mild' },
  warm: { from: 21, to: 27, label: 'warm' },
  hot: { from: 27, to: Infinity, label: 'hot' },
} as const;

export function temperatureBand(c: number): Band {
  for (const b of Object.values(bandMap)) {
    if (c >= b.from && c < b.to) return b.label;
  }
  return 'hot';
}

export type PressureTrend = 'rising' | 'steady' | 'falling';

export interface SummaryReadingInput {
  temperatureC: number;
  feelsLikeC?: number;
  windSpeedKmh: number;
  windGustKmh: number;
  windDirectionDeg: number;
  rainRateMmH: number;
  rainTodayMm: number;
  humidityPct: number;
  pressureHpa?: number;
  pressureTrend?: PressureTrend;
  isOffline?: boolean;
  unitSystem?: UnitSystem;
}

/**
 * Generates editorial human summary text and jacket advice from a weather reading
 * per docs/03 §6 and docs/04 §5.
 */
export function summarySentence(r: SummaryReadingInput): {
  sentence: string;
  jacket: string;
} {
  if (r.isOffline) {
    return {
      sentence: 'Station offline. Displaying last recorded observations.',
      jacket: 'Check outdoor conditions directly.',
    };
  }

  const t = r.temperatureC;
  const feels = r.feelsLikeC;
  const wind = r.windSpeedKmh;
  const gust = r.windGustKmh;
  const dirDeg = r.windDirectionDeg;
  const band = temperatureBand(t);
  const bIndex = beaufort(wind).scale;
  const gustIndex = beaufort(gust).scale;
  const dirWord = compassWord(dirDeg).toLowerCase();
  const imperial = r.unitSystem === 'imperial';

  // Display values honour the unit toggle; thresholds and band logic stay
  // in metric (physics doesn't change with the label).
  const dispTemp = (c: number) =>
    imperial ? Math.round(cToF(c)) : Math.round(c);
  const dispSpeed = (kmh: number) =>
    imperial ? `${Math.round(kmhToMph(kmh))} mph` : `${Math.round(kmh)} km/h`;
  const tempUnitWord = 'degrees';
  const rainToday = formatRain(r.rainTodayMm, r.unitSystem ?? 'metric');

  const parts: string[] = [];

  // 1. Temperature & general state opening
  if (band === 'freezing') {
    parts.push(`${dispTemp(t)} ${tempUnitWord} and freezing.`);
  } else if (r.rainRateMmH > 0) {
    parts.push(`${dispTemp(t)} ${tempUnitWord} and ${band}.`);
  } else if (r.humidityPct >= 75 && t >= 21) {
    parts.push(`${dispTemp(t)} ${tempUnitWord} and humid.`);
  } else if (r.rainTodayMm === 0) {
    parts.push(`${dispTemp(t)} ${tempUnitWord} and dry.`);
  } else {
    parts.push(`${dispTemp(t)} ${tempUnitWord} and ${band}.`);
  }

  // 2. Feels like note if distinct by >= 2 degrees
  if (feels != null && Math.abs(feels - t) >= 2) {
    parts.push(`Feels like ${dispTemp(feels)} ${tempUnitWord}.`);
  }

  // 3. Wind sentence
  if (wind >= 1) {
    const bName = beaufort(wind).name;
    parts.push(`${bName} from the ${dirWord} at ${dispSpeed(wind)}.`);
    if (Math.round(gust) > Math.round(wind) && gustIndex > bIndex) {
      parts.push(`Gusts to ${dispSpeed(gust)}.`);
    }
  } else {
    parts.push('Calm.');
  }

  // 4. Rain sentence
  if (r.rainRateMmH >= 8) {
    parts.push('Heavy rain.');
  } else if (r.rainRateMmH > 2) {
    parts.push('Steady rain.');
  } else if (r.rainRateMmH > 0) {
    parts.push('Drizzle.');
  } else if (r.rainTodayMm > 0) {
    parts.push(`${rainToday.value} ${rainToday.unit} of rain today.`);
  }

  // 5. Pressure trend
  if (r.pressureTrend === 'falling') {
    parts.push('Pressure falling.');
  } else if (r.pressureTrend === 'rising') {
    parts.push('Pressure rising.');
  } else if (r.pressureTrend === 'steady' || r.pressureHpa != null) {
    parts.push('Pressure steady.');
  }

  // Jacket advice line
  let jacket: string;
  if (wind >= 62 || gust >= 75) {
    jacket = 'Stay indoors if possible; severe wind.';
  } else if (r.rainRateMmH > 0) {
    jacket =
      band === 'freezing' || band === 'cold'
        ? 'Warm waterproof coat and umbrella.'
        : 'Rain jacket or umbrella.';
  } else {
    switch (band) {
      case 'freezing':
        jacket = 'Coat, scarf and gloves.';
        break;
      case 'cold':
        jacket = 'Warm coat.';
        break;
      case 'cool':
        jacket = 'Light jacket or layers.';
        break;
      case 'mild':
        jacket = 'No jacket needed.';
        break;
      case 'warm':
        jacket = 'T-shirt weather.';
        break;
      case 'hot':
        jacket = 'T-shirt and stay hydrated.';
        break;
    }
  }

  return { sentence: parts.join(' '), jacket };
}
