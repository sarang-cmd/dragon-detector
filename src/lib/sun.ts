/**
 * Astronomical solar calculations based on standard NOAA / US Naval Observatory formulas.
 * Computes sunrise and sunset times locally without any external dependencies.
 */

export interface SunTimes {
  sunrise: Date | null;
  sunset: Date | null;
  isPolarDay: boolean;
  isPolarNight: boolean;
}

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

/**
 * Calculates official sunrise and sunset for a given date and coordinates.
 * Zenith is 90° 50' (90.833°) for standard atmospheric refraction at the horizon.
 */
export function calculateSunTimes(
  date: Date,
  latitude: number,
  longitude: number
): SunTimes {
  // Day of the year
  const startOfYear = new Date(Date.UTC(date.getFullYear(), 0, 0));
  const diff = date.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

  const lngHour = longitude / 15;

  function calcTime(isSunrise: boolean): Date | null {
    const t = isSunrise
      ? dayOfYear + (6 - lngHour) / 24
      : dayOfYear + (18 - lngHour) / 24;

    // Sun's mean anomaly
    const M = 0.9856 * t - 3.289;

    // Sun's true longitude
    let L =
      M +
      1.916 * Math.sin(M * DEG2RAD) +
      0.02 * Math.sin(2 * M * DEG2RAD) +
      282.634;
    L = ((L % 360) + 360) % 360;

    // Sun's right ascension
    let RA = RAD2DEG * Math.atan(0.91764 * Math.tan(L * DEG2RAD));
    RA = ((RA % 360) + 360) % 360;

    // Right ascension in same quadrant as L
    const Lquadrant = Math.floor(L / 90) * 90;
    const RAquadrant = Math.floor(RA / 90) * 90;
    RA = RA + (Lquadrant - RAquadrant);
    RA = RA / 15; // in hours

    // Sun's declination
    const sinDec = 0.39782 * Math.sin(L * DEG2RAD);
    const cosDec = Math.cos(Math.asin(sinDec));

    // Sun's local hour angle (zenith = 90.833° for official sunrise/sunset)
    const zenith = 90.833;
    const cosH =
      (Math.cos(zenith * DEG2RAD) - sinDec * Math.sin(latitude * DEG2RAD)) /
      (cosDec * Math.cos(latitude * DEG2RAD));

    if (cosH > 1 || cosH < -1) {
      return null; // Polar day or polar night
    }

    let H: number;
    if (isSunrise) {
      H = 360 - RAD2DEG * Math.acos(cosH);
    } else {
      H = RAD2DEG * Math.acos(cosH);
    }
    H = H / 15; // in hours

    // Local mean time of event
    const T = H + RA - 0.06571 * t - 6.622;

    // UTC time of event
    let UT = T - lngHour;
    UT = ((UT % 24) + 24) % 24;

    const hours = Math.floor(UT);
    const minutes = Math.floor((UT - hours) * 60);
    const seconds = Math.floor(((UT - hours) * 60 - minutes) * 60);

    const result = new Date(date);
    result.setUTCHours(hours, minutes, seconds, 0);
    return result;
  }

  const sunrise = calcTime(true);
  const sunset = calcTime(false);

  return {
    sunrise,
    sunset,
    isPolarDay: sunrise === null && sunset === null && latitude > 60,
    isPolarNight: sunrise === null && sunset === null && latitude < -60,
  };
}

/** Formats a Date object to "HH:mm" in local station time. */
export function formatSunTime(date: Date | null): string {
  if (!date) return '--:--';
  return date.toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}
