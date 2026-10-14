# 09: Detailed Stage Prompts (long-form engineering pipeline)

How to use: for each stage, (1) check preconditions, (2) start a NEW chat in the recommended tool, (3) attach what is listed, (4) paste the prompt, (5) verify the acceptance criteria yourself, (6) commit and update `docs/PROGRESS.md`. Prompts reference files in `/docs`; keep them in the repo. Replace anything in <angle brackets>.

Global preamble: begin EVERY new chat with this one line, then the stage prompt:
```
First read AGENTS.md, docs/PROGRESS.md and every file in /docs that the task mentions. Work only on the task below. Do not touch unrelated files. When finished, run pnpm build and pnpm lint, then give me a summary of files changed, decisions made, and anything you were unsure about.
```

---
## Stage 0: Context load and plan check
Tool: Freebuff Desktop, reasoning model (GLM class). Attach: nothing. Preconditions: repo has /docs and /public/brand.
```
ROLE: You are a senior full-stack engineer and product designer joining a small student team.
PROJECT: A public live weather website for Dresden International School (DIS). The data comes from a Sainlogic WS3500 weather station that uploads to the Ecowitt cloud. The users are students (ages ~6 to 18), teachers and parents. It must be extremely easy to understand and double as a teaching tool. The aesthetic is premium, black and white, with a restrained DIS accent colour, and must not look AI-generated.

TASK: Do NOT write code. Read every file in /docs (00 to 09, including 03a brand kit, 03b Canvas UI notes, 07 hardware). Then produce a written report with these sections:
1. Goal in your own words (max 5 sentences).
2. Pages and routes you will build, with one line on each.
3. The architecture in 8 bullets, including how mock data and real data are swapped.
4. A list of every sensor the WS3500 has and every tile that follows from it. Explicitly list tiles you will NOT build and why.
5. The 10 riskiest assumptions in the plan, ranked, each with a mitigation.
6. Any contradiction or ambiguity you found between the docs. Quote the file names.
7. Questions you need answered before coding. Only ask questions that really block you.
8. A proposed definition of done for stages 1 to 10 in one line each.
Keep the whole report under 700 words. Do not invent Ecowitt API field names; mark anything unknown as UNKNOWN until a real sample JSON exists.
```
Acceptance: the report mentions stale/offline states, tipping-bucket rain (not piezo), indoor data hidden, Europe/Berlin timezone. If not, tell it which is missing and re-ask. Commit: nothing yet (save the report as `docs/PLAN_CHECK.md`).

---
## Stage 1: Scaffold and tooling
Tool: Freebuff Desktop, fast model. Attach: nothing.
```
TASK: Scaffold the project and tooling per docs/04.

REQUIREMENTS
1. Create a Next.js project (App Router, TypeScript strict, src/ directory, Tailwind CSS, ESLint) in the current directory using pnpm. Do not create a nested folder.
2. Initialise shadcn/ui (neutral base color, CSS variables enabled). Add components: card, tabs, tooltip, dialog, sheet, toggle, select, skeleton, badge, separator, table, button.
3. Install: lucide-react, swr, recharts, next-themes, clsx, tailwind-merge, date-fns, date-fns-tz, zod. Dev: vitest, @testing-library/react, jsdom, prettier, prettier-plugin-tailwindcss.
4. Create this folder structure with typed placeholder files that compile (no TODO crashes):
   src/app/{page.tsx,learn/page.tsx,data/page.tsx,station/page.tsx,display/page.tsx,api/weather/route.ts,api/history/route.ts}
   src/components/{weather,learn,effects}/
   src/lib/{types.ts,units.ts,beaufort.ts,summary.ts,moon.ts,time.ts}
   src/lib/sources/{index.ts,mock.ts,ecowitt.ts}
   src/lib/content/{concepts.ts,activities.ts}
   src/hooks/useWeather.ts
5. Add scripts: dev, build, lint, test, typecheck, format.
6. Create .env.example with ECOWITT_APPLICATION_KEY=, ECOWITT_API_KEY=, ECOWITT_MAC=, DATA_SOURCE=mock, NEXT_PUBLIC_SITE_URL=. Ensure .gitignore covers .env*.local, .next, node_modules, coverage.
7. Add a minimal vitest config and one trivial passing test so the test pipeline is proven.
8. Set the default time zone constant to "Europe/Berlin" in src/lib/time.ts and export a helper for formatting a Date in that zone.
9. Do not install any other UI library or font package yet.

DO NOT: add placeholder marketing copy, example pages from the template, or default Next.js boilerplate content. Replace app/page.tsx with a plain "DIS Weather Station" heading.
VERIFY: pnpm install, pnpm typecheck, pnpm lint, pnpm test, pnpm build all pass. Report the output of each.
```
Acceptance: all five commands succeed; no Next.js boilerplate remains. Commit: `chore: scaffold project`.

