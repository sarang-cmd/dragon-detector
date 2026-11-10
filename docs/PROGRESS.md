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

## Session 3, Home page (bento dashboard) finished, DONE

- (other agent) built most of the bento: HeroReading (big temperature 12.5°C clamp, feels-like, min/max range bar with progressbar a11y, summary sentence + jacket advice, LiveDot/RelativeTime), WindCompass (SVG + cardinal/minor ticks, ghost gust needle, exact screen-reader sentence), RainGauge (0–10 mm scale, "No rain today."), HumidityTile (+dew point +comfort word), PressureTile (trend arrow + sparkline), UVTile (WHO segment bar), SolarTile (hidden if absent), MoonSunTile (math moon + sunrise/sunset from src/lib/site.ts), Metric primitive with Tooltip "What is this?" → /learn#<concept-id>, ValueCrossfade (300 ms, reduced-motion), Sparkline SkeletonTile, LearnHintStrip (→ /learn and /display).
- This session finished the gaps:
  1. `/learn#<concept-id>` anchors were broken (learn page had no ids). Fixed: ConceptCardShell now renders `id={card.id}` + `scroll-mt-28`; all 9 tile links and the hero link now land on the right card.
  2. `/display` was linked but did not exist (404). Built minimal kiosk page per docs/04 §6: fullscreen, no nav, cycles Temp/Wind/Rain every 12 s, 6 px burn-in shift every 10 min, reuses HeroReading/WindCompass/RainGauge, LiveDot + RelativeTime header, typecheck-clean.
  3. Humidity comfort word was misleading (72 % RH with 7.9 °C dew point read "Dry"). Rewrote comfortWord: RH bands lead (35–65 comfortable), dew point only escalates inside the middle band (dew >16 C = humid); 72 % now reads "Humid". Locked with 5 unit tests.
  4. REAL BUG: mock scenario overrides did nothing for wind/rain, `getWind()`/`maybeRain()` read the constructor `scenario` while `setScenario` mutated `currentScenario` only. Fixed by switching all simulation branches to `currentScenario`; added regression tests (setScenario storm → 35+ km/h wind; back to calm → ≤10). Verified live via cookie: storm → wind 53, gust 72, rain 4.8 mm/h; rain → 2.8 mm/h; offline → 35-min-old timestamp driving isStale/isOffline.
- Tests: 124 passing across 12 files (added HumidityTile.test.tsx, scenario regression tests). `vitest run` exit 0; typecheck exit 0; lint 0 warnings.
- Self-review: overflow probe `scrollWidth > clientWidth+1` at 360/390/768/1024/1440, clean at every width in dark; light theme accent verified #00529E flip and no overflow at 390. Console clean. Screenshots unavailable (preview compositor bug, ap-side); DOM/a11y-level checks used instead.
- Preview: http://localhost:54772 (detached npm.cmd run dev, pid 31980, logs .freebuff/preview-c2f67de1-…log[.err]).
- Final check additions: unit toggle verified end-to-end (hero °F, wind mph, rain in, pressure inHg). Found + fixed a real bug, sparklines under imperial showed hPa/km/h/mm values with converted unit labels; all three call sites (PressureTile, WindCompass, RainGauge) now convert data arrays per unit system (verified live: 29.8–30.0 inHg, 3.1–6.8 mph, 0.0–0.1 in/h). Fixed flaky `vitest run` cause: 12 parallel jsdom fork workers exhausted memory ("Failed to start forks worker"); maxWorkers: 4 in vitest.config, two consecutive 124/124 exit-0 runs.
- Remaining: real Ecowitt sample JSON to replace mock.

## Session 2.5, Client data layer + live-status components, DONE

- `src/hooks/useWeather.ts` rewritten to contract: SWR `keepPreviousData`, refresh 5s (mock mode via NEXT_PUBLIC_DATA_MODE) / 60s otherwise, revalidateOnFocus + reconnect, exponential retry backoff (interval × 2^retryCount), zod-validated fetcher that never surfaces internal error bodies. Returns { reading, history, isLoading, error, isStale, isOffline, measuredAt, secondsSinceMeasured }; `secondsSinceMeasured` ticks every 1s from a dedicated interval (`useElapsedSeconds`) without refetching; first paint is 0 for hydration safety; stale/offline computed client-side (>10 min / >30 min, strict).
- `src/hooks/useHistory.ts` (new): own SWR key `/api/history?range=…`, 5-minute refresh, zod-validated.
- `src/components/weather/RelativeTime.tsx`: pure `formatElapsed` ("just now", "40 s ago", "14 min ago", "1 h 15 min ago") + component.
- `src/components/weather/StaleBanner.tsx`: appears past stale/offline thresholds, calm tone ("Data last measured … may be reconnecting." / offline variant). Grid-rows 0fr→1fr transition wrapper means NO layout jump; transition disabled under reduced motion; role=status/aria-live=polite.
- `src/components/weather/ScenarioDebugPanel.tsx` (dev-only, NODE_ENV guard): floating button + keyboard-accessible popover (Esc closes, aria-expanded/controls, aria-pressed), sets `weather_scenario` cookie consumed by both API routes in non-production, then revalidates all SWR keys.
- `src/components/weather/StatusStrip.tsx`: derives Live/Delayed/Offline for LiveDot from the hook and hosts RelativeTime + StaleBanner; mounted in the home hero (replacing hardcoded status).
- Route updates: /api/weather reads `weather_scenario` cookie fallback in non-production (query param still wins, 403 in prod); /api/history honors the same cookie.
- Tests: +22 (98/98 total). New: elapsed ticking (fake-timer 1s ticks, future-timestamp clamp, null), threshold boundaries (exactly 10 min fresh, >10 min stale, exactly 30 min stale, >30 min offline), formatElapsed/RelativeTime, StaleBanner visibility + both messages + grid-rows wrapper. vitest now includes *.test.tsx via @vitejs/plugin-react.
- Fixes during verification: errorRetryFactor removed from SWR options (SWR v2 does exponential backoff internally off errorRetryInterval).
- Live verification via preview: LIVE ("measured just now" + LIVE label), OFFLINE scenario ("measured 35 min ago" + offline banner), LIVE again after revalidate. Delayed state (10–30 min window) covered by unit tests, no mock scenario produces that age live. Browser console clean (one info devtools notice only).
- Preview registered: http://localhost:57492 (detached next dev, pid 49004, log .freebuff/preview-c2f67de1-76ec-41a1-bd11-65061c007ed4.log + dev-server.log).

## Session 2, Data layer (mock, per docs/02 and docs/04), DONE

