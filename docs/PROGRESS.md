# DIS Weather Station Website

Project: live weather website for Dresden International School (DIS), powered by a Sainlogic WS3500 station that uploads to the Ecowitt cloud (ecowitt.net) and is read through the Ecowitt Cloud API.
Build time: about 6 hours over 3 sessions. Stack: Next.js (App Router) + TypeScript + Tailwind + shadcn/ui + Canvas UI (canvasui.dev) + Recharts, deployed on Vercel.

## Plan (session 1 below)

1. Scaffold Next.js + pnpm + Tailwind + shadcn/ui + deps.
2. Design tokens and shell (header / footer / logo plate / theme + unit toggles).
3. Types, units, beaufort, mock simulator, API routes, useWeather hook.
4. Dashboard (hero + bento tiles).
5. Build, lint, screenshot, commit.

## Context

- All decisions and specifications are in `/docs` (00-07, including 03a, 03b, 07).
- Brand colors: DIS Blue #00529E, DIS Amber #F6A800, DIS Green #B3D236. Dark mode accent = Amber; light mode accent = Blue.
- Anti-AI-look rules are hard: no purple/blue gradients, no glassmorphism, no emoji icons, no "Welcome" hero with three feature cards, no gradient text, no decorative cards. One accent color, one display font, strict grid.
- Stack: Next.js App Router, TypeScript, Tailwind, shadcn/ui, Lucide, Recharts, SWR, next-themes, pnpm.
- Data flow: browser `useWeather` (SWR) -> `/api/weather` -> `src/sources/index.ts` picks mock or ecowitt via `DATA_SOURCE` -> normalized `WeatherReading`.
- Privacy: keys server-only, no trackers/cookies, Privacy + Imprint placeholders, never expose indoor console data.

## Session 1 status

- Scaffold complete. Next.js 14, TypeScript, Tailwind 3.4, shadcn/ui deps, Geist fonts, dark/light themes, DIS logo plate in a white rounded header plate, DIS brand tags in footer, theme toggle, placeholder unit toggle, favicon, 404 page, eslint/prettier/prettierignore, .gitignore, .env.example. Build and lint pass.
- Brand tokens wired in globals.css: dark default, light optional, accent swaps Amber/Blue, green reserved for live status.
- Placeholder home page renders Header + Footer + hint strip.

## Decisions made

- Geist Sans/Mono from next/font/google with a system fallback if the fonts fail to resolve during a cold build (some Next/font caches did not know Geist at the time builds were run).
- DIS horizontal logo rendered as text "dis" in a white rounded plate in dark mode, because the provided horizontal logo has white background and dark text.
- Accent token driven by `.dark` class, CSS var `--accent`, used only in LiveDot, focus ring, link hover, active series (cadence kept for later).
- Design system tokens in globals.css instead of a separate CSS var file, because Tailwind config is light and the rest is dark by default per 03a.
- No swipe to switch weather; keyboard accessible where present.
- No Canvas UI yet; deferred to Prompt 8.
- Favicon: use DIS logo plate as text mark for now, replace with actual SVG/logo later.

## Uncertainties

- Real Ecowitt API field names and exact response shape are unknown until a redacted sample JSON lands in /docs/sample-real-time.json. The normalizer in src/sources/ecowitt.ts is intentionally defensive and guesses field paths from the typical shape in doc 02; final authority is the sample JSON.
- Actual station latitude/longitude/elevation/mount height missing; impacts station page and pressure correction note wording.
- School logo permission status unknown; footer currently references the provided horizontal logo file in /public/brand if present.
- School font unknown; using Geist unless IT supplies something else.
- Favicon/logo exact assets not yet placed; placeholder behavior only.

## Known issues

- Unit toggle is a placeholder stub in Header; not wired to units changes yet (Prompt 3/5 area).
- Rain event reset logic in mock uses local system clock; should be Europe/Berlin midnight; currently resets at local midnight with a drift guard. Needs Europe/Berlin treat per doc 02 section 6.
- Mock history points use a deterministic offset RNG per index; fine for demo, but not a substitute for a real sample-based history when available.

## Tool / model used

- Scaffold and shell by this agent; build + lint verified.

## Session 3 — Home page (bento dashboard) finished — DONE

