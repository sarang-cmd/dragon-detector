export type MoonPhase = 'new' | 'waxing_crescent' | 'first_quarter' | 'waxing_gibbous' | 'full' | 'waning_gibbous' | 'last_quarter' | 'waning_crescent';
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

export function moonPhase(date: Date): { phase: MoonPhase; illumination: MoonIllumination; name: string; emoji: string } {
  const knownNew = new Date('2000-01-06T18:14:00Z').getTime();
  const days = (date.getTime() - knownNew) / 86400000;
  const lunations = days / 29.53058867;
  const fraction = lunations - Math.floor(lunations);
  const degrees = fraction * 360;

  let phase: MoonPhase;
  if (degrees < 1) phase = 'new';
  else if (degrees < 45) phase = 'waxing_crescent';
  else if (degrees < 90) phase = 'first_quarter';
  else if (degrees < 135) phase = 'waxing_gibbous';
  else if (degrees < 180) phase = 'full';
  else if (degrees < 225) phase = 'waning_gibbous';
  else if (degrees < 270) phase = 'last_quarter';
  else if (degrees < 315) phase = 'waning_crescent';
  else phase = 'new';

  const illumination = 0.5 * (1 - Math.cos((degrees * Math.PI) / 180));
  return {
    phase,
    illumination: Math.round(illumination * 100) / 100,
    name: moonNames[phase],
    emoji: phase === 'new' ? '🌑' : illumination < 0.5 ? '🌒' : illumination < 0.95 ? '🌔' : '🌕',
  };
}