- `src/lib/types.ts`: zod schemas for WeatherReading, HistoryPoint, WeatherApiResponse (reading + history {h24,d7} + meta{fetchedAt, stale, offline, measuredAt, source, scenario?}) and HistoryApiResponse; TS types inferred from schemas; WeatherSource interface.
- `src/lib/units.ts`: fToC/cToF, mphToKmh/kmhToMph/kmhToMs, inToMm/mmToIn, inHgToHpa/hPaToInHg plus formatTemp/formatSpeed/formatRain/formatPressure honouring metric/imperial; rounding helpers (temp 1dp, wind 1dp internal/0dp display, rain 2dp, pressure 1dp).
- `src/lib/beaufort.ts`: beaufort(kmh) -> {scale 0-12, name, kidName}, wind compass labels, wrapDeg and circular averageWindDirection.
- `src/lib/moon.ts`: mean-synodic moon phase + illumination (epoch 2000-01-06T18:14Z, 29.53058867-day month, no network).
- `src/lib/sources/mock.ts`: mulberry32 seeded deterministic simulation per docs/02 §6, seasonal-adjustable temperature sine, inverse humidity, gusts + circularly drifting wind direction, rain events with accumulation reset at Europe/Berlin midnight, pressure drift, UV/solar bell curve zero at night, Magnus dew point, wind chill <10C/>4.8km/h, heat index >=26C/>=40% RH; scenarios storm/calm/rain/offline via ctor arg or setScenario; history consistent with current reading (last history point ~= current within tolerance, covered by test).
- `src/lib/sources/index.ts`: getSource() by DATA_SOURCE (default mock), ecowitt stub throws "not implemented".
- `src/app/api/weather/route.ts` + `api/history/route.ts`: zod query validation, scenario param non-production only (403 otherwise), stale >10min / offline >30min, Cache-Control no-store for mock, s-maxage=60 stale-while-revalidate=30 for real mode, generic error messages (400/403/502/503), no internal details leaks, last-good in-memory fallback on failure.
- Tests (vitest, `src/**/*.test.ts`): 76 tests / 76 assertions passing across units (round-trips, 32F=0C, 1013.25hPa=29.92inHg), beaufort boundaries + wrapDeg, moon (real events: new 2019-12-26, full 2020-01-10, quarters 2019-12-19/2020-01-02), mock determinism, wind direction wrap, humidity 0-100, dew point <= air temp, rain monotonic within a day + midnight reset, route/query schema + thresholds.
- Fixed during verification: vitest.config.js missing `@` alias; storm scenario now returns real gusts above sustained wind; Beaufort test 0.5km/h expectation corrected (calm < 1 km/h); moon test dates corrected to real events and tolerance widened for known ~8deg drift of the mean-synodic formula.
- LIVE verification: `next dev` + curl 200 and valid JSON on /api/weather, /api/history?range=24h, /api/history?range=7d; invalid range -> 400 {"error":"Invalid range parameter. Use 24h or 7d."}.
- Remaining: UI wiring (Prompt 4), unit toggle, real Ecowitt sample for normalizer.

## Session 4, /data page (Prompt 6), DONE

- `src/lib/types.ts`: `HistoryPointSchema` extended with optional full-sensor fields (`dewPointC`, `feelsLikeC`, `windGustKmh`, `windDirectionDeg`, `rainTodayMm`, `rainHourMm`, `rainWeekMm`, `uvIndex`, `solarWm2`); old payloads without them still validate (missing = empty CSV cells / hidden secondary series).
- `src/lib/sources/mock.ts`: history points now populate dew point (Magnus), gust, drifting direction, Berlin-midnight-resetting `rainTodayMm`, UV/solar bell curve; **7d fixed from 96 pts (48 h) to 336 pts at 30 min = 7 full days** (live-verified: 336 pts spanning 167.5 h).
- `src/lib/history.ts` (new): `computeStats` (min+time/max+time/avg/change), `paddedDomain` (pressure axis), `stepHours`/`cumulativeRain`, `buildHistoryCsv` (units comment + 11 metric columns, ascending, RFC-4180 escaping), `csvFileName` (`dis-weather_<range>_<date>.csv`), Berlin tick/tooltip/stat formatters, `parseRange`/`parseMetric`.
- `src/lib/history.test.ts` (new, 10 tests): stats values/timestamps, null-skipping, empty->null, padded flat domain, CSV comment/header/row, empty cells for missing optionals, ascending order, quote/comma escaping, filename pattern.
- `src/hooks/useHistory.ts`: added `retry()` (SWR mutate) for the error-state retry button; additive, no other callers.
- `src/components/data/data-client.tsx` (new): shareable `?range=24h|7d&metric=<tab>` (+ `?view=table`), 6 tabs, Recharts with 1.5px lines / no fills / horizontal-only 6%-opacity grid / muted axes / Berlin ticks (HH:mm 24h, weekday+date 7d), temp+dashed-dew, wind+gust-dots, rain bars+cumulative line, padded pressure domain, humidity line, dual sun charts + UV peak note; custom design-system tooltip; min/max/avg/change chips; accessible sticky-header scrollable table; client-side CSV download (always metric); skeletons, "No data for this period yet" empty state, error+retry. Animations disabled (`isAnimationActive={false}`) so headless screenshots and reduced-motion stay deterministic. Accent only on active series, greys elsewhere; display values honour the unit toggle.
- `src/app/data/page.tsx`: server wrapper keeps `metadata`, renders `DataClient` in Suspense.
- Tests: 134/134 passing (13 files, incl. 10 new). `pnpm build` clean, `pnpm lint` 0 warnings.
- Verification: headless Chrome screenshots at 390 px (light) and 1440 px (forced dark) for all six tabs at 24h, plus 7d temperature at both widths and table view at both widths, lines/bars render, amber (dark) / DIS blue (light) accent only on active series, no overflow, console clean (one benign React DevTools notice in dev). Shots in `Temp\opencode\data-shots` (not committed). Imperial display and tooltip hover verified by code review only (no session capable of those interactions headless).
- Remaining: real Ecowitt sample JSON for the history normalizer; Ecowitt history returns fewer fields (secondary series hide gracefully by design).

## Session 5, /learn rebuild (Prompt 7) + header overlap fix, DONE

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
- Header fix (user-reported overlap): sticky header used `bg-[var(--color-background)]/95`, which Tailwind v3 cannot apply to a `var()` color, the declaration was dropped, leaving the header transparent so page text scrolled through it. Replaced with solid `bg-[var(--color-background)]`; verified with scrolled CDP screenshots (text now hides cleanly under the header).
- Tooling note: dev server wedged once (all routes + static chunks 404); fresh `next dev` on same port fixed it. Reusable CDP scripts kept in `scripts/screenshots/` (`scrolled-shot.mjs`, `scroll-to-shot.mjs`, `learn-check.mjs`).
## Session 7, CanvasUI effects, IMPLEMENTED

- Added the actual Canvas UI React sources for ASCII Sweep, Clouds, Droplets,
  Frost, and VHS under `src/components/canvasui/` (from the supplied component
  prompts), plus dynamic, client-only mounts in the weather/effects layer.
