import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSource } from '@/lib/sources';
import { SITE_CONFIG } from '@/lib/site';
import {
  buildStatisticalOutlook,
  isFresh,
  outlookAiStatus,
  type ForecastHour,
  type OutlookAiStatus,
  type OutlookPayload,
} from '@/lib/outlook';
import type { UnitSystem } from '@/lib/units';

// Station coordinates, verified on-site (src/lib/site.ts).
const LAT = SITE_CONFIG.latitude ?? 51.0497;
const LON = SITE_CONFIG.longitude ?? 13.7284;

// One shared outlook for everyone, refreshed at most every 15 minutes.
// Two tiers: (1) in-memory per instance, (2) Supabase `outlook_cache` shared
// across all instances. A school of visitors on any number of server
// instances still costs a single upstream call per 15 minutes (free-tier
// safe). If Supabase is unconfigured or its table missing, tier 1 alone
// applies and a 60s negative-cache avoids hammering a dead backend.
const CACHE_TTL_MS = 15 * 60 * 1000;
const SUPABASE_DOWN_COOLDOWN_MS = 60 * 1000;
const AI_TIMEOUT_MS = 15_000;

// The model answer is generated in a second pass: `GET /api/outlook` returns
// the statistics immediately with `aiStatus: 'pending'`, and the browser then
// asks for `?ai=1`, which streams (well, waits for) the sentence. That is why
// the two halves are cached separately — the statistics stay CDN-cacheable
// while the AI request is per-visitor and cancellable.
interface StatsCache {
  expiresAt: number;
  units: UnitSystem;
  payload: OutlookPayload;
}

interface AiCache {
  expiresAt: number;
  units: UnitSystem;
  text: string | null;
  model: string | null;
}

/** Outcome of one generation attempt. `aborted` is never cached. */
type AiOutcome =
  | { status: 'ok'; text: string; model: string }
  | { status: 'failed' }
  | { status: 'aborted' };

interface AiJob {
  units: UnitSystem;
  /** How many requests are currently waiting on this generation. */
  waiters: number;
  controller: AbortController;
  promise: Promise<AiOutcome>;
}

let statsCache: StatsCache | null = null;
let statsInFlight: { units: UnitSystem; promise: Promise<OutlookPayload> } | null =
  null;
let aiCache: AiCache | null = null;
let aiJob: AiJob | null = null;
let supabaseDownUntil = 0;

const querySchema = z.object({
  units: z.enum(['metric', 'imperial']).optional(),
  ai: z.enum(['0', '1']).optional(),
  // Sent by the Retry button: ignore a stored *failure* and try again. A
  // stored sentence is never regenerated, success is sticky for the TTL.
  fresh: z.enum(['0', '1']).optional(),
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

/**
 * Merge the two abort sources available to a generation (the visitor gave up,
 * the hard timeout) into one signal. Node 18 has no `AbortSignal.any`.
 */
function cancellable(
  cancel: AbortController,
  timeoutMs: number
): { signal: AbortSignal; dispose: () => void } {
  const combined = new AbortController();
  const forward = () => combined.abort();
  if (cancel.signal.aborted) forward();
  else cancel.signal.addEventListener('abort', forward, { once: true });
  const timer = setTimeout(forward, timeoutMs);
  return {
    signal: combined.signal,
    dispose: () => {
      clearTimeout(timer);
      cancel.signal.removeEventListener('abort', forward);
    },
  };
}

async function generateAi(
  base: OutlookPayload,
  units: UnitSystem,
  cancel: AbortController
): Promise<AiOutcome> {
  const key = process.env.GROQ_API_KEY;
  if (!key) return { status: 'failed' };
  try {
    const source = getSource();
    const current = await source.getCurrent();
    const { system, user } = groqPrompt(
      current.temperatureC,
      current.rainRateMmH,
      base.statisticalHeadline,
      base.hours,
      units
    );
    const { signal, dispose } = cancellable(cancel, AI_TIMEOUT_MS);
    let res: Response;
    try {
      res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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
        signal,
      });
    } finally {
      dispose();
    }
    if (!res.ok) {
      console.error('[outlook-api] Groq rejected the request');
      return { status: 'failed' };
    }
    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = json.choices?.[0]?.message?.content?.trim();
    if (!text) return { status: 'failed' };
    return { text, model: 'openai/gpt-oss-120b', status: 'ok' };
  } catch {
    // The visitor pressed stop: not a failure, and nothing is cached, so the
    // next visitor (or the same one, on retry) starts a clean generation.
    if (cancel.signal.aborted) return { status: 'aborted' };
    console.error('[outlook-api] Groq call failed, using statistics');
    return { status: 'failed' };
  }
}

