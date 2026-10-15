import { WeatherReading, HistoryPoint, WeatherSource } from '@/lib/types'
import { averageWindDirection, wrapDeg } from '@/lib/beaufort'
import {
  roundTemp,
  roundWind,
  roundRain,
  roundPressure,
} from '@/lib/units'
import { DEFAULT_TIME_ZONE } from '@/lib/time'

// Mulberry32: fast seeded PRNG.
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type Scenario = 'storm' | 'calm' | 'rain' | 'offline' | 'default'

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

function signedNoise(rng: () => number, amplitude: number) {
  return (rng() - 0.5) * 2 * amplitude
}

// Magnus dew point approximation (a=17.27, b=237.7).
function dewPointCelsius(tempC: number, humidityPct: number) {
  const a = 17.27
  const b = 237.7
  const gamma = (a * tempC) / (b + tempC) + Math.log(humidityPct / 100)
  return (b * gamma) / (a - gamma)
}

// Wind chill (only relevant when temp <= 10C and wind > 4.8 km/h).
function windChillCelsius(tempC: number, windKmh: number) {
  if (tempC > 10 || windKmh <= 4.8) return tempC
  const ws = windKmh / 3.6
  const wc =
    13.12 + 0.6215 * tempC - 11.37 * Math.pow(ws, 0.16) +
    0.3965 * tempC * Math.pow(ws, 0.16)
  return Math.min(tempC, wc)
}

// Heat index (only relevant when temp >= 26C and humidity >= 40%).
function heatIndexCelsius(tempC: number, humidityPct: number) {
  if (tempC < 26 || humidityPct < 40) return tempC
  const T = tempC
  const R = humidityPct
  // Rothfusz regression in Celsius (conversion of the standard F formula).
  const hiF =
    -42.379 +
    2.04901523 * (T * 9 / 5 + 32) +
    10.14333127 * (R / 100) -
    0.22475541 * (T * 9 / 5 + 32) * (R / 100) -
    0.00683783 * Math.pow(T * 9 / 5 + 32, 2) -
    0.05481717 * Math.pow(R / 100, 2) +
    0.00122874 * Math.pow(T * 9 / 5 + 32, 2) * (R / 100) +
    0.00085282 * (T * 9 / 5 + 32) * Math.pow(R / 100, 2) -
    0.00000199 * Math.pow(T * 9 / 5 + 32, 2) * Math.pow(R / 100, 2)
  return (hiF - 32) * 5 / 9
}

function feelsLikeCelsius(
  tempC: number,
  windKmh: number,
  humidityPct: number,
  dewPoint: number
) {
  const wc = windChillCelsius(tempC, windKmh)
  const hi = heatIndexCelsius(tempC, humidityPct)
  // Choose the more meaningful comfort index.
  if (tempC <= 10 && windKmh > 4.8) return wc
  if (tempC >= 26 && humidityPct >= 40) return hi
  // Otherwise falls back to simple approximation from docs/02 mock section.
  return tempC - windKmh * 0.1 + (humidityPct > 80 ? 1 : 0)
}

interface WindSample {
  speed: number
  gust: number
  dir: number
}

