import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSource } from '@/lib/sources'
import { WeatherApiResponseSchema } from '@/lib/types'

const STALE_MS = 10 * 60 * 1000
const OFFLINE_MS = 30 * 60 * 1000

const querySchema = z.object({
  range: z.enum(['24h', '7d']).optional(),
  scenario: z
    .enum(['storm', 'calm', 'rain', 'offline', 'default'])
    .optional(),
})

const scenarioEnum = z.enum(['storm', 'calm', 'rain', 'offline', 'default'])

// Non-production only: allow picking the mock scenario by cookie as well
// as query param (query param wins).
function resolveScenario(
  params: z.infer<typeof querySchema>,
  req: NextRequest
): string | undefined {
  if (params.scenario) return params.scenario
  if (!isDev()) return undefined
  const cookieScenario = req.cookies.get('weather_scenario')?.value
  if (!cookieScenario) return undefined
  const parsed = scenarioEnum.safeParse(cookieScenario)
  return parsed.success ? parsed.data : undefined
}

function isDev() {
  const nodeEnv = process.env.NODE_ENV
  const vercel = process.env.VERCEL
  return nodeEnv !== 'production' && vercel !== '1'
}

export async function GET(req: NextRequest) {
  const rawParams = Object.fromEntries(req.nextUrl.searchParams.entries())
  const parsed = querySchema.safeParse(rawParams)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid query parameters' },
      { status: 400 }
    )
  }

  const params = parsed.data
  const scenario = resolveScenario(params, req)

  // Scenario override only available in development / non-production.
  if (scenario && !isDev()) {
    return NextResponse.json(
      { error: 'Scenario overrides are not available in production' },
      { status: 403 }
    )
  }

  const source = getSource()

  // If a scenario was provided, attempt to apply it on the mock source.
  if (scenario && process.env.DATA_SOURCE !== 'ecowitt') {
    try {
      const s = source as any
      if (typeof s.setScenario === 'function') {
        s.setScenario(scenario)
      }
    } catch {
      // ignore failure to set scenario on incompatible source
    }
  }

  const nowMs = Date.now()
  let readingResult: any = null

  try {
    const [readingResult_, history24, history7] = await Promise.all([
      source.getCurrent(),
      source.getHistory('24h'),
      source.getHistory('7d'),
    ])

    readingResult = readingResult_
    const measuredAt = readingResult.timestamp
    const ageMs = nowMs - new Date(measuredAt).getTime()
    const stale = ageMs > STALE_MS
    const offline = ageMs > OFFLINE_MS

    const responseBody = {
      reading: readingResult,
      history: { h24: history24, d7: history7 },
      meta: {
        fetchedAt: new Date().toISOString(),
        fetchedAtServer: new Date().toISOString(),
        stale,
        offline,
        measuredAt,
        source: readingResult.source,
        scenario,
      },
    }

    const validated = WeatherApiResponseSchema.parse(responseBody)

    const isMock = readingResult.source === 'mock'
    const cacheHeaders = isMock
      ? 'no-store'
      : 'public, s-maxage=60, stale-while-revalidate=30, no-transform'

    return NextResponse.json(validated, {
      headers: {
        'Cache-Control': cacheHeaders,
        Vary: 'Origin',
      },
    })
  } catch (err) {
    // Never leak internal error messages.
    console.error('[weather-api] Failed to fetch weather data')

    let status = 502
    let message = 'Weather data unavailable'

    const prev = (globalThis as any).__weatherLastGoodReading
    if (prev && prev.source) {
      status = 200
      const ageMs = nowMs - new Date(prev.timestamp).getTime()
      const stale = ageMs > STALE_MS
      const offline = ageMs > OFFLINE_MS
      return NextResponse.json(
        {
          reading: prev,
          history: { h24: [], d7: [] },
          meta: {
            fetchedAt: new Date().toISOString(),
            fetchedAtServer: new Date().toISOString(),
            stale,
            offline,
            measuredAt: prev.timestamp,
            source: prev.source,
            scenario,
          },
        },
        {
          headers: {
            'Cache-Control': 'no-store',
            Vary: 'Origin',
          },
        }
      )
    }

    if (process.env.DATA_SOURCE === 'ecowitt') {
      status = 503
      message = 'Weather service unavailable'
    }

    return NextResponse.json(
      { error: message, stale: false, offline: false },
      { status }
    )
  } finally {
    // Keep last good reading for fallback (no secrets).
    if (readingResult && readingResult.source) {
      ;(globalThis as any).__weatherLastGoodReading = readingResult
    }
  }
}
