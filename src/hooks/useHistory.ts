'use client';

import useSWR from 'swr';
import { HistoryApiResponseSchema, HistoryApiResponse } from '@/lib/types';

const HISTORY_REFRESH_MS = 5 * 60 * 1000;

export async function historyFetcher(url: string): Promise<HistoryApiResponse> {
  const res = await fetch(url, { credentials: 'same-origin' });
  if (!res.ok) {
    throw new Error('History data unavailable');
  }
  try {
    return HistoryApiResponseSchema.parse(await res.json());
  } catch {
    throw new Error('History data unavailable');
  }
}

export type HistoryRange = '24h' | '7d';

export type HistoryQueryResult = {
  points: HistoryApiResponse['points'] | null;
  measuredAt: string | null;
  range: HistoryRange;
  isLoading: boolean;
  error: string | null;
};

export function useHistory(
  range: HistoryRange,
  scenario?: string
): HistoryQueryResult {
  const key =
    `/api/history?range=${range}` +
    (scenario ? `&scenario=${encodeURIComponent(scenario)}` : '');

  const { data, error, isLoading } = useSWR<HistoryApiResponse>(
    key,
    historyFetcher,
    {
      refreshInterval: HISTORY_REFRESH_MS,
      keepPreviousData: true,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      // SWR applies exponential backoff (interval × 2^retryCount) on retry.
      errorRetryInterval: 1_000,
    }
  );

  return {
    points: data?.points ?? null,
    measuredAt: data?.measuredAt ?? null,
    range: range,
    isLoading,
    error: error ? error.message : null,
  };
}