function createMockSource(scenario: Scenario = 'default', seed = 12345): WeatherSource {
  const rng = mulberry32(seed)
  let rainToday = 0 // mm, reset at Europe/Berlin midnight
  let currentRainAccum = 0
  let rainEventEnd = 0
  let pressure = 1013
  const windState = { dirDeg: null as number | null }

  // Active scenario; changeable at runtime via setScenario (dev panel/routes).
  let currentScenario: Scenario = scenario

  function now() {
    return Date.now()
  }

  function isBerlinMidnightPassed() {
    const b = new Date()
    b.setHours(0, 0, 0, 0)
    b.setMinutes(b.getMinutes() + 60)
    b.setSeconds(b.getSeconds() - 1)
    return now() > b.getTime()
  }

  // Reset daily totals at Europe/Berlin midnight.
  if (isBerlinMidnightPassed()) {
    rainToday = 0
    currentRainAccum = 0
  }

  function pick(lo: number, hi: number) {
    return lo + (hi - lo) * rng()
  }

  function startRainEvent() {
    const durationMin = Math.round(pick(10, 40))
    rainEventEnd = now() + durationMin * 60000
    currentRainAccum = pick(2, 14) // event total in mm
  }

  function maybeRain(): number {
    if (currentScenario === 'offline') return 0

    if (currentScenario === 'storm') {
      return pick(2, 8)
    }
    if (currentScenario === 'rain') {
      return pick(0.5, 3)
    }

    if (currentRainAccum > 0 && now() < rainEventEnd) {
      const remaining = Math.max(1, rainEventEnd - (now() - 60000))
      const rate = currentRainAccum / (remaining / 60000)
      return Math.min(rate, pick(3, 7))
    }
    if (currentRainAccum > 0 && now() >= rainEventEnd) {
      currentRainAccum = 0
      return 0
    }
    if (rng() < 0.02) {
      startRainEvent()
      return pick(1, 4)
    }
    return 0
  }

  function getWind(): WindSample {
    if (currentScenario === 'storm') {
      // Strong sustained wind with real gusts above it (cap 72 km/h).
      const speed = pick(35, 55)
      return {
        speed,
        gust: Math.min(72, speed * pick(1.2, 1.5)),
        dir: pick(180, 270),
      }
    }
    if (currentScenario === 'calm') {
      return {
        speed: pick(2, 6),
        gust: 0,
        dir: 0,
      }
    }
    const base = 8
    const speed = Math.max(0, base + signedNoise(rng, 3))
    const gust = Math.max(speed, speed * pick(1.3, 2.2))
    // Circular drift; never jump 359->0 arbitrarily.
    if (windState.dirDeg === null) {
      windState.dirDeg = pick(0, 360)
    }
    const dirDelta = signedNoise(rng, 10)
    windState.dirDeg = wrapDeg(windState.dirDeg + dirDelta)
    const dir = windState.dirDeg
    return { speed, gust, dir }
  }

  function temperatureAt(nowT: number, seasonShift = 0) {
    const hour = (nowT / 3600000) % 24
    const midday = 15
    const amplitude = 5.5
    const base = 10.5 + seasonShift
    const offsetHour = hour - midday
    const sine = Math.sin((offsetHour * Math.PI) / 12)
    return base + amplitude * sine + signedNoise(rng, 0.3)
  }

  function humidityFromTemp(t: number) {
    const base = 75 - (t - 10) * 1.5
    return clamp(base + signedNoise(rng, 4), 30, 100)
  }

  function pressureDrift() {
    pressure = roundPressure(pressure + signedNoise(rng, 0.2))
    return pressure
  }

  function solarCurve() {
    const hour = nightOverride.midnight != null
      ? (nightOverride.midnight.getTime() / 3600000) % 24
      : (now() / 3600000) % 24
    if (hour < 6 || hour > 20) return 0
    const width = 8
    const val = Math.sin(((hour - 6) / width) * Math.PI)
    return Math.max(0, val * 600) + signedNoise(rng, 30)
  }

  function uvFromSolar(solar: number) {
    if (solar <= 0) return 0
    const uvi = solar / 120
    return clamp(uvi, 0, 11)
  }

  // Controlled midnight used for testability.
  const nightOverride = { midnight: null as Date | null }

  function buildReading(nowT = now()) {
    const t = temperatureAt(nowT)
    const humidity = humidityFromTemp(t)
    const wind = getWind()
    const rainRate = maybeRain()
    const dew = dewPointCelsius(t, humidity)
    const feels = feelsLikeCelsius(t, wind.speed, humidity, dew)

    // Update pressure baseline with drift.
    pressure = pressureDrift()

    if (rainRate > 0) {
      rainToday += (rainRate * 5) / 3600 // approx per 5s sample
      if (rainToday < 0) rainToday = 0
    }

    return {
      timestamp: new Date(nowT).toISOString(),
      source: 'mock',
      temperatureC: Math.round(t * 10) / 10,
      feelsLikeC: Math.round(feels * 10) / 10,
      dewPointC: Math.round(dew * 10) / 10,
      humidityPct: Math.round(humidity),
      pressureHpa: roundPressure(pressure),
      windSpeedKmh: roundWind(wind.speed),
      windGustKmh: roundWind(wind.gust),
      windDirectionDeg: roundWind(wind.dir),
      rainRateMmH: roundRain(rainRate),
      rainTodayMm: roundRain(rainToday),
      uvIndex: roundTemp(uvFromSolar(solarCurve())),
      solarWm2: Math.round(solarCurve()),
    } as WeatherReading
  }

  function historyPoints(
    count: number,
    resolutionMinutes: number,
    scenarioOverride?: Scenario
  ): HistoryPoint[] {
    const points: HistoryPoint[] = []
    const nowT = now()
    const step = resolutionMinutes * 60000

    // To keep history deterministic and consistent with the current reading,
    // we derive a per-point seed but keep the same seasonal pattern.
    for (let i = count - 1; i >= 0; i--) {
      const tMs = nowT - i * step
      const offsetRng = mulberry32(seed + i * 7)
      const hour = (tMs / 3600000) % 24
      const midday = 15
      const amplitude = 5.5
      const base = 10.5
      const offsetHour = hour - midday
      const sine = Math.sin((offsetHour * Math.PI) / 12)
      const temp = base + amplitude * sine + signedNoise(offsetRng, 0.3)
      const humidity = clamp(
        75 - (temp - 10) * 1.5 + signedNoise(offsetRng, 4),
        30,
        100
      )
      const speed = 8 + signedNoise(offsetRng, 3)
      const gust = Math.max(speed, speed * (1.3 + offsetRng() * 0.9))
      const pressure = 1013 + signedNoise(offsetRng, 4)
      const scenarioUsed = scenarioOverride ?? currentScenario
      let rain = 0
      if (scenarioUsed === 'rain') {
        rain = i % 12 === 0 ? pick(0.2, 2.5) : 0
      } else if (scenarioUsed === 'storm') {
        rain = i % 12 === 0 ? pick(2, 8) : 0
      } else if (i % 12 === 0 && offsetRng() < 0.25) {
        rain = pick(1, 4)
      }

      points.push({
        timestamp: new Date(tMs).toISOString(),
        temperatureC: Math.round(temp * 10) / 10,
        humidityPct: Math.round(humidity),
        windSpeedKmh: Math.round(Math.max(0, speed) * 10) / 10,
        rainRateMmH: Math.round(rain * 100) / 100,
        pressureHpa: Math.round(pressure * 10) / 10,
      })
    }

    return points
  }

  // Expose a scenario override so tests/routes can force a state without
  // recreating the source.
  return {
    getCurrent(): Promise<WeatherReading> {
      if (currentScenario === 'offline') {
        // Offline: return a reading with an old timestamp so the route layer
        // flags it stale/offline.
        const old = now() - 35 * 60 * 1000 // 35 minutes ago
        return Promise.resolve(buildReading(old))
      }
      return Promise.resolve(buildReading())
    },
    getHistory(range: '24h' | '7d'): Promise<HistoryPoint[]> {
      if (range === '24h') return Promise.resolve(historyPoints(288, 5))
      return Promise.resolve(historyPoints(96, 30))
    },
    // non-standard helper used by route layer / tests
    setScenario(scenario: Scenario) {
      currentScenario = scenario
    },
    // Expose last built reading for consistency assertions in tests.
    __debug: {
      get lastReading() {
        return buildReading() as WeatherReading
      },
      setNightMidnight: (date: Date | null) => {
        nightOverride.midnight = date ? new Date(date.getTime()) : null
      },
      getNightMidnight: () => {
        return nightOverride.midnight ?? null
      },
    },
  } as unknown as WeatherSource & {
    setScenario: (scenario: Scenario) => void
    __debug: { lastReading: WeatherReading }
  }
}

export default createMockSource