- Added a device-tier detector (reduced motion and missing WebGL force off;
  constrained devices use lite settings), persisted Auto/On/Off preference,
  reference-counted ambient registration, and an FPS guard that persists a
  trip and offers re-enable. Kiosk effects are forced off. Toggle controls are
  available in header, footer and Learn; the Learn copy is audience-aware.
- Wired clouds to the hero, frost only below 0 °C, droplets only during positive
  rain rate, weak-signal treatment only in stale/offline banner, and a one-shot
  unit-change sweep over the dashboard data area. Values remain normal DOM;
  reduced-motion/effects-off retain the ordinary page. Canvas layers and the
  sweep are hidden in print.
- Preserved the upstream Canvas UI license text in
  `src/components/canvasui/LICENSE.md`. The repository license is MIT + Commons
  Clause Condition v1.0 (Copyright (c) 2026 David Haz); application/site use is
  permitted, while selling or redistributing the components themselves is
  restricted. Re-check with the school before launch.
- Verification: `pnpm test:run` (157 passing), `pnpm lint`, `pnpm typecheck`,
  and isolated `CI=1 NEXT_TELEMETRY_DISABLED=1 pnpm build` pass. Preview served
  `/`, `/learn`, `/display`, and `/api/health` with HTTP 200; accessibility tree
  showed normal weather values and controls; at 360 px the page had no horizontal
  overflow and the mobile nav exposed keyboard-focusable unit/effects controls.
  Cloud and rain canvas dimensions were checked after mounting.
- Still unverified on actual school hardware: Chromebook throttling, FPS-trip
  persistence/re-enable interaction, reduced-motion, no-GPU, Save-Data, full
  keyboard-only journey, print output, and effect visual screenshots. The
  implementation plan now marks these as remaining rather than claiming pass.

## Session 6, Implementation plan doc + screenshot housekeeping, DONE

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
  scripts untracked and ready to commit. No implementation work done, plan only.
- Verification: `pnpm lint` clean; `pnpm build` failed first on stale `.next`
  cache (`/imprint` module error), clean rebuild passes all 14 routes.
- Next: implement `docs/11` package (file allowlist in §12).

## Session 7, docs/11 implementation, DONE

- Roles + onboarding: `src/context/role-context.tsx` (`dis_role` + `dis_role_set`,
  legacy `dis_learn_audience` migration, kids/students mapping, teacher-only
  gating), `RoleOnboarding` modal (6 cards, focus trap, no dismiss without a
  choice, `ready` gate against first-paint flash), footer `RoleSwitcher`
  (custom Selector, immediate apply + persist). Deviated from plan §3.3: footer
  switcher changes role directly instead of reopening the picker (same outcome,
  fewer steps).
- `src/components/ui/selector.tsx`: custom listbox (arrows/Home/End/Enter/Esc,
  outside-click close, checkmark, accent focus ring). Used by Learn age filter
  and footer role switcher.
- Learn: role-driven reading level, Activities + TeacherPanel rendered only for
  Teacher (others get the gate note), subject filter + `allSubjects()` deleted,
  age filter rebuilt on Selector, header line now `{age} · {min} · {programme}`.
- Content: `curriculum.subjects` removed from schema + all 8 activities;
  programmes narrowed to PYP/MYP/DP (`sensor-accuracy` TOK→DP); age labels
  scrubbed of CS/ESS/TOK/Physics qualifiers. Tests assert the programme set
  and forbid the removed words.
- Loading bar: found pre-existing `src/components/effects/TopProgressBar.tsx`
  meeting the spec, kept and verified live (polling CDP: `data-visible=true`
  mid-transition). Duplicate `navigation/` version written then deleted.
  Plan doc §6 + §12 corrected.
- Units: station page split into server wrapper + `StationClient` (every
  range/accuracy/resolution converts; footnote states active system);
  `ExplainerCard` unit rows via `CONCEPT_UNITS` map; `summarySentence` takes
  `unitSystem` (bands/thresholds stay metric, display converts: °F, mph, in);
  `UncertaintyDemo` already honored the toggle, untouched.
- Grid/skeleton: loading grid now 8 slots mirroring the real tiles 1:1
  (hero + tall wind + 6 small, same min-heights), `skeleton-shimmer` sweep
  (hard-edged translucent band, no color gradients), `bento-enter` 40ms
  stagger (≤280ms), motion-reduce safe.
- Rain: default-scenario event probability 2%→8% (demo-visible totals);
  `RainGauge` shows "Trace of rain today" for 0<today<0.05; regression test
  forces sustained rain → non-zero today. Consistency test narrowed: rain is
  event-driven per sample, so closeness no longer asserted (temp/humidity/wind
  contract kept, rain plausibility kept).
- Admin panel: floating button removed; triple-press D within 800ms reveals it
  (sessionStorage unlock, Esc hides, input-focus guard, prod null-guard kept).
