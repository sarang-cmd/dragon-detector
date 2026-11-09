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

type UnitKind = 'temp' | 'speed' | 'rain' | 'pressure' | 'plain';

interface RawField {
  time?: string;
  unit?: string;
  value?: string;
}

/** Lower-cases and unfolds unit symbols so "℃"/"C" and "℉"/"F" compare alike. */
export function normalizeUnit(unit?: string): string {
  return (unit ?? '')
    .toLowerCase()
    .replace(/℃/g, 'c')
    .replace(/℉/g, 'f')
    .replace(/\s+/g, '');
}

/**
 * Converts a raw value into the internal metric model. The request already
 * asks for metric units (temp_unitid=1, pressure_unitid=3,
 * wind_speed_unitid=7, rainfall_unitid=12), so this only converts when the
 * cloud still answers in imperial — never twice.
 */
export function convertWithUnit(kind: UnitKind, value: number, unit?: string): number {
  const u = normalizeUnit(unit);
  switch (kind) {
    case 'temp':
      return u.includes('f') ? fToC(value) : value;
    case 'speed':
      if (u.includes('mph')) return mphToKmh(value);
      if (u.includes('m/s')) return value * 3.6;
      if (u.includes('knot')) return value * 1.852;
      return value; // km/h
    case 'rain':
      return u.includes('in') ? inToMm(value) : value; // mm
    case 'pressure':
      if (u.includes('inhg')) return inHgToHpa(value);
      if (u.includes('mmhg')) return value * 1.33322;
      return value; // hPa
    default:
      return value;
  }
}

/** Reads Ecowitt `{ time, unit, value }` fields, converting to metric. */
function num(v: unknown, kind: UnitKind = 'plain'): number | undefined {
  if (!v || typeof v !== 'object' || !('value' in v)) return undefined;
  const field = v as RawField;
  if (field.value == null || field.value === '') return undefined;
  const n = Number(field.value);
  if (!Number.isFinite(n)) return undefined;
  return convertWithUnit(kind, n, field.unit);
}

/** Ecowitt answers `{ code, msg }`; 0 means success. No secrets in `msg`. */
function assertApiSuccess(json: { code?: unknown; msg?: unknown }): void {
  const code = Number(json.code);
  if (Number.isFinite(code) && code !== 0) {
    throw new Error(`Ecowitt API error ${code}: ${String(json.msg ?? 'unknown error')}`);
  }
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

/**
 * Ecowitt reports `time` as a Unix timestamp, historically in seconds. Treat
 * anything that is clearly too small to be milliseconds as seconds so a
 * reading never lands in 1970 and gets flagged as offline.
 */
export function toIsoTime(ts: string | number | undefined): string {
  const n = Number(ts);
  if (!Number.isFinite(n) || n <= 0) return new Date().toISOString();
  const ms = n < 1e11 ? n * 1000 : n;
  return new Date(ms).toISOString();
}

const CREDENTIAL_VARS = ['ECOWITT_APPLICATION_KEY', 'ECOWITT_API_KEY', 'ECOWITT_MAC'] as const;

/** True when all three Ecowitt credentials are present in the environment. */
export function hasEcowittCredentials(): boolean {
  return CREDENTIAL_VARS.every((name) => Boolean(process.env[name]));
}

/** Human-readable, secret-free message used when credentials are missing. */
export function missingCredentialsMessage(): string {
  return `Missing Ecowitt env vars: ${CREDENTIAL_VARS.join(', ')}`;
}

export function normalizeRealTime(raw: string): WeatherReading {
  const json = JSON.parse(raw) as EcoRaw & { code?: unknown; msg?: unknown };
  assertApiSuccess(json);
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
      timestamp: toIsoTime(ts ?? Date.now()),
      source: 'ecowitt',
      temperatureC: num(temp, 'temp') ?? 0,
      feelsLikeC: num(feelsLike, 'temp'),
      dewPointC: num(dewPoint, 'temp'),
      humidityPct: num(humidity) ?? 0,
      pressureHpa: num(pressure, 'pressure'),
      windSpeedKmh: num(windSpeed, 'speed') ?? 0,
      windGustKmh: num(windGust, 'speed') ?? 0,
      windDirectionDeg: windDir ? Number(windDir.value) || 0 : 0,
      rainRateMmH: num(rainRate, 'rain') ?? 0,
      rainTodayMm: num(rainDay, 'rain') ?? 0,
      rainHourMm: num(rainHour, 'rain'),
      rainWeekMm: num(rainWeek, 'rain'),
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
    throw new Error(missingCredentialsMessage());
  }

  const url = new URL('https://api.ecowitt.net/api/v3/device/real_time');
  url.searchParams.set('application_key', appKey);
  url.searchParams.set('api_key', apiKey);
  url.searchParams.set('mac', mac);
  url.searchParams.set('call_back', 'all');
  // Metric unit IDs (verified against doc.ecowitt.net + public integrations):
  // °C, hPa, km/h, mm, W/m². The normalizer still converts defensively when
  // the cloud ignores them and answers in imperial.
  url.searchParams.set('temp_unitid', '1');
  url.searchParams.set('pressure_unitid', '3');
  url.searchParams.set('wind_speed_unitid', '7');
  url.searchParams.set('rainfall_unitid', '12');
  url.searchParams.set('solar_irradiance_unitid', '16');

  return serialize(() =>
    fetch(url.toString(), { signal: AbortSignal.timeout(8000) })
      .then((res) => {
        if (!res.ok) throw new Error(`Ecowitt real_time HTTP ${res.status}`);
        return res.text();
      })
      .then((raw) => ({ raw, reading: normalizeRealTime(raw) }))
  );
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
  // History call_back takes group names, not individual metrics.
  url.searchParams.set('call_back', 'outdoor,wind,rainfall,pressure,solar_and_uvi');
  // Same unit IDs as real_time so the converter below has a known baseline.
  url.searchParams.set('temp_unitid', '1');
  url.searchParams.set('pressure_unitid', '3');
  url.searchParams.set('wind_speed_unitid', '7');
  url.searchParams.set('rainfall_unitid', '12');
  return url.toString();
}

