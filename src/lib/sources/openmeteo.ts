/**
 * Open-Meteo live source: free, no API key. Current conditions for the
 * station coordinates plus hourly model fields (rain totals, UV, solar).
 * History comes from recorded Supabase rows plus the ERA5 archive API
 * (which lags ~5 days) for anything we have not recorded ourselves.
 */
import { SITE_CONFIG } from '@/lib/site';
import type { HistoryPoint, WeatherReading } from '@/lib/types';

const LAT = SITE_CONFIG.latitude ?? 51.0497;
const LON = SITE_CONFIG.longitude ?? 13.7284;

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const ARCHIVE_URL = 'https://archive-api.open-meteo.com/v1/archive';

const CURRENT_VARS = [
  'temperature_2m',
  'relative_humidity_2m',
  'apparent_temperature',
  'precipitation',
  'pressure_msl',
  'cloud_cover',
  'wind_speed_10m',
  'wind_direction_10m',
  'wind_gusts_10m',
].join(',');

const HOURLY_VARS = [
  'temperature_2m',
  'relative_humidity_2m',
  'dew_point_2m',
  'precipitation',
  'precipitation_probability',
  'pressure_msl',
  'wind_speed_10m',
  'wind_direction_10m',
  'wind_gusts_10m',
  'uv_index',
  'shortwave_radiation',
].join(',');

export interface OpenMeteoResponse {
  current?: Record<string, number | string | null>;
  hourly?: Record<string, (number | string | null)[]> & { time: string[] };
}

function num(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

/** Current Berlin hour as "YYYY-MM-DDTHH" for matching hourly slots. */
export function berlinHourKey(when: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  }).format(when);
  return parts.slice(0, 13).replace(' ', 'T');
}

/** Index of the hourly slot at or before now (local model time). */
export function currentHourIndex(times: string[], nowKey = berlinHourKey()): number {
  let idx = 0;
  for (let i = 0; i < times.length; i++) {
    if (typeof times[i] === 'string' && times[i].slice(0, 13) <= nowKey) idx = i;
    else break;
  }
  return idx;
}

function at<T>(arr: (T | null | undefined)[] | undefined, i: number): number | null {
  if (!arr || i < 0 || i >= arr.length) return null;
  return num(arr[i]);
}

export function mapCurrentReading(json: OpenMeteoResponse, now = new Date()): WeatherReading {
  const c = json.current ?? {};
  const times = json.hourly?.time ?? [];
  const hi = times.length ? currentHourIndex(times, berlinHourKey(now)) : 0;
  const h = (name: string): number | null => at(json.hourly?.[name] as (number | null)[] | undefined, hi);

  const temperatureC = num(c.temperature_2m) ?? h('temperature_2m') ?? 0;
  // Rain today: sum of this calendar day's hourly precipitation up to now.
  const dayPrefix = berlinHourKey(now).slice(0, 10);
  let rainTodayMm = 0;
  if (json.hourly) {
    const precip = (json.hourly.precipitation ?? []) as (number | null)[];
    for (let i = 0; i <= hi && i < times.length; i++) {
      if (typeof times[i] === 'string' && times[i].slice(0, 10) === dayPrefix) {
        rainTodayMm += num(precip[i]) ?? 0;
      }
    }
  }

  return {
    timestamp: now.toISOString(),
    source: 'openmeteo',
    temperatureC,
    feelsLikeC: num(c.apparent_temperature) ?? temperatureC,
    dewPointC: h('dew_point_2m') ?? undefined,
    humidityPct: Math.round(num(c.relative_humidity_2m) ?? h('relative_humidity_2m') ?? 0),
    pressureHpa: num(c.pressure_msl) ?? h('pressure_msl') ?? undefined,
    windSpeedKmh: num(c.wind_speed_10m) ?? h('wind_speed_10m') ?? 0,
    windGustKmh: num(c.wind_gusts_10m) ?? h('wind_gusts_10m') ?? 0,
    windDirectionDeg: Math.round(num(c.wind_direction_10m) ?? h('wind_direction_10m') ?? 0),
    rainRateMmH: num(c.precipitation) ?? 0,
    rainTodayMm: Math.round(rainTodayMm * 100) / 100,
    rainHourMm: num(c.precipitation) ?? undefined,
    rainWeekMm: undefined, // computed separately from the archive API
    uvIndex: h('uv_index') ?? undefined,
    solarWm2: h('shortwave_radiation') ?? undefined,
  };
}