- Incidental (parallel agent's tree): added the missing
  `<AsciiSweepTransition unitSystem={unitSystem}>` opening tag in
  `src/app/page.tsx`, import + closing tag existed without it, breaking
  `tsc`/build. No other foreign files touched.
- Tests: 173/173 (role 3, station 6, ExplainerCard 3, summary imperial 2,
  mock rain + consistency, content schema updates). `pnpm build` clean
  (14 routes), `pnpm lint` 0 warnings, `tsc` clean.
- Verification: `scripts/screenshots/verify-docs11.mjs`, onboarding (6 cards,
  pick persists, modal closes), teacher (8 activities + handout) vs PYP
  (kids copy, 0 activities, gate note), station imperial (footnote + converted
  table), rain tile non-zero rate, top bar mid-transition, triple-D panel with
  no prior button. Shots in `screenshots/{onboarding,learn,station,home}/`.
  Dev server left running at http://127.0.0.1:3201 (pid 3912).

## Session 8, grid fill, tooltip portal, README, DONE

- Grid: tile roots gained `flex-1` so all 8 tiles fill their bento cells
  (hero/wind span two rows; row-3 tiles equalize to the tallest). CDP rect
  measurement: every tile-to-wrapper gap is now 0px at 1440; tablet/mobile
  unchanged. Committed separately (`8270697`), pushed.
- Tooltip: rain "?" tooltip was clipped by tile `overflow:hidden` (showed
  "his? Learn about …"). Rewrote `src/components/ui/tooltip.tsx` as a
  `document.body` portal with `position:fixed` from the trigger rect, side
  flip + horizontal clamp, 240px wrap. CDP hover check: full text, inside
  viewport, no console errors. Committed separately (`3747ad3`), pushed.
- README: expanded with all brand images (logo, tagline, 30-years, dragons),
  badges, env + deploy guide. Committed + pushed (`4f46296`). Also moved
  `themeColor` from `metadata` to the `viewport` export (Vercel flags it).
- Debugging note: the :3100 dev server was a FOREIGN tree (no "Viewing as",
  no role modal), port had been reclaimed after a reboot. Own server now
  on :3201; always verify "Viewing as" before trusting a screenshot run.

## Session 9, hero outlook (Open-Meteo + Groq), DONE

- `src/lib/outlook.ts`: pure statistical engine (station trend + model
  output, unit-aware headlines) + 6 tests.
- `src/app/api/outlook`: Open-Meteo Dresden hourly (no key) + Groq
  `openai/gpt-oss-120b` (reasoning_effort low, max_tokens 300, a small
  budget starves the answer because reasoning shares it). One shared
  15-min in-memory cache keyed by units for all visitors; statistical
  fallback; key never leaves the server.
- Hero "Coming up" block: 12h hand-rolled SVG temp curve + precip bars,
  AI sentence with freshness label ("AI outlook" / "Station trends").
- Model notes: `llama-3.1-8b-instant` and `llama-3.3-70b-versatile` are
  retired on Groq; available chat models listed via `/models` first.
- Verification: 179/179 tests, build (15 routes) + lint clean, CDP shot
  `screenshots/home/hero-outlook-1440.png` shows curve + AI sentence.
  Committed (outlook files + `.env.example` placeholders).

## Session 10, Supabase auth + progress store, DONE

- Auth: `AuthProvider` + `useAuth` (Google OAuth, email sign-in/sign-up with
  confirm-email handling), `/login` page, `/auth/callback` code exchange,
  `middleware.ts` session refresh, header + mobile-sheet `AuthButton`.
  Unconfigured deployments show a graceful fallback (weather works unsigned).
- Progress: `src/lib/track/progress.ts` (Supabase `track_progress` row with
  localStorage mirror + merge; local-only when signed out) and
  `supabase/migrations/0001_track_progress.sql` (RLS owner-only; user runs
  in the Supabase SQL editor).
- Keys: user-supplied Groq key + Supabase URL/anon key written to gitignored
  `.env.local` only (verified via `git check-ignore`); placeholders added to
  `.env.example`. Keys never printed or committed.
- Dashboard admin checklist still open (user-side): enable Google + Email
  providers in Supabase Auth, add site/redirect URLs (localhost + vercel
  domain), run the migration SQL, optionally disable "confirm email".
- Verification: `tsc` + lint clean, full build clean, `/login` CDP shot
  renders (Google button + email form behind the role modal on fresh
  profiles). Committed auth files + header/layout wiring + supabase deps.

## Session 11, Duolingo-style learning track, DONE

- Track data: `src/lib/track/curriculum.ts` (12 nodes matching the concepts,
  5 units, 36 questions with validated answers) + tests; `MAX 360 XP`.
- `useTrackProgress` hook + `src/lib/track/progress.ts` (Supabase row with
  localStorage mirror/merge; idempotent `completeLesson`, guests stay local).
- `LearningTrack` path UI: XP bar with progress, sign-in nudge for guests,
  snake-offset nodes (done/current/locked, locks only on the path).
- Lesson pages `/learn/track/[nodeId]`: role-aware explainer + 3-question
  check with instant feedback, +10 XP per correct answer, retry + next links.
- Learn page: "Your path" on top, concepts as a fully clickable lesson list
  (list always open for browsing; order enforced only on the path), activities
  + handout unchanged below.
- Verification: 184/184 tests, build (16 routes) + lint clean, CDP shots
  `learn-track-1440.png` (path, XP bar, locks) and `lesson-rain-1440.png`
  (explainer + quiz). Committed in two steps (data, then UI).

## Session 12 — shared cache, auth extras, track fun — DONE

- Outlook cache is now two-tier: in-memory L1 + Supabase `outlook_cache`
  table (migration 0002, SECURITY DEFINER refresh, public read) so every
  server instance shares one 15-min outlook. Verified live: repeat requests
  return the identical `generatedAt` with zero upstream calls; missing table
  degrades gracefully to memory-only with a 60 s backoff. `isFresh` tested.
  Groq model moved to `openai/gpt-oss-120b` (3.1/3.3 retired; listed via
  `/models`); `reasoning_effort: low` + 300 tokens so reasoning does not
  starve the answer.
- Progress bleed fixed: per-user localStorage keys, guest quarantine, adopt
  once on first sign-in, reset button; `resolveProgress` unit-tested.
- Em dashes removed site-wide (copy, comments, placeholders, docs).
- Signup: Gmail deep-link + "open email app" buttons; branded
  `confirm-signup` + `recovery` templates in `supabase/templates/` with
  dashboard paste instructions in the deployment guide.
- Avatars: `0003_avatars.sql` bucket + owner-only policies, header menu
  upload (2 MB, image-only, RLS-hint on failure), `avatar_url` in metadata.
- Favicons + touch icons rounded (PowerShell System.Drawing), ICO rebuilt
  as PNG-compressed 32px; backups in Temp (deleted after verify).
- Track fun: procedural dragon `Mascot` (auto-upgrades to `/mascot.png`
  when the club drops the file in), node labels + UP NEXT badge + gating
  copy on the path, unlocked browsing list, mascot quiz reactions, finish
  confetti (motion-safe), unlock messaging ("This unlocked X").
- Verification: 191/191 tests, build + lint clean, CDP shots (track labels,
  lesson, login, hero outlook, tooltips). Committed per step, pushed straight
  through (remote `ac43d4f` at the time).

## Session 13 — brand emails, rounded logos, lesson titles — DONE

- NOTE: commit `23ed19c` is titled "fix: lesson buttons…" but contains the
  whole batch below (staging swept it in one go; history not rewritten
  because main is shared — contents verified correct in HEAD).
- Rounded brand PNGs generated in-repo (`dis-logo-horizontal.rounded.png`
  on white matte, `dragon_detector_logo.rounded.png` with real transparency);
  header + README now reference them. Emails keep the already-uploaded
  storage JPGs inside rounded containers (no re-upload needed). Favicon ICO
  rebuilt as PNG-compressed 32px (done earlier, session 11 follow-up).
- Lesson buttons/headers now show concept titles ("Wind direction"), not raw
  ids (`titleOf` helper).
- Email suite rewritten, light 3-color theme (blue band/headlines, amber CTA,
  green security callouts, tagline banner at the bottom, both badges in the
  footer): confirm-signup, invite-user, magic-link, change-email,
  reset-password (replaces recovery.html), password-changed, email-changed,
  reauthentication + `SUBJECTS.md` with per-template subject options.
- Deployment guide: exact template map, SMTP options (Resend/Gmail),
  provider-agnostic Gmail search note.
- Q&A answered live: custom SMTP has NO fallback on quota exhaustion
  (signups stall silently); added a resend-confirmation path that detects
  "Email not confirmed" and offers a re-send.

## Session 14 — outlook history + sample seed + answers — DONE

- Outlook history: `outlook_history` table + `append_outlook_history` (capped
  at 50/unit, migration 0004), new public endpoint
  `GET /api/outlook/history?units=&limit=`, every fresh build appends.
- Fallback chain is now: memory (fresh) → Supabase (fresh) → rebuild →
  Supabase any-age flagged `stale: true` → 502. The site never shows a dead
  hero when the APIs are down.
- Seed (migration 0005): one current cache row per units + two history rows,
  all flagged `sample: true`, so the hero/graph/panel work with zero
  external APIs until real builds overwrite them.
- Debug panel gained an Outlook history viewer (public data, empty-state
  note pointing at the migrations). Verified via CDP.
- Answers: sun/moon are NOT measured and use NO API — `lib/sun.ts` computes
  sunrise/sunset from coordinates + date, `lib/moon.ts` computes the phase
  from the date. Nothing to provide. External APIs in use: Open-Meteo (free,
  no key) for forecast, Groq (key provided) for the AI sentence, Supabase
  (provided) for auth/progress/cache. Live station data still needs the
  Ecowitt integration built (stub throws) + keys.
- Env note: two dev servers kept dying/corrupting `.next` in this shared
  tree (parallel builds); fix is kill + wipe `.next` + restart. Do not run
  builds while the other agent is building.

## Session 15 — lobby outlook fix — DONE

- `/display` kiosk no longer renders the "Coming up" outlook block
  (`HeroReading showOutlook`, default true; display passes false). The lobby
  cycles current conditions; forecast + AI stay on Live.
- Outlook graph: added a baseline at the bars' feet so small probabilities
  read as bars, not floating dashes.
- Verified via CDP at 1920x1080 (no "Coming up" in DOM) + screenshot.

## Session 17 — misc fixes (badge path, link reasons) — DONE

- Station badge pointed at a deleted `.jpg`; the real file is the full-color
  `dis-dragons-badge.png`. Fixed the `src`, verified via CDP (badge renders
  in its white ring, "Dresden Dragons" label below).
- Email-link failures now carry reason codes (`missing|expired|used|invalid`)
  and /login translates each into a specific recovery message.

## Session 16 — Sid tour + chatbot + email-link forensics — DONE

- Email links: `/auth/confirm` now returns reason codes
  (`missing|expired|used|invalid`) and `/login` translates each into a
  specific recovery message. The landing the user sees is generated by my
  error path, which means verification itself is rejecting the token.
- Guided tour (`TourProvider`): 5 steps across /, /learn, /data, /station
  with ring highlight + progress dots + Back/Next/Skip; auto-starts once
  after onboarding, restartable from the footer. Finale modal: waving Sid,
  "Hi, I'm Sid!", confetti, Let's go.
- Ask Sid chatbot: floating button + panel, `POST /api/sid` (Groq 120b,
  live station context, kids-safe system prompt, 6-turn memory).
- Verified live via CDP: tour auto-start, all 5 steps, finale, real chat
  answer grounded in live numbers ("12 °C warmer… wind about 8 km/h").
- House rules respected throughout: minimal diffs, shared files checked
  before each commit (parallel agent's files untouched).

## Session 18 — signup mail-failure UX — DONE

- "Error sending confirmation email" comes verbatim from Supabase's mailer
  (SMTP/rate-limit side): the signup call itself is correct. The app now
  detects mailer failures and offers "Continue with Google instead"
  (no email needed) plus a wait-and-retry path, instead of a dead end.
- Repeated testing of the same address can also trip Supabase's built-in
  mail rate limits: use a fresh address or Google while testing.

## Session 19 — misc polish — DONE

- Station Dragons badge enlarged 96px to 144px, then white ring removed
  entirely (PNG has real transparency) so the badge sits directly on the
  card.

## Session 20 — real data via Open-Meteo, honest labels — DONE

- Question "is all of the data here real?" answered file-by-file; the site
  was showing mock data while the footer claimed Ecowitt. Fixed everywhere:
  footer + display footer + data-page intro now name the actual backend
  (Demo vs Open-Meteo area model vs Ecowitt), driven by DATA_SOURCE.
  `useWeather` exposes `isMock` from the API's `meta.source`.
- `src/lib/sources/openmeteo.ts` (new, default source): live readings from
  Open-Meteo (no key), rain-today from today's hourly sum, rain-week from
  the archive API, 2-min server cache (free tier is 10k calls/day).
- History: Supabase `readings` append (migration 0006, SECURITY DEFINER
  upsert + 30-day trim, 10-min throttle) layered under forecast-API
  `past_days` (closes the ERA5 5-day gap, real from day one) layered under
  the ERA5 archive for older spans. DB rows win ties; mock never writes.
- Coordinates unified to the user's on-site fix (51.04972603740881,
  13.728412086540333) in `SITE_CONFIG`, footer, station page, outlook
  route (via SITE_CONFIG), sun tests.
- Verification: 198/198 tests, build + lint clean, live API checks
  (11.3C matched Open-Meteo direct, 24h + 168-point 7d history), CDP shots
  of hero + data page on real data.

## Session 21 — where the Ecowitt keys go (+ wiring the station source) — DONE

- Question: "where do I add this key to make it work?" Answer: `.env.local`
  at the repo root (gitignored; copy from `.env.example`), and — for the live
  site — Vercel → Project → Settings → Environment Variables (Production +
  Preview + Development) followed by a redeploy. Restart `pnpm dev` after any
  env edit; Next.js reads env only at boot.
- Blocker found and fixed: the Ecowitt keys had nothing to plug into. The live
  registry `src/lib/sources/index.ts` held a stub that threw "not
  implemented", while the fully written adapter `src/sources/ecowitt.ts` (the
  canonical location per docs/02 and docs/04) was imported by nobody. The
  registry now uses the real adapter, warns once at boot when
  `DATA_SOURCE=ecowitt` is set without credentials, and fails per request with
  the missing variable names (never the values).
