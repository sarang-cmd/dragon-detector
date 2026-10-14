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
