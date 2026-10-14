# DIS Weather Station — codebase inventory (read-only)

Last checked: 2026-10-14.

## Verified present

- `.env.example` — Ecowitt placeholder keys + `DATA_SOURCE=mock`, `NEXT_PUBLIC_SITE_URL=`.
- `.gitignore` — excludes `.env*.local`, `.next`, `node_modules`.
- `package.json` — Next.js 14, TypeScript, Tailwind, pnpm, Vivest/prettier deps for later.
- `pnpm-lock.yaml` — present.
- `tsconfig.json` — strict, `src/` alias set up.
- `next.config.mjs` — basic image remote patterns.
- `tailwind.config.ts` — dark mode class, DIS colors.
- `postcss.config.mjs` — tailwind + autoprefixer.
- `src/app/layout.tsx` — Geist fonts, dark/light via next-themes, minimal meta.
- `src/app/page.tsx` — bare “DIS Weather Station” heading.
- `src/app/learn/page.tsx` — static Learn shell with Kids/Students copy, cards, activity list.
- `src/app/api/weather/route.ts` — server cache, stale logic, scenario param.
- `src/app/api/history/route.ts` — simple JSON route.
- `src/app/not-found.tsx` — friendly 404.
- `src/components/header.tsx` — DIS logo plate, nav, theme toggle, placeholder unit toggle.
- `src/components/footer.tsx` — DIS logo copy, station/source credits, legal links.
- `src/components/live-dot.tsx` — live/delayed/offline status dot.
- `src/components/theme-provider.tsx` — next-themes wrapper.
- `src/hooks/useWeather.ts` — SWR hook returning reading, history, stale/offline, secondsSinceUpdate.
- `src/lib/types.ts` — `WeatherReading`, `HistoryPoint`, `WeatherApiResponse`, `WeatherSource`.
- `src/lib/units.ts` — temp/speed/rain/pressure converters.
- `src/lib/beaufort.ts` — Beaufort index, names, compass label helpers.
- `src/lib/moon.ts` — moon phase computation.
- `src/lib/summary.ts` — human sentence + jacket advice.
- `src/sources/mock.ts` — seeded mock simulator with scenario override.
- `src/sources/ecowitt.ts` — Ecowitt normalizer skeleton, defensive against unknown field names.
- `src/sources/index.ts` — router by `DATA_SOURCE`.
- `src/lib/content/concepts.ts` — Learn concept cards (typed).
- `src/lib/content/activities.ts` — classroom activities (typed, 8 activities).
- `docs/00-09` — full spec set including 03a, 03b, 07.
- `docs/PROGRESS.md` — project status tracking.
- `public/brand/*` — DIS logos and brand kit assets present.
- `public/favicon.svg` — minimal DIS logo plate.

## Not present yet

- shadcn/ui components (card, tabs, tooltip, dialog, sheet, toggle, select, skeleton, badge, separator, table, button).
- `vitest.config.ts`, test setup, trivial passing test.
- `src/lib/time.ts`.
- `src/components/weather/`, `src/components/learn/`, `src/components/effects/`.
- `src/lib/content/concepts.ts` and `activities.ts` are written but covered only by the build, not a test runtime.

## Risks seen on first inspection

- Ecowitt adapter is defensive but the exact upstream field names are UNKNOWN until a real sample JSON lands.
- Mock reset logic uses local midnight instead of Europe/Berlin midnight in the current file path; docs 02 section 6 requires Europe/Berlin.
- Learn page is a self-contained shell; it does not yet use shadcn primitives, so the prompt to install them is still open.
- No actual test is running yet.

## Commands that need to pass before this task is declared done

- `pnpm install`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`
- `pnpm build`

## Files that are still placeholders and not yet wired

- `/data`, `/station`, `/display` pages do not exist yet.
- `src/components/weather`, `src/components/learn`, `src/components/effects` are empty folders.