- Unit bug fixed: requests pin metric units (temp_unitid=1, pressure_unitid=3,
  wind_speed_unitid=7, rainfall_unitid=12, solar_irradiance_unitid=16 —
  °C/hPa/km/h/mm/W·m⁻²), but the adapter converted again as if imperial, so
  11 °C would have displayed as −11.7 °C. Conversion is now driven by each
  field's `unit` string and only fires for imperial labels (both "F" and "℉").
- History reworked: `YYYY-MM-DD HH:MM:SS` bounds, group-name `call_back`
  (`outdoor,wind,rainfall,pressure,solar_and_uvi`), and a shape-agnostic
  walker for the documented `{ unit, list }` series (with a legacy
  `data.item` fallback). Timestamps in seconds are no longer read as
  milliseconds, so readings no longer land in 1970 / show as offline.
  Non-zero API `code` now throws with `msg` (no secrets in the message).
- `/api/weather` records readings for Ecowitt as well as Open-Meteo
  (`source !== 'mock'`), so station history accumulates in `readings`.
- New `src/sources/ecowitt.test.ts` (12 tests: metric passthrough, imperial
  conversion, unix seconds, API error code, both history shapes, credential
  guard, query building). Verification: tsc clean, lint clean, build clean,
  206 + 12 tests green. `src/lib/route.test.ts` (4 tests) hits the live
  Open-Meteo API and fails in any sandbox without outbound internet — it
  fails identically on the untouched baseline, so it is environmental, not a
  regression.
