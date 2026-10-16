'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { WeatherApiResponseSchema, WeatherApiResponse } from '@/lib/types';

const STALE_AFTER_MS = 10 * 60 * 1000;
const OFFLINE_AFTER_MS = 30 * 60 * 1000;

export const WEATHER_STALE_MS = STALE_AFTER_MS;
export const WEATHER_OFFLINE_MS = OFFLINE_AFTER_MS;

export async function weatherFetcher(url: string): Promise<WeatherApiResponse> {
  const res = await fetch(url, { credentials: 'same-origin' });
  if (!res.ok) {
    // Never surface internal API error bodies to the UI.
    throw new Error('Weather data unavailable');
  }
  try {
    return WeatherApiResponseSchema.parse(await res.json());
  } catch {
    throw new Error('Weather data unavailable');
  }
}

/** Age of a measured value in ms; 0 when not yet mounted or unknown. */
export function measuredAgeMs(
  measuredAt: string | null | undefined,
  nowMs: number | null
): number {
  if (measuredAt == null || nowMs == null) return 0;
  return Math.max(0, nowMs - Date.parse(measuredAt));
}

/** Derive stale/offline flags from an age in ms (strictly greater than thresholds). */
export function classifyWeatherAge(ageMs: number): {
  isStale: boolean;
  isOffline: boolean;
} {
  return {
    isStale: ageMs > STALE_AFTER_MS,
    isOffline: ageMs > OFFLINE_AFTER_MS,
  };
}

/** Seconds since `measuredAt`, recomputed every second WITHOUT refetching. */
export function useElapsedSeconds(measuredAt: string | null | undefined): number {
  const [nowMs, setNowMs] = useState<number | null>(null);

  useEffect(() => {
    // First paint matches the server render (0), then we tick.
    setNowMs(Date.now());
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  if (measuredAt == null) return 0;
  if (nowMs == null) return 0;
  return Math.max(0, Math.round((nowMs - Date.parse(measuredAt)) / 1000));
}

export type WeatherQueryResult = {
  reading: WeatherApiResponse['reading'] | null;
  history: WeatherApiResponse['history'] | null;
  measuredAt: string | null;
  secondsSinceMeasured: number;
  isStale: boolean;
  isOffline: boolean;
  /** True unless the API served a real Ecowitt reading. */
  isMock: boolean;
  isLoading: boolean;
  error: string | null;
};

export function useWeather(scenario?: string): WeatherQueryResult {
  const isMockMode = process.env.NEXT_PUBLIC_DATA_MODE !== 'real';

  const key = scenario
    ? `/api/weather?scenario=${encodeURIComponent(scenario)}`
    : '/api/weather';

  const { data, error, isLoading } = useSWR<WeatherApiResponse>(
    key,
    weatherFetcher,
    {
      refreshInterval: isMockMode ? 5_000 : 60_000,
      keepPreviousData: true,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      // SWR applies exponential backoff (interval × 2^retryCount) on retry.
      shouldRetryOnError: true,
      errorRetryInterval: 1_000,
    }
  );

  // Separate 1-second interval so secondsSinceMeasured ticks live
  // without triggering a refetch (refetching is SWR's job above).
  const secondsSinceMeasured = useElapsedSeconds(data?.meta.measuredAt ?? null);

  const ageMs =
    data?.meta.measuredAt != null
      ? nowBasedAge(data.meta.measuredAt, secondsSinceMeasured)
      : 0;
  const { isStale, isOffline } = classifyWeatherAge(ageMs);

  return {
    reading: data?.reading ?? null,
    history: data?.history ?? null,
    measuredAt: data?.meta.measuredAt ?? null,
    secondsSinceMeasured,
    isStale,
    isOffline,
    isMock: (data?.meta.source ?? 'mock') !== 'ecowitt',
    isLoading: !data && !error,
    error: error ? error.message : null,
  };
}

/** Round-trip the seconds to ms so flags and seconds stay in agreement. */
function nowBasedAge(measuredAt: string, secondsSinceMeasured: number): number {
  return secondsSinceMeasured * 1000;
}
