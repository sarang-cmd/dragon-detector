# DIS Weather Station

<p align="center">
  <img src="public/brand/dis-logo-horizontal.jpg" alt="Dresden International School" width="320" />
</p>

<p align="center">
  <a href="https://dragon-detector.vercel.app"><img src="https://img.shields.io/badge/live-dragon--detector.vercel.app-00529E?style=for-the-badge" alt="Live deployment" /></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black?logo=next.js" alt="Next.js 14" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black" alt="React 18" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" alt="TypeScript 5" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3-38BDF8?logo=tailwind-css&logoColor=black" alt="Tailwind CSS 3" />
  <img src="https://img.shields.io/badge/pnpm-10-F69220?logo=pnpm&logoColor=black" alt="pnpm" />
  <img src="https://img.shields.io/badge/Vitest-5-6E9F18?logo=vitest&logoColor=white" alt="Vitest" />
  <img src="https://img.shields.io/badge/Supabase-auth-3FCF8E?logo=supabase&logoColor=black" alt="Supabase" />
  <img src="https://img.shields.io/badge/Groq-AI_outlook-FF4A4A" alt="Groq" />
</p>

Live school weather station for **Dresden International School** — a Sainlogic
WS3500 on the campus roof, published as a fast, accessible, bilingual-ready
dashboard for students, teachers and families.

**Live:** https://dragon-detector.vercel.app

---

## What it does

| Page | Content |
|---|---|
| **Live** (`/`) | Bento-grid instrument tiles: temperature, wind compass, rain gauge, humidity, pressure, UV, solar, sun & moon — with 24h sparklines, a 12-hour AI/statistical outlook with forecast graph, and print-friendly lobby display (`/display`) |
| **Data** (`/data`) | Full history table + charts, metric/imperial toggle, CSV export |
| **Learn** (`/learn`) | 12 measurement explainers (kids + students reading levels), classroom activities and a teacher handout with printable sheets |
| **Station** (`/station`) | Hardware specs, siting, sensor tolerances, maintenance records |

Cross-cutting: **role onboarding** (Kindergarten, PYP, MYP, DP, Teacher, Family —
persisted locally, teacher-only activities), **metric/imperial everywhere**,
theme-aware UI (DIS Blue / DIS Amber), and a mock simulator with rain, storm,
calm and offline scenarios for development.

## Getting started

```bash
pnpm install
pnpm dev        # http://localhost:3000
```

```bash
pnpm build      # production build (required before calling work done)
pnpm lint       # ESLint, zero warnings
npx vitest run  # unit tests
```

## Environment

Copy `.env.example` to `.env.local` (gitignored — **never commit real keys**;
keys are server-only and never reach the browser, except the Supabase
publishable key which is public-by-design):

```bash
DATA_SOURCE=mock          # live data: switch to ecowitt + credentials when ready
GROQ_API_KEY=             # optional: enables the AI outlook sentence
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Without `GROQ_API_KEY` the outlook falls back to station statistics, so the
hero still predicts. One shared server cache (15 min) serves every visitor —
a whole school costs a single upstream call.

## Project structure

```
src/app/            # App Router pages + API routes (/api/weather, /api/history, /api/outlook)
src/components/     # weather/* tiles, learn/* cards, onboarding/*, ui/* primitives
src/context/        # unit-context (metric/imperial), role-context, theme/effects
src/lib/            # units, summary, outlook engine, beaufort, sources (mock/ecowitt)
src/hooks/          # useWeather (SWR data layer)
docs/               # 00–11: brief, API model, design system, build spec, plans
scripts/screenshots/# CDP capture helpers for visual verification
screenshots/        # local verification shots (gitignored)
```

`docs/` is the source of truth — read `docs/00`–`docs/07` before changing
anything. House rules live in `AGENTS.md`.

## License

Application/site use is permitted; selling or redistributing the components
themselves is restricted — see `src/components/canvasui/LICENSE.md`
(MIT + Commons Clause Condition v1.0, © 2026 David Haz). Re-check with the
school before launch.

<p align="center">
  <img src="public/brand/dis-dragons-badge.jpg" alt="DIS Dragons" width="96" />
  <br />
  <sub>Built by the DIS Weather Club · Dresden International School · Anhalter Str. 1, 01069 Dresden</sub>
</p>
