import type { WeatherReading } from '@/lib/types';

export interface LivePreview {
  reading: WeatherReading | null;
  /** Backend the reading came from, or 'unavailable' when the fetch failed. */
  source: string;
  generatedAt: string;
}

/** Absolute origin for server-side self-requests (preview images, embeds). */
export function previewBaseUrl(): string {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined) ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);
  return configured || 'http://localhost:3000';
}

/**
 * Reads the live reading through our own API so previews and embeds never
 * talk to Ecowitt directly. Never throws: a failed preview degrades to the
 * branded card rather than a broken share link.
 */
export async function fetchLivePreview(): Promise<LivePreview> {
  const generatedAt = new Date().toISOString();
  try {
    const res = await fetch(`${previewBaseUrl()}/api/weather`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return { reading: null, source: 'unavailable', generatedAt };
    const json = (await res.json()) as {
      reading?: WeatherReading;
      meta?: { source?: string };
    };
    return {
      reading: json.reading ?? null,
      source: json.meta?.source ?? 'unknown',
      generatedAt,
    };
  } catch {
    return { reading: null, source: 'unavailable', generatedAt };
  }
}

/** "just now" / "4 min ago" — short form for cards with little room. */
export function shortAge(iso: string | undefined, now = Date.now()): string {
  if (!iso) return 'unknown';
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return 'unknown';
  const minutes = Math.max(0, Math.round((now - t) / 60000));
  if (minutes < 1) return 'just now';
  if (minutes === 1) return '1 min ago';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
}

/** Human label for the backend behind a reading. */
export function sourceLabel(source: string): string {
  if (source === 'ecowitt') return 'Ecowitt Cloud API · station WS3500';
  if (source === 'openmeteo') return 'Open-Meteo area model';
  if (source === 'mock') return 'Demo · simulated readings';
  return 'Live data unavailable';
}