---
## Stage 2: Brand, tokens and app shell
Tool: Google Antigravity, strongest model (spend quota here). Attach: DIS logos (horizontal, 30 Years, dragon badge), 3-5 dresden-is.de screenshots, 2-3 canvasui.dev screenshots.
```
ROLE: Senior product designer who also writes production React.
CONTEXT: Read docs/03_Design_System_and_Branding.md and docs/03a_DIS_Brand_Kit.md fully; they override anything you assume. The attached images show the DIS logos, the school website and the visual reference (canvasui.dev). Do not copy the school website layout; only take brand cues. The look I want: premium, calm, scientific instrument, black and white, big typography, thin borders, tactile detail. It must not look AI-generated.

BUILD
1. Design tokens in src/app/globals.css as CSS variables exactly per docs/03 section 3 and 03a: dark theme default, light theme, --accent = DIS Amber in dark and DIS Blue in light. Wire them into Tailwind's theme and the shadcn variables so shadcn components inherit them.
2. Fonts: Geist Sans and Geist Mono via next/font. Define utility classes: .label (11-12px uppercase tracking .08em muted), .numeric (tabular-nums, mono), .display (hero sizes with clamp()).
3. next-themes provider: system default, manual toggle (sun/moon icon button, accessible name, 44px target). Avoid flash of wrong theme.
4. Header: horizontal DIS logo from /public/brand (28-32px tall; on dark theme place it on a small white rounded plate because the JPG has a white background; leave a clear TODO comment to swap for a transparent SVG), nav links Live / Data / Learn / Station, active state indicator, mobile navigation using shadcn Sheet, theme toggle, unit toggle (Metric / Imperial, state in a React context persisted in localStorage; no behaviour yet beyond storing).
5. Footer: station line ("Sainlogic WS3500, Dresden"), "Built by the DIS Weather Club", the 30 Years logo as a small mark, links to Privacy and Imprint (placeholder pages), and a 4px blue/amber/green strip above the footer echoing the school banner.
6. Placeholder pages use real layout: page title in .display, a one-sentence description, no lorem ipsum.
7. Add a /styleguide route (dev-only via env flag) that displays: colour tokens in both themes, type scale, buttons, badges, a tile/card, focus ring, and the contrast ratios of text on background as computed numbers.

RULES: obey every rule in docs/03 section 6. No gradients except none at all for now. No emoji. No glassmorphism. Border 1px, radius 12px, no shadows. Accessible focus rings in var(--accent). Respect prefers-reduced-motion.

SELF-REVIEW BEFORE FINISHING: Take screenshots of /styleguide and / at 390px and 1440px, in both themes. List every design rule you bent or are unsure about. Check text contrast ratios and report the numbers.
```
Acceptance: logo visible in both themes, accent swaps, nothing looks like a template. Commit: `feat: design tokens and shell`.

