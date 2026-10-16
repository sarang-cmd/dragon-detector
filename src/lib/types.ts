// Schema-based types as requested in docs/02 and docs/04.
// Using zod so the TS types are inferred from a single source of truth.
import { z } from 'zod';

export const UnitSystemSchema = z.enum(['metric', 'imperial']);

export const WeatherReadingSchema = z.object({
  timestamp: z.string(),
  source: z.enum(['mock', 'ecowitt', 'openmeteo']),
  temperatureC: z.number(),
  feelsLikeC: z.number().optional(),
  dewPointC: z.number().optional(),
  humidityPct: z.number(),
  pressureHpa: z.number().optional(),
  windSpeedKmh: z.number(),
  windGustKmh: z.number(),
  windDirectionDeg: z.number(),
  rainRateMmH: z.number(),
  rainTodayMm: z.number(),
  rainHourMm: z.number().optional(),
  rainWeekMm: z.number().optional(),
  uvIndex: z.number().optional(),
  solarWm2: z.number().optional(),
});

export type WeatherReading = z.infer<typeof WeatherReadingSchema>;

export const HistoryPointSchema = WeatherReadingSchema.pick({
  timestamp: true,
  temperatureC: true,
  humidityPct: true,
  windSpeedKmh: true,
  rainRateMmH: true,
  pressureHpa: true,
}).extend({
  // Optional full-sensor fields so /data charts, stats and CSV can render
  // dew point, gusts, direction, accumulations, UV and solar. Older payloads
  // (and the Ecowitt history normalizer) may omit them; UI treats missing
  // as empty cells / hidden secondary series.
  dewPointC: z.number().optional(),
  feelsLikeC: z.number().optional(),
  windGustKmh: z.number().optional(),
  windDirectionDeg: z.number().optional(),
  rainTodayMm: z.number().optional(),
  rainHourMm: z.number().optional(),
  rainWeekMm: z.number().optional(),
  uvIndex: z.number().optional(),
  solarWm2: z.number().optional(),
});

export type HistoryPoint = z.infer<typeof HistoryPointSchema>;

export const WeatherApiResponseSchema = z.object({
  reading: WeatherReadingSchema,
  history: z.object({
    h24: z.array(HistoryPointSchema),
    d7: z.array(HistoryPointSchema),
  }),
  meta: z.object({
    fetchedAt: z.string(),
    fetchedAtServer: z.string(),
    stale: z.boolean(),
    offline: z.boolean(),
    measuredAt: z.string(),
    source: z.enum(['mock', 'ecowitt', 'openmeteo']),
    scenario: z.string().optional(),
  }),
});

export type WeatherApiResponse = z.infer<typeof WeatherApiResponseSchema>;

export interface WeatherSource {
  getCurrent(): Promise<WeatherReading>;
  getHistory(range: '24h' | '7d'): Promise<HistoryPoint[]>;
}

// Keep a small assertion helper for tests without importing zod shape directly.
export function assertReading(r: unknown): asserts r is WeatherReading {
  WeatherReadingSchema.parse(r);
}

export function assertHistoryPoint(p: unknown): asserts p is HistoryPoint {
  HistoryPointSchema.parse(p);
}

// History API response shape.
export const HistoryApiResponseSchema = z.object({
  points: z.array(HistoryPointSchema),
  range: z.enum(['24h', '7d']),
  fetchedAt: z.string(),
  measuredAt: z.string().optional(),
});

export type HistoryApiResponse = z.infer<typeof HistoryApiResponseSchema>;

// Re-export schemas for convenience in tests.
export const Schemas = {
  WeatherReading: WeatherReadingSchema,
  HistoryPoint: HistoryPointSchema,
  WeatherApiResponse: WeatherApiResponseSchema,
  HistoryApiResponse: HistoryApiResponseSchema,
};
