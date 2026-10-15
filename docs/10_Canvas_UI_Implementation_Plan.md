# 10: CanvasUI Implementation Plan (agent handoff)

**Status:** plan only — nothing here is implemented. This document is the complete
brief for whichever agent builds it. Read `docs/00–07` (plus `03a_DIS_Brand_Kit.md`
and `03b_Canvas_UI_Notes.md`) before touching code; those docs are the source of truth.

**Project:** DIS Weather Station website (Dresden International School). Station:
Sainlogic WS3500 via Ecowitt cloud. Stack: Next.js App Router, TypeScript,
Tailwind, shadcn/ui, pnpm.

## 0. House rules (non-negotiable, from AGENTS.md)

- Read `/docs` before any work.
- Never read, print, or commit `.env` files or API keys. Keys are server-only.
- UI only imports `WeatherReading` from `src/lib/types.ts`; only
  `src/sources/ecowitt.ts` knows Ecowitt.
- Anti-AI-look rules in `docs/03` §6: no gradients-as-decoration, no emoji icons
  (Lucide 1.5 stroke only), no generic hero/cards, one accent color, strict grid.
- Dark mode accent = DIS Amber (`#F6A800`); light mode accent = DIS Blue
  (`#00529E`); green only for live/fresh status.
- CanvasUI usage stays monochrome, tinted with `var(--accent)` at most ~20% opacity.
- Run `pnpm build` and `pnpm lint` before calling the task done.
- Minimal changes; do not rewrite files you were not asked to touch.
- After finishing, update `docs/PROGRESS.md`.

## 1. Hard constraint: use the REAL CanvasUI components

Install the actual library components per effect via the shadcn registry, e.g.

```bash
npx shadcn@latest add @canvas-ui/ascii-sweep-react
npx shadcn@latest add @canvas-ui/droplets-react
npx shadcn@latest add @canvas-ui/clouds-react
npx shadcn@latest add @canvas-ui/frost-react
```

(or the equivalent through the CanvasUI MCP server). The code is copied into the
repo — tune props, do not re-implement.

**Do NOT build lightweight CSS/2D look-alikes.** A previous attempt did exactly
that and was reverted: it defeated the purpose. The real components are the
deliverable; device capability is handled by Section 4 (tier + FPS guard
deciding *whether the real components mount*), not by faking them.

Browser realities (from canvasui.dev, re-verify at build time):

- html-in-canvas capture needs an experimental Chrome flag; without it, content
  renders as normal HTML and pure-overlay effects keep running. Every component
  must degrade to plain HTML — test with the flag off.
- WebGPU builds need a recent Chrome/Edge/Safari/Firefox; prefer WebGL builds
  for this school audience unless profiling says otherwise.
- All components pause off-screen, clean up on unmount, and respect
  `prefers-reduced-motion` — verify each claim for the components you install.
- License is reported as MIT + Commons Clause (fine for a school site, not for
  reselling components). Re-check the repo license before launch.
- Always test in the browsers on the school laptops (Chromebooks are the baseline).

## 2. User decisions (from the planning discussion — do not relitigate)

| # | Effect | Verdict |
|---|--------|---------|
| 1 | ASCII Sweep on metric↔imperial toggle | **Yes, across the data area** (dashboard tiles, not header/nav) |
| 2 | Droplets on the rain tile | **Yes** |
| 3 | Clouds on the hero | **Yes** |
| 4 | Frost below freezing | **Yes** |
| 5 | Particle/Decrypt reveal on `/learn` | **No** |
| 6 | Particle Scroll on `/display` | **No** |
| 7 | VHS/Glitch treatment for stale/offline | **Yes** (instrument-safe: subtle, calm, never on live data) |

Q&A answers, also locked:

- **Default mode: Auto.** The device decides; effects start in the tier the
  laptop can handle and the FPS guard (Section 4) turns them off if it gets slow.
- **Toggle placement: quiet but findable.** No loud header button. One small
  control (e.g. beside the theme toggle) plus the full control in the footer
  and on the Learn page.
- **Sweep scope: data area only.** Header, nav, and footer stay stable DOM so
  focus, tab order, and `aria-current` never break mid-animation.