---
## Stage 3: Types, units, mock simulator and API routes
Tool: Freebuff, reasoning model (GLM class). Attach: nothing (docs are in repo).
```
TASK: Implement the data layer with mock data per docs/02 and docs/04. Everything must be tested.

1. src/lib/types.ts: WeatherReading, HistoryPoint, WeatherApiResponse = { reading, stale: boolean, offline: boolean, fetchedAt: string, measuredAt: string } exactly as docs/02 describes. Use zod schemas and infer the TS types from them.
2. src/lib/units.ts: pure functions fToC, cToF, mphToKmh, kmhToMph, kmhToMs, inToMm, mmToIn, inHgToHpa, hPaToInHg, plus format helpers formatTemp(valueC, system), formatSpeed, formatRain, formatPressure that honour Metric/Imperial and return { value: string, unit: string }. Round sensibly (temp 1 decimal, wind 0 decimals, rain 1 decimal, pressure 1 decimal).
3. src/lib/beaufort.ts: beaufort(kmh) returns { scale: 0-12, name: "Calm" ... "Hurricane", kidName: simple description }.
4. src/lib/moon.ts: moon phase and illumination for a given Date using a standard algorithm (no network).
5. src/lib/sources/mock.ts: implements WeatherSource (getCurrent, getHistory("24h"|"7d")). Simulation per docs/02 section 6: seeded deterministic RNG (mulberry32), seasonally adjustable temperature sine, inverse humidity, wind with gusts and drifting direction (circular maths, never jump across 359-0 wrongly), rain events with realistic durations and accumulation resetting at Europe/Berlin midnight, pressure drift, UV and solar bell curve that is zero at night, derived dew point (Magnus formula) and feels-like (wind chill below 10C and wind > 4.8 km/h, heat index above 26C, else the air temp). Generated history must be consistent with current values (the last history point equals the current reading within tolerance).
6. Scenario overrides via the argument `scenario`: "storm" (strong gusty wind, heavy rain, falling pressure), "calm", "rain", "offline" (throws or returns an old timestamp).
7. src/lib/sources/index.ts: getSource() chooses by process.env.DATA_SOURCE ("mock" default, "ecowitt" returns the ecowitt source which still throws "not implemented").
8. src/app/api/weather/route.ts and api/history/route.ts: GET handlers, validate query params with zod (range, scenario in non-production only), call the source, add stale/offline logic (stale if measuredAt older than 10 minutes, offline older than 30), set Cache-Control s-maxage=60 stale-while-revalidate=30 in real mode and no-store in mock mode, never leak internal error messages (return a generic message and status 502/503), log errors server-side without secrets.
9. Tests (vitest): units round-trips and known values (32F = 0C, 1013.25 hPa = 29.92 inHg), beaufort boundaries, moon phase for 3 known dates, mock determinism (same seed gives same output), wind direction wrap-around, rain total never decreases within a day and resets at Berlin midnight, humidity within 0-100, dew point never above air temp, route returns valid schema, stale/offline thresholds.

DO NOT build any UI. DO NOT guess Ecowitt field names.
VERIFY: pnpm test passes with at least 25 assertions; curl localhost:3000/api/weather and /api/history?range=24h return valid JSON; show me both outputs trimmed.
```
Acceptance: tests green; curl output plausible. Commit: `feat: types, units and mock source`.

