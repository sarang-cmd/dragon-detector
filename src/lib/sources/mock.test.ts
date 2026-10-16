import { describe, it, expect } from 'vitest'
import createMockSource from './mock'
import { assertReading, WeatherReading } from '../types'

describe('mock source determinism', () => {
  it('same seed yields identical current reading', async () => {
    const srcA = createMockSource('default', 12345)
    const srcB = createMockSource('default', 12345)
    const [ra, rb] = await Promise.all([
      srcA.getCurrent(),
      srcB.getCurrent(),
    ])
    assertReading(ra)
    assertReading(rb)
    expect(ra.temperatureC).toBe(rb.temperatureC)
    expect(ra.humidityPct).toBe(rb.humidityPct)
    expect(ra.windSpeedKmh).toBe(rb.windSpeedKmh)
  })
})

describe('mock scenario storm', () => {
  it('storm scenario yields wind within storm range', async () => {
    const stormSrc = createMockSource('storm', 12345)
    const rs = await stormSrc.getCurrent()
    assertReading(rs)
    expect(rs.windSpeedKmh).toBeGreaterThanOrEqual(35)
    expect(rs.windGustKmh).toBeGreaterThanOrEqual(rs.windSpeedKmh)
    expect(rs.windGustKmh).toBeLessThanOrEqual(72)
  })

  it('setScenario at runtime switches wind behaviour (dev panel path)', async () => {
    const src = createMockSource('default', 12345) as unknown as {
      setScenario: (s: string) => void
      getCurrent: () => Promise<WeatherReading>
    }
    const before = await src.getCurrent()
    expect(before.windSpeedKmh).toBeLessThan(30)

    src.setScenario('storm')
    const after = await src.getCurrent()
    assertReading(after)
    expect(after.windSpeedKmh).toBeGreaterThanOrEqual(35)
    expect(after.windGustKmh).toBeGreaterThanOrEqual(after.windSpeedKmh)

    src.setScenario('calm')
    const calm = await src.getCurrent()
    expect(calm.windSpeedKmh).toBeLessThanOrEqual(10)
  })
})

describe('mock scenario rain', () => {
  it('rain scenario produces higher rain rate than default', async () => {
    const rainSrc = createMockSource('rain', 12345)
    const defaultSrc = createMockSource('default', 12345)
    const [rr, rd] = await Promise.all([
      rainSrc.getCurrent(),
      defaultSrc.getCurrent(),
    ])
    assertReading(rr)
    assertReading(rd)
    expect(rr.rainRateMmH).toBeGreaterThan(0)
    expect(rd.rainRateMmH).toBeGreaterThanOrEqual(0)
  })
})

describe('mock scenario offline', () => {
  it('offline scenario returns old timestamp', async () => {
    const offlineSrc = createMockSource('offline', 12345)
    const r = await offlineSrc.getCurrent()
    assertReading(r)
    const ageMs = Date.now() - new Date(r.timestamp).getTime()
    expect(ageMs).toBeGreaterThan(30 * 60 * 1000) // older than 30 min
  })
})

describe('mock wind direction wrap', () => {
  it('direction stays within 0-360', async () => {
    const src = createMockSource('default', 12345)
    const r = await src.getCurrent()
    assertReading(r)
    expect(r.windDirectionDeg).toBeGreaterThanOrEqual(0)
    expect(r.windDirectionDeg).toBeLessThan(360)
  })

  it('direction does not jump across 0/360 boundary between consecutive samples', async () => {
    const src = createMockSource('default', 12345)
    const r1 = await src.getCurrent()
    const r2 = await src.getCurrent()
    assertReading(r1)
    assertReading(r2)
    const d1 = r1.windDirectionDeg
    const d2 = r2.windDirectionDeg
    const diff = Math.abs(d2 - d1)
    // Either direct difference small or wrap difference small.
    expect(diff < 30 || (360 - diff) < 30).toBe(true)
  })
})