- (other agent) built most of the bento: HeroReading (big temperature 12.5°C clamp, feels-like, min/max range bar with progressbar a11y, summary sentence + jacket advice, LiveDot/RelativeTime), WindCompass (SVG + cardinal/minor ticks, ghost gust needle, exact screen-reader sentence), RainGauge (0–10 mm scale, "No rain today."), HumidityTile (+dew point +comfort word), PressureTile (trend arrow + sparkline), UVTile (WHO segment bar), SolarTile (hidden if absent), MoonSunTile (math moon + sunrise/sunset from src/lib/site.ts), Metric primitive with Tooltip "What is this?" → /learn#<concept-id>, ValueCrossfade (300 ms, reduced-motion), Sparkline SkeletonTile, LearnHintStrip (→ /learn and /display).
- This session finished the gaps:
  1. `/learn#<concept-id>` anchors were broken (learn page had no ids). Fixed: ConceptCardShell now renders `id={card.id}` + `scroll-mt-28`; all 9 tile links and the hero link now land on the right card.
  2. `/display` was linked but did not exist (404). Built minimal kiosk page per docs/04 §6: fullscreen, no nav, cycles Temp/Wind/Rain every 12 s, 6 px burn-in shift every 10 min, reuses HeroReading/WindCompass/RainGauge, LiveDot + RelativeTime header, typecheck-clean.
  3. Humidity comfort word was misleading (72 % RH with 7.9 °C dew point read "Dry"). Rewrote comfortWord: RH bands lead (35–65 comfortable), dew point only escalates inside the middle band (dew >16 C = humid); 72 % now reads "Humid". Locked with 5 unit tests.
  4. REAL BUG: mock scenario overrides did nothing for wind/rain — `getWind()`/`maybeRain()` read the constructor `scenario` while `setScenario` mutated `currentScenario` only. Fixed by switching all simulation branches to `currentScenario`; added regression tests (setScenario storm → 35+ km/h wind; back to calm → ≤10). Verified live via cookie: storm → wind 53, gust 72, rain 4.8 mm/h; rain → 2.8 mm/h; offline → 35-min-old timestamp driving isStale/isOffline.
- Tests: 124 passing across 12 files (added HumidityTile.test.tsx, scenario regression tests). `vitest run` exit 0; typecheck exit 0; lint 0 warnings.
- Self-review: overflow probe `scrollWidth > clientWidth+1` at 360/390/768/1024/1440 — clean at every width in dark; light theme accent verified #00529E flip and no overflow at 390. Console clean. Screenshots unavailable (preview compositor bug, ap-side); DOM/a11y-level checks used instead.
- Preview: http://localhost:54772 (detached npm.cmd run dev, pid 31980, logs .freebuff/preview-c2f67de1-…log[.err]).
- Final check additions: unit toggle verified end-to-end (hero °F, wind mph, rain in, pressure inHg). Found + fixed a real bug — sparklines under imperial showed hPa/km/h/mm values with converted unit labels; all three call sites (PressureTile, WindCompass, RainGauge) now convert data arrays per unit system (verified live: 29.8–30.0 inHg, 3.1–6.8 mph, 0.0–0.1 in/h). Fixed flaky `vitest run` cause: 12 parallel jsdom fork workers exhausted memory ("Failed to start forks worker"); maxWorkers: 4 in vitest.config — two consecutive 124/124 exit-0 runs.
- Remaining: real Ecowitt sample JSON to replace mock.

## Session 2.5 — Client data layer + live-status components — DONE

