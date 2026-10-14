import { WeatherReading, HistoryPoint, WeatherSource } from '@/lib/types';

// Fast mulberry32 seeded PRNG so the world is stable unless a scenario is set.
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Scenario = 'storm' | 'calm' | 'rain' | 'offline' | 'default';

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function signedNoise(rng: () => number, amplitude: number) {
  return (rng() - 0.5) * 2 * amplitude;
}

export function createMockSource(scenario: Scenario = 'default', seed = 12345) {
  const rng = mulberry32(seed);
  let rainToday = 0; // mm, reset at Europe/Berlin midnight
  let currentRainAccum = 0; // event accumulator
  let rainEventEnd = 0; // unix ms
  let pressure = 1013;

  function now() {
    return Date.now();
  }

  function isBerlinMidnightPassed() {
    const b = new Date();
    b.setHours(0, 0, 0, 0);
    b.setMinutes(b.getMinutes() + 60);
    b.setSeconds(b.getSeconds() - 1);
    return now() > b.getTime();
  }

  // Reset daily totals at Europe/Berlin midnight.
  if (isBerlinMidnightPassed()) {
    rainToday = 0;
    currentRainAccum = 0;
  }

  function pick(lo: number, hi: number) {
    return lo + (hi - lo) * rng();
  }

  function startRainEvent() {
    const durationMin = Math.round(pick(10, 40));
    rainEventEnd = now() + durationMin * 60000;
    currentRainAccum = pick(2, 14); // event total in mm
  }

  function maybeRain() {
    const isOffline = scenario === 'offline';
    if (isOffline) return 0;

    if (scenario === 'storm') {
      // storm: heavier rain, stronger wind.
      return pick(2, 8);
    }
    if (scenario === 'rain') {
      // rain: lighter but present.
      return pick(0.5, 3);
    }

    // default / calm: mostly dry, occasional event
    if (currentRainAccum > 0 && now() < rainEventEnd) {
      const rate = currentRainAccum / (rainEventEnd - (now() - 60000));
      return Math.min(rate, pick(3, 7));
    }
    if (currentRainAccum > 0 && now() >= rainEventEnd) {
      currentRainAccum = 0;
      return 0;
    }
    // trigger new event rarely
    if (rng() < 0.02) {
      startRainEvent();
      return pick(1, 4);
    }
    return 0;
  }

  function getWind() {
    if (scenario === 'storm') {
      return { speed: pick(35, 55), gust: 0, dir: pick(180, 270) };
    }
    if (scenario === 'calm') {
      return { speed: pick(2, 6), gust: 0, dir: 0 };
    }
    const base = 8;
    const speed = base + signedNoise(rng, 3);
    const gust = speed * pick(1.3, 2.2);
    // drift direction slowly
    const baseDir = pick(0, 360);
    const dir = baseDir + signedNoise(rng, 10);
    return { speed: Math.max(0, speed), gust: Math.max(speed, gust), dir };
  }

  function temperatureAt(nowT: number) {
    // daily sine: min ~5 at 05:00, max ~16 at 15:00, with a seasonal shift
    const hour = (nowT / 3600000) % 24;
    const midday = 15;
    const amplitude = 5.5;
    const base = 10.5;
    const offsetHour = hour - midday;
    const sine = Math.sin((offsetHour * Math.PI) / 12);
    return base + amplitude * sine + signedNoise(rng, 0.3);
  }

  function humidityFromTemp(t: number) {
    // inverse relationship: warmer -> lower humidity, clamp 30-100
    const base = 75 - (t - 10) * 1.5;
    return clamp(base + signedNoise(rng, 4), 30, 100);
  }

  function pressureDrift() {
    return pressure + signedNoise(rng, 0.2);
  }

  function solarCurve() {
    const hour = (now() / 3600000) % 24;
    if (hour < 6 || hour > 20) return 0;
    const peak = 12;
    const width = 8;
    const val = Math.sin(((hour - 6) / width) * Math.PI);
    return Math.max(0, val * 600) + signedNoise(rng, 30);
  }

  function uvFromSolar(solar: number) {
    if (solar <= 0) return 0;
    const uvi = solar / 120;
    return clamp(uvi, 0, 11);
  }

  function buildReading() {
    const nowT = now();
    const t = temperatureAt(nowT);
    const humidity = humidityFromTemp(t);
    const wind = getWind();
    const rainRate = maybeRain();
    const feelsLike = t - (wind.speed * 0.1) + (humidity > 80 ? 1 : 0);
    const dewPoint = t - ((100 - humidity) / 5);

    pressure = pressureDrift();

    if (rainRate > 0) {
      rainToday += rainRate / 3600 * 60 * 5; // approx per sample
      if (rainToday < 0) rainToday = 0;
    }

    if (scenario === 'offline') {
      // still returns a current reading but the source layer will flag offline
    }

    return {
      timestamp: new Date(nowT).toISOString(),
      source: 'mock',
      temperatureC: Math.round(t * 10) / 10,
      feelsLikeC: Math.round(feelsLike * 10) / 10,
      dewPointC: Math.round(dewPoint * 10) / 10,
      humidityPct: Math.round(humidity),
      pressureHpa: Math.round(pressure * 10) / 10,
      windSpeedKmh: Math.round(wind.speed * 10) / 10,
      windGustKmh: Math.round(wind.gust * 10) / 10,
      windDirectionDeg: Math.round(wind.dir % 360),
      rainRateMmH: Math.round(rainRate * 100) / 100,
      rainTodayMm: Math.round(rainToday * 100) / 100,
      uvIndex: Math.round(uvFromSolar(solarCurve() * 10) / 10) / 10,
      solarWm2: Math.round(solarCurve()),
    } as WeatherReading;
  }

  function historyPoints(count: number, resolutionMinutes: number): HistoryPoint[] {
    const points: HistoryPoint[] = [];
    const nowT = now();
    const step = resolutionMinutes * 60000;
    for (let i = count - 1; i >= 0; i--) {
      const t = new Date(nowT - i * step).toISOString();
      // Temporarily shift seedable randomness so history is a believable line,
      // not a fresh random walk from this instant. Use deterministic offset.
      const offsetRng = mulberry32(seed + i * 7);
      const hour = ((nowT - i * step) / 3600000) % 24;
      const midday = 15;
      const amplitude = 5.5;
      const base = 10.5;
      const offsetHour = hour - midday;
      const sine = Math.sin((offsetHour * Math.PI) / 12);
      const temp = base + amplitude * sine + signedNoise(offsetRng, 0.3);
      const humidity = clamp(75 - (temp - 10) * 1.5 + signedNoise(offsetRng, 4), 30, 100);
      const speed = 8 + signedNoise(offsetRng, 3);
      const gust = speed * (1.3 + offsetRng() * 0.9);
      const pressure = 1013 + signedNoise(offsetRng, 4);
      const rain = i % 12 === 0 && offsetRng() < 0.25 ? pick(0.2, 2.5) : 0;

      points.push({
        timestamp: t,
        temperatureC: Math.round(temp * 10) / 10,
        humidityPct: Math.round(humidity),
        windSpeedKmh: Math.round(Math.max(0, speed) * 10) / 10,
        rainRateMmH: Math.round(rain * 100) / 100,
        pressureHpa: Math.round(pressure * 10) / 10,
      });
    }
    return points;
  }    return {
      getCurrent(): Promise<WeatherReading> {
        return Promise.resolve(buildReading() as WeatherReading);
      },
      getHistory(range: '24h' | '7d'): Promise<HistoryPoint[]> {
        if (range === '24h') return Promise.resolve(historyPoints(288, 5));
        return Promise.resolve(historyPoints(96, 30));
      },
    } as WeatherSource & { __scenario?: Scenario };
}

export default createMockSource;
