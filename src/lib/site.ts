/**
 * Station and site configuration for Dresden International School weather station.
 * Hardware: Sainlogic WS3500 via Ecowitt cloud.
 */

export interface SiteConfig {
  stationName: string;
  stationModel: string;
  schoolName: string;
  city: string;
  country: string;
  /**
   * GPS coordinates for Dresden International School (Annenstraße 9, 01067 Dresden).
   * TODO: Verify exact GPS coordinates of rooftop sensor array.
   * If latitude or longitude is null/undefined, sunrise/sunset is hidden per spec.
   */
  latitude: number | null;
  longitude: number | null;
  elevationM: number | null;
}

export const SITE_CONFIG: SiteConfig = {
  stationName: 'DIS Weather Station',
  stationModel: 'Sainlogic WS3500',
  schoolName: 'Dresden International School',
  city: 'Dresden',
  country: 'Germany',
  latitude: 51.0478,
  longitude: 13.7258,
  elevationM: 112,
};
