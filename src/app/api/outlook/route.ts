import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSource } from '@/lib/sources';
import {
  buildStatisticalOutlook,
  isFresh,
  type ForecastHour,
} from '@/lib/outlook';
import type { UnitSystem } from '@/lib/units';

// Station coordinates (docs/04 §2, footer).
const LAT = 51.0504;
const LON = 13.7373;

// One shared outlook for everyone, refreshed at most every 15 minutes.
// Two tiers: (1) in-memory per instance, (2) Supabase `outlook_cache` shared
// across all instances. A school of visitors on any number of server
// instances still costs a single upstream call per 15 minutes (free-tier
// safe). If Supabase is unconfigured or its table missing, tier 1 alone
// applies and a 60s negative-cache avoids hammering a dead backend.
const CACHE_TTL_MS = 15 * 60 * 1000;
const SUPABASE_DOWN_COOLDOWN_MS = 60 * 1000;

interface CachedOutlook {
  expiresAt: number;
  payload: Record<string, unknown>;
  units: UnitSystem;
}

let cache: CachedOutlook | null = null;
let inFlight: { units: UnitSystem; promise: Promise<Record<string, unknown>> } | null =
  null;
let supabaseDownUntil = 0;

const querySchema = z.object({
  units: z.enum(['metric', 'imperial']).optional(),
});

const openMeteoSchema = z.object({
  hourly: z.object({
    time: z.array(z.string()),
    temperature_2m: z.array(z.number().nullable()).optional(),
    precipitation_probability: z.array(z.number().nullable()).optional(),
    precipitation: z.array(z.number().nullable()).optional(),
    wind_speed_10m: z.array(z.number().nullable()).optional(),
    relative_humidity_2m: z.array(z.number().nullable()).optional(),
  }),
});