- `src/hooks/useWeather.ts` rewritten to contract: SWR `keepPreviousData`, refresh 5s (mock mode via NEXT_PUBLIC_DATA_MODE) / 60s otherwise, revalidateOnFocus + reconnect, exponential retry backoff (interval × 2^retryCount), zod-validated fetcher that never surfaces internal error bodies. Returns { reading, history, isLoading, error, isStale, isOffline, measuredAt, secondsSinceMeasured }; `secondsSinceMeasured` ticks every 1s from a dedicated interval (`useElapsedSeconds`) without refetching; first paint is 0 for hydration safety; stale/offline computed client-side (>10 min / >30 min, strict).
- `src/hooks/useHistory.ts` (new): own SWR key `/api/history?range=…`, 5-minute refresh, zod-validated.
- `src/components/weather/RelativeTime.tsx`: pure `formatElapsed` ("just now", "40 s ago", "14 min ago", "1 h 15 min ago") + component.
- `src/components/weather/StaleBanner.tsx`: appears past stale/offline thresholds, calm tone ("Data last measured … may be reconnecting." / offline variant). Grid-rows 0fr→1fr transition wrapper means NO layout jump; transition disabled under reduced motion; role=status/aria-live=polite.
- `src/components/weather/ScenarioDebugPanel.tsx` (dev-only, NODE_ENV guard): floating button + keyboard-accessible popover (Esc closes, aria-expanded/controls, aria-pressed), sets `weather_scenario` cookie consumed by both API routes in non-production, then revalidates all SWR keys.
- `src/components/weather/StatusStrip.tsx`: derives Live/Delayed/Offline for LiveDot from the hook and hosts RelativeTime + StaleBanner; mounted in the home hero (replacing hardcoded status).
- Route updates: /api/weather reads `weather_scenario` cookie fallback in non-production (query param still wins, 403 in prod); /api/history honors the same cookie.
- Tests: +22 (98/98 total). New: elapsed ticking (fake-timer 1s ticks, future-timestamp clamp, null), threshold boundaries (exactly 10 min fresh, >10 min stale, exactly 30 min stale, >30 min offline), formatElapsed/RelativeTime, StaleBanner visibility + both messages + grid-rows wrapper. vitest now includes *.test.tsx via @vitejs/plugin-react.
- Fixes during verification: errorRetryFactor removed from SWR options (SWR v2 does exponential backoff internally off errorRetryInterval).
- Live verification via preview: LIVE ("measured just now" + LIVE label), OFFLINE scenario ("measured 35 min ago" + offline banner), LIVE again after revalidate. Delayed state (10–30 min window) covered by unit tests — no mock scenario produces that age live. Browser console clean (one info devtools notice only).
- Preview registered: http://localhost:57492 (detached next dev, pid 49004, log .freebuff/preview-c2f67de1-76ec-41a1-bd11-65061c007ed4.log + dev-server.log).

## Session 2 — Data layer (mock, per docs/02 and docs/04) — DONE

- `src/lib/types.ts`: zod schemas for WeatherReading, HistoryPoint, WeatherApiResponse (reading + history {h24,d7} + meta{fetchedAt, stale, offline, measuredAt, source, scenario?}) and HistoryApiResponse; TS types inferred from schemas; WeatherSource interface.
- `src/lib/units.ts`: fToC/cToF, mphToKmh/kmhToMph/kmhToMs, inToMm/mmToIn, inHgToHpa/hPaToInHg plus formatTemp/formatSpeed/formatRain/formatPressure honouring metric/imperial; rounding helpers (temp 1dp, wind 1dp internal/0dp display, rain 2dp, pressure 1dp).
- `src/lib/beaufort.ts`: beaufort(kmh) -> {scale 0-12, name, kidName}, wind compass labels, wrapDeg and circular averageWindDirection.
- `src/lib/moon.ts`: mean-synodic moon phase + illumination (epoch 2000-01-06T18:14Z, 29.53058867-day month, no network).
- `src/lib/sources/mock.ts`: mulberry32 seeded deterministic simulation per docs/02 §6 — seasonal-adjustable temperature sine, inverse humidity, gusts + circularly drifting wind direction, rain events with accumulation reset at Europe/Berlin midnight, pressure drift, UV/solar bell curve zero at night, Magnus dew point, wind chill <10C/>4.8km/h, heat index >=26C/>=40% RH; scenarios storm/calm/rain/offline via ctor arg or setScenario; history consistent with current reading (last history point ~= current within tolerance, covered by test).
- `src/lib/sources/index.ts`: getSource() by DATA_SOURCE (default mock), ecowitt stub throws "not implemented".
- `src/app/api/weather/route.ts` + `api/history/route.ts`: zod query validation, scenario param non-production only (403 otherwise), stale >10min / offline >30min, Cache-Control no-store for mock, s-maxage=60 stale-while-revalidate=30 for real mode, generic error messages (400/403/502/503), no internal details leaks, last-good in-memory fallback on failure.
- Tests (vitest, `src/**/*.test.ts`): 76 tests / 76 assertions passing across units (round-trips, 32F=0C, 1013.25hPa=29.92inHg), beaufort boundaries + wrapDeg, moon (real events: new 2019-12-26, full 2020-01-10, quarters 2019-12-19/2020-01-02), mock determinism, wind direction wrap, humidity 0-100, dew point <= air temp, rain monotonic within a day + midnight reset, route/query schema + thresholds.
- Fixed during verification: vitest.config.js missing `@` alias; storm scenario now returns real gusts above sustained wind; Beaufort test 0.5km/h expectation corrected (calm < 1 km/h); moon test dates corrected to real events and tolerance widened for known ~8deg drift of the mean-synodic formula.
- LIVE verification: `next dev` + curl 200 and valid JSON on /api/weather, /api/history?range=24h, /api/history?range=7d; invalid range -> 400 {"error":"Invalid range parameter. Use 24h or 7d."}.
- Remaining: UI wiring (Prompt 4), unit toggle, real Ecowitt sample for normalizer.