---
## Stage 4: Data hook and live states
Tool: Freebuff, fast model.
```
TASK: Build the client data layer and live-status components.
1. src/hooks/useWeather.ts using SWR: fetch /api/weather, refreshInterval 5000 when NEXT_PUBLIC_DATA_MODE === "mock" else 60000, keepPreviousData, errorRetryInterval with backoff, revalidate on focus. Return { reading, history, isLoading, error, isStale, isOffline, measuredAt, secondsSinceMeasured } where secondsSinceMeasured ticks every second without refetching (separate interval, cleaned up).
2. A useHistory(range) hook with its own SWR key, refresh every 5 minutes.
3. Components in src/components/weather: LiveDot (states Live = green dot with a slow pulse, Delayed = amber, Offline = grey; text label always visible; pulse disabled for reduced motion), StaleBanner (appears for stale and offline, calm tone: "Data last measured 14 minutes ago. The station may be reconnecting."), RelativeTime (formats "measured 40 s ago" in English, updates live).
4. A UnitProvider consumer: hooks to read the chosen unit system everywhere.
5. Dev-only debug panel (visible only if process.env.NODE_ENV !== "production"), a small floating button that opens a popover to choose mock scenario (storm, calm, rain, offline) by setting a cookie or query param read by the API route.
6. Tests for secondsSinceMeasured and stale/offline derived flags.
RULES: no layout shift when the banner appears (reserve space or animate height); everything keyboard accessible; no console warnings.
VERIFY: show a screenshot or description of each of the three live states, and run the tests.
```
Commit: `feat: weather hook and live status`.

---
## Stage 5: The dashboard (home page)
Tool: Freebuff (MiMo for image input) builds; then Antigravity reviews with screenshots. Attach: 2-3 canvasui.dev screenshots for mood; Ecowitt app dashboard screenshot.
```
TASK: Build the home page "/" as the product's core experience. Read docs/03 (all), 03a, 04 section 6 and 07 first.

LAYOUT (desktop 12-col grid, max width 1200px, gap 24px; mobile single column, gap 16px)
- Hero (spans full width on mobile, 2 columns x 2 rows in the bento on desktop): the big temperature (.display, clamp 96-200px, light weight, tabular numbers), "Feels like X", min/max today as a thin range bar, the generated summary sentence (src/lib/summary.ts) and jacket advice line, LiveDot + RelativeTime.
- Wind tile (1x2): WindCompass SVG with cardinal ticks and 16 minor ticks, a needle pointing in the direction the wind blows FROM, spring animation (use CSS or a tiny rAF spring, no heavy library), a faint ghost needle for gust direction smoothing, centre readout of speed, gust, compass word, Beaufort word. Screen-reader text: "Wind from the south-west, 14 kilometres per hour, gusting 24."
- Rain tile: rate, last hour, today, this week, and a RainGauge (vertical fill, scale adjusts nicely: 0-10 mm base, expands when exceeded). Message when dry: "No rain today."
- Humidity tile with dew point and a plain-language comfort word (dry, comfortable, humid).
- Pressure tile: relative pressure in hPa, 3-hour trend arrow with words (rising, steady, falling), mini sparkline.
- UV index tile: number, band name (Low...Extreme), colour-independent indicator (a segmented bar with labels). Light tile: W/m2 or lux depending on available field; hide if absent.
- Moon phase tile (computed) and sunrise/sunset if lat/long constants are provided in src/lib/site.ts (leave TODO constants, hide the tile if not set).
- Each tile has a small "What is this?" icon button that links to /learn#<concept-id>, with a tooltip.
- Sparkline under the main tiles (24h) using inline SVG; accent colour for the line, muted for area-less strokes.
- A "New to weather data?" strip linking to /learn and /display.

IMPLEMENTATION RULES
- Tiles are reusable via a Metric component (label, value, unit, secondary, children). Fixed minimum heights so numbers changing never shift layout.
- Numbers use tabular-nums. Value changes crossfade 300ms. All animation honours prefers-reduced-motion.
- Skeleton states match final geometry. Offline state greys values and shows the StaleBanner.
- Hide any tile whose field is undefined; never display "NaN" or "undefined" or "--" without explanation.
- Copy must be specific and human (see docs/03 section 6). Example good copy: "Wind from the south-west, gusting 24 km/h." Example bad copy: "Experience real-time insights."
- Unit toggle must immediately convert every tile.
- Never display indoor values.
- Obey all anti AI-look rules. Remove any decoration that does not carry information.

TESTS: unit tests for summary.ts across at least 12 combinations (cold/dry/calm, hot/humid/gusty, storm with falling pressure, offline, etc.) and for the compass word helper.

SELF-REVIEW: take screenshots at 360, 390, 768, 1024, 1440 px in both themes under scenarios calm, storm, rain, offline. List defects you see and fix them before reporting.
```
Then, in Antigravity with the screenshots: paste the "Fix the AI look" prompt from docs/05. Commit: `feat: dashboard`.

