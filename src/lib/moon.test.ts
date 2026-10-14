import { describe, it, expect } from 'vitest'
import { moonPhase, SYNODIC_MONTH_DAYS, KNOWN_NEW_MOON } from './moon'

const moonDegrees = (date: Date): number => {
  const days =
    (date.getTime() - KNOWN_NEW_MOON) / 86400000
  const lunations = days / SYNODIC_MONTH_DAYS
  const fraction = lunations - Math.floor(lunations)
  return fraction * 360
}

describe('moon phase', () => {
  it('new moon 2019-12-26 around 04:13 UTC (real event)', () => {
    const d = new Date('2019-12-26T04:13:00Z')
    const m = moonPhase(d)
    // The simple mean-synodic algorithm drifts a few degrees over 20 years.
    // Compare crown: wrap degrees into (-180, 180] so 352° counts as -7.8°
    const raw = moonDegrees(d)
    let dd = raw > 180 ? raw - 360 : raw
    expect(Math.abs(dd)).toBeLessThan(15)
    expect(m.phase === 'new' || m.phase === 'waning_crescent' || m.phase === 'waxing_crescent').toBe(true)
    expect(Math.abs(m.illumination - 0)).toBeLessThan(0.1)
  })

  it('full moon 2020-01-10 around 19:21 UTC', () => {
    const d = new Date('2020-01-10T19:21:00Z')
    const m = moonPhase(d)
    expect(moonDegrees(d)).toBeGreaterThan(175)
    expect(moonDegrees(d)).toBeLessThan(185)
    expect(m.phase === 'full' || m.phase === 'waxing_gibbous' || m.phase === 'waning_gibbous').toBe(true)
    expect(Math.abs(m.illumination - 1)).toBeLessThan(0.05)
  })

  it('first quarter 2020-01-02 around 02:45 UTC (real event)', () => {
    const d = new Date('2020-01-02T02:45:00Z')
    const m = moonPhase(d)
    expect(moonDegrees(d)).toBeGreaterThan(70)
    expect(moonDegrees(d)).toBeLessThan(100)
    expect(m.phase === 'first_quarter' || m.phase === 'waxing_crescent' || m.phase === 'waxing_gibbous').toBe(true)
    expect(m.illumination).toBeGreaterThan(0.35)
    expect(m.illumination).toBeLessThan(0.7)
  })

  it('last quarter 2019-12-19 around 04:57 UTC (real event)', () => {
    const d = new Date('2019-12-19T04:57:00Z')
    const m = moonPhase(d)
    expect(moonDegrees(d)).toBeGreaterThan(265)
    expect(moonDegrees(d)).toBeLessThan(290)
    expect(m.phase).toBe('last_quarter')
    expect(m.illumination).toBeGreaterThan(0.4)
    expect(m.illumination).toBeLessThan(0.7)
  })

  it('illumination always 0..1', () => {
    const tests = [
      new Date('2019-12-01T00:00:00Z'),
      new Date('2020-01-01T00:00:00Z'),
      new Date('2020-12-31T23:59:59Z'),
      new Date(),
    ]
    for (const d of tests) {
      const m = moonPhase(d)
      expect(m.illumination).toBeGreaterThanOrEqual(0)
      expect(m.illumination).toBeLessThanOrEqual(1)
    }
  })
})

export {}