type SeriesField = 'temp' | 'humidity' | 'wind' | 'gust' | 'dir' | 'rainRate' | 'rain' | 'pressure';

/** Ecowitt history expects "YYYY-MM-DD HH:MM:SS". */
function formatApiDate(d: Date): string {
  const iso = d.toISOString();
  return `${iso.slice(0, 10)} ${iso.slice(11, 19)}`;
}

/**
 * Maps an Ecowitt leaf key onto an internal series. Leaf key names vary
 * between firmware/API versions (snake_case and squashed forms both occur),
 * so both spellings are accepted.
 */
const FIELD_BY_LEAF: Record<string, SeriesField> = {
  temperature: 'temp',
  temp: 'temp',
  humidity: 'humidity',
  wind_speed: 'wind',
  windspeed: 'wind',
  wind_gust: 'gust',
  windgust: 'gust',
  wind_direction: 'dir',
  winddirection: 'dir',
  rain_rate: 'rainRate',
  rainrate: 'rainRate',
  hourly: 'rain',
  daily: 'rain',
  rainfall: 'rain',
  rain: 'rain',
  relative: 'pressure',
  relative_pressure: 'pressure',
};

const KIND_BY_FIELD: Record<SeriesField, UnitKind> = {
  temp: 'temp',
  humidity: 'plain',
  wind: 'speed',
  gust: 'speed',
  dir: 'plain',
  rainRate: 'rain',
  rain: 'rain',
  pressure: 'pressure',
};

function convertValue(field: SeriesField, value: number, unit?: string): number {
  return convertWithUnit(KIND_BY_FIELD[field], value, unit);
}

type ListEntry = [number, number];

function listEntries(list: unknown): ListEntry[] {
  const out: ListEntry[] = [];
  const push = (t: unknown, v: unknown) => {
    const time = Number(t);
    const value = Number(v);
    if (!Number.isFinite(time) || time <= 0 || !Number.isFinite(value)) return;
    const ms = time < 1e11 ? time * 1000 : time;
    out.push([ms, value]);
  };
  if (Array.isArray(list)) {
    for (const entry of list) {
      if (!entry || typeof entry !== 'object') continue;
      const e = entry as Record<string, unknown>;
      push(e.time ?? e.timestamp ?? e.date, e.value ?? e.v ?? e.temp);
    }
    return out;
  }
  if (list && typeof list === 'object') {
    for (const [time, value] of Object.entries(list as Record<string, unknown>)) {
      push(time, value);
    }
  }
  return out;
}

/**
 * Walks the response looking for `{ unit, list }` series nodes at any depth and
 * collects them by internal field name. The exact nesting is version-specific,
 * so the walk is intentionally shape-agnostic.
 */
function collectSeries(node: unknown, sink: Map<SeriesField, Map<number, number>>, depth = 0): void {
  if (!node || typeof node !== 'object' || depth > 6) return;
  if (Array.isArray(node)) {
    for (const item of node) collectSeries(item, sink, depth + 1);
    return;
  }
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    if (!value || typeof value !== 'object') continue;
    const field = FIELD_BY_LEAF[key.toLowerCase()];
    const series = value as { unit?: unknown; list?: unknown };
    if (field && series.list && typeof series.list === 'object') {
      const unit = typeof series.unit === 'string' ? series.unit : undefined;
      const target = sink.get(field) ?? new Map<number, number>();
      for (const [ms, raw] of listEntries(series.list)) {
        target.set(ms, convertValue(field, raw, unit));
      }
      sink.set(field, target);
      continue;
    }
    collectSeries(value, sink, depth + 1);
  }
}

