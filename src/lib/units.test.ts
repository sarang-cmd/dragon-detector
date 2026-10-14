import { describe, it, expect } from 'vitest'
import {
  fToC,
  cToF,
  mphToKmh,
  kmhToMph,
  kmhToMs,
  inToMm,
  mmToIn,
  inHgToHpa,
  hPaToInHg,
  formatTemp,
  formatSpeed,
  formatRain,
  formatPressure,
} from './units'

describe('units conversions', () => {
  it('32°F = 0°C', () => {
    expect(fToC(32)).toBe(0)
  })

  it('212°F = 100°C', () => {
    expect(fToC(212)).toBe(100)
  })

  it('0°C = 32°F', () => {
    expect(cToF(0)).toBe(32)
  })

  it('100°C = 212°F', () => {
    expect(cToF(100)).toBeCloseTo(212, 6)
  })

  it('0°C = 32°F round trip', () => {
    expect(cToF(fToC(32))).toBeCloseTo(32, 6)
    expect(fToC(cToF(0))).toBeCloseTo(0, 8)
  })

  it('1 mph = 1.609344 km/h', () => {
    expect(mphToKmh(1)).toBe(1.609344)
  })

  it('1 km/h = 0.621371 mph (within tolerance)', () => {
    expect(kmhToMph(1)).toBeCloseTo(0.621371, 5)
  })

  it('kmhToMs 3.6 km/h = 1 m/s', () => {
    expect(kmhToMs(3.6)).toBe(1)
  })

  it('inToMm 1 inch = 25.4 mm', () => {
    expect(inToMm(1)).toBe(25.4)
  })

  it('mmToIn 25.4 mm = 1 inch', () => {
    expect(mmToIn(25.4)).toBe(1)
  })

  it('inHgToHpa 29.92 inHg = 1013.25 hPa (within tolerance)', () => {
    expect(inHgToHpa(29.92)).toBeCloseTo(1013.25, 1)
  })

  it('hPaToInHg 1013.25 hPa = 29.92 inHg (within tolerance)', () => {
    expect(hPaToInHg(1013.25)).toBeCloseTo(29.92, 1)
  })

  it('round trip pressure', () => {
    const hpa = 1013.25
    expect(hPaToInHg(inHgToHpa(hpa))).toBeCloseTo(hpa, 8)
  })
})

describe('format helpers', () => {
  it('formatTemp metric: 0°C -> value 0.0 unit °C', () => {
    expect(formatTemp(0, 'metric')).toEqual({ value: '0.0', unit: '°C' })
  })

  it('formatTemp imperial: 0°C -> 32.0°F', () => {
    expect(formatTemp(0, 'imperial')).toEqual({ value: '32.0', unit: '°F' })
  })

  it('formatTemp metric: -5.6°C -> -5.6°C', () => {
    expect(formatTemp(-5.6, 'metric')).toEqual({ value: '-5.6', unit: '°C' })
  })

  it('formatSpeed metric: 14 km/h -> "14" km/h', () => {
    expect(formatSpeed(14, 'metric')).toEqual({ value: '14', unit: 'km/h' })
  })

  it('formatSpeed imperial: 14 km/h -> 9 mph', () => {
    expect(formatSpeed(14, 'imperial')).toEqual({ value: '9', unit: 'mph' })
  })

  it('formatRain metric: 5.3 mm -> "5.3" mm', () => {
    expect(formatRain(5.3, 'metric')).toEqual({ value: '5.3', unit: 'mm' })
  })

  it('formatRain imperial: 5.3 mm -> 0.21 in', () => {
    expect(formatRain(5.3, 'imperial')).toEqual({ value: '0.21', unit: 'in' })
  })

  it('formatPressure metric: 1013.25 hPa -> "1013.3" hPa', () => {
    expect(formatPressure(1013.25, 'metric')).toEqual({
      value: '1013.3',
      unit: 'hPa',
    })
  })

  it('formatPressure imperial: 1013.25 hPa -> 29.92 inHg', () => {
    expect(formatPressure(1013.25, 'imperial')).toEqual({
      value: '29.92',
      unit: 'inHg',
    })
  })

  it('formatPressure undefined -> "--"', () => {
    expect(formatPressure(undefined, 'metric')).toEqual({
      value: '--',
      unit: 'hPa',
    })
    expect(formatPressure(undefined, 'imperial')).toEqual({
      value: '--',
      unit: 'inHg',
    })
  })
})
