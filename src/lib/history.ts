import type { HistoryPoint } from '@/lib/types';
import { DEFAULT_TIME_ZONE } from '@/lib/time';

export type HistoryRange = '24h' | '7d';

export type MetricKey =
  | 'temperature'
  | 'wind'
  | 'rain'
  | 'pressure'
  | 'humidity'
  | 'sun';

export const METRICS: { key: MetricKey; label: string }[] = [
  { key: 'temperature', label: 'Temperature' },
  { key: 'wind', label: 'Wind' },
  { key: 'rain', label: 'Rain' },
  { key: 'pressure', label: 'Pressure' },
  { key: 'humidity', label: 'Humidity' },
  { key: 'sun', label: 'Sun' },
];

export function parseRange(raw: string | null): HistoryRange {
  return raw === '7d' ? '7d' : '24h';
}

export function parseMetric(raw: string | null): MetricKey {
  const keys: MetricKey[] = [
    'temperature',
    'wind',
    'rain',
    'pressure',
    'humidity',
    'sun',
  ];
  return keys.includes(raw as MetricKey) ? (raw as MetricKey) : 'temperature';
}

// ---------- Berlin time formatters ----------

const tick24hFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: DEFAULT_TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const tick7dFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: DEFAULT_TIME_ZONE,
  weekday: 'short',
  day: '2-digit',
  month: '2-digit',
});

const tooltipFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: DEFAULT_TIME_ZONE,
  weekday: 'short',
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const statTimeFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: DEFAULT_TIME_ZONE,
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const dayFmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: DEFAULT_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function safeDate(iso: string): Date | null {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatTick(iso: string, range: HistoryRange): string {
  const d = safeDate(iso);
  if (!d) return '';
  return range === '24h' ? tick24hFmt.format(d) : tick7dFmt.format(d);
}

export function formatTooltipTime(iso: string): string {
  const d = safeDate(iso);
  return d ? `${tooltipFmt.format(d)} (Berlin)` : iso;
}

export function formatStatTime(iso: string): string {
  const d = safeDate(iso);
  return d ? statTimeFmt.format(d) : '';
}

export function berlinToday(): string {
  return dayFmt.format(new Date());
}

// ---------- Stats ----------

export interface StatPoint {
  timestamp: string;
  value: number | null | undefined;
}

export interface SeriesStats {
  min: number;
  max: number;
  avg: number;
  change: number;
  minTime: string;
  maxTime: string;
  count: number;
}

export function computeStats(points: StatPoint[]): SeriesStats | null {
  const valid = points.filter(
    (p): p is { timestamp: string; value: number } =>
      typeof p.value === 'number' && Number.isFinite(p.value)
  );
  if (valid.length === 0) return null;
  let min = valid[0].value;
  let max = valid[0].value;
  let minTime = valid[0].timestamp;
  let maxTime = valid[0].timestamp;
  let sum = 0;
  for (const p of valid) {
    sum += p.value;
    if (p.value < min) {
      min = p.value;
      minTime = p.timestamp;
    }
    if (p.value > max) {
      max = p.value;
      maxTime = p.timestamp;
    }
  }
  return {
    min,
    max,
    avg: sum / valid.length,
    change: valid[valid.length - 1].value - valid[0].value,
    minTime,
    maxTime,
    count: valid.length,
  };
}

// Padded domain so tiny pressure changes stay visible.
export function paddedDomain(
  values: (number | null | undefined)[],
  minPad = 0.5,
  fraction = 0.3
): [number, number] {
  const valid = values.filter(
    (v): v is number => typeof v === 'number' && Number.isFinite(v)
  );
  if (valid.length === 0) return [0, 1];
  const lo = Math.min(...valid);
  const hi = Math.max(...valid);
  const span = hi - lo;
  const pad = Math.max(minPad, span * fraction);
  // Round outward to 1 decimal for stable axis labels.
  const lower = Math.floor((lo - pad) * 10) / 10;
  const upper = Math.ceil((hi + pad) * 10) / 10;
  if (upper <= lower) return [lower, lower + 1];
  return [lower, upper];
}

// Estimate the sampling step in hours from timestamps (median diff).
export function stepHours(points: HistoryPoint[]): number {
  if (points.length < 2) return 5 / 60;
  const times = points
    .map((p) => new Date(p.timestamp).getTime())
    .filter((t) => Number.isFinite(t))
    .sort((a, b) => a - b);
  if (times.length < 2) return 5 / 60;
  const diffs: number[] = [];
  for (let i = 1; i < times.length; i++) diffs.push(times[i] - times[i - 1]);
  diffs.sort((a, b) => a - b);
  const median = diffs[Math.floor(diffs.length / 2)];
  const hours = median / 3_600_000;
  return hours > 0 && Number.isFinite(hours) ? hours : 5 / 60;
}

export function cumulativeRain(
  points: HistoryPoint[],
  rainPerPointMm: (number | null | undefined)[]
): (number | null)[] {
  const hours = stepHours(points);
  let running = 0;
  return rainPerPointMm.map((r) => {
    if (typeof r !== 'number' || !Number.isFinite(r)) return null;
    running += r * hours;
    return Math.round(running * 100) / 100;
  });
}

// ---------- CSV ----------

export const CSV_COLUMNS = [
  'timestamp_iso',
  'temperature_c',
  'humidity_pct',
  'pressure_hpa',
  'wind_kmh',
  'gust_kmh',
  'wind_dir_deg',
  'rain_rate_mm_h',
  'rain_today_mm',
  'uv',
  'solar_w_m2',
] as const;

export const CSV_UNITS_COMMENT =
  '# Units are always metric: temperature °C, humidity %, pressure hPa, wind km/h, wind direction degrees, rain mm/h and mm, UV index, solar W/m².';

function escapeCsvCell(value: string): string {
  if (value.includes('"') || value.includes(',') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function numCell(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return '';
  return escapeCsvCell(String(v));
}

export function buildHistoryCsv(points: HistoryPoint[]): string {
  const sorted = [...points].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  const header = CSV_COLUMNS.join(',');
  const rows = sorted.map((p) =>
    [
      escapeCsvCell(p.timestamp),
      numCell(p.temperatureC),
      numCell(p.humidityPct),
      numCell(p.pressureHpa),
      numCell(p.windSpeedKmh),
      numCell(p.windGustKmh),
      numCell(p.windDirectionDeg),
      numCell(p.rainRateMmH),
      numCell(p.rainTodayMm),
      numCell(p.uvIndex),
      numCell(p.solarWm2),
    ].join(',')
  );
  return [CSV_UNITS_COMMENT, header, ...rows].join('\n') + '\n';
}

export function csvFileName(range: HistoryRange, date = berlinToday()): string {
  return `dis-weather_${range}_${date}.csv`;
}

export function downloadCsv(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