## Session 4 — /data page (Prompt 6) — DONE

- `src/lib/types.ts`: `HistoryPointSchema` extended with optional full-sensor fields (`dewPointC`, `feelsLikeC`, `windGustKmh`, `windDirectionDeg`, `rainTodayMm`, `rainHourMm`, `rainWeekMm`, `uvIndex`, `solarWm2`); old payloads without them still validate (missing = empty CSV cells / hidden secondary series).
- `src/lib/sources/mock.ts`: history points now populate dew point (Magnus), gust, drifting direction, Berlin-midnight-resetting `rainTodayMm`, UV/solar bell curve; **7d fixed from 96 pts (48 h) to 336 pts at 30 min = 7 full days** (live-verified: 336 pts spanning 167.5 h).
- `src/lib/history.ts` (new): `computeStats` (min+time/max+time/avg/change), `paddedDomain` (pressure axis), `stepHours`/`cumulativeRain`, `buildHistoryCsv` (units comment + 11 metric columns, ascending, RFC-4180 escaping), `csvFileName` (`dis-weather_<range>_<date>.csv`), Berlin tick/tooltip/stat formatters, `parseRange`/`parseMetric`.
- `src/lib/history.test.ts` (new, 10 tests): stats values/timestamps, null-skipping, empty->null, padded flat domain, CSV comment/header/row, empty cells for missing optionals, ascending order, quote/comma escaping, filename pattern.
- `src/hooks/useHistory.ts`: added `retry()` (SWR mutate) for the error-state retry button; additive, no other callers.
- `src/components/data/data-client.tsx` (new): shareable `?range=24h|7d&metric=<tab>` (+ `?view=table`), 6 tabs, Recharts with 1.5px lines / no fills / horizontal-only 6%-opacity grid / muted axes / Berlin ticks (HH:mm 24h, weekday+date 7d), temp+dashed-dew, wind+gust-dots, rain bars+cumulative line, padded pressure domain, humidity line, dual sun charts + UV peak note; custom design-system tooltip; min/max/avg/change chips; accessible sticky-header scrollable table; client-side CSV download (always metric); skeletons, "No data for this period yet" empty state, error+retry. Animations disabled (`isAnimationActive={false}`) so headless screenshots and reduced-motion stay deterministic. Accent only on active series, greys elsewhere; display values honour the unit toggle.
- `src/app/data/page.tsx`: server wrapper keeps `metadata`, renders `DataClient` in Suspense.
- Tests: 134/134 passing (13 files, incl. 10 new). `pnpm build` clean, `pnpm lint` 0 warnings.
- Verification: headless Chrome screenshots at 390 px (light) and 1440 px (forced dark) for all six tabs at 24h, plus 7d temperature at both widths and table view at both widths — lines/bars render, amber (dark) / DIS blue (light) accent only on active series, no overflow, console clean (one benign React DevTools notice in dev). Shots in `Temp\opencode\data-shots` (not committed). Imperial display and tooltip hover verified by code review only (no session capable of those interactions headless).
- Remaining: real Ecowitt sample JSON for the history normalizer; Ecowitt history returns fewer fields (secondary series hide gracefully by design).

## Session 5 — /learn rebuild (Prompt 7) + header overlap fix — DONE