export function mapHourlyToHistory(
  json: OpenMeteoResponse,
  fromMs: number,
  toMs: number
): HistoryPoint[] {
  const times = json.hourly?.time ?? [];
  const out: HistoryPoint[] = [];
  for (let i = 0; i < times.length; i++) {
    const t = Date.parse(`${times[i]}:00`);
    if (Number.isNaN(t) || t < fromMs || t > toMs) continue;
    const g = (name: string): number | null => at(json.hourly?.[name] as (number | null)[] | undefined, i);
    const temp = g('temperature_2m');
    const hum = g('relative_humidity_2m');
    const wind = g('wind_speed_10m');
    const rain = g('precipitation');
    const pres = g('pressure_msl');
    if (temp == null || hum == null || wind == null || rain == null || pres == null) continue;
    out.push({
      timestamp: new Date(t).toISOString(),
      temperatureC: temp,
      humidityPct: Math.round(hum),
      windSpeedKmh: wind,
      rainRateMmH: rain,
      pressureHpa: pres,
      dewPointC: g('dew_point_2m') ?? undefined,
      windGustKmh: g('wind_gusts_10m') ?? undefined,
      windDirectionDeg: g('wind_direction_10m') != null ? Math.round(g('wind_direction_10m')!) : undefined,
      uvIndex: g('uv_index') ?? undefined,
      solarWm2: g('shortwave_radiation') ?? undefined,
    });
  }
  return out;
}

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Daily precipitation sums for the rain-week tile (ERA5, lags a few days). */
export async function fetchRainWeekMm(): Promise<number | undefined> {
  try {
    const end = new Date(Date.now() - 5 * 86400000);
    const start = new Date(end.getTime() - 6 * 86400000);
    const url =
      `${ARCHIVE_URL}?latitude=${LAT}&longitude=${LON}` +
      `&start_date=${isoDay(start)}&end_date=${isoDay(end)}` +
      `&daily=precipitation_sum&timezone=Europe%2FBerlin`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return undefined;
    const json = (await res.json()) as { daily?: { precipitation_sum?: (number | null)[] } };
    const sums = json.daily?.precipitation_sum ?? [];
    let total = 0;
    let any = false;
    for (const s of sums) {
      if (typeof s === 'number' && Number.isFinite(s)) {
        total += s;
        any = true;
      }
    }
    return any ? Math.round(total * 10) / 10 : undefined;
  } catch {
    return undefined;
  }
}

async function fetchForecast(): Promise<OpenMeteoResponse> {
  const url =
    `${FORECAST_URL}?latitude=${LAT}&longitude=${LON}` +
    `&current=${CURRENT_VARS}&hourly=${HOURLY_VARS}` +
    `&forecast_days=2&timezone=Europe%2FBerlin&wind_speed_unit=kmh`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
  return (await res.json()) as OpenMeteoResponse;
}

async function fetchForecastHourlyPast(pastDays: number): Promise<OpenMeteoResponse> {
  const days = Math.min(7, Math.max(1, Math.ceil(pastDays)));
  const url =
    `${FORECAST_URL}?latitude=${LAT}&longitude=${LON}` +
    `&hourly=${HOURLY_VARS}&past_days=${days}&forecast_days=1` +
    `&timezone=Europe%2FBerlin&wind_speed_unit=kmh`;
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`Open-Meteo past ${res.status}`);
  return (await res.json()) as OpenMeteoResponse;
}

async function fetchArchiveHourly(fromMs: number, toMs: number): Promise<HistoryPoint[]> {
  const start = isoDay(new Date(Math.max(0, fromMs)));
  const end = isoDay(new Date(Math.min(Date.now() - 5 * 86400000, toMs)));
  if (end < start) return [];
  const url =
    `${ARCHIVE_URL}?latitude=${LAT}&longitude=${LON}` +
    `&start_date=${start}&end_date=${end}` +
    `&hourly=${HOURLY_VARS}&timezone=Europe%2FBerlin&wind_speed_unit=kmh`;
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`Open-Meteo archive ${res.status}`);
  return mapHourlyToHistory((await res.json()) as OpenMeteoResponse, fromMs, toMs);
}

// Current-reading cache: Open-Meteo free tier is 10k calls/day, so share one
// upstream fetch per 2 minutes across all visitors of this instance.
let currentCache: { at: number; reading: WeatherReading } | null = null;
const CURRENT_TTL_MS = 2 * 60 * 1000;

async function getCachedCurrent(): Promise<WeatherReading> {
  const now = Date.now();
  if (currentCache && now - currentCache.at < CURRENT_TTL_MS) {
    return { ...currentCache.reading, timestamp: new Date(now).toISOString() };
  }
  const json = await fetchForecast();
  const reading = mapCurrentReading(json);
  reading.rainWeekMm = await fetchRainWeekMm();
  currentCache = { at: now, reading };
  return reading;
}

interface DbRow {
  time: string;
  temp_c: number | null;
  feels_c: number | null;
  humidity_pct: number | null;
  pressure_hpa: number | null;
  wind_kmh: number | null;
  gust_kmh: number | null;
  wind_dir: number | null;
  rain_rate: number | null;
  rain_today: number | null;
  uv: number | null;
  solar: number | null;
}

