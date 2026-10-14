export type MoonPhase =
  | 'new'
  | 'waxing_crescent'
  | 'first_quarter'
  | 'waxing_gibbous'
  | 'full'
  | 'waning_gibbous'
  | 'last_quarter'
  | 'waning_crescent';

export type MoonIllumination = number; // 0..1

const moonNames: Record<MoonPhase, string> = {
  new: 'New Moon',
  waxing_crescent: 'Waxing Crescent',
  first_quarter: 'First Quarter',
  waxing_gibbous: 'Waxing Gibbous',
  full: 'Full Moon',
  waning_gibbous: 'Waning Gibbous',
  last_quarter: 'Last Quarter',
  waning_crescent: 'Waning Crescent',
};

// Standard lunar phase algorithm based on a known new moon reference.
// https://en.wikipedia.org/wiki/Lunar_phase
export const SYNODIC_MONTH_DAYS = 29.53058867;
// Known new moon reference used by moonPhase and the test helper.
export const KNOWN_NEW_MOON = new Date('2000-01-06T18:14:00Z').getTime();

function computeLunarDegrees(date: Date): number {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new Error('moonPhase expects a valid Date')
  }
  const days =
    (date.getTime() - KNOWN_NEW_MOON) / 86400000
  const lunations = days / SYNODIC_MONTH_DAYS
  const fraction = lunations - Math.floor(lunations)
  return fraction * 360
}



export function moonPhase(date: Date): {
  phase: MoonPhase;
  illumination: MoonIllumination;
  name: string;
} {
  const degrees = computeLunarDegrees(date)

  let phase: MoonPhase
  if (degrees < 1) phase = 'new'
  else if (degrees < 45) phase = 'waxing_crescent'
  else if (degrees < 90) phase = 'first_quarter'
  else if (degrees < 135) phase = 'waxing_gibbous'
  else if (degrees < 180) phase = 'full'
  else if (degrees < 225) phase = 'waning_gibbous'
  else if (degrees < 270) phase = 'last_quarter'
  else if (degrees < 315) phase = 'waning_crescent'
  else phase = 'new'

  const illumination = 0.5 * (1 - Math.cos((degrees * Math.PI) / 180))
  return {
    phase,
    illumination: Math.round(illumination * 100) / 100,
    name: moonNames[phase],
  }
}