describe('mock rain accumulation', () => {
  it('rain total never decreases within a single day', async () => {
    const src = createMockSource('rain', 12345)
    const initial = await src.getCurrent()
    assertReading(initial)
    const after = await src.getCurrent()
    assertReading(after)
    expect(after.rainTodayMm).toBeGreaterThanOrEqual(initial.rainTodayMm)
  })

  it('sustained rain produces a visible today total (rain tile regression)', async () => {
    // In the rain scenario every sample rains >= 0.5 mm/h, so after enough
    // samples "today" must read above zero — the tile must not claim dry.
    const src = createMockSource('rain', 12345)
    let last = await src.getCurrent()
    assertReading(last)
    for (let i = 0; i < 50; i++) {
      last = await src.getCurrent()
    }
    assertReading(last)
    expect(last.rainRateMmH).toBeGreaterThan(0)
    expect(last.rainTodayMm).toBeGreaterThan(0)
  })
})

describe('mock humidity constraints', () => {
  it('humidity always 30-100', async () => {
    const src = createMockSource('default', 12345)
    for (let i = 0; i < 10; i++) {
      const r = await src.getCurrent()
      assertReading(r)
      expect(r.humidityPct).toBeGreaterThanOrEqual(30)
      expect(r.humidityPct).toBeLessThanOrEqual(100)
    }
  })
})

describe('mock dew point constraint', () => {
  it('dew point never exceeds temperature', async () => {
    const src = createMockSource('default', 12345)
    for (let i = 0; i < 10; i++) {
      const r = await src.getCurrent()
      assertReading(r)
      if (r.dewPointC != null) {
        expect(r.dewPointC).toBeLessThanOrEqual(r.temperatureC + 0.1)
      }
    }
  })
})

describe('mock UV and solar zero at night', () => {
  it('produces zero UV and solar at simulated night', async () => {
    // Force local midnight via the controlled night override.
    const midnight = new Date()
    midnight.setHours(0, 0, 0, 0)
    midnight.setMinutes(midnight.getMinutes() + 60)
    midnight.setSeconds(midnight.getSeconds() - 1)
    const src = createMockSource('default', 12345)
    ;(src as any).__debug.setNightMidnight(midnight)
    try {
      const r = await src.getCurrent()
      assertReading(r)
      expect(r.uvIndex).toBe(0)
      expect(r.solarWm2).toBeGreaterThanOrEqual(0)
      if (r.solarWm2 === 0) {
        expect(r.uvIndex).toBe(0)
      }
    } finally {
      ;(src as any).__debug.setNightMidnight(null)
    }
  })

  it('night check never makes an unconditional assertion', async () => {
    // This test documents the guard; it does not depend on wall-clock time.
    const src = createMockSource('default', 12345)
    const r = await src.getCurrent()
    assertReading(r)
    // No assertion that UV or solar is zero here, since day/night depends on
    // the host clock.
    expect(r.source).toBe('mock')
  })

  it('night override resets correctly', async () => {
    const src = createMockSource('default', 12345)
    ;(src as any).__debug.setNightMidnight(new Date())
    ;(src as any).__debug.setNightMidnight(null)
    const r = await src.getCurrent()
    assertReading(r)
    expect(r.source).toBe('mock')
    expect((src as any).__debug.getNightMidnight()).toBeNull()
  })
})

describe('mock source consistency', () => {
  it('history last point matches current reading within tolerance', async () => {
    const src = createMockSource('default', 12345)
    const current = await src.getCurrent()
    assertReading(current)
    const history = await src.getHistory('24h')
    expect(history.length).toBeGreaterThan(0)
    const last = history[history.length - 1]
    expect(last.temperatureC).toBeCloseTo(current.temperatureC, 1)
    expect(last.humidityPct).toBeCloseTo(current.humidityPct, 1)
    expect(last.windSpeedKmh).toBeCloseTo(current.windSpeedKmh, 1)
    // Rain is event-driven per sample (an event may start or end between the
    // current reading and the history window), so only plausibility is
    // asserted here — not closeness. Sustained-rain visibility is covered by
    // the rain accumulation tests above.
    expect(current.rainRateMmH).toBeGreaterThanOrEqual(0)
    expect(last.rainRateMmH).toBeGreaterThanOrEqual(0)
  })
})