function rowToPoint(r: DbRow): HistoryPoint | null {
  if (
    r.temp_c == null ||
    r.humidity_pct == null ||
    r.wind_kmh == null ||
    r.rain_rate == null ||
    r.pressure_hpa == null
  ) {
    return null;
  }
  return {
    timestamp: r.time,
    temperatureC: r.temp_c,
    humidityPct: Math.round(r.humidity_pct),
    windSpeedKmh: r.wind_kmh,
    rainRateMmH: r.rain_rate,
    pressureHpa: r.pressure_hpa,
    feelsLikeC: r.feels_c ?? undefined,
    dewPointC: undefined,
    windGustKmh: r.gust_kmh ?? undefined,
    windDirectionDeg: r.wind_dir != null ? Math.round(r.wind_dir) : undefined,
    rainTodayMm: r.rain_today ?? undefined,
    uvIndex: r.uv ?? undefined,
    solarWm2: r.solar ?? undefined,
  };
}

async function readRecordedHistory(fromMs: number): Promise<HistoryPoint[]> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return [];
  }
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = createClient();
    const { data, error } = await supabase
      .from('readings')
      .select(
        'time,temp_c,feels_c,humidity_pct,pressure_hpa,wind_kmh,gust_kmh,wind_dir,rain_rate,rain_today,uv,solar'
      )
      .gte('time', new Date(fromMs).toISOString())
      .order('time', { ascending: true })
      .limit(3000);
    if (error) throw error;
    const out: HistoryPoint[] = [];
    for (const r of (data ?? []) as DbRow[]) {
      const p = rowToPoint(r);
      if (p) out.push(p);
    }
    return out;
  } catch {
    return [];
  }
}

/**
 * Record the current reading for history (called from the weather API path,
 * throttled to one row per 10 minutes; upsert dedupes across instances).
 */
let lastRecordedAt = 0;
const RECORD_EVERY_MS = 10 * 60 * 1000;

export async function recordCurrentReading(reading: WeatherReading): Promise<void> {
  const now = Date.now();
  if (now - lastRecordedAt < RECORD_EVERY_MS) return;
  lastRecordedAt = now;
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return;
  }
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = createClient();
    await supabase.rpc('record_reading', {
      p_time: reading.timestamp,
      p_temp_c: reading.temperatureC,
      p_feels_c: reading.feelsLikeC ?? null,
      p_humidity_pct: reading.humidityPct,
      p_pressure_hpa: reading.pressureHpa ?? null,
      p_wind_kmh: reading.windSpeedKmh,
      p_gust_kmh: reading.windGustKmh ?? null,
      p_wind_dir: reading.windDirectionDeg ?? null,
      p_rain_rate: reading.rainRateMmH,
      p_rain_today: reading.rainTodayMm,
      p_uv: reading.uvIndex ?? null,
      p_solar: reading.solarWm2 ?? null,
    });
  } catch {
    // History accumulation is best-effort; live data flows regardless.
  }
}

export function createOpenMeteoSource() {
  return {
    getCurrent: async (): Promise<WeatherReading> => getCachedCurrent(),
    getHistory: async (range: '24h' | '7d'): Promise<HistoryPoint[]> => {
      const spanMs = range === '24h' ? 24 * 3600000 : 7 * 24 * 3600000;
      const fromMs = Date.now() - spanMs;
      const nowMs = Date.now();
      const byTime = new Map<string, HistoryPoint>();

      // 1. Our own recorded rows (most truthful for this rooftop).
      try {
        for (const p of await readRecordedHistory(fromMs)) {
          byTime.set(p.timestamp, p);
        }
      } catch {
        // fall through to model data
      }

      // 2. Recent days straight from the forecast model (past_days covers
      //    the ERA5 delay gap, so history is real from day one).
      try {
        const recentStart = Math.max(fromMs, nowMs - 7 * 86400000);
        if (recentStart < nowMs) {
          const pastDays = (nowMs - recentStart) / 86400000;
          const json = await fetchForecastHourlyPast(pastDays);
          for (const p of mapHourlyToHistory(json, recentStart, nowMs)) {
            if (!byTime.has(p.timestamp)) byTime.set(p.timestamp, p);
          }
        }
      } catch {
        // fall through to whatever was recorded
      }

      // 3. Anything older than 7 days comes from the ERA5 archive.
      try {
        const archiveEnd = nowMs - 7 * 86400000;
        if (fromMs < archiveEnd) {
          for (const p of await fetchArchiveHourly(fromMs, archiveEnd)) {
            if (!byTime.has(p.timestamp)) byTime.set(p.timestamp, p);
          }
        }
      } catch {
        // serve whatever we have
      }

      return Array.from(byTime.values()).sort(
        (a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp)
      );
    },
  };
}