- Not verifiable here: no outbound access to api.ecowitt.net from this
  sandbox, so the adapter was never called against the real station. Once the
  keys are in, paste a real `real_time` response into
  `docs/sample-real-time.json` — per docs/02 that sample is the final
  authority for the normalizer.

## Session 22 — production switch + light-mode ambience — DONE

- Production was serving `source: "openmeteo"` while the preview served the
  station: `DATA_SOURCE` had never been set for the production target (it was
  an empty var), so the app fell back to the default. Set to `ecowitt` for
  production and redeployed `main`; production and preview now match.
- Light-mode hero fix: the Clouds shader paints *from* a base colour and with
  `color="auto"` it samples the tile surface, so on the light theme's white
  surface it rendered white-on-white (invisible), and while the theme was
  switching it kept the previous base for a frame — the "inverted" blob.
  `src/lib/effects/ambience.ts` now supplies an explicit per-theme base
  (dark = surface, light = cool mid-tone) plus a `key` on theme change so no
  stale frame survives, and a slightly higher ceiling on cloud opacity in
  light mode where the shader reads fainter.
- Per-tile ambience (`src/components/effects/TileAmbience.tsx`), each with its
  own motif rather than one repeated treatment: wind = fast drifting streaks
  that quicken with wind speed; humidity = slow, windless mist that thickens
  with humidity; pressure = a soft band that rides high when pressure rises
  and low when it falls; UV = warm corner glow scaled by index; solar =
  broader warm wash with a slow breathe; sun & moon = cool moonlight at night,
  warm daylight by day (driven by `isDaylight()` in `src/lib/sun.ts`).
  All are aria-hidden, sit behind tile content, honour the effects mode/tier
  gates and go static under `prefers-reduced-motion`.
- Verification: tsc + lint clean, 216 tests pass (10 new: ambience helpers,
  `isDaylight`). The same 4 `src/lib/route.test.ts` failures remain — they
  call the live Open-Meteo API and fail identically on the untouched
  baseline without outbound internet.

## Session 23 — share preview + embeddable live card — DONE

- Link previews are now generated from the live reading:
  `src/app/opengraph-image.tsx` (1200x630, `next/og`) shows temperature,
  feels-like, humidity, wind, the real backend label and the reading's age,
  using the brand rules (dark surface, amber accent, the three-colour banner
  strip, flat colour). Twitter/X re-exports it via `twitter-image.tsx`.
  `revalidate = 120`, and it degrades to a branded "Live data unavailable"
  card rather than a broken share link.
- `src/lib/embed/live.ts` centralises the server-side self-fetch
  (`fetchLivePreview`, `previewBaseUrl`, `shortAge`, `sourceLabel`), so
  neither preview nor embed ever calls Ecowitt directly.
- New `/embed` route + `EmbedCard`: a compact card that fills its iframe,
  refreshes with the dashboard (60 s on live data), follows the visitor's
  system theme unless `?theme=dark|light` is passed, and is `noindex`.
  Discovered via a new "Embed" button in `LearnHintStrip`.
- `metadataBase` added to the root metadata so the generated preview resolves
  to an absolute URL when shared.
- Verification: dev server with mock data — `/opengraph-image` returns
  image/png (46 KB), `/embed` and `/` return 200, `og:image` and
  `twitter:image` meta tags emitted. Satori requires explicit
  `display: flex` on any element with more than one child; two rows broke
  that on the first run and were fixed.

## Session 24 — honest AI outlook states + cancellable generation — DONE

- The outlook no longer goes quiet. `Outlook.tsx` used to `return null` on any
  endpoint failure and silently swapped the AI sentence for statistics, so a
  broken model was indistinguishable from a working one. Now every state is
  visible: "Generating your AI outlook…" with a **Stop** button while the model
  works, "AI outlook unavailable — showing the station trend." with **Retry**
  when it fails, "Generation stopped." with **Generate** after a cancel, and a
  "The forecast isn't loading right now." block (with Retry) when the whole
  endpoint 502s.
- Two-phase API (`src/app/api/outlook/route.ts`): `GET /api/outlook` returns
  the statistics immediately with `aiStatus: 'ready' | 'pending' |
  'unavailable'`, and `?ai=1` runs (or reuses) the model call. Statistics
  therefore stay CDN-cacheable (`s-maxage=900`) while the AI request is
  per-visitor and `no-store`.
- Cancellation is real, not cosmetic: `requestAi()` refcounts the waiters on
  one shared generation; the last one out aborts the upstream Groq call, and
  an `aborted` run is never cached, so the next visitor starts clean. Two
  waiters where one gives up does **not** cancel the other (verified against a
  local slow stand-in: one upstream request, completed normally).
  `cancellable()` merges the visitor's abort with the 15 s hard timeout
  because Node 18 has no `AbortSignal.any`.
- Caches are split (statistics vs. the model answer) so the shared Supabase
  row can still hand a finished sentence to other instances; `withAi()` merges
  at serve time and `normalizeStored()`/`outlookAiStatus()` keep payloads
  written before `aiStatus` existed readable and honest.
- `?fresh=1` (sent by Retry/Generate) retries past a stored *failure*; a stored
  success is never regenerated, so retrying is free but idempotent.
- Verification: 6 new component tests (`Outlook.test.tsx`) pin each state
  including the `fresh=1` retry, 3 new `outlookAiStatus` tests, tsc + lint
  clean, 225 tests pass; the same 4 `src/lib/route.test.ts` failures remain
  (they call live Open-Meteo, unreachable from the sandbox).

## Session 25 — statistics page (`/stats`) — DONE

- New **Statistics** page (`src/app/stats/page.tsx` +
  `src/components/stats/StatsClient.tsx`), linked from the header nav between
  Data and Learn. It reads the same `/api/history` window the Data page uses
  (24 h / 7 d switch) plus `/api/weather` for the live counters.
- New stats engine `src/lib/stats.ts` (pure, no network): extremes for every
  sensor with the timestamp that set them, record **coverage** (readings vs.
  readings the window should hold — an honest stand-in for uptime, since gaps
  are shown rather than hidden), a row per **Berlin calendar day**, rainfall
  integrated from the rain rate × sampling step, **hour-of-day means**, an
  eight-sector **wind rose**, and **dry / wet / frost runs** in hours.
  Everything is computed in metric and converted only at render, and a sensor
  the station never reported is left out instead of shown as 0.