/** Legacy flat shape: `data.item` as an array of per-timestamp records. */
function collectLegacyItems(items: unknown, sink: Map<SeriesField, Map<number, number>>): void {
  if (!Array.isArray(items)) return;
  for (const entry of items) {
    if (!entry || typeof entry !== 'object') continue;
    const e = entry as Record<string, unknown>;
    const ts = Number(e.time ?? e.timestamp);
    if (!Number.isFinite(ts) || ts <= 0) continue;
    const ms = ts < 1e11 ? ts * 1000 : ts;
    const pairs: Array<[SeriesField, unknown]> = [
      ['temp', e.temp ?? e.temperature],
      ['humidity', e.humidity],
      ['wind', e.wind_speed],
      ['gust', e.wind_gust],
      ['dir', e.wind_direction],
      ['rainRate', e.rain_rate],
      ['rain', e.rain ?? e.rainfall],
      ['pressure', e.pressure ?? e.relative_pressure],
    ];
    for (const [field, raw] of pairs) {
      const value = Number(raw);
      if (!Number.isFinite(value)) continue;
      const target = sink.get(field) ?? new Map<number, number>();
      target.set(ms, convertValue(field, value));
      sink.set(field, target);
    }
  }
}

/** Turns a raw Ecowitt history response into ascending HistoryPoints. */
export function normalizeHistory(raw: string): HistoryPoint[] {
  const json = JSON.parse(raw) as Record<string, unknown> & { code?: unknown; msg?: unknown };
  assertApiSuccess(json);
  const series = new Map<SeriesField, Map<number, number>>();
  collectSeries((json as { data?: unknown }).data ?? json, series);
  const data = json.data as { item?: unknown } | undefined;
  if (data && Array.isArray(data.item)) collectLegacyItems(data.item, series);

  const times = new Set<number>();
  series.forEach((map) => {
    map.forEach((_value, ms) => times.add(ms));
  });

  const points: HistoryPoint[] = [];
  const ordered = Array.from(times).sort((a, b) => a - b);
  for (let i = 0; i < ordered.length; i += 1) {
    const ms = ordered[i];
    const at = (field: SeriesField) => series.get(field)?.get(ms);
    const temp = at('temp');
    const humidity = at('humidity');
    const wind = at('wind');
    const gust = at('gust');
    const dir = at('dir');
    const rainRate = at('rainRate');
    const rain = at('rain');
    const pressure = at('pressure');
    if (
      temp == null &&
      humidity == null &&
      wind == null &&
      pressure == null &&
      rainRate == null &&
      rain == null
    ) {
      continue;
    }
    points.push({
      timestamp: new Date(ms).toISOString(),
      temperatureC: temp != null ? Math.round(temp * 10) / 10 : 0,
      humidityPct: humidity != null ? Math.round(humidity) : 0,
      windSpeedKmh: wind != null ? Math.round(wind * 10) / 10 : 0,
      windGustKmh: gust != null ? Math.round(gust * 10) / 10 : undefined,
      windDirectionDeg: dir != null ? Math.round(dir) : undefined,
      rainRateMmH: rainRate != null ? Math.round(rainRate * 100) / 100 : 0,
      pressureHpa: pressure != null ? Math.round(pressure * 10) / 10 : undefined,
      rainHourMm: rain != null ? Math.round(rain * 100) / 100 : undefined,
    });
  }
  return points;
}

/**
 * One upstream request at a time, with a small gap. /api/weather asks for
 * current + 24h + 7d simultaneously and the cloud throttles concurrent
 * calls, which silently starved one of the three.
 */
const MIN_GAP_MS = 220;
let upstreamChain: Promise<unknown> = Promise.resolve();

function serialize<T>(task: () => Promise<T>): Promise<T> {
  const run = upstreamChain.then(async () => {
    try {
      return await task();
    } finally {
      await new Promise((resolve) => setTimeout(resolve, MIN_GAP_MS));
    }
  });
  upstreamChain = run.catch(() => undefined);
  return run;
}

export async function fetchHistory(range: '24h' | '7d'): Promise<{ points: HistoryPoint[]; raw: string }> {
  if (!hasEcowittCredentials()) {
    throw new Error(missingCredentialsMessage());
  }

  const now = new Date();
  const end = formatApiDate(now);
  const start = formatApiDate(
    new Date(now.getTime() - (range === '24h' ? 86400000 : 7 * 86400000))
  );
  const url = buildHistoryQuery(range, start, end);

  const load = () =>
    serialize(async () => {
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) throw new Error(`Ecowitt history HTTP ${res.status}`);
      const raw = await res.text();
      // Exact field nesting is version-specific; docs/sample-history.json
      // (once pasted from a real call) is the final authority here.
      return { raw, points: normalizeHistory(raw) };
    });

  const first = await load();
  if (first.points.length > 0) return first;
  // A throttled call answers 200 with an empty payload; try once more.
  await new Promise((resolve) => setTimeout(resolve, 600));
  const retry = await load();
  return retry.points.length > 0 ? retry : first;
}

export function createRealSource(): WeatherSource {
  let lastGood: WeatherReading | null = null;

  return {
    async getCurrent() {
      try {
        const { reading } = await fetchRealTime();
        lastGood = reading;
        return reading;
      } catch (err) {
        if (lastGood) return lastGood;
        // Surface the real cause (never contains keys) so misconfiguration is
        // visible in server logs instead of a generic message.
        throw err instanceof Error ? err : new Error('Ecowitt real-time fetch failed');
      }
    },
    async getHistory(range) {
      const { points } = await fetchHistory(range);
      return points;
    },
  };
}

export default createRealSource;
