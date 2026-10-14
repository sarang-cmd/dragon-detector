import { describe, it, expect } from 'vitest'
import { beaufort, wrapDeg, windDirectionLabel } from './beaufort'

describe('beaufort scale', () => {
  it('calm at 0 km/h', () => {
    expect(beaufort(0)).toEqual({ scale: 0, name: 'Calm', kidName: 'Calm' })
  })

  it('calm below 1 km/h (0.5 km/h is still calm)', () => {
    expect(beaufort(0.5)).toEqual({ scale: 0, name: 'Calm', kidName: 'Calm' })
    expect(beaufort(0.99)).toEqual({ scale: 0, name: 'Calm', kidName: 'Calm' })
  })

  it('light air at 1 km/h (boundary)', () => {
    expect(beaufort(1)).toEqual({ scale: 1, name: 'Light air', kidName: 'Very light' })
  })

  it('light breeze at 6 km/h', () => {
    expect(beaufort(6)).toEqual({ scale: 2, name: 'Light breeze', kidName: 'Light' })
  })

  it('gentle breeze at 12 km/h', () => {
    expect(beaufort(12)).toEqual({ scale: 3, name: 'Gentle breeze', kidName: 'Gentle' })
  })

  it('moderate breeze at 20 km/h', () => {
    expect(beaufort(20)).toEqual({ scale: 4, name: 'Moderate breeze', kidName: 'Moderate' })
  })

  it('fresh breeze at 29 km/h', () => {
    expect(beaufort(29)).toEqual({ scale: 5, name: 'Fresh breeze', kidName: 'Fresh' })
  })

  it('strong breeze at 39 km/h', () => {
    expect(beaufort(39)).toEqual({ scale: 6, name: 'Strong breeze', kidName: 'Strong' })
  })

  it('high wind at 50 km/h', () => {
    expect(beaufort(50)).toEqual({ scale: 7, name: 'High wind', kidName: 'High wind' })
  })

  it('gale at 62 km/h', () => {
    expect(beaufort(62)).toEqual({ scale: 8, name: 'Gale', kidName: 'Gale' })
  })

  it('strong gale at 75 km/h', () => {
    expect(beaufort(75)).toEqual({ scale: 9, name: 'Strong gale', kidName: 'Strong gale' })
  })

  it('storm at 89 km/h', () => {
    expect(beaufort(89)).toEqual({ scale: 10, name: 'Storm', kidName: 'Storm' })
  })

  it('violent storm at 103 km/h', () => {
    expect(beaufort(103)).toEqual({ scale: 11, name: 'Violent storm', kidName: 'Very stormy' })
  })

  it('hurricane at 120 km/h', () => {
    expect(beaufort(120)).toEqual({ scale: 12, name: 'Hurricane', kidName: 'Hurricane' })
  })

  it('negative wind speed treated as calm', () => {
    expect(beaufort(-5)).toEqual({ scale: 0, name: 'Calm', kidName: 'Calm' })
  })
})

describe('wind direction label', () => {
  it('0 deg -> N', () => {
    expect(windDirectionLabel(0)).toBe('N')
  })

  it('90 deg -> E', () => {
    expect(windDirectionLabel(90)).toBe('E')
  })

  it('180 deg -> S', () => {
    expect(windDirectionLabel(180)).toBe('S')
  })

  it('270 deg -> W', () => {
    expect(windDirectionLabel(270)).toBe('W')
  })

  it('360 deg -> N', () => {
    expect(windDirectionLabel(360)).toBe('N')
  })

  it('-45 deg -> NW', () => {
    expect(windDirectionLabel(-45)).toBe('NW')
  })
})

describe('wrapDeg', () => {
  it('wraps 370 to 10', () => {
    expect(wrapDeg(370)).toBe(10)
  })

  it('wraps -10 to 350', () => {
    expect(wrapDeg(-10)).toBe(350)
  })

  it('wraps 720 to 0', () => {
    expect(wrapDeg(720)).toBe(0)
  })

  it('handles negative large values', () => {
    expect(wrapDeg(-400)).toBe(320)
  })
})