Gating means at most ~2 layers are ever mounted at once (ambient + conditional),
which keeps the `docs/03b` "max 1–2 effects" spirit: sweep (one-shot), plus one
of droplets/clouds/frost, plus the stale veil only in stale/offline states.

## 3. Effect placements (exact)

### 3.1 ASCII Sweep — unit toggle (`@canvas-ui/ascii-sweep-react`)

- **Mount:** wrap the dashboard data grid in `src/app/page.tsx` (the bento grid,
  not the `Header`/`Footer`), keyed by `unitSystem` from
  `src/context/unit-context.tsx`.
- **Behavior:** on `metric`↔`imperial` change, the glyph band sweeps the data
  area once while the converted values settle underneath. Skip on first mount.
- **Fallback:** the existing `ValueCrossfade.tsx` 300 ms crossfade stays as the
  reduced-motion / effects-off path.
- **A11y:** overlay is `aria-hidden`; screen readers announce new values once
  through existing paths. No per-tile announcements.
- **Verify in demo:** confirm the component accepts old→new content swap (two
  slots) or works as a one-shot mask over instantly-updated children; confirm it
  exposes an imperative `play()` if its default trigger is hover/cursor.

### 3.2 Droplets — rain tile (`@canvas-ui/droplets-react`)

- **Mount:** inside `src/components/weather/RainGauge.tsx`, **only when
  `rainRateMmH > 0`**. Dry state = today's plain tile, zero change.
- **Behavior:** droplet density scales with rain rate. Cap particle counts per
  tier (Section 4); pause off-screen and on hidden tabs (the library claims this
  — verify).

### 3.3 Clouds — hero (`@canvas-ui/clouds-react`)

- **Mount:** background layer of `src/components/weather/HeroReading.tsx`.
- **Behavior:** mist opacity follows `humidityPct` (faint at all times — single
  digits to low-teens percent opacity, monochrome). Cursor-wind parting is
  desktop pointer-fine only; static mist on touch/lite tier.

### 3.4 Frost — freezing state (`@canvas-ui/frost-react`)

- **Mount:** hero (and/or `WindCompass.tsx`), **only when temperature < 0 °C**.
  Unmounted the rest of the year.
- **Behavior:** frozen pane that melts under the cursor and refreezes (library
  behavior — verify props); static pane on lite tier.

### 3.5 Stale signal — weak-signal veil (VHS or Glitch family, subtle build)

- **Mount:** inside `src/components/weather/StaleBanner.tsx`, **only when
  `isStale || isOffline`**. Never on live data.
- **Behavior:** faint monochrome scanline/tracking veil over the banner. Keep the
  existing calm copy ("…may be reconnecting") word-for-word; the effect must
  read as "weak signal", never as "broken site". Static (non-animated) on lite.

## 4. Performance system (the reason this works on Chromebooks)

### 4.1 Static device tier (computed once, client-side)

Signals: `navigator.hardwareConcurrency`, `navigator.deviceMemory`,
canvas/WebGL probe, `prefers-reduced-motion`, `navigator.connection.saveData`.
Suggested mapping:

- `reduced-motion` → **off** always (manual On must never override this).
- No canvas/GPU → **off**.
- ≤4 cores, ≤4 GB RAM, or Save-Data → **lite** (reduced densities, static
  variants, shorter sweep).
- Otherwise → **full**.

Unknown hardware defaults to full **only because** the runtime guard below is
the backstop. Keep the tier logic in a pure, unit-testable module
(`src/lib/effects/tier.ts` style) with a matrix test.

### 4.2 Runtime FPS guard (auto-disable)

- Sample `requestAnimationFrame` deltas **only while an ambient effect is
  mounted** (reference-count registrations from ambient layers).
- Rolling window (~60 frames); trip after ~3 consecutive windows under ~28 fps.
  Clamp tab-switch gaps so one pause can't poison the average; reset on
  `visibilitychange`.