/**
 * Join the generation already running for these units, or start one. The
 * caller must `release()` when it stops waiting; the last one out cancels the
 * upstream call so a visitor who gives up does not keep paying for tokens.
 */
function requestAi(
  units: UnitSystem,
  base: OutlookPayload
): { promise: Promise<AiOutcome>; release: () => void } {
  if (!aiJob || aiJob.units !== units) {
    const controller = new AbortController();
    const job: AiJob = {
      units,
      waiters: 0,
      controller,
      promise: generateAi(base, units, controller).finally(() => {
        if (aiJob?.controller === controller) aiJob = null;
      }),
    };
    aiJob = job;
  }
  const job = aiJob;
  job.waiters += 1;
  let released = false;
  return {
    promise: job.promise,
    release: () => {
      if (released) return;
      released = true;
      job.waiters -= 1;
      if (job.waiters <= 0 && aiJob?.controller === job.controller) {
        job.controller.abort();
      }
    },
  };
}

/**
 * Tier 2: shared Supabase cache. Returns the cached row (payload +
 * updatedAt) or null when missing/unavailable. Freshness is decided by the
 * caller: fresh rows are served as-is, any-age rows only as a last resort
 * when upstream APIs are down (marked `stale: true`).
 */
async function readSharedCacheRow(
  units: UnitSystem
): Promise<{ payload: Record<string, unknown>; updatedAt: string } | null> {
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
    if (error || !data) throw error ?? new Error('no row');
    return {
      payload: data.payload as Record<string, unknown>,
      updatedAt: data.updated_at as string,
    };
  } catch {
    // Table missing, RLS, or network: back off briefly, stay memory-only.
    supabaseDownUntil = Date.now() + SUPABASE_DOWN_COOLDOWN_MS;
    return null;
  }
}

/** Persist to the shared cache and append to the public history (both via
 * SECURITY DEFINER rpc — the anon key has no raw write access). */
async function persistOutlook(
  units: UnitSystem,
  payload: OutlookPayload
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
    const { error: histError } = await supabase.rpc('append_outlook_history', {
      p_units: units,
      p_payload: payload,
    });
    if (histError) throw histError;
  } catch {
    supabaseDownUntil = Date.now() + SUPABASE_DOWN_COOLDOWN_MS;
  }
}

/** Make a stored payload (possibly written by an older deploy) trustworthy. */
function normalizeStored(raw: Record<string, unknown>, units: UnitSystem): OutlookPayload {
  const hours = Array.isArray(raw.hours) ? (raw.hours as ForecastHour[]) : [];
  const payload = {
    generatedAt: typeof raw.generatedAt === 'string' ? raw.generatedAt : new Date().toISOString(),
    units,
    statisticalHeadline:
      typeof raw.statisticalHeadline === 'string' ? raw.statisticalHeadline : '',
    tempDirection: (raw.tempDirection ?? 'steady') as OutlookPayload['tempDirection'],
    rainExpected: raw.rainExpected === true,
    ai: typeof raw.ai === 'string' ? raw.ai : null,
    aiModel: typeof raw.aiModel === 'string' ? raw.aiModel : null,
    aiStatus: 'unavailable' as OutlookAiStatus,
    hours,
    tempMinNext12h: typeof raw.tempMinNext12h === 'number' ? raw.tempMinNext12h : null,
    tempMaxNext12h: typeof raw.tempMaxNext12h === 'number' ? raw.tempMaxNext12h : null,
  };
  return { ...payload, aiStatus: outlookAiStatus(payload) };
}

async function buildBaseOutlook(units: UnitSystem): Promise<OutlookPayload> {
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

  const temps = hours.map((h) => h.tempC).filter((t): t is number => t != null);
  return {
    generatedAt: new Date().toISOString(),
    units,
    statisticalHeadline: statistical.headline,
    tempDirection: statistical.tempDirection,
    rainExpected: statistical.rainExpected,
    ai: null,
    aiModel: null,
    aiStatus: 'pending',
    hours,
    tempMinNext12h: temps.length ? Math.min(...temps) : null,
    tempMaxNext12h: temps.length ? Math.max(...temps) : null,
  };
}

/** Statistics plus whatever the model has for us right now. */
function withAi(base: OutlookPayload, units: UnitSystem): OutlookPayload {
  if (!process.env.GROQ_API_KEY) {
    return { ...base, ai: null, aiModel: null, aiStatus: 'unavailable' };
  }
  const cached = aiCache && aiCache.units === units ? aiCache : null;
  if (!cached) return { ...base, ai: null, aiModel: null, aiStatus: 'pending' };
  if (!cached.text) {
    return { ...base, ai: null, aiModel: null, aiStatus: 'unavailable' };
  }
  return {
    ...base,
    ai: cached.text,
    aiModel: cached.model,
    aiStatus: 'ready',
  };
}

