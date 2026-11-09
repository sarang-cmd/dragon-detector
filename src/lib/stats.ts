import type { HistoryPoint } from '@/lib/types';
import { stepHours } from '@/lib/history';
import { averageWindDirection, compassWord } from '@/lib/beaufort';
import { DEFAULT_TIME_ZONE } from '@/lib/time';

/**
 * Station statistics over one history window.
 *
 * Everything here is pure: it takes `HistoryPoint[]` (already normalised,
 * always metric — °C, km/h, mm, hPa, W/m²) and returns numbers plus the
 * timestamps that produced them. The page converts to imperial at render
 * time, so the maths never sees a converted value.
 */

/** Min, max and mean of one series, with the moments they happened. */
export interface Extremes {
  min: number;
  max: number;
  avg: number;
  minTime: string | null;
  maxTime: string | null;
  /** How many of the window's readings carried this sensor. */
  count: number;
}

/** How much of the window the station actually reported in. */
export interface Coverage {
  points: number;
  /** Readings the window should hold, given the sampling step. */
  expected: number;
  /** 0–100. Our honest stand-in for "uptime": gaps are visible, not hidden. */
  percent: number;
  stepHours: number;
  from: string | null;
  to: string | null;
  spanHours: number;
}

export interface DailyRow {
  /** Europe/Berlin calendar day, YYYY-MM-DD. */
  date: string;
  min: number | null;
  max: number | null;
  avg: number | null;
  rainMm: number;
  maxGust: number | null;
  avgHumidity: number | null;
  points: number;
}

/** Mean conditions for one hour of the day across the whole window. */
export interface HourProfile {
  hour: number;
  avgTemp: number | null;
  avgWind: number | null;
  count: number;
}

export interface WindSector {
  label: string;
  /** Sector midpoint in degrees, for drawing. */
  deg: number;
  percent: number;
  count: number;
}

export interface Streaks {
  /** Hours, not readings: `count × stepHours`. */
  dryHours: number;
  wetHours: number;
  frostHours: number;
  longestDryHours: number;
  longestWetHours: number;
  longestFrostHours: number;
  /** Still-running streaks at the end of the window. */
  currentDryHours: number;
  currentWetHours: number;
  currentFrostHours: number;
}

export interface RainTotals {
  /** Estimated over the window: Σ rain rate × sampling step. */
  windowMm: number;
  wettestDay: DailyRow | null;
  dryDays: number;
  wetDays: number;
}

export interface WindSummary {
  prevailingDeg: number;
  prevailingLabel: string;
  sectors: WindSector[];
  /** Share of readings below 1 km/h. */
  calmPercent: number;
  avgSpeed: number | null;
  maxGust: number | null;
  maxGustTime: string | null;
}

export interface StationStats {
  coverage: Coverage;
  temperature: Extremes | null;
  feelsLike: Extremes | null;
  dewPoint: Extremes | null;
  humidity: Extremes | null;
  pressure: Extremes | null;
  windSpeed: Extremes | null;
  gust: Extremes | null;
  rainRate: Extremes | null;
  uv: Extremes | null;
  solar: Extremes | null;
  rain: RainTotals;
  daily: DailyRow[];
  hourly: HourProfile[];
  wind: WindSummary;
  streaks: Streaks;
}

const SECTOR_LABELS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;
const HOUR_MS = 3_600_000;

const dayFmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: DEFAULT_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const hourFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: DEFAULT_TIME_ZONE,
  hour: '2-digit',
  hour12: false,
});

function num(v: number | null | undefined): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

function berlinDay(iso: string): string | null {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return dayFmt.format(new Date(t));
}

