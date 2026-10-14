export type WeatherReading = {
  timestamp: string; // ISO 8601 UTC
  source: 'mock' | 'ecowitt';
  temperatureC: number;
  feelsLikeC?: number;
  dewPointC?: number;
  humidityPct: number;
  pressureHpa?: number;
  windSpeedKmh: number;
  windGustKmh: number;
  windDirectionDeg: number;
  rainRateMmH: number;
  rainTodayMm: number;
  rainHourMm?: number;
  rainWeekMm?: number;
  uvIndex?: number;
  solarWm2?: number;
};

export type HistoryPoint = Pick<
  WeatherReading,
  'timestamp' | 'temperatureC' | 'humidityPct' | 'windSpeedKmh' | 'rainRateMmH' | 'pressureHpa'
>;

export type WeatherApiResponse = {
  reading: WeatherReading;
  history: {
    h24: HistoryPoint[];
    d7: HistoryPoint[];
  };
  meta: {
    fetchedAt: string; // ISO 8601 UTC
    stale: boolean;
    isOffline: boolean;
    source: WeatherReading['source'];
    measuredAt: string; // upstream station time, not fetch time
    updatedAt: string; // station upload interval
    scenario?: string;
  };
};

export interface WeatherSource {
  getCurrent(): Promise<WeatherReading>;
  getHistory(range: '24h' | '7d'): Promise<HistoryPoint[]>;
}
