import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSource } from '@/lib/sources'
import { HistoryApiResponseSchema } from '@/lib/types'

const rangeSchema = z.enum(['24h', '7d'])

export async function GET(req: NextRequest) {
  const rawRange = req.nextUrl.searchParams.get('range') || '24h'
  const parsedRange = rangeSchema.safeParse(rawRange)

  if (!parsedRange.success) {
    return NextResponse.json(
      { error: 'Invalid range parameter. Use 24h or 7d.' },
      { status: 400 }
    )
  }

  const range = parsedRange.data

  // Non-production only: cookie-based scenario selection (matches /api/weather).
  let scenario: string | undefined
  if (process.env.NODE_ENV !== 'production' && process.env.DATA_SOURCE !== 'ecowitt') {
    const cookieScenario = req.cookies.get('weather_scenario')?.value
    if (
      cookieScenario &&
      ['storm', 'calm', 'rain', 'offline', 'default'].includes(cookieScenario)
    ) {
      scenario = cookieScenario
    }
  }

  try {
    const source = getSource()
    if (scenario) {
      const s = source as any
      if (typeof s.setScenario === 'function') {
        s.setScenario(scenario)
      }
    }
    const points = await source.getHistory(range)
    const now = new Date().toISOString()

    // If the source provides a measuredAt timestamp, include it for staleness
    // awareness. The mock source always provides timestamps.
    let measuredAt: string | undefined
    if (points.length > 0) {
      measuredAt = points[points.length - 1].timestamp
    }

    const body = {
      points,
      range,
      fetchedAt: now,
      measuredAt,
    }

    const validated = HistoryApiResponseSchema.parse(body)

    const isMock = process.env.DATA_SOURCE !== 'ecowitt'
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
    console.error('[history-api] Failed to fetch history data')

    let status = 503
    let message = 'History data unavailable'

    if (process.env.DATA_SOURCE === 'ecowitt') {
      status = 503
      message = 'Weather service unavailable'
    }

    return NextResponse.json(
      { error: message, points: [], range, fetchedAt: new Date().toISOString() },
      { status }
    )
  }
}
