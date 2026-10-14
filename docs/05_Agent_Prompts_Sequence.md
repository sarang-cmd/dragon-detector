# Agent Prompt Sequence (copy-paste)

Works with OpenCode, Freebuff, Antigravity or any terminal agent. Station: Sainlogic WS3500 (Ecowitt cloud). Build only tiles for sensors in doc 07. Brand colors are in 03a.

Rules for every session:
- Start the agent in the repo root. First message: "Read everything in /docs before doing anything. Summarize the plan in 8 bullets and wait."
- One prompt at a time. Run the app, check, commit, then next.
- If the result looks generic, paste a screenshot and say exactly what to change. Do not re-roll everything.
- Attach with Prompt 2: logos, DIS site screenshots, canvasui.dev screenshots.

---
## Prompt 0: Context load
```
You are building the DIS Weather Station website for Dresden International School. Read all files in /docs (00-07, including 03a, 03b and the 07 hardware doc). Do not write code yet. Reply with: (1) your understanding of the goal, (2) the stack, (3) the pages, (4) the 5 biggest risks, (5) any questions that block you. Under 300 words.
```

## Prompt 1: Scaffold
```
Scaffold the project per docs/04. Next.js App Router, TypeScript, Tailwind, pnpm. Initialize shadcn/ui and add: card, tabs, tooltip, dialog, sheet, toggle, select, skeleton, badge, separator, table. Install lucide-react, swr, recharts, next-themes. Create the folder structure from docs/04 with typed placeholders. Add .env.example (ECOWITT_APPLICATION_KEY, ECOWITT_API_KEY, ECOWITT_MAC, DATA_SOURCE=mock) and ensure .env.local is in .gitignore. Run build and lint. Commit "chore: scaffold".
```

## Prompt 2: Design tokens and shell
```
Attached: DIS logos and screenshots of the school site and canvasui.dev. Implement docs/03 and docs/03a. Use the exact brand hex codes in 03a; accent is Amber in dark mode and Blue in light mode. Set up dark (default) and light themes, load Geist Sans and Geist Mono via next/font, and build the shell: header with the horizontal DIS logo (on a white plate in dark mode), nav, theme toggle, unit toggle, footer with the optional 4 px blue/amber/green strip. Follow the anti-AI-look rules strictly. Show screenshots at 390 px and 1440 px and list any rule you bent.
```

## Prompt 3: Types, units, mock simulator
```
Implement src/lib/types.ts, units.ts, beaufort.ts, moon.ts and sources/mock.ts exactly per docs/02. Mock simulator: seeded RNG, daily temperature sine, inverse humidity, wind with gusts and drifting direction, rain events accumulating daily (reset at Europe/Berlin midnight), pressure drift, UV and solar bell curve, 7 days of history, ?scenario=storm|calm|rain|offline overrides. Create sources/index.ts choosing by DATA_SOURCE, plus /api/weather and /api/history with 60 s cache and the stale logic from docs/02 section 7. Unit tests for units and beaufort. Run tests.
```

## Prompt 4: Data hook and live behavior
```
Create hooks/useWeather.ts with SWR: refresh 5 s for mock, 60 s otherwise. Expose reading, history, isStale, isOffline, secondsSinceUpdate. Build LiveDot ("Live", "Delayed", "Offline") and StaleBanner. Add a dev-only debug panel to switch scenarios (hidden in production).
```

## Prompt 5: Dashboard
```
Build the home page per docs/04 section 6. Components: HeroReading, Metric, WindCompass (SVG, spring needle, gust ghost needle, cardinal ticks, text alternative), RainGauge, Sparkline, bento layout. Tiles: temperature, humidity + dew point, wind, rain, pressure + trend, UV index, light, min/max, moon phase. Add summary.ts with the human sentence and jacket advice. Tabular-nums, fixed tile sizes, skeletons while loading. No decorative elements. Verify at 390 px. Screenshot both breakpoints.
```

## Prompt 6: Data page
```
Build /data with Recharts: tabs for temperature, wind (speed + gust), rain (bars), pressure, humidity, sun; 24 h / 7 d switch; min/max/avg chips; "View as table"; "Download CSV". Thin 1.5 px lines, minimal gridlines, accent only on the active series, custom tooltip matching the design system.
```

## Prompt 7: Learn section
```
Build /learn from docs/06. Create src/content/concepts.ts and activities.ts (typed). ExplainerCard: icon, plain explanation, how it is measured, units, typical Dresden values, "Try this" question. Kids/Students toggle swaps text and enlarges type. Include a measurement-uncertainty card using the WS3500 accuracy figures from docs/07. Add "What is this?" tooltips on dashboard metrics linking to the matching card. Add the printable Activities list with a print stylesheet.
```

## Prompt 8: Motion and Canvas UI
```
Read docs/03b. Use the shadcn CLI or MCP to install ONE or TWO Canvas UI components that fit the black-and-white look (prefer Clouds and Droplets). Integrate in components/effects/WeatherFx.tsx: Droplets only when rainRateMmH > 0, Clouds opacity tied to humidity. Lazy-load, static fallback, pause off-screen, honor prefers-reduced-motion, no CPU spike, never reduce text legibility. Tell me what you picked and why. Apply the motion rules in docs/03 section 8.
```

## Prompt 9: Station, display, real adapter
```
1) Build /station and /display per docs/04, using the facts in docs/07. 2) Implement sources/ecowitt.ts: call https://api.ecowitt.net/api/v3/device/real_time with call_back=all using server env vars; write the normalizer from /docs/sample-real-time.json; handle string values, missing groups, imperial to metric conversion; 8 s timeout; last-good fallback. Never log full URLs (they contain keys). 3) Add history via the Ecowitt history endpoint (read the official docs for params and cycle types) with the same fallback. 4) Test the normalizer against the sample JSON. Do not change UI files.
```

## Prompt 10: QA and launch
```
Audit the whole app: accessibility (axe, keyboard, AA contrast), Lighthouse mobile >= 90, no console errors, no key exposure (grep client bundle and repo), responsive 360-1920 px, reduced motion, offline and stale states, print styles for /learn. Add metadata, Open Graph image, favicon, robots, Privacy/Imprint placeholder pages. Output a pass/fail checklist and fix every fail.
```

---
## Helper prompts
**Fix the AI look**
```
This looks generic. Here is a screenshot. List every element that violates docs/03 section 6, then fix them. Remove at least 3 decorative elements. Tighten spacing to the scale. Add nothing new.
```
**Debug**
```
Problem: <describe>. Expected: <x>. Actual: <y>. Relevant files: <paths>. Find the root cause first, explain in 3 lines, then fix minimally.
```
**Review before commit**
```
Review git diff like a strict senior engineer. List bugs, type holes, accessibility issues and anything that leaks secrets. Do not modify files.
```
**Tooling tip:** one agent builds per session; a second only reviews. Never run two agents editing the same branch.