function berlinHour(iso: string): number | null {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  const h = Number.parseInt(hourFmt.format(new Date(t)), 10);
  return Number.isFinite(h) ? h % 24 : null;
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/** Sorted by time; unparseable timestamps dropped. */
function sorted(points: HistoryPoint[]): HistoryPoint[] {
  return points
    .filter((p) => !Number.isNaN(Date.parse(p.timestamp)))
    .slice()
    .sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
}

function extremes(
  points: HistoryPoint[],
  pick: (p: HistoryPoint) => number | null | undefined
): Extremes | null {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  let minTime: string | null = null;
  let maxTime: string | null = null;
  let sum = 0;
  let count = 0;
  for (const p of points) {
    const v = num(pick(p));
    if (v == null) continue;
    count += 1;
    sum += v;
    if (v < min) {
      min = v;
      minTime = p.timestamp;
    }
    if (v > max) {
      max = v;
      maxTime = p.timestamp;
    }
  }
  if (count === 0) return null;
  return { min, max, avg: sum / count, minTime, maxTime, count };
}

function coverage(points: HistoryPoint[]): Coverage {
  if (points.length === 0) {
    return {
      points: 0,
      expected: 0,
      percent: 0,
      stepHours: 0,
      from: null,
      to: null,
      spanHours: 0,
    };
  }
  const step = stepHours(points);
  const from = points[0].timestamp;
  const to = points[points.length - 1].timestamp;
  const spanHours = Math.max(0, (Date.parse(to) - Date.parse(from)) / HOUR_MS);
  // +1 so a window measured at both ends counts both endpoints.
  const expected = step > 0 ? Math.floor(spanHours / step) + 1 : points.length;
  const percent = expected > 0 ? Math.min(100, (points.length / expected) * 100) : 100;
  return {
    points: points.length,
    expected,
    percent,
    stepHours: step,
    from,
    to,
    spanHours,
  };
}

function dailyRows(points: HistoryPoint[], step: number): DailyRow[] {
  const byDay = new Map<string, HistoryPoint[]>();
  for (const p of points) {
    const day = berlinDay(p.timestamp);
    if (!day) continue;
    const bucket = byDay.get(day);
    if (bucket) bucket.push(p);
    else byDay.set(day, [p]);
  }
  return Array.from(byDay.keys())
    .sort()
    .map((date) => {
      const rows = byDay.get(date) ?? [];
      const temps = rows.map((p) => num(p.temperatureC)).filter((v): v is number => v != null);
      const gusts = rows
        .map((p) => num(p.windGustKmh ?? p.windSpeedKmh))
        .filter((v): v is number => v != null);
      const humidity = rows
        .map((p) => num(p.humidityPct))
        .filter((v): v is number => v != null);
      const rainMm = rows.reduce((total, p) => {
        const rate = num(p.rainRateMmH);
        return rate == null ? total : total + rate * step;
      }, 0);
      return {
        date,
        min: temps.length ? Math.min(...temps) : null,
        max: temps.length ? Math.max(...temps) : null,
        avg: mean(temps),
        // Rounding here keeps the table honest to the 0.1 mm bucket.
        rainMm: Math.round(rainMm * 10) / 10,
        maxGust: gusts.length ? Math.max(...gusts) : null,
        avgHumidity: mean(humidity),
        points: rows.length,
      };
    });
}

function hourlyProfile(points: HistoryPoint[]): HourProfile[] {
  const temps = new Map<number, number[]>();
  const winds = new Map<number, number[]>();
  for (const p of points) {
    const hour = berlinHour(p.timestamp);
    if (hour == null) continue;
    const t = num(p.temperatureC);
    if (t != null) {
      const bucket = temps.get(hour);
      if (bucket) bucket.push(t);
      else temps.set(hour, [t]);
    }
    const w = num(p.windSpeedKmh);
    if (w != null) {
      const bucket = winds.get(hour);
      if (bucket) bucket.push(w);
      else winds.set(hour, [w]);
    }
  }
  const profile: HourProfile[] = [];
  for (let hour = 0; hour < 24; hour++) {
    const t = temps.get(hour) ?? [];
    const w = winds.get(hour) ?? [];
    profile.push({
      hour,
      avgTemp: mean(t),
      avgWind: mean(w),
      count: Math.max(t.length, w.length),
    });
  }
  return profile;
}

function windSummary(points: HistoryPoint[]): WindSummary {
  const dirs: number[] = [];
  const speeds: number[] = [];
  let calm = 0;
  let gustMax: number | null = null;
  let gustTime: string | null = null;
  const counts = new Array<number>(SECTOR_LABELS.length).fill(0);

  for (const p of points) {
    const dir = num(p.windDirectionDeg);
    const speed = num(p.windSpeedKmh);
    if (speed != null) {
      speeds.push(speed);
      if (speed < 1) calm += 1;
    }
    if (dir != null) {
      dirs.push(dir);
      // Sectors are centred on the compass point, so N spans 337.5°–22.5°.
      const idx = Math.round((((dir % 360) + 360) % 360) / 45) % SECTOR_LABELS.length;
      counts[idx] += 1;
    }
    const gust = num(p.windGustKmh);
    if (gust != null && (gustMax == null || gust > gustMax)) {
      gustMax = gust;
      gustTime = p.timestamp;
    }
  }

  const total = dirs.length;
  const sectors: WindSector[] = SECTOR_LABELS.map((label, i) => ({
    label,
    deg: i * 45,
    percent: total > 0 ? (counts[i] / total) * 100 : 0,
    count: counts[i],
  }));

  const prevailingDeg = dirs.length ? averageWindDirection(dirs) : 0;
  return {
    prevailingDeg,
    prevailingLabel: dirs.length ? compassWord(prevailingDeg) : '—',
    sectors,
    calmPercent: speeds.length > 0 ? (calm / speeds.length) * 100 : 0,
    avgSpeed: mean(speeds),
    maxGust: gustMax,
    maxGustTime: gustTime,
  };
}

/**
 * Run lengths in hours. `isOn` decides whether a reading counts towards a
 * streak; gaps in the record break a streak rather than extending it.
 */
function streakHours(
  points: HistoryPoint[],
  step: number,
  isOn: (p: HistoryPoint) => boolean | null
): { on: number; longest: number; current: number } {
  let on = 0;
  let longest = 0;
  let run = 0;
  for (const p of points) {
    const state = isOn(p);
    if (state == null) {
      // Sensor missing: end the run, do not count it either way.
      run = 0;
      continue;
    }
    if (state) {
      run += 1;
      on += 1;
      if (run > longest) longest = run;
    } else {
      run = 0;
    }
  }
  // "Current" is the run still alive at the newest reading.
  let current = 0;
  for (let i = points.length - 1; i >= 0; i--) {
    if (isOn(points[i]) !== true) break;
    current += 1;
  }
  const hours = (n: number) => Math.round(n * step * 10) / 10;
  return { on: hours(on), longest: hours(longest), current: hours(current) };
}

function streaks(points: HistoryPoint[], step: number): Streaks {
  const dry = streakHours(points, step, (p) => {
    const r = num(p.rainRateMmH);
    return r == null ? null : r <= 0;
  });
  const wet = streakHours(points, step, (p) => {
    const r = num(p.rainRateMmH);
    return r == null ? null : r > 0;
  });
  const frost = streakHours(points, step, (p) => {
    const t = num(p.temperatureC);
    return t == null ? null : t < 0;
  });
  return {
    dryHours: dry.on,
    wetHours: wet.on,
    frostHours: frost.on,
    longestDryHours: dry.longest,
    longestWetHours: wet.longest,
    longestFrostHours: frost.longest,
    currentDryHours: dry.current,
    currentWetHours: wet.current,
    currentFrostHours: frost.current,
  };
}

/**
 * Build every statistic on the page from one history window.
 * Safe on an empty array: every series is null and coverage is 0.
 */
export function computeStationStats(history: HistoryPoint[]): StationStats {
  const points = sorted(history);
  const cov = coverage(points);
  const step = cov.stepHours > 0 ? cov.stepHours : 5 / 60;
  const daily = dailyRows(points, step);

  const windowMm = points.reduce((total, p) => {
    const rate = num(p.rainRateMmH);
    return rate == null ? total : total + rate * step;
  }, 0);

  let wettest: DailyRow | null = null;
  let wetDays = 0;
  let dryDays = 0;
  for (const row of daily) {
    if (row.rainMm > 0) wetDays += 1;
    else dryDays += 1;
    if (!wettest || row.rainMm > wettest.rainMm) wettest = row;
  }

  return {
    coverage: cov,
    temperature: extremes(points, (p) => p.temperatureC),
    feelsLike: extremes(points, (p) => p.feelsLikeC),
    dewPoint: extremes(points, (p) => p.dewPointC),
    humidity: extremes(points, (p) => p.humidityPct),
    pressure: extremes(points, (p) => p.pressureHpa),
    windSpeed: extremes(points, (p) => p.windSpeedKmh),
    gust: extremes(points, (p) => p.windGustKmh),
    rainRate: extremes(points, (p) => p.rainRateMmH),
    uv: extremes(points, (p) => p.uvIndex),
    solar: extremes(points, (p) => p.solarWm2),
    rain: {
      windowMm: Math.round(windowMm * 10) / 10,
      wettestDay: wettest,
      dryDays,
      wetDays,
    },
    daily,
    hourly: hourlyProfile(points),
    wind: windSummary(points),
    streaks: streaks(points, step),
  };
}

/** "3.4 days", "18 h", "45 min" — for the window length headline. */
export function formatSpan(hours: number): string {
  if (!Number.isFinite(hours) || hours <= 0) return 'no data';
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  if (hours < 48) return `${Math.round(hours)} h`;
  const days = hours / 24;
  return `${days.toFixed(days < 10 ? 1 : 0)} days`;
}

/** Hours → "2 h 30 min", used by the streak rows. */
export function formatHours(hours: number): string {
  if (!Number.isFinite(hours) || hours <= 0) return '0 min';
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  const whole = Math.floor(hours);
  const mins = Math.round((hours - whole) * 60);
  if (mins === 0) return `${whole} h`;
  return `${whole} h ${mins} min`;
}
