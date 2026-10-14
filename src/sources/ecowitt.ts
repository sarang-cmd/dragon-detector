import { WeatherReading, HistoryPoint, WeatherSource } from '@/lib/types';
import { fToC, mphToKmh, inToMm, inHgToHpa } from '@/lib/units';

interface EcoRaw {
  data: {
    outdoor?: {
      temperature?: { time: string; unit: string; value: string };
      feels_like?: { time: string; unit: string; value: string };
      app_temp?: { time: string; unit: string; value: string };
      dew_point?: { time: string; unit: string; value: string };
      humidity?: { time: string; unit: string; value: string };
    };
    wind?: {
      wind_speed?: { time: string; unit: string; value: string };
      wind_gust?: { time: string; unit: string; value: string };
      wind_direction?: { time: string; unit: string; value: string };
    };
    rainfall?: {
      rain_rate?: { time: string; unit: string; value: string };
      hourly?: { time: string; unit: string; value: string };
      daily?: { time: string; unit: string; value: string };
      weekly?: { time: string; unit: string; value: string };
    };
    pressure?: {
      relative?: { time: string; unit: string; value: string };
    };
    solar_and_uvi?: {
      solar?: { time: string; unit: string; value: string };
      uvi?: { time: string; unit: string; value: string };
    };
  };
}

function num(v: unknown) {
  if (v && typeof v === 'object' && 'value' in v && typeof (v as { value: unknown }).value === 'string') {
    return Number((v as { value: string }).value);
  }
  return undefined;
}

function pickTime(groups: EcoRaw['data']) {
  const candidates: Array<{ time: string | undefined } | undefined> = [
    groups.outdoor?.temperature,
    groups.wind?.wind_speed,
    groups.rainfall?.rain_rate,
  ];
  for (const c of candidates) {
    if (c && c.time) return c.time;
  }
  return new Date().toISOString();
}

export function normalizeRealTime(raw: string): WeatherReading {
  const json: EcoRaw = JSON.parse(raw);
  const d = json.data;
  const ts = pickTime(d);    const temp = d.outdoor?.temperature;
    const feelsLike = d.outdoor?.feels_like ?? d.outdoor?.app_temp;
    const dewPoint = d.outdoor?.dew_point;
    const humidity = d.outdoor?.humidity;
    const windSpeed = d.wind?.wind_speed;
    const windGust = d.wind?.wind_gust;
    const windDir = d.wind?.wind_direction;
    const rainRate = d.rainfall?.rain_rate;
    const rainHour = d.rainfall?.hourly;
    const rainDay = d.rainfall?.daily;
    const rainWeek = d.rainfall?.weekly;
    const pressure = d.pressure?.relative;
    const solar = d.solar_and_uvi?.solar;
    const uvi = d.solar_and_uvi?.uvi;

    const reading: Readonly<WeatherReading> = {
      timestamp: new Date(Number(ts || Date.now())).toISOString(),
      source: 'ecowitt',
      temperatureC: temp ? fToC(num(temp) ?? 0) : 0,
      feelsLikeC: feelsLike ? fToC(num(feelsLike) ?? 0) : undefined,
      dewPointC: dewPoint ? fToC(num(dewPoint) ?? 0) : undefined,
      humidityPct: humidity ? (num(humidity) ?? 0) : 0,
      pressureHpa: pressure ? inHgToHpa(num(pressure) ?? 0) : undefined,
      windSpeedKmh: windSpeed ? mphToKmh(num(windSpeed) ?? 0) : 0,
      windGustKmh: windGust ? mphToKmh(num(windGust) ?? 0) : 0,
      windDirectionDeg: windDir ? Number(windDir.value) : 0,
      rainRateMmH: rainRate ? inToMm(num(rainRate) ?? 0) : 0,
      rainTodayMm: rainDay ? inToMm(num(rainDay) ?? 0) : 0,
      rainHourMm: rainHour ? inToMm(num(rainHour) ?? 0) : undefined,
      rainWeekMm: rainWeek ? inToMm(num(rainWeek) ?? 0) : undefined,
      uvIndex: uvi ? num(uvi) : undefined,
      solarWm2: solar ? num(solar) : undefined,
    };

  return reading;
}