- `scripts/project-stats.mjs` (`pnpm stats`) counts the project — code, tests,
  pages, routes, components, docs, migrations, dependencies, commits — and
  writes `src/lib/project-stats.json`, which the page shows under "This build".
  A shallow clone reports no commit count rather than a wrong one (the sandbox
  clone was unshallowed to get the real history: 72 commits since 2026-10-14).
  README gained the table and the regenerate command.
- Verification: 21 new tests for the engine (`src/lib/stats.test.ts`, including
  Berlin-day grouping across midnight, gaps breaking streaks, sector wrapping
  at 350° and the empty-window case) and 5 for the page
  (`src/components/stats/StatsClient.test.tsx` — jsdom needs a
  `ResizeObserver` stub for recharts). Engine also run against the real
  `/api/history?range=7d` payload: 336 readings, 30-min step, 100 % coverage,
  4.8–16.2 °C, prevailing W, 7.1 mm rain over 8 calendar days.

## Session 26 — per-tile background effects, scoped toggle, droplets — DONE

- **Every instrument tile now has a Canvas UI background.** Sun & moon, solar
  radiation, UV index and relative pressure already had a CSS layer, but it was
  painted at 2.5–12 % opacity and read as nothing at all. Each keeps that motif
  and gains its own cloud field on top, with its own character: UV is thin,
  high and quick; solar is broad and slow; sun & moon is warm by day and a
  cooler, stiller veil at night; pressure is the widest and stillest of the
  set, and its trend picks the tint as well as the pace (rising warms and
  settles, falling cools and moves). New pure helpers in
  `src/lib/effects/ambience.ts` (`uvHaze`, `solarHaze`, `celestialHaze`,
  `pressureHaze`) plus `TILE_CLOUD_BASE`, which carries the same caveat as
  `CLOUD_BASE`: the shader lifts *from* the base on dark surfaces and darkens
  *from* it on light ones, so each theme and tint needs its own mid-tone.
- **The canvas is the top rung of a ladder, not the whole thing.** A tile's
  ambience is CSS always, CSS-only on the lite tier, and CSS + one cloud field
  on the full tier — so a Chromebook still gets the motif, just not the motion.
  `TileClouds` pins `quality`, `shadow` and `refraction` so a tile cannot ask
  for more than a small decorative layer needs.
- **The rain tile now runs the supplied Canvas UI `Droplets` properly.** It was
  already the right component but driven as a hint: `refraction` 0.04, `blur`
  0, `vignette` 0, a transparent child. Droplets refracts whatever is painted
  inside it, so over a transparent child the drops have nothing to bend and
  are all but invisible. It now gets `.rain-refraction-surface` — a wash close
  enough to the card colour to read as part of the tile — and runs at the
  strength the component is designed for. Rates come from `dropletParams`, a
  curve rather than a straight scale, so a drizzle is visible and a cloudburst
  stops short of covering the numbers. On browsers without html-in-canvas the
  child renders on its own and still reads as a soft sheen.
- **The effects toggle is now scoped to background effects.** It used to gate
  the unit-switch ASCII sweep as well, which is a transition rather than a
  background, so turning effects off quietly changed behaviour that had
  nothing to do with ambience. The sweep now answers to what the *device* can
  do (`tier`) and not to the visitor's on/off choice. `TopProgressBar` no
  longer lists `mode` as a dependency, which was retriggering the bar every
  time the toggle was used. The settings copy says what the switch covers.
- **Droplets can be forced from the developer console.** `src/lib/effects/dev-overrides.ts`
  is a small `useSyncExternalStore` store — deliberately not React context,
  because the console and the tiles sit in different subtrees, and values do
  not survive a reload so a developer cannot forget they forced a downpour.
  The console gained a **Droplets** group (Off / Drizzle 1 mm/h / Rain 6 mm/h /
  Downpour 24 mm/h) and a footer line reminding you of the shortcut. Writes
  are no-ops in production, where the console is not rendered at all.
- **Shortcut:** press <kbd>d</kbd> three times within 800 ms to open the
  developer console, <kbd>Esc</kbd> to close. It is dev-only (returns `null`
  in production) and is mounted for every path except `/display`.
- Verification: tsc clean, `pnpm lint` clean, `pnpm build` clean. 286 tests
  pass (30 new: 13 for the haze/droplet helpers, 3 for the override store, 15
  pinning the ambience ladder across full / lite / off, 6 for
  `RainWeatherEffect` including the console override on a stale, dry tile).
  The same 4 `src/lib/route.test.ts` failures remain — they call live
  Open-Meteo, unreachable from the sandbox. **Not verifiable here:** no browser
  is installable in the sandbox, so the shader output itself (as opposed to the
  mounting logic) has not been seen; check the tiles on a real Chromium device.

## Session 27 — rain tile ambience + club photos above the fold — DONE

- **The rain tile was the one bare card.** Every other tile gained a Canvas UI
  background in session 26, but precipitation was still gated on
  `rateMmH > 0` — so on a dry day, which is most days, it showed nothing at
  all. It now has the same ladder as the rest: a `.ambience-wet` CSS wash
  always, plus a cool cloud field on the full tier, with the Canvas UI
  droplets landing on top when it actually rains. New `wetness()`,
  `wetHaze()` and `wetWash()` helpers in `src/lib/effects/ambience.ts`.
- **Wetness takes either signal.** `max(todayMm / 15, rateMmH / 12)` — a dry
  morning after a wet night still reads as damp, and a sudden downpour
  registers before it has filled the gauge. A bone-dry tile still gets a haze
  (opacity 0.05), because the point is that it stops being the empty card.
- **The haze is rendered *after* the droplets in the DOM.** Droplets refracts
  whatever is painted inside it, which means its layer paints an opaque
  surface of its own; the haze has to sit above that surface rather than be
  buried under it. Easy to undo by accident — the ordering is commented in
  `RainGauge.tsx`.
- **Club photos moved above "Who we are"** on `/about`. They used to sit at
  the very bottom, after the timeline and the "what comes next" table. The
  gallery is unchanged otherwise: it is a carousel, and it currently holds
  two files (`public/club/club-01.jpg`, `club-03.jpg` — note `club-02` is
  absent). More photos need no layout work: drop the file in `public/club/`
  and add one line to `CLUB_PHOTOS` in `src/lib/content/club.ts`.
- Verification: tsc, `pnpm lint` and `pnpm build` clean. 294 tests pass (8
  new: 3 for `wetness`/`wetHaze`/`wetWash`, 5 pinning the rain ambience
  including the dry-day regression). The 4 known `src/lib/route.test.ts`
  failures remain. Confirmed over HTTP on the dev server: `/about` renders
  the Photos section before "Who we are", both club images return 200, and
  the compiled CSS carries the `.ambience-wet` rule. Still not verifiable
  here: the shader output itself, since no browser is installable.

## Session 28 — the developer console could not be opened — DONE

