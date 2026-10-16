import type { HistoryPoint, WeatherReading } from './types';
import { cToF, type UnitSystem } from './units';

/** One hour of the Open-Meteo forecast, already trimmed to the next hours. */
export interface ForecastHour {
  time: string;
  tempC: number | null;
  precipProb: number | null;
  precipMm: number | null;
  windKmh: number | null;
  humidityPct: number | null;
}

export interface StatisticalOutlook {
  tempDirection: 'rising' | 'falling' | 'steady';
  /** Forecasted change from now to ~6h out, in °C. */
  tempChange6h: number;
  rainExpected: boolean;
  /** Highest precipitation probability in the next 12h, 0–100. */
  maxPrecipProb: number;
  /** Hours from now until the first hour with probability >= 40, if any. */
  rainOnsetInHours: number | null;
  headline: string;
}

function num(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

function mean(values: number[]): number | null {
  const finite = values.filter((v) => Number.isFinite(v));
  if (finite.length === 0) return null;
  return finite.reduce((a, b) => a + b, 0) / finite.length;
}

/**
 * Short-term statistical outlook from station data + forecast model output.
 * Pure function — no network, no keys — so the hero always has something to
 * say even when the AI provider is unavailable.
 */
export function buildStatisticalOutlook(
  current: WeatherReading,
  history: HistoryPoint[],
  forecast: ForecastHour[],
  unitSystem: UnitSystem
): StatisticalOutlook {
  const imperial = unitSystem === 'imperial';
  const tUnit = imperial ? '°F' : '°C';

  // Station trend: mean of the most recent quarter vs the quarter before it.
  const temps = history
    .map((p) => num(p.temperatureC))
    .filter((t): t is number => t != null);
  let stationDelta = 0;
  if (temps.length >= 8) {
    const q = Math.floor(temps.length / 4);
    const recent = mean(temps.slice(-q)) ?? current.temperatureC;
    const before = mean(temps.slice(-2 * q, -q)) ?? recent;
    stationDelta = recent - before;
  }

  // Forecast change ~6h out (fallback: station trend extrapolated).
  const now = current.temperatureC;
  const f6 = forecast.length > 5 ? num(forecast[5].tempC) : null;
  const tempChange6h = f6 != null ? f6 - now : stationDelta * 2;
  const tempDirection =
    tempChange6h >= 1 ? 'rising' : tempChange6h <= -1 ? 'falling' : 'steady';

  const next12 = forecast.slice(0, 12);
  const probs = next12.map((h) => num(h.precipProb) ?? 0);
  const maxPrecipProb = probs.length ? Math.max(...probs) : 0;
  const onsetIdx = probs.findIndex((p) => p >= 40);
  const rainExpected = maxPrecipProb >= 40;
  const rainOnsetInHours = onsetIdx >= 0 ? onsetIdx : null;

  const dispDelta = (c: number) =>
    `${Math.abs(imperial ? Math.round(c * 1.8) : Math.round(c))} ${tUnit}`;

  const parts: string[] = [];
  if (tempDirection === 'rising') {
    parts.push(`Warming up: about ${dispDelta(tempChange6h)} higher in 6 hours.`);
  } else if (tempDirection === 'falling') {
    parts.push(`Cooling down: about ${dispDelta(tempChange6h)} lower in 6 hours.`);
  } else {
    parts.push('Temperatures holding steady for the next few hours.');
  }

  if (rainOnsetInHours != null) {
    const label =
      rainOnsetInHours === 0 ? 'this hour' : `in about ${rainOnsetInHours} hour${rainOnsetInHours === 1 ? '' : 's'}`;
    parts.push(`Rain likely ${label} (up to ${Math.round(maxPrecipProb)}%).`);
  } else if (current.rainRateMmH > 0) {
    parts.push('Rain now, easing off later.');
  } else {
    parts.push('Staying dry for the next 12 hours.');
  }

  return {
    tempDirection,
    tempChange6h,
    rainExpected,
    maxPrecipProb,
    rainOnsetInHours,
    headline: parts.join(' '),
  };
}

/** Short hour label ("14:00") from an ISO timestamp, local time. */
export function hourLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${String(d.getHours()).padStart(2, '0')}:00`;
}

export function displayTemp(c: number | null, unitSystem: UnitSystem): string | null {
  if (c == null) return null;
  const v = unitSystem === 'imperial' ? cToF(c) : c;
  return `${Math.round(v)}°`;
}