---
## Stage 6: Data and history page
Tool: Freebuff or OpenCode, fast model.
```
TASK: Build /data per docs/04.
1. Tabs: Temperature, Wind, Rain, Pressure, Humidity, Sun. Range switch 24 h / 7 d (URL param ?range= so it is shareable, ?metric= for the tab).
2. Charts with Recharts: 1.5px lines, no fill gradients, minimal horizontal grid at 6% opacity, no vertical grid, axis in muted label style, time axis in Europe/Berlin (HH:mm for 24 h, weekday + date for 7 d). Temperature: line + dew point as a dashed secondary line. Wind: speed line + gust as thin dots/line. Rain: bars (per hour) + cumulative line. Pressure: line with auto domain padded so tiny changes are visible. Humidity: line. Sun: UV and solar radiation (two small charts).
3. Custom tooltip matching the design system: timestamp, value with unit, and secondary values.
4. Stat chips above the chart: min (with time), max (with time), average, change over range.
5. "View as table" toggle: accessible table of the same data, sticky header, scrollable.
6. "Download CSV": client-side generation, columns timestamp_iso, temperature_c, humidity_pct, pressure_hpa, wind_kmh, gust_kmh, wind_dir_deg, rain_rate_mm_h, rain_today_mm, uv, solar_w_m2 (leave empty cells for missing fields); file name dis-weather_<range>_<date>.csv; metric units always in the CSV, with a header comment line explaining that.
7. Loading skeletons, empty state ("No data for this period yet"), and error state with retry.
8. Accent only on the active series; other series in neutral greys. Respect unit toggle for displayed values.
9. Tests: CSV builder (escaping, ordering, empty cells) and min/max/avg helper.
VERIFY with screenshots at 390 and 1440 px for each tab.
```
Commit: `feat: data page`.

---
## Stage 7: Learn section and education content
Tool: Freebuff fast model (content is fine on any model); optionally Vibe to proofread. Attach: nothing.
```
TASK: Build /learn from docs/06 as a real educational resource.
1. Typed content in src/lib/content/concepts.ts: for each of temperature, feels-like, humidity, dew point, wind speed, gust, wind direction, rain, pressure, UV index, light/solar, measurement uncertainty. Fields: id, title, icon (lucide name), kids {summary, example}, students {summary, howMeasured, formula?, unit, typicalDresden: {winter, summer}}, tryThis (question), relatedMetricKey, accuracyNote (WS3500 figures from docs/07 where relevant). Keep kids text at about reading age 8: sentences under 15 words, no jargon.
2. src/lib/content/activities.ts: the 8 activities from docs/06, each with age, minutes, materials, steps (numbered), expected result, extension, curriculum link (MYP/DP subject).
3. ExplainerCard component and an index page with anchor ids matching the concept ids (the dashboard links to /learn#id). Kids/Students toggle persisted in localStorage; kids mode increases base type size and shows the simpler text.
4. Live context: each card can show the current live value of its measurement ("Right now: 11.4 C"), updated via useWeather.
5. Activities section: filter by age band and subject, printable sheet view (print stylesheet: black on white, hide nav, one activity per page, page-break rules).
6. A "Measurement uncertainty" card with a small interactive demo: slider for the true temperature showing the +/-1 C band; and a sentence explaining why a school station may differ from the official DWD reading.
7. Add "What is this?" tooltips on dashboard tiles that deep link here.
8. A "For teachers" panel: how to show the class (/display), how to get data (/data CSV), and a QR code placeholder component (generate QR client-side with a small dependency or an inline SVG library if you add one; justify the dependency).
RULES: accurate science, no invented Dresden statistics (use rounded, clearly labelled typical ranges only, or omit); neutral, warm tone; WCAG AA; headings in order.
TESTS: content schema validation with zod (every concept has both audiences, every activity has steps).
```
Commit: `feat: learn section`.