- `src/lib/content/concepts.ts` rewritten: zod `ConceptSchema` (id enum, lucide-icon enum, kids {summary, example}, students {summary, howMeasured, formula?, unit, typicalDresden {winter, summer}}, tryThis, relatedMetricKey, accuracyNote). 12 concepts from docs/06; kids sentences unit-tested to ≤14 words; Dresden figures are rounded labelled typical ranges (about 600 mm/year, UVI 5–7 summer midday, solar ~700–900 W/m²); undocumented accuracies honestly marked "manual states no figure".
- `src/lib/content/activities.ts` rewritten: zod `ActivitySchema` with the 8 docs/06 activities (ageLabel + ageBand + ageMin/Max, minutes, materials, ≥3 numbered steps, expectedResult, extension, curriculum {programme, subjects}); `allSubjects()` feeds the subject filter.
- `src/lib/content/content.test.ts` (new, 11 tests): exact 12-concept id set, schema validation, both audiences non-empty, kids sentence length, icon allowlist, dashboard anchor coverage, 8 activities, steps/materials/result/extension/curriculum presence.
- `src/components/learn/ExplainerCard.tsx` (new): real Lucide icons by name (no emoji), live "Right now: …" value per concept via `useWeather` honouring the unit toggle, students detail grid (how measured / unit / formula / Dresden ranges), accuracy note, try-this, "See the chart" deep link to /data.
- `src/components/learn/UncertaintyDemo.tsx` (new): true-temperature slider (-10…30 °C) with ±1 °C band visualization, live sentence, DWD-vs-courtyard explanation.
- `src/components/learn/TeacherPanel.tsx` (new): /display, /data-CSV and activities steps + intranet contact note + client-side SVG QR of the /display URL via `qrcode.react` (chosen: renders offline as SVG with zero network/tracking, crisp for print; justification recorded here).
- `src/app/learn/page.tsx` rewritten: h1→h2→h3 order, anchor ids = concept ids (dashboard /learn# links verified by test), Kids/Students toggle persisted in `dis_learn_audience` with larger kids type (`.audience-kids .learn-body`), activity age-band + subject filters, print button.
- `src/app/globals.css`: print stylesheet (black on white via token override, header/footer/chrome hidden with `print:hidden`, `.activity-sheet` one-per-page breaks).
- Dashboard "What is this?" links: already present on all tiles; anchor ids preserved so all 7 existing deep links resolve.
- Tests: 145/145 passing (14 files, incl. 11 new). `pnpm build` clean, `pnpm lint` 0 warnings.
- Verification (headless Chrome, dev server): students + kids views at 1440 dark, kids at 390, uncertainty slider, teacher QR, activities + print emulation (white, chrome hidden, sheets only), anchor `#pressure` landing (card top=112px under sticky header), age filter (5 upper-secondary), localStorage persistence. Shots in `screenshots/learn/` (moved from Temp, see Session 6).
- Header fix (user-reported overlap): sticky header used `bg-[var(--color-background)]/95`, which Tailwind v3 cannot apply to a `var()` color — the declaration was dropped, leaving the header transparent so page text scrolled through it. Replaced with solid `bg-[var(--color-background)]`; verified with scrolled CDP screenshots (text now hides cleanly under the header).
- Tooling note: dev server wedged once (all routes + static chunks 404); fresh `next dev` on same port fixed it. Reusable CDP scripts kept in `scripts/screenshots/` (`scrolled-shot.mjs`, `scroll-to-shot.mjs`, `learn-check.mjs`).
## Session 6 — Implementation plan doc + screenshot housekeeping — DONE

- Wrote `docs/11_Onboarding_Units_and_Polish_Plan.md`: full spec for site-wide
  role onboarding (6 roles, `dis_role` key, kids/students mapping, teacher-only
  activities + handout), subject-tag removal (programmes narrow to PYP/MYP/DP),
  custom Selector listbox, YouTube-style top progress bar on `var(--accent)`,
  units-everywhere audit table (station page hardcoded-metric root cause),
  skeleton 1:1 geometry fix, mock rain accumulation root cause + "Trace" rule,
  triple-press-D admin panel reveal. File allowlist included (§12).
- Moved all of `Temp/opencode/` (37 PNGs + 2 DOM dumps + 3 CDP scripts) into
  `screenshots/data/{temperature,wind,rain,pressure,humidity,sun,table}/`,
  `screenshots/learn/`, `screenshots/header/`, `screenshots/dom/` and
  `scripts/screenshots/`; Temp copy deleted. `screenshots/` gitignored (binaries),
  scripts untracked and ready to commit. No implementation work done — plan only.
- Verification: `pnpm lint` clean; `pnpm build` failed first on stale `.next`
  cache (`/imprint` module error) — clean rebuild passes all 14 routes.
- Next: implement `docs/11` package (file allowlist in §12).