export function fetchRealTime(): Promise<{ reading: WeatherReading; raw: string }> {
  const appKey = process.env.ECOWITT_APPLICATION_KEY;
  const apiKey = process.env.ECOWITT_API_KEY;
  const mac = process.env.ECOWITT_MAC;

  if (!appKey || !apiKey || !mac) {
    throw new Error('Missing Ecowitt env vars: ECOWITT_APPLICATION_KEY, ECOWITT_API_KEY, ECOWITT_MAC');
  }

  const url = new URL('https://api.ecowitt.net/api/v3/device/real_time');
  url.searchParams.set('application_key', appKey);
  url.searchParams.set('api_key', apiKey);
  url.searchParams.set('mac', mac);
  url.searchParams.set('call_back', 'all');
  url.searchParams.set('temp_unitid', '1');
  url.searchParams.set('pressure_unitid', '3');
  url.searchParams.set('wind_speed_unitid', '7');
  url.searchParams.set('rainfall_unitid', '12');

  return fetch(url.toString(), { signal: AbortSignal.timeout(8000) })
    .then((res) => {
      if (!res.ok) throw new Error(`Ecowitt real_time HTTP ${res.status}`);
      return res.text();
    })
    .then((raw) => ({ raw, reading: normalizeRealTime(raw) }));
}

export function buildHistoryQuery(
  range: '24h' | '7d',
  start: string,
  end: string
): string {
  const url = new URL('https://api.ecowitt.net/api/v3/device/history');
  url.searchParams.set('application_key', process.env.ECOWITT_APPLICATION_KEY || '');
  url.searchParams.set('api_key', process.env.ECOWITT_API_KEY || '');
  url.searchParams.set('mac', process.env.ECOWITT_MAC || '');
  url.searchParams.set('start_date', start);
  url.searchParams.set('end_date', end);
  url.searchParams.set('cycle_type', range === '24h' ? '5min' : '30min');
  url.searchParams.set('call_back', 'outdoor_temperature,humidity,wind_speed,rainfall,relative_pressure');
  return url.toString();
}

export async function fetchHistory(range: '24h' | '7d'): Promise<{ points: HistoryPoint[]; raw: string }> {
  const now = new Date();
  const end = now.toISOString().slice(0, 10);
  const start = new Date(now.getTime() - (range === '24h' ? 86400000 : 7 * 86400000)).toISOString().slice(0, 10);
  const url = buildHistoryQuery(range, start, end);

  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`Ecowitt history HTTP ${res.status}`);
  const raw = await res.text();
  const json = JSON.parse(raw);
  // Normalize to HistoryPoint. Guard against missing/unexpected shapes by
  // using string values where possible. Exact field path is the sample JSON that
  // lands in docs and is the final authority, so this normalizer is intentionally
  // defensive and not tied to a guess at field names.
  const items: HistoryPoint[] = [];
  const list = Array.isArray(json.data?.item) ? json.data.item : [];

  for (const entry of list) {
    const ts = entry.time ? Number(entry.time) : undefined;
    if (!ts) continue;
    const temperature = Number(entry.temp ?? entry.temperature ?? entry.data?.outdoor?.temperature?.value ?? NaN);
    const humidity = Number(entry.humidity ?? entry.data?.outdoor?.humidity?.value ?? NaN);
    const speed = Number(entry.wind_speed ?? entry.data?.wind?.wind_speed?.value ?? NaN);
    const rain = Number(entry.rain ?? entry.rainfall ?? entry.data?.rainfall?.rain_rate?.value ?? NaN);
    const pressure = entry.pressure ?? entry.relative_pressure ?? entry.data?.pressure?.relative?.value ?? undefined;
    if (Number.isNaN(temperature) && Number.isNaN(humidity) && Number.isNaN(speed)) continue;

    items.push({
      timestamp: new Date(ts).toISOString(),
      temperatureC: Number.isNaN(temperature) ? 0 : Math.round(temperature * 10) / 10,
      humidityPct: Number.isNaN(humidity) ? 0 : Math.round(humidity),
      windSpeedKmh: Number.isNaN(speed) ? 0 : Math.round(mphToKmh(speed) * 10) / 10,
      rainRateMmH: Number.isNaN(rain) ? 0 : Math.round(inToMm(rain) * 100) / 100,
      pressureHpa: pressure != null ? Math.round(inHgToHpa(pressure) * 10) / 10 : undefined,
    });
  }
  return { raw, points: items };
}

export function createRealSource(): WeatherSource {
  let lastGood: WeatherReading | null = null;

  return {
    async getCurrent() {
      try {
        const { reading } = await fetchRealTime();
        lastGood = reading;
        return reading;
      } catch {
        if (lastGood) return lastGood;
        throw new Error('No last-good Ecowitt reading available');
      }
    },
    async getHistory(range) {
      const { points } = await fetchHistory(range);
      return points;
    },
  };
}

export default createRealSource;
