'use client';

import useSWR from 'swr';
import { WeatherReading, HistoryPoint } from '@/lib/types';

const fetcher = async (url: string) => {
  const res = await fetch(url, { cache: 'no-store', next: { revalidate: 0 } });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Weather API error ${res.status}`);
  }
  return res.json() as Promise<{
    reading: WeatherReading;
    history: { h24: HistoryPoint[]; d7: HistoryPoint[] };
    meta: {
      fetchedAt: string;
      stale: boolean;
      isOffline: boolean;
      source: 'mock' | 'ecowitt';
      measuredAt: string;
      updatedAt: string;
      scenario?: string;
    };
  }>;
};

type WeatherState = {
  reading: WeatherReading | null;
  history: { h24: HistoryPoint[]; d7: HistoryPoint[] } | null;
  isLoading: boolean;
  isStale: boolean;
  isOffline: boolean;
  secondsSinceUpdate: number;
  scenario?: string;
  error: string | null;
  refresh: () => Promise<void>;
};

export function useWeather(scenario?: string) {
  const shouldScenario = typeof window !== 'undefined' && scenario;
  const url = new URL('/api/weather', window.location.origin);
  if (shouldScenario) url.searchParams.set('scenario', scenario);

  const { data, error, mutate } = useSWR<{
    reading: WeatherReading;
    history: { h24: HistoryPoint[]; d7: HistoryPoint[] };
    meta: {
      fetchedAt: string;
      stale: boolean;
      isOffline: boolean;
      source: 'mock' | 'ecowitt';
      measuredAt: string;
      updatedAt: string;
      scenario?: string;
    };
  }>(url.toString(), fetcher, {
    refreshInterval: shouldScenario ? 0 : undefined,
    revalidateOnFocus: false,
  });

  const reading = data?.reading ?? null;
  const history = data?.history ?? null;
  const meta = data?.meta;
  const isLoading = !data && !error;
  const isStale = meta?.stale ?? false;
  const isOffline = meta?.isOffline ?? false;

  let secondsSinceUpdate = 0;
  if (meta?.measuredAt && typeof window !== 'undefined') {
    const diff = Date.now() - new Date(meta.measuredAt).getTime();
    secondsSinceUpdate = Math.max(0, Math.round(diff / 1000));
  }

  return {
    reading,
    history,
    isLoading,
    isStale,
    isOffline,
    secondsSinceUpdate,
    scenario: meta?.scenario,
    error: error ? error.message : null,
    refresh: mutate,
  };
}
