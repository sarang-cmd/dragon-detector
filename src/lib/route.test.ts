import { describe, it, expect } from 'vitest'
import { getSource } from '@/lib/sources'
import { WeatherApiResponseSchema, HistoryApiResponseSchema, assertReading } from '@/lib/types'
import { z } from 'zod'

describe('weather API data layer', () => {
  it('getSource().getCurrent() returns a valid reading', async () => {
    const source = getSource()
    const reading = await source.getCurrent()
    assertReading(reading)
    // Basic sanity checks.
    expect(reading.source).toBeDefined()
    expect(reading.temperatureC).toBeDefined()
    expect(reading.humidityPct).toBeGreaterThanOrEqual(0)
    expect(reading.humidityPct).toBeLessThanOrEqual(100)
  })

  it('getSource().getHistory() returns valid history', async () => {
    const source = getSource()
    const h24 = await source.getHistory('24h')
    const h7 = await source.getHistory('7d')
    expect(h24.length).toBeGreaterThan(0)
    expect(h7.length).toBeGreaterThan(0)
    for (const p of h24) {
      expect(p.timestamp).toBeDefined()
      expect(p.temperatureC).toBeDefined()
    }
    for (const p of h7) {
      expect(p.timestamp).toBeDefined()
      expect(p.temperatureC).toBeDefined()
    }
  })

  it('full WeatherApiResponse schema rounds-trips through zod', async () => {
    const source = getSource()
    const reading = await source.getCurrent()
    const h24 = await source.getHistory('24h')
    const h7 = await source.getHistory('7d')

    const body = {
      reading,
      history: { h24, d7: h7 },
      meta: {
        fetchedAt: new Date().toISOString(),
        fetchedAtServer: new Date().toISOString(),
        stale: false,
        offline: false,
        measuredAt: reading.timestamp,
        source: reading.source,
        scenario: undefined,
      },
    }

    const parsed = WeatherApiResponseSchema.parse(body)
    expect(parsed.reading).toEqual(reading)
    expect(parsed.history.h24).toEqual(h24)
    expect(parsed.history.d7).toEqual(h7)
  })

  it('HistoryApiResponse schema rounds-trips through zod', async () => {
    const source = getSource()
    const h24 = await source.getHistory('24h')

    const body = {
      points: h24,
      range: '24h' as const,
      fetchedAt: new Date().toISOString(),
      measuredAt: h24[h24.length - 1].timestamp,
    }

    const parsed = HistoryApiResponseSchema.parse(body)
    expect(parsed.points).toEqual(h24)
    expect(parsed.range).toBe('24h')
  })
})

describe('query parameter validation', () => {
  const querySchema = z.object({
    range: z.enum(['24h', '7d']).optional(),
    scenario: z
      .enum(['storm', 'calm', 'rain', 'offline', 'default'])
      .optional(),
  })

  it('accepts valid params', () => {
    const result = querySchema.safeParse({ range: '24h', scenario: 'storm' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.range).toBe('24h')
      expect(result.data.scenario).toBe('storm')
    }
  })

  it('rejects invalid range', () => {
    const result = querySchema.safeParse({ range: '48h' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid scenario', () => {
    const result = querySchema.safeParse({ scenario: 'winter' })
    expect(result.success).toBe(false)
  })

  it('accepts empty params', () => {
    const result = querySchema.safeParse({})
    expect(result.success).toBe(true)
  })
})
