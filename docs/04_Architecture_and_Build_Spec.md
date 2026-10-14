# Architecture and Build Spec

## 1. Stack
Next.js (App Router) + TypeScript, Tailwind, shadcn/ui, Lucide, Recharts, SWR, next-themes, Canvas UI (optional accents), Vercel, pnpm, ESLint + Prettier.

## 2. Folder structure
```
/docs                       these .md files + sample-real-time.json
/public/brand               DIS logos, station photos
/src/app  layout.tsx page.tsx globals.css
  learn/ data/ station/ display/ (page.tsx each)
  api/weather/route.ts  api/history/route.ts
/src/components
  ui/  weather/ (HeroReading Metric WindCompass RainGauge Sparkline LiveDot StaleBanner)
  learn/ (ExplainerCard Activity)  effects/ (WeatherFx.tsx with fallback)
/src/lib  types.ts units.ts beaufort.ts summary.ts moon.ts
  sources/ index.ts mock.ts ecowitt.ts
  content/ concepts.ts activities.ts
/src/hooks/useWeather.ts
```

## 3. Data flow
Browser -> `useWeather` (SWR; 5 s mock / 60 s real) -> `/api/weather` -> `sources/index.ts` chooses mock or ecowitt via `DATA_SOURCE` -> normalized `WeatherReading` (+ `stale`, `fetchedAt`).

## 4. Source interface
```ts
export interface WeatherSource {
  getCurrent(): Promise<WeatherReading>;
  getHistory(range: "24h" | "7d"): Promise<HistoryPoint[]>;
}
```

## 5. Summary sentence (`summary.ts`)
Human text from the reading, e.g. "11 degrees and dry. Light breeze from the south-west at 14 km/h. Pressure steady." Temperature bands (freezing <0, cold <8, cool <15, mild <21, warm <27, hot), Beaufort wind words, rain wording if rate > 0, pressure trend over 3 h (+/-1 hPa), plus a jacket advice line.

## 6. Pages

### `/` Dashboard
1. Header: DIS logo, nav (Live, Data, Learn, Station), theme and unit toggles.
2. Hero: big temperature, feels-like, summary, LiveDot with "measured 40 s ago".
3. Bento: wind compass (speed, gust, Beaufort), rain (rate, hour, day, week), humidity (+ dew point), pressure (relative, trend), UV index and light, today's min/max, moon phase.
4. Sparklines per tile (24 h).
5. "New to this?" strip linking to /learn.
6. Footer: station location, "Sainlogic WS3500", "Built by the DIS Weather Club", source note, 30 Years mark.

### `/data`
Tabs Temperature / Wind / Rain / Pressure / Humidity / Sun; 24 h and 7 d; min/max/avg chips; table view; CSV download.

### `/learn`
Cards per measurement (doc 06) with Kids/Students toggle; Activities list, printable.

### `/station`
Photo, static map, sensor list with accuracy (doc 07: temp +/-1 C, humidity +/-5 %, rain +/-10 %), mounting height and siting caveats, maintenance log, club credits, dragon badge.

### `/display`
Fullscreen kiosk for a lobby screen: nav hidden, cycles Temp / Wind / Rain every 12 s, small position shift every 10 min to avoid burn-in.

## 7. States
Loading skeleton; stale (>10 min) banner; offline (>30 min) greyed last values; missing sensor hides tile; error fallback; empty history.

## 8. Targets
Lighthouse >= 90; LCP < 2 s on mobile 4G; no layout shift (tabular-nums, fixed tile sizes); Canvas effects lazy-loaded and disabled on reduced-motion. Unit tests for units, beaufort, summary and the Ecowitt normalizer (using the real sample JSON).

## 9. Security and privacy
Keys server-only. No third-party trackers or cookies (the school site itself gates YouTube behind consent; match that culture). DIS is in Germany: add Privacy and Imprint pages (school supplies text). Never expose indoor console data. Cache protects the proxy from abuse.

## 10. Git
Branch per session (`s1-foundation`, `s2-depth`, `s3-real-data`), commit after each prompt, tag `v1.0`.