---
## Stage 8: Motion and Canvas UI
Tool: Antigravity or Freebuff reasoning model. Attach: canvasui.dev screenshots of the 2-3 favourite components.
```
TASK: Add restrained, weather-driven motion. Read docs/03 section 8 and docs/03b.

1. Visit/read the Canvas UI documentation and repository (github.com/DavidHDev/canvas-ui). Report in 6 bullets: install method, browser support, licence, performance notes, SSR concerns, which components suit this project.
2. Install at most TWO components (prefer overlay effects that work in every browser: Droplets for rain, Clouds for humidity). If a component needs the experimental html-in-canvas flag, do not use it unless a robust static fallback exists.
3. Create src/components/effects/WeatherFx.tsx: a client component, dynamically imported with ssr:false, lazy-mounted when the hero is in view (IntersectionObserver), unmounted when off-screen.
   - Droplets mounts only when rainRateMmH > 0, intensity scales with rate.
   - Clouds opacity maps from humidity (0.0 at <=50% to 0.35 at 100%); monochrome, tinted at most 20% with var(--accent).
4. Fallbacks: if WebGL/WebGPU unsupported, if prefers-reduced-motion, if the device reports low memory (navigator.deviceMemory < 4) or the user turned effects off, render nothing and keep the layout identical.
5. A visible user control in the footer: "Visual effects: On / Off" persisted in localStorage.
6. Other motion: number crossfades (300ms), tile entrance stagger 40ms (max 400ms total), compass spring 600ms, nothing else. No parallax, no cursor trails.
7. Measure: report the main-thread time and FPS in Chrome DevTools performance panel on mobile throttling with effects on and off. If the effect costs more than 8 ms per frame on average, remove or simplify it.
8. Confirm text legibility and contrast with the effect running; the effect must never sit above text.
VERIFY: toggling effects off leaves a fully good-looking page. Add a Playwright or manual checklist of the browsers tested.
```
Commit: `feat: weather-driven effects`.

---
## Stage 9a: Station and Display pages
Tool: Freebuff fast model. Attach: station photos if available.
```
TASK: Build /station and /display per docs/04 and docs/07.
/station: hero photo slot (graceful placeholder if no photo), a facts table (model Sainlogic WS3500, mounted height <TBD constant>, location text, sensors list, accuracy figures from docs/07, data source Ecowitt cloud, update frequency <TBD>), a static map placeholder component (no third-party tracking tiles; use a plain image or a link to an OpenStreetMap page), "How we measure" section (short, links to /learn), a maintenance log fed by a typed array in src/lib/site.ts (date, action), siting caveats paragraph, the club credits block with names from a typed array, the dragon badge. Put every TBD in src/lib/site.ts so I can fill them in once.
/display: fullscreen kiosk mode. Hide header/footer/nav. Large type (vw-based), auto theme from system, slides cycling every 12 s between Temperature, Wind, Rain, and Pressure & UV with a thin progress bar; pauses on hover or key press; Fullscreen button; wake lock if supported; every 10 minutes shift content by up to 8px to reduce burn-in; shows school logo small and "measured X ago". Works with arrow keys; respects reduced motion by disabling the progress animation and cross-fades.
TESTS: slide cycling logic with fake timers.
```
Commit: `feat: station and display pages`.

