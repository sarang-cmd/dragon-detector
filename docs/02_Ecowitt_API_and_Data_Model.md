# Ecowitt API and Data Model

Station: Sainlogic WS3500, uploading to ecowitt.net via the WS View app (see doc 07).

## 1. Credentials (Session 3)
1. Log in at ecowitt.net, open your user profile and find the API management section.
2. Create an **Application Key** and an **API Key**.
3. Find the device **MAC** in the app's Device List (the manual also lists a MAC display on the console).
4. `.env.local`:
```
ECOWITT_APPLICATION_KEY=...
ECOWITT_API_KEY=...
ECOWITT_MAC=AA:BB:CC:DD:EE:FF
DATA_SOURCE=mock   # mock | ecowitt
```

## 2. Endpoints
Real-time:
```
GET https://api.ecowitt.net/api/v3/device/real_time
  ?application_key=...&api_key=...&mac=...&call_back=all
  &temp_unitid=1&pressure_unitid=3&wind_speed_unitid=7&rainfall_unitid=12
```
- `call_back=all` returns all groups present.
- Default units are imperial. The metric unit IDs above come from public integrations (e.g. TapHome). **Verify against the official docs at api.ecowitt.net**, and convert in the adapter as a safety net.
- History: `/api/v3/device/history` with `start_date`, `end_date`, `cycle_type` (e.g. 5min, 30min, 4hour, 1day) and a `call_back` list. Check official docs for exact params and range limits.

## 3. Fields (typical real_time response)
| Path | Field | Default unit | Meaning |
|---|---|---|---|
| data.outdoor | temperature | degF | Air temp |
| data.outdoor | feels_like, app_temp, dew_point | degF | Comfort |
| data.outdoor | humidity | % | Relative humidity |
| data.wind | wind_speed, wind_gust | mph | Average and peak |
| data.wind | wind_direction | deg | 0 = N; direction wind comes FROM |
| data.rainfall | rain_rate | in/h | Intensity |
| data.rainfall | hourly, daily, event, weekly, monthly, yearly | in | Accumulation |
| data.pressure | relative, absolute | inHg | Sea-level vs station |
| data.solar_and_uvi | solar, uvi | W/m2, index | Sun |
| data.indoor | temperature, humidity | degF, % | Console indoor, NEVER show publicly |
Each field is typically `{ "time": "<unix>", "unit": "...", "value": "..." }`. Values are strings: use `Number()`.
The WS3500 has a standard tipping-bucket rain gauge, so expect the normal `rainfall` group (no piezo keys). Paste the real response into `/docs/sample-real-time.json`; it is the final authority.

## 4. Internal model (TypeScript)
```ts
export type WeatherReading = {
  timestamp: string; source: "mock" | "ecowitt";
  temperatureC: number; feelsLikeC?: number; dewPointC?: number; humidityPct: number;
  pressureHpa?: number; windSpeedKmh: number; windGustKmh: number; windDirectionDeg: number;
  rainRateMmH: number; rainTodayMm: number; rainHourMm?: number; rainWeekMm?: number;
  uvIndex?: number; solarWm2?: number;
};
export type HistoryPoint = Pick<WeatherReading,"timestamp"|"temperatureC"|"humidityPct"|"windSpeedKmh"|"rainRateMmH"|"pressureHpa">;
```
UI imports only this. The adapter is the only code that knows Ecowitt.

## 5. Conversions
- degC = (degF - 32) x 5/9; km/h = mph x 1.609344; mm = in x 25.4; hPa = inHg x 33.8639
- Compass: `["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"][Math.round(deg/22.5)%16]`
- Beaufort thresholds (km/h): 1, 6, 12, 20, 29, 39, 50, 62, 75, 89, 103, 118.

## 6. Mock simulator
- Temperature: daily sine (min ~5 C at 05:00, max ~16 C at 15:00, adjust for season) + small random walk.
- Humidity inversely follows temperature, clamp 30-100.
- Wind: base 8 km/h + noise; gust = speed x 1.3-2.2; direction drifts +/-10 deg with occasional shifts.
- Rain: mostly 0; random events 10-40 min at 0.5-6 mm/h; daily total resets at local midnight (Europe/Berlin).
- Pressure ~1013 hPa drifting 0.2 hPa/h. UV and solar follow a daytime bell curve.
- Seeded RNG; `?scenario=storm|calm|rain|offline` forces states.
- Updates every 5 s in mock, every 60 s in real mode.

## 7. Server proxy rules
- `/api/weather` reads env, calls Ecowitt, normalizes, returns `WeatherReading` + `stale` + `fetchedAt`.
- Cache 60 s so 100 visitors = 1 upstream call a minute.
- 8 s timeout; on failure return last good value flagged stale.
- Never forward raw upstream errors or log full URLs (they contain keys).
- Stale if data older than 10 min, offline after 30.
- Show the API `time` as "measured at", not fetch time. Freshness is limited by the upload interval set in the WS View app (sensor itself transmits about every 16 s).

## 8. Backup path
The console supports "Custom Website" upload (Ecowitt or Wunderground protocol) to a URL you control. Not needed for v1.
