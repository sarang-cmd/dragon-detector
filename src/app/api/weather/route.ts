import { NextRequest, NextResponse } from 'next/server';
import { getSource } from '@/sources';
import { WeatherReading, HistoryPoint } from '@/lib/types';

// Client-friendly response shape.
type WeatherResponse = {
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
};

const SOURCE_CACHE_MS = 60_000; // 60 s server-side cache protects Ecowitt rate limits.
const STALE_MS = 10 * 60 * 1000; // older than 10 min: stale
const OFFLINE_MS = 30 * 60 * 1000; // older than 30 min: offline

let lastGood: WeatherReading | null = null;
let lastResponse: WeatherResponse | null = null;
let lastFetchAt = 0;

function now(): number {
  return Date.now();
}

function secondsStale(measuredAt: string) {
  const ms = now() - new Date(measuredAt).getTime();
  return Math.max(0, Math.round(ms / 1000));
}

function buildMeta(reading: WeatherReading, scenario?: string) {
  const measuredAt = reading.timestamp;
  const fetchedAt = new Date().toISOString();
  const age = secondsStale(measuredAt);
  const stale = age > STALE_MS / 1000;
  const isOffline = age > OFFLINE_MS / 1000;
  return {
    fetchedAt,
    stale,
    isOffline,
    source: reading.source,
    measuredAt,
    updatedAt: measuredAt,
    scenario: scenario || undefined,
  };
}

function createEmptyHistory(): { h24: HistoryPoint[]; d7: HistoryPoint[] } {
  return { h24: [], d7: [] };
}

export async function GET(req: NextRequest) {
  const scenario = (req.nextUrl.searchParams.get('scenario') || '').toLowerCase();
  const forceMock = req.nextUrl.searchParams.has('force_mock');

  const source = getSource();
  // DEV: route param can override scenario on the shared mock source.
  if (scenario && !forceMock) {
    // update the shared source's scenario (mock only)
    if (process.env.DATA_SOURCE !== 'ecowitt') {
      ;(source as unknown as { __scenario?: string }).__scenario = scenario;
    } else {
      // still accept scenario param for metadata only.
    }
  }

  const freshEnough = now() - lastFetchAt < SOURCE_CACHE_MS;
  let reading: WeatherReading;
  let history = createEmptyHistory();

  if (freshEnough && lastResponse) {
    // Reuse cached response for this interval (does not update measuredAt).
    reading = lastResponse.reading;
    history = lastResponse.history;
  } else {
    try {
      reading = await source.getCurrent();
      lastGood = reading;
      const hist = await source.getHistory('24h');
      const hist7 = await source.getHistory('7d');
      history = { h24: hist, d7: hist7 };
    } catch (err) {
      // Fallback to last-good, flagged stale/offline.
      if (!lastGood) {
        return NextResponse.json(
          { error: 'Weather unavailable', stale: false, isOffline: true },
          { status: 503 }
        );
      }
      reading = lastGood;
      history = createEmptyHistory();
    }
    lastFetchAt = now();
    lastResponse = { reading, history, meta: buildMeta(reading, scenario) };
  }

  const meta = buildMeta(reading, scenario);
  lastResponse = { reading, history, meta };

  return NextResponse.json(lastResponse, {
    headers: {
      'Cache-Control': 'private, max-age=0, no-cache',
      Vary: 'Origin',
    },
  });
}