---
## Stage 9b: Real Ecowitt adapter
Tool: Reasoning model (GLM class or Antigravity). Preconditions: you created the Application Key, API Key and MAC; they are in .env.local; you saved a redacted real response to docs/sample-real-time.json (get it via curl on your own machine, never paste the keys into chat). Attach: the sample JSON file.
```
TASK: Implement src/lib/sources/ecowitt.ts. Read docs/02 and docs/07 and docs/sample-real-time.json first. The sample JSON is the ONLY authority on field names; never guess. If a field you need is not in the sample, say so and make it optional.

1. Request builder: GET https://api.ecowitt.net/api/v3/device/real_time with application_key, api_key, mac, call_back=all, and unit IDs for metric. Before relying on unit IDs, read the official Ecowitt API documentation (api.ecowitt.net / ecowitt.com docs) and report which IDs you used and where you found them. Implement conversion from the response's reported unit strings as a safety net: if the unit string says F/mph/in/inHg, convert; if it already says C/km/h/mm/hPa, pass through. Never assume.
2. Response validation with zod: top-level code must equal 0, data present. Values arrive as strings; parse to numbers; reject NaN. Missing groups produce undefined fields, not errors.
3. Normalizer mapping to WeatherReading: temperatureC, feelsLikeC, dewPointC, humidityPct, pressureHpa (use RELATIVE, not absolute), windSpeedKmh, windGustKmh, windDirectionDeg, rainRateMmH, rainTodayMm, rainHourMm, rainWeekMm, uvIndex, solarWm2, timestamp from the API's reported time (unix seconds to ISO) with fetch time fallback. Never include indoor values in the output type.
4. History: implement getHistory using /api/v3/device/history. Read the official docs for parameters (start_date, end_date format, cycle_type, call_back list) and per-cycle range limits. Choose cycle types: 24h -> 5min (or the finest allowed), 7d -> 30min or 4hour (justify). If a range exceeds limits, split into several requests and merge, deduplicate and sort by time.
5. Robustness: 8 s timeout via AbortController, one retry with jitter for network errors and 5xx, no retry on auth errors, an in-memory last-good cache so failures return stale data flagged accordingly, never throw raw upstream text, redact application_key/api_key/mac from every log line.
6. Rate-friendliness: in-memory cache TTL 60 s for current and 5 min for history, request coalescing (concurrent callers share one promise).
7. Tests using docs/sample-real-time.json fixtures: normalization, unit conversion for both unit sets, missing groups, string-to-number parsing, error code non-zero, timeout, redaction of keys in logs, history merge and dedupe.
8. Do not modify any UI files. Set DATA_SOURCE=ecowitt only in .env.local, never in code.
VERIFY: run the app with DATA_SOURCE=ecowitt and compare the dashboard values with the WS View app side by side; list each metric, our value, the app's value. Explain any difference.
```
Commit: `feat: ecowitt adapter`.