async function fetchForecast(): Promise<ForecastHour[]> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}` +
    `&hourly=temperature_2m,precipitation_probability,precipitation,wind_speed_10m,relative_humidity_2m` +
    `&forecast_days=2&timezone=Europe%2FBerlin&wind_speed_unit=kmh`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
  const json = openMeteoSchema.parse(await res.json());

  const now = Date.now();
  const hours: ForecastHour[] = [];
  for (let i = 0; i < json.hourly.time.length && hours.length < 12; i++) {
    const t = new Date(json.hourly.time[i]).getTime();
    if (Number.isNaN(t) || t < now - 60 * 60 * 1000) continue;
    hours.push({
      time: json.hourly.time[i],
      tempC: json.hourly.temperature_2m?.[i] ?? null,
      precipProb: json.hourly.precipitation_probability?.[i] ?? null,
      precipMm: json.hourly.precipitation?.[i] ?? null,
      windKmh: json.hourly.wind_speed_10m?.[i] ?? null,
      humidityPct: json.hourly.relative_humidity_2m?.[i] ?? null,
    });
  }
  return hours;
}

function groqPrompt(
  tempC: number,
  rainRate: number,
  statistical: string,
  hours: ForecastHour[],
  units: UnitSystem
): { system: string; user: string } {
  const unitWord = units === 'metric' ? 'Celsius, km/h and mm' : 'Fahrenheit, mph and inches';
  const curve = hours
    .slice(0, 8)
    .map(
      (h) =>
        `${h.time.slice(11, 16)}: ${h.tempC ?? '?'}C, rain ${h.precipProb ?? '?'}%`
    )
    .join('; ');
  return {
    system:
      'You are the Dresden International School weather station assistant. ' +
      'Write one or two very short plain-language sentences (reading age ~12) ' +
      'about the next 12 hours for students. Use only the numbers given. ' +
      `Use ${unitWord}. No markdown, no emojis, no exclamation marks, ` +
      'no advice beyond jackets or umbrellas.',
    user:
      `Now in Dresden: ${tempC.toFixed(1)}C, rain rate ${rainRate} mm/h. ` +
      `Station trend says: ${statistical} ` +
      `Model hours: ${curve}`,
  };
}

async function fetchAiOutlook(
  tempC: number,
  rainRate: number,
  statistical: string,
  hours: ForecastHour[],
  units: UnitSystem
): Promise<{ text: string; model: string } | null> {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  try {
    const { system, user } = groqPrompt(tempC, rainRate, statistical, hours, units);
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      // The key travels only in this server-to-Groq call; it is never
      // logged, never returned to the browser, never committed.
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        // Low reasoning effort: this task needs a short answer, not a proof.
        // (Reasoning tokens share the completion budget, a deep think with
        // a small max_tokens starves the actual answer.)
        reasoning_effort: 'low',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        temperature: 0.3,
        max_tokens: 300,
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      console.error('[outlook-api] Groq rejected the request');
      return null;
    }
    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = json.choices?.[0]?.message?.content?.trim();
    if (!text) return null;
    return { text, model: 'openai/gpt-oss-120b' };
  } catch {
    console.error('[outlook-api] Groq call failed, using statistics');
    return null;
  }
}

/**
 * Tier 2: shared Supabase cache. Returns the cached payload when fresh,
 * null when stale/missing/unavailable (never throws).
 */
async function readSharedCache(
  units: UnitSystem
): Promise<{ payload: Record<string, unknown>; generatedAt: string } | null> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    Date.now() < supabaseDownUntil
  ) {
    return null;
  }
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = createClient();
    const { data, error } = await supabase
      .from('outlook_cache')
      .select('payload, updated_at')
      .eq('units', units)
      .maybeSingle();
    if (error) throw error;
    if (!data || !isFresh(data.updated_at, Date.now())) return null;
    return {
      payload: data.payload as Record<string, unknown>,
      generatedAt: data.updated_at as string,
    };
  } catch {
    // Table missing, RLS, or network: back off briefly, stay memory-only.
    supabaseDownUntil = Date.now() + SUPABASE_DOWN_COOLDOWN_MS;
    return null;
  }
}

/** Persist via SECURITY DEFINER rpc (anon key has no raw write access). */
async function writeSharedCache(
  units: UnitSystem,
  payload: Record<string, unknown>
): Promise<void> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return;
  }
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = createClient();
    const { error } = await supabase.rpc('refresh_outlook_cache', {
      p_units: units,
      p_payload: payload,
    });
    if (error) throw error;
  } catch {
    supabaseDownUntil = Date.now() + SUPABASE_DOWN_COOLDOWN_MS;
  }
}

async function buildOutlook(units: UnitSystem): Promise<Record<string, unknown>> {
  const source = getSource();
  const [current, history24] = await Promise.all([
    source.getCurrent(),
    source.getHistory('24h').catch(() => []),
  ]);

  let hours: ForecastHour[] = [];
  try {
    hours = await fetchForecast();
  } catch {
    console.error('[outlook-api] Open-Meteo unavailable, statistics only');
  }

  const statistical = buildStatisticalOutlook(
    current,
    history24,
    hours,
    units
  );

  const ai = await fetchAiOutlook(
    current.temperatureC,
    current.rainRateMmH,
    statistical.headline,
    hours,
    units
  );

  const temps = hours.map((h) => h.tempC).filter((t): t is number => t != null);
  return {
    generatedAt: new Date().toISOString(),
    units,
    statisticalHeadline: statistical.headline,
    tempDirection: statistical.tempDirection,
    rainExpected: statistical.rainExpected,
    ai: ai?.text ?? null,
    aiModel: ai?.model ?? null,
    hours,
    tempMinNext12h: temps.length ? Math.min(...temps) : null,
    tempMaxNext12h: temps.length ? Math.max(...temps) : null,
  };
}

export async function GET(req: NextRequest) {
  const parsed = querySchema.safeParse(
    Object.fromEntries(req.nextUrl.searchParams.entries())
  );
  const units: UnitSystem = parsed.success ? (parsed.data.units ?? 'metric') : 'metric';

  const now = Date.now();
  if (cache && cache.units === units && cache.expiresAt > now) {
    return NextResponse.json(cache.payload, {
      headers: { 'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=60' },
    });
  }

  try {
    if (!inFlight || inFlight.units !== units) {
      const promise = (async () => {
        // Tier 2 first: another instance may have refreshed already.
        const shared = await readSharedCache(units);
        if (shared) {
          cache = {
            expiresAt: Date.now() + CACHE_TTL_MS,
            payload: shared.payload,
            units,
          };
          return shared.payload;
        }
        const payload = await buildOutlook(units);
        cache = { expiresAt: Date.now() + CACHE_TTL_MS, payload, units };
        // Share with every other instance; failure only costs one instance.
        await writeSharedCache(units, payload);
        return payload;
      })()
        .finally(() => {
          if (inFlight?.units === units) inFlight = null;
        });
      inFlight = { units, promise };
    }
    const payload = await inFlight.promise;
    return NextResponse.json(payload, {
      headers: { 'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=60' },
    });
  } catch (err) {
    // Never leak internal error messages.
    console.error('[outlook-api] Failed to build outlook');
    return NextResponse.json({ error: 'Outlook unavailable' }, { status: 502 });
  }
}