/** Adopt an AI sentence another instance already generated and shared. */
function seedAiFromPayload(payload: OutlookPayload, units: UnitSystem): void {
  if (aiCache && aiCache.units === units && aiCache.expiresAt > Date.now()) return;
  if (!payload.ai) return;
  aiCache = {
    expiresAt: Date.now() + CACHE_TTL_MS,
    units,
    text: payload.ai,
    model: payload.aiModel,
  };
}

/** Statistics layer: memory, then Supabase, then a fresh build. */
async function getBaseOutlook(units: UnitSystem): Promise<OutlookPayload> {
  if (statsCache && statsCache.units === units && statsCache.expiresAt > Date.now()) {
    return statsCache.payload;
  }
  if (!statsInFlight || statsInFlight.units !== units) {
    const promise = (async () => {
      // Tier 2 first: another instance may have refreshed already.
      const shared = await readSharedCacheRow(units);
      if (shared && isFresh(shared.updatedAt, Date.now())) {
        const payload = normalizeStored(shared.payload, units);
        statsCache = { expiresAt: Date.now() + CACHE_TTL_MS, units, payload };
        seedAiFromPayload(payload, units);
        return payload;
      }
      try {
        const payload = await buildBaseOutlook(units);
        statsCache = { expiresAt: Date.now() + CACHE_TTL_MS, units, payload };
        return payload;
      } catch (buildError) {
        // Upstream APIs down: serve the newest stored outlook of any age,
        // clearly flagged, rather than failing the hero.
        if (shared) {
          return { ...normalizeStored(shared.payload, units), stale: true };
        }
        throw buildError;
      }
    })().finally(() => {
      if (statsInFlight?.promise === promise) statsInFlight = null;
    });
    statsInFlight = { units, promise };
  }
  return statsInFlight.promise;
}

function cdnJson(payload: OutlookPayload): NextResponse {
  return NextResponse.json(payload, {
    headers: { 'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=60' },
  });
}

/** The AI request is per-visitor and cancellable: never cache it at the edge. */
function privateJson(payload: OutlookPayload): NextResponse {
  return NextResponse.json(payload, {
    headers: { 'Cache-Control': 'private, no-store' },
  });
}

export async function GET(req: NextRequest) {
  const parsed = querySchema.safeParse(
    Object.fromEntries(req.nextUrl.searchParams.entries())
  );
  const units: UnitSystem = parsed.success ? (parsed.data.units ?? 'metric') : 'metric';
  const wantAi = parsed.success ? parsed.data.ai === '1' : false;
  const force = parsed.success ? parsed.data.fresh === '1' : false;

  try {
    const base = await getBaseOutlook(units);

    if (!wantAi) {
      const payload = withAi(base, units);
      // Share with every other instance; failure only costs one instance.
      // While the model is still running the `?ai=1` call writes the finished
      // version, so this interim payload is not worth a round trip.
      if (payload.aiStatus !== 'pending') await persistOutlook(units, payload);
      return cdnJson(payload);
    }

    const stored = aiCache && aiCache.units === units ? aiCache : null;
    const reuse =
      !!stored &&
      stored.expiresAt > Date.now() &&
      // A stored sentence is final; a stored failure can be retried.
      (stored.text !== null || !force);
    if (!process.env.GROQ_API_KEY || reuse) return privateJson(withAi(base, units));

    const { promise, release } = requestAi(units, base);
    const onClientAbort = () => release();
    if (req.signal.aborted) onClientAbort();
    else req.signal.addEventListener('abort', onClientAbort, { once: true });

    let outcome: AiOutcome;
    try {
      outcome = await promise;
    } finally {
      release();
      req.signal.removeEventListener('abort', onClientAbort);
    }

    if (outcome.status !== 'aborted') {
      aiCache = {
        expiresAt: Date.now() + CACHE_TTL_MS,
        units,
        text: outcome.status === 'ok' ? outcome.text : null,
        model: outcome.status === 'ok' ? outcome.model : null,
      };
    }
    const payload = withAi(base, units);
    if (payload.aiStatus !== 'pending') await persistOutlook(units, payload);
    return privateJson(payload);
  } catch (err) {
    // Never leak internal error messages.
    console.error('[outlook-api] Failed to build outlook');
    return NextResponse.json({ error: 'Outlook unavailable' }, { status: 502 });
  }
}