---
## Stage 10: QA, accessibility, performance and launch
Tool: Antigravity (audit), then Mistral Vibe or OpenCode with Devstral (second pass). Attach: nothing.
```
ROLE: You are an adversarial QA lead and accessibility specialist. Audit the entire app. Do not add features. Fix defects.

1. Correctness: compare every displayed value with the source reading; check unit conversion in both systems; wind direction semantics (FROM); rain reset at Europe/Berlin midnight including around daylight saving changes (write tests with fake timers for 2026-10-25 when clocks go back); pressure uses relative value; indoor data nowhere in network responses (inspect /api/weather output and the client bundle).
2. Security: grep repository history and the production build output (.next/static) for ECOWITT, api_key, application_key, the MAC. Verify .env files are ignored. Check that error responses leak nothing. Add basic security headers in next.config (Content-Security-Policy appropriate for this app, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, frame-ancestors none).
3. Privacy: no third-party requests at runtime except fonts if self-hosted (they should be self-hosted via next/font), no cookies except theme/unit preferences in localStorage; Privacy and Imprint pages exist with placeholders marked clearly for the school to fill.
4. Accessibility: run axe on every page in both themes; keyboard-only navigation; visible focus; headings in order; ARIA for compass and charts; reduced-motion; colour not the only signal; 200% zoom and 400% reflow; screen reader text for live updates uses polite announcements and is not noisy (announce changes at most every 60 s).
5. Performance: Lighthouse mobile >= 90 for all four categories on /, /data, /learn; LCP < 2 s; CLS < 0.05; JS bundle sizes reported; lazy-load charts and effects; images optimised with next/image.
6. Resilience: simulate API failure, slow API (timeouts), empty history, missing sensors, offline > 30 min, and rapid unit toggling; the UI must stay sane.
7. SEO and sharing: metadata, Open Graph and Twitter cards, canonical URL, robots.txt, sitemap, favicon set, and a dynamic OG image (opengraph-image.tsx) with logo and current temperature if feasible.
8. Cross-browser: list issues for Safari iOS, Chrome Android, Firefox, and Edge based on code review of features used (backdrop-filter, dvh units, wake lock, Intl APIs).
9. Print: /learn activities print cleanly on A4.
OUTPUT: a table of every check with PASS/FAIL/NA and evidence, then fix every FAIL and re-run. Finish with a list of items that need a human decision.
```
Commit: `chore: qa and launch hardening`. Then run the second pass in Vibe/OpenCode with the "Review before commit" prompt (read-only).

---
## Stage 11: Deployment
Tool: Freebuff or you by hand. Preconditions: GitHub repo pushed; Vercel account.
```
TASK: Prepare deployment on Vercel. 1) Add vercel.json only if needed (region fra1 for Frankfurt). 2) Document required environment variables in README (names only, never values). 3) Add a GitHub Action that runs install, typecheck, lint, test and build on every push and pull request. 4) Add a /api/health route returning { ok: true, source, lastMeasuredAt, stale } with no secrets. 5) Write README.md: what the project is, how to run locally, how to switch DATA_SOURCE, how to update docs/site constants, how to rotate keys, how to add a maintenance log entry, and who maintains it. 6) Add a short HANDOVER.md for the next Weather Club cohort: accounts needed, where keys live, how to renew, how to debug stale data (check console Wi-Fi 2.4 GHz and the upload interval in the WS View app).
```
Then manually: add env vars in the Vercel dashboard (Production and Preview), deploy, test the preview URL on your phone, ask school IT for the subdomain CNAME.

---
## Rescue prompts (use any time)
**Agent hallucinated an API field**
```
Stop. You used a field that does not exist in docs/sample-real-time.json. List every field name you referenced in ecowitt.ts, mark each one VERIFIED (present in the sample with path) or UNVERIFIED, remove all UNVERIFIED ones, and make the corresponding output fields optional.
```
**Design drifted**
```
Compare the current UI with docs/03 and 03a rule by rule. Output a table: rule, status, offending file and line. Fix only the failures. Do not add features.
```
**Rate limit hit mid-task (new tool takes over)**
```
Continue an in-progress task. Read AGENTS.md, docs/PROGRESS.md and the last 3 git commits, then run git diff to see uncommitted work. The task was: <stage and prompt name>. The previous agent stopped because of a rate limit. Finish only what is missing, run build, lint and tests, and report.
```
**Bug triage**
```
Bug: <what happens>. Expected: <what should happen>. Steps: <steps>. Do not change code yet. Give me the 3 most likely root causes ranked, the evidence you would look for for each (file and line), then investigate in that order and fix the real one with the smallest change. Add a regression test.
```
**Refactor safely**
```
Refactor <file or module> for readability without changing behaviour. First write characterisation tests that pass on the current code. Then refactor. All tests must still pass. Show the diff summary.
```
**Pre-commit reviewer (read-only, use a different tool)**
```
Review the uncommitted git diff as a strict senior engineer. Do not modify files. Report: bugs, type holes, race conditions, accessibility regressions, performance risks, secrets exposure, and deviations from docs/. Rank findings by severity with file:line references.
```