- **It was never a bug in the shortcut.** `d` three times within 800 ms is
  correct and tested. The console was gated on
  `process.env.NODE_ENV === 'production'` returning `null`, so it did not
  render at all on any production build — the live site *and* every Vercel
  preview deployment. Anyone testing on a preview URL saw a dead shortcut.
- **It now runs on Vercel preview deployments too.** `isDevConsoleEnabled()`
  accepts `NODE_ENV !== 'production'` **or**
  `NEXT_PUBLIC_VERCEL_ENV === 'preview'`. There is no real data to protect on
  a preview, and that is where the effects get checked. Production stays
  locked no matter what the URL says — the console can replace the station's
  readings with mock scenarios and send real signup emails, so it must not
  reach the live site.
- **`?dev=1` (or `#dev`) opens it directly.** A `keydown` listener only fires
  when the page has focus, which it does not have inside a preview iframe or
  after clicking the surrounding page. The URL flag sidesteps focus entirely
  and is the reliable way in. The panel's own footer now says both.
- Verification: 12 new tests in `ScenarioDebugPanel.test.tsx` — the
  triple-press, two presses not being enough, presses outside the 800 ms
  window, Escape closing it, `d` typed into an input being ignored, the
  sessionStorage flag surviving a remount, the `?dev=1` and `#dev` forms, a
  plain URL staying shut, and the three environment cases including
  production-stays-locked. tsc, `pnpm lint` and `pnpm build` clean; 306 tests
  pass. The 4 known `src/lib/route.test.ts` failures remain.

## Session 29 — stats wind card layout, wind background, effects always on, console in production — DONE

- **The wind card on `/stats` was unreadable.** Its tile group reused
  `TileGrid`, which is `grid-cols-2 lg:grid-cols-4` — four across inside a
  320px column, so each tile was about 90px wide. That is what clipped
  "PREVAILING" mid-word and parked units ("km/h", "%") on their own line.
  Fixed by: a 2×2 grid for the wind tiles specifically, a wider column
  (`minmax(0, min(46%, 420px))`), `min-width: 0` on every tile, letter-spacing
  cut from 0.08em to 0.04em with wrapping allowed, and the value font dropped
  to `clamp(1rem, 1.6vw, 1.5rem)`.
- **Number and unit are now welded together.** `StatTile` takes a `unit` prop
  rendered as a 0.6em muted span, separated from the figure by a non-breaking
  space, so a narrow tile can no longer split them across lines.
- **Prevailing direction shows the abbreviation.** `windDirectionLabel()` (already
  in `beaufort.ts`) gives "ENE" as the large value, with "East-northeast · 77°"
  demoted to the secondary line. No data logic touched — this is presentation
  only, and `windSummary` is unchanged.
- **The wind card had drifted to being invisible.** Two causes: it was gated on
  `windSpeedKmh > 0`, so a calm day left it bare, and its `cover` was
  hardcoded at 0.012 — roughly a tenth of what the other tiles use, which is
  why it looked like it had no background once the rest gained theirs. The
  gate is gone and `cover` now comes from `windStreak()` alongside the other
  knobs, at comparable strength.
- **Effects are on for every machine.** `readEffectTier()` returns `'full'`
  unconditionally instead of probing cores, memory, Save-Data and
  `prefers-reduced-motion`. What still switches them off is the run-time
  `FpsGuard`, which reacts to the page struggling rather than to a guess about
  the hardware. `detectEffectTier` is kept as a pure function for diagnostics
  and is still fully tested. **This does override `prefers-reduced-motion`, an
  accessibility setting — deliberately, and worth revisiting if anyone
  complains.**
- **The developer console now ships in production.** It was gated off there,
  which is why it "did not work" after merging; there was no other kill switch
  in the codebase. Opening it still takes deliberate action (`?dev=1`, or `d`
  three times), and nothing in it affects anyone else: scenarios are a
  per-browser cookie, the mascot is localStorage, effect overrides are
  in-memory. The one exception is the test-email tool, which can send mail to
  an address typed into a public page — that stays behind
  `NEXT_PUBLIC_DEV_EMAILS=1`, and the panel says so when it is off.
- Verification: tsc, `pnpm lint` and `pnpm build` clean; 312 tests pass, 6 new
  (3 for the stats wind card — two-across layout, abbreviated direction,
  unit welded to the value; 2 for the wind haze; 1 for the console shipping
  in production) plus reworked console/email tests. The 4 known
  `src/lib/route.test.ts` failures remain. Confirmed the console and the new
  tile CSS are both present in the **production** bundle.
- **Not verifiable here:** no browser is installable, so the acceptance
  criterion `scrollWidth <= clientWidth` at 1440 / 1100 / 800px has not been
  measured. jsdom does no layout. Check those three widths in a real browser.

## Session 30 — the tile backgrounds were not moving — DONE

- **They were moving, just 5–20× slower than the wind tile.** The Clouds
  shader advances `time += delta * speed * 0.03` per frame, so `speed` is the
  whole story. Wind ran at 0.16–0.62; every other tile was set between 0.015
  and 0.14, which beside it reads as a still image. The fix is not one shared
  value but a shared *floor*: every preset now sits in wind's range while
  keeping its personality — UV quickest, solar next, pressure stillest, night
  stiller than day, and humidity the only one left windless (`wind: 0`, which
  is what makes it read as still mist rather than as slow wind).
- **Speeds now:** wind 0.16–0.62 · UV 0.18–0.52 · solar 0.14–0.40 · day 0.20 /
  night 0.11 · pressure 0.12–0.24 · rain 0.16–0.48 · humidity 0.12–0.28.
- **Humidity's speed was hardcoded** at the call site rather than coming from
  `mistParams` like the rest of its knobs; it now returns with them.
- **The CSS motifs pan as well,** so a tile still drifts when the canvas cannot
  start (no WebGL, a refused context). New `ambience-pan` keyframe on the UV,
  celestial and rain washes; solar keeps its breathe and pans too. Pressure
  keeps its own band drift, since that one animates `transform` already.
- **The developer console reports what is actually running:** a live
  "Canvas layers: n/m" count (how many ambience hosts have a live canvas in
  them) and whether `prefers-reduced-motion` is on. Those are the two things
  that would leave a background present but frozen, and both were invisible
  before. `prefersReducedMotion()` is guarded — a missing `matchMedia` must not
  take the panel down.
- Verification: tsc, `pnpm lint` and `pnpm build` clean; 314 tests pass, 2 new
  (one asserting every preset clears 0.6× the wind floor so this cannot
  silently regress, one asserting the personalities survive the change). The 4
  known `src/lib/route.test.ts` failures remain. `ambience-pan` confirmed in
  the production CSS.
- **Not verifiable here:** no browser is installable, so the motion itself has
  not been watched. If a tile still looks frozen after this, open the console
  (`?dev=1`) and read the "Canvas layers" line — 0/n means the canvas is not
  starting at all and the cause is upstream of these numbers.