- On trip: unmount all effects, persist the trip in `localStorage`, show one calm
  inline notice ("The moving rain and clouds turned themselves off to keep this
  page fast on this laptop. The numbers still update live.") with a one-tap
  re-enable. No layout jump (reuse the `StaleBanner` grid-rows pattern).
- Re-enabling clears the trip; the guard re-arms silently.

### 4.3 Manual toggle (Auto default, quiet but findable)

- `localStorage`-persisted mode: **Auto / On / Off** (same pattern as the unit
  system and Learn audience keys).
- Header: one small icon button (44 px target, `aria-pressed`, tooltip) that
  cycles modes. Mobile nav sheet: a matching row.
- Footer + Learn page: full three-state radio group with one-line plain-language
  descriptions and the current laptop tier.
- Lobby kiosk (`src/app/display/page.tsx`): force effects off — projector,
  12 s view cycle, and burn-in shift must never fight GPU loops.

## 5. Guidance for the whole school (grades 3–12, staff, teachers)

- **Kids (3–5):** one sentence near the footer control — "Pretty rain and
  clouds. If the page gets slow, they turn themselves off. The numbers keep
  working." No jargon.
- **Students (6–12):** short "Why did the effects turn off?" bullets (old
  laptop / battery saver / slow Wi-Fi), placed in the Learn page effects
  section and respecting the existing Kids/Students `AudienceToggle`.
- **Teachers/staff:** a paragraph in `TeacherPanel.tsx` — leave Auto on for
  class; the lobby display runs plain; printed handouts never include motion
  layers; CSV/table data is never affected.
- **Print:** all canvas layers hidden in print CSS; numbers and charts print
  exactly as today.

## 6. Suggested build phases

1. **Infra:** tier module + tests, effects context/provider with FPS guard,
   toggle UI (header/footer/Learn), kiosk force-off. No visual effects yet.
2. **Sweep:** install `ascii-sweep`, wrap dashboard data area, keep
   `ValueCrossfade` fallback. Verify on a throttled Chromebook profile.
3. **Ambient:** install `droplets`, `clouds`, `frost` with the gates in §3.
   One at a time; screenshot each scenario (storm/rain/frost/offline via the
   existing `weather_scenario` cookie).
4. **Stale veil + guidance:** install the VHS/Glitch-family component, gate to
   stale/offline, add kids/students/teacher copy.
5. **Verify:** §7 matrix, then `pnpm build`, `pnpm lint`, update
   `docs/PROGRESS.md`.

Suggested touch list (only these unless the work demands more):
`src/app/layout.tsx`, `src/app/page.tsx`, `src/app/learn/page.tsx`,
`src/app/display/page.tsx`, `src/app/globals.css`,
`src/components/header.tsx`, `src/components/footer.tsx`,
`src/components/learn/TeacherPanel.tsx`,
`src/components/weather/HeroReading.tsx`,
`src/components/weather/RainGauge.tsx`,
`src/components/weather/StaleBanner.tsx`,
plus new `src/lib/effects/*`, `src/context/effects-context.tsx`,
`src/components/effects/*`. New unit tests alongside each pure module.

## 7. Acceptance criteria

- [ ] Real `@canvas-ui/*` registry components installed; no CSS re-implementations.
- [ ] Each effect mounts only under its §3 gate; dry/warm/live states are
  pixel-identical to today.
- [ ] Chromebook profile (4-core throttle, flag off): page is fully readable,
  plain-HTML fallbacks, no console errors.
- [ ] Forced slow FPS trips the guard once, shows the notice, persists across
  reload; re-enable works.
- [ ] Reduced-motion, no-GPU, Save-Data, keyboard-only, 360 px mobile, and print
  all verified.
- [ ] Toggle discoverable in header, footer, and Learn; kid wording reviewed.
- [ ] `pnpm build` + `pnpm lint` clean; `docs/PROGRESS.md` updated.
- [ ] CanvasUI license re-checked before launch.

## 8. Rejected (do not build)

Learn-entrance particle/decrypt reveals, display scroll-dissolve transitions,
fire/fluid/shatter/cursor-lens components (`Blaze`, `Flame Wrap`, `Liquid`,
`Shatter`, `Bubble`, `Glass`, `Magnify`, `Laser`): wrong metaphors or pure
decoration, violating `docs/03` restraint rules.
