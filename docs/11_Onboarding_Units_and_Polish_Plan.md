# Onboarding, Units, Loading Bar, Grid/Skeleton, Rain Fix, Hidden Admin Panel

Source of truth for the work package agreed 2026-10-15. Read this before touching
any of the files listed in §12. Decided answers (locked): six roles
(Kindergarten, PYP, MYP, DP, Teacher, Family) · Activities + TeacherPanel gated
to Teacher · triple-press D reveals the admin panel · subjects dropped entirely.

## 1. Goals and non-goals

In scope:

1. Site-wide first-visit onboarding with role picker, persisted in the browser.
2. Teacher-only gating of classroom activities and the teacher handout.
3. Removal of all subject tagging (Computer Science, ESS, TOK-as-subject).
4. Custom selector component replacing native `<select>` elements.
5. YouTube-style top loading bar on page transitions, theme-aware.
6. Metric/imperial units honored on every surface, including the station page.
7. Dashboard grid + skeleton loading polish.
8. Precipitation "mm today" fix in the mock/demo path.
9. Scenario/admin panel hidden behind a key combination.

Out of scope: German i18n, real Ecowitt data wiring, forecast features, logo
assets, any visual rebrand. Anti-AI-look rules (docs/03 §6) and brand tokens
(docs/03a) still apply to everything new.

## 2. Role model

### 2.1 Roles and storage

```ts
export type Role = 'kindergarten' | 'pyp' | 'myp' | 'dp' | 'teacher' | 'family';
```

- New file `src/context/role-context.tsx` with `RoleProvider` + `useRole()`.
- `localStorage` key: `dis_role` (value = one of the six roles).
- Companion flag `dis_role_set = '1'` so "never onboarded" is distinguishable
  from a stored value.
- Migration: on first load, if `dis_role` is absent but legacy
  `dis_learn_audience` exists, pre-select `kids → pyp`, `students → myp`
  (do not auto-commit; the user still confirms in the picker). Afterwards the
  legacy key is left alone (harmless) — do not add new readers of it.
- `src/app/learn/page.tsx` drops its local `usePersistedAudience` hook and
  reads the role context instead. The `.audience-kids` large-type class is kept
  and driven by the mapped reading level, not by a separate toggle.

### 2.2 Role → reading-level mapping

| Role | Reading level | Sees activities? | Sees TeacherPanel? |
|---|---|---|---|
| Kindergarten | kids | No | No |
| PYP | kids | No | No |
| MYP | students | No | No |
| DP | students | No | No |
| Teacher | students | Yes | Yes |
| Family | kids | No | No |

"Reading level" means exactly what the current Kids/Students toggle controls:
`concept.kids` vs `concept.students` copy in `ExplainerCard`, plus the
`.audience-kids` font-size bump. No other content differences.

### 2.3 Gating semantics

- This is audience-appropriateness, not access control. There is no login and
  nothing secret; a student typing `#activities` must not hit a dead page.
- Non-teacher roles see the concepts grid plus one muted line where the
  activities section would be: "Classroom activities and the teacher handout
  appear when viewing as a teacher." No links to hidden content.
- Teacher role sees everything as today, minus the subject filter (§4).

## 3. Onboarding flow

### 3.1 Trigger

- New client wrapper (e.g. `src/components/onboarding/RoleOnboarding.tsx`)
  mounted in `RootLayout` inside `UnitProvider`.
- On mount it reads `dis_role`/`dis_role_set`. Absent → modal opens.
  Present → renders nothing.
- First-visit modal: Esc does NOT dismiss (there is no valid "no role" state;
  every card is a valid choice, so dismissal is never needed). Focus is trapped
  in the dialog; focus lands on the first role card on open.

### 3.2 Picker content

- Six cards, each a real `<button>`: Lucide icon, role name, one plain-language
  line. Draft copy:
  - Kindergarten: "Very simple words and big pictures."
  - PYP: "Simple explanations of every measurement."
  - MYP: "Full detail, charts and data downloads."
  - DP: "Full detail, charts and data downloads."
  - Teacher: "Everything, plus classroom activities and the handout."
  - Family: "Plain words — is it raining, do we need jackets?"
- Footer note: "You can change this anytime below." (points at the footer
  switcher, §3.3).
- Styling: 12px radius cards, surface background, 1px border, accent ring on
  selected/hover. No native form controls anywhere in this flow.

### 3.3 Changing role later

- Footer gains a "Viewing as: {Role} ▾" switcher built on the custom Selector
  (§5). Changing it updates context + `localStorage` immediately and, if on
  `/learn`, re-maps reading level and activity visibility without reload.
- The same picker doubles as the change UI if opened from the footer (in
  change-mode Esc IS allowed to close).

## 4. Content cleanup: subjects dropped entirely

### 4.1 Data changes (`src/lib/content/activities.ts`)

- Delete `curriculum.subjects` and the `allSubjects()` helper.
- `curriculum` keeps `programme` only, narrowed to `'PYP' | 'MYP' | 'DP'`
  (remove `'TOK'` from `PROGRAMMES`).
- `sensor-accuracy` activity: retag `programme: 'TOK'` → `'DP'`; keep the
  "how do we know a measurement is right?" debate framing, delete the
  "TOK / Physics" age-label prefix (becomes "Ages 16–18").
- Scrub remaining subject mentions: `data-science` materials
  ("Maths / CS" → "Maths"), `urban-heat` age label ("DP Geography / ESS"
  → "DP, ages 16–18"), `dew-point-and-fog` ("Physics" qualifier → "Ages
  14–18"). Programme field already carries the curriculum meaning.

### 4.2 UI changes (`src/app/learn/page.tsx`)

- Delete the subject `<select>` and its label; keep the age-band filter,
  rebuilt on the custom Selector (§5).
- `ActivitySheet` header line currently prints
  `{ageLabel} · {minutes} min · {programme} · {subjects}` — drop the subjects
  segment.

### 4.3 Tests (`src/lib/content/content.test.ts`)

- Assert every activity validates without `subjects`.
- Assert `programme ∈ {PYP, MYP, DP}` for all activities.
- Assert no activity string contains "Computer Science", "ESS", or "TOK".

## 5. Custom Selector component

- New `src/components/ui/selector.tsx`: a listbox, not a restyled select.
  - Closed: pill button showing current value + chevron, `aria-expanded`,
    `aria-haspopup="listbox"`, 12px radius, surface bg, 1px border —
    visually consistent with `UnitToggle`.
  - Open: popover list with `role="listbox"`, options with `role="option"`
    + `aria-selected`, checkmark on the active one.
  - Keyboard: Enter/Space opens, arrows move, Home/End jump, Esc closes and
    refocuses the button, Tab closes. Focus ring in `var(--accent)`.
- Used in exactly two places: Learn age-band filter, footer role switcher.
- The data-page range/metric controls are already custom buttons — untouched.

## 6. Top loading bar

- New `src/components/navigation/TopProgressBar.tsx`, mounted in `RootLayout`.
- Mechanism: watches `usePathname()` + `useSearchParams()`. On change, bar
  appears at ~10% width and a `requestAnimationFrame` trickle eases it toward
  90% (fast start, slow approach — that easing curve is the "satisfying" part).
  When the route settles, it completes to 100% and fades over 150ms.
- Color: `background: var(--accent)` — DIS Amber in dark mode, DIS Blue in
  light, automatically. Height 2px, fixed to viewport top, `z-index` above the
  sticky header.
- `prefers-reduced-motion`: no trickle; bar appears and disappears instantly.
- No new dependencies (deliberately not NProgress).

## 7. Units honored everywhere

### 7.1 Audit table (every hardcoded-metric spot found)

| # | Location | Today (metric-only) | Fix |
|---|---|---|---|
| 1 | `src/app/station/page.tsx` sensor table | Range/accuracy/resolution strings (`-40°C…`, `0–180 km/h`, `300–1,100 hPa`, `0.1 mm`) | Make the table client-rendered via `useUnitSystem`; compute every cell through `lib/units.ts` |
| 2 | `ExplainerCard` "Unit" row | Static `concept.students.unit` (`°C`, `km/h, Beaufort 0–12`, …) | Render per `unitSystem` (§7.3) |
| 3 | `UncertaintyDemo` slider labels | °C-only axis copy | Honor toggle; imperial shows °F band |
| 4 | Hero summary sentence (`summary.ts`) | Verify wording/units under imperial | Fix any metric leaks found |
| 5 | Data page table/charts | Already converts (`data-client.tsx` `conv` memo) | No change; add nothing |

Reference conversions for tests: `-40°C ↔ -40°F`, `180 km/h → 112 mph`,
`1013.25 hPa = 29.92 inHg`, `1 mm = 0.04 in` (2dp → `0.04`).

### 7.2 Station page conversion rules

- Temperature rows: °C → °F via `cToF`, 1dp.
- Wind rows: km/h → mph via `kmhToMph`, whole numbers; keep the Beaufort note
  metric-anchored with an imperial equivalent in parentheses.
- Rain rows: mm → in via `mmToIn`, 2dp.
- Pressure rows: hPa → inHg via `hPaToInHg`, 2dp.
- Column headers carry the active unit ("Operating Range (°F)" etc.).
- Footnote mirroring the data page: "Values shown in {metric|imperial} units."

### 7.3 Learn unit rows

Replace the static unit string with a per-system pair, e.g. temperature
`°C` / `°F`; wind speed `km/h, Beaufort 0–12` / `mph, Beaufort 0–12`; rain
`mm, mm/h` / `in, in/h`; pressure `hPa (relative, sea-level corrected)` /
`inHg (relative, sea-level corrected)`. Implement as a small map in
`ExplainerCard`, not as new content fields (content files stay unit-free).

### 7.4 CSV stays metric

`buildHistoryCsv` always exports metric — already documented in the table
footnote. Keep; add the same one-line note wherever imperial values appear.

## 8. Dashboard grid and skeleton polish

### 8.1 Root cause of the "unsatisfying" swap

`src/app/page.tsx` renders 1 hero skeleton + 7 identical generic skeletons,
but the loaded grid has hero (6-col, 2-row) + wind (3-col, 2-row) + up to six
3-col tiles with different heights and conditional presence (pressure/UV/solar
hide when the sensor is absent). Geometry differs, so the swap jumps.

### 8.2 Fix

- Skeleton mirrors the real grid 1:1: hero skeleton (6-col, 2-row), tall wind
  skeleton (3-col, 2-row), six 3-col tile skeletons — each sharing the exact
  `min-h` classes of its real tile. Conditional tiles keep reserved slots so
  presence/absence doesn't reflow the grid.
- Replace flat `animate-pulse` with a slow monochrome luminance sweep built
  from surface tones only (no color gradients — anti-AI-look rule stands).
- Real tiles fade in with a 40ms stagger (max ~400ms), `motion-reduce` safe,
  matching docs/03 §8 cadence.
- Verify: no `scrollWidth` overflow at 360/390/768/1024/1440, dark + light.
- Fallback if the bento still reads as unsatisfying: uniform 3-col grid with a
  full-width hero. Structural fallback only — offered for review, not default.

## 9. Precipitation fix

### 9.1 Root cause

Default mock scenario starts a rain event with 2% probability per 5 s sample
(`src/lib/sources/mock.ts`, `maybeRain`), and each rainy sample adds only
`rate × 5 / 3600 ≈ 0.001–0.006 mm` to `rainToday`. With `roundRain` at 2dp and
metric display at 1dp, "today" reads `0.0 mm` essentially forever, and `isDry`
(`todayMm === 0 && rateMmH === 0`) is near-permanently true. The tile works —
it just never sees rain.

### 9.2 Fix

- Keep full precision in the `rainToday` accumulator; round only at display.
- Seed default-scenario events often enough that "today" visibly moves within
  a demo session (tune probability/duration, keep totals plausible for Dresden).
- Display rule: `0` + rate `0` → "No rain today."; `0 < today < 0.05` →
  "Trace"; otherwise the formatted value.
- History `rainTodayMm` cumulative logic is correct — untouched.
- Regression test: force a rain event → `rainTodayMm > 0` and the tile shows
  a non-zero today value with `isDry === false`.

## 10. Hidden admin panel

- `src/components/weather/ScenarioDebugPanel.tsx`: delete the always-visible
  floating "Scenario: …" button.
- Reveal: the letter `d` pressed 3 times within 800ms opens the panel.
  Unlock persists in `sessionStorage` (survives page views, not visits).
  Esc closes the panel (not the unlock — reopening is one triple-press away).
- Keep the `NODE_ENV === 'production'` null-guard and the cookie mechanism
  (`weather_scenario` → API routes) exactly as-is.
- Staff handoff: document the combo in `docs/PROGRESS.md` only — never in UI
  copy, tooltips, or committed screenshots.

## 11. Screenshot and script housekeeping (done 2026-10-15)

- Everything from `Temp/opencode/` was moved into the repo and the Temp copy
  deleted. Layout:
  - `screenshots/data/{temperature,wind,rain,pressure,humidity,sun,table}/`
    — data-page tab shots. Filename convention (kept):
    `{tab}-{width}[-tall|-7d][-dark].png`, width ∈ {390, 1440}.
  - `screenshots/learn/` — `learn-*.png` (students/kids/print/teachers/
    uncertainty views).
  - `screenshots/header/` — `header-fix-check*.png` (sticky-header overlap
    verification).
  - `screenshots/dom/` — `dom-dark*.html` (accessibility DOM dumps).
  - `scripts/screenshots/` — `learn-check.mjs`, `scroll-to-shot.mjs`,
    `scrolled-shot.mjs` (reusable CDP capture helpers).
- `screenshots/` is gitignored (large regenerable binaries); scripts are
  committed. All future verification shots go directly into this structure —
  nothing new lands in Temp.

## 12. Files touched by the implementation (forbidden to touch anything else)

New: `src/context/role-context.tsx`,
`src/components/onboarding/RoleOnboarding.tsx`,
`src/components/ui/selector.tsx`,
`src/components/navigation/TopProgressBar.tsx`, this doc.
Edit: `src/app/layout.tsx`, `src/app/learn/page.tsx`, `src/app/station/page.tsx`,
`src/components/learn/ExplainerCard.tsx`,
`src/components/learn/UncertaintyDemo.tsx` (labels only),
`src/components/weather/ScenarioDebugPanel.tsx`,
`src/components/footer.tsx`, `src/components/weather/SkeletonTile.tsx`
(skeleton geometry/animation only), `src/app/page.tsx` (skeleton slots only),
`src/lib/content/activities.ts`, `src/lib/content/content.test.ts`,
`src/lib/summary.ts` (only if imperial leaks are found), `.gitignore` (only if
new ignore entries are needed), `docs/PROGRESS.md`.
Do not rewrite files outside this list.

## 13. Verification checklist

- [ ] `vitest run`: new tests — role mapping + gating matrix, Selector
      keyboard behavior, station conversion table, ExplainerCard imperial unit
      row, rain regression (event → non-zero today, `isDry === false`).
- [ ] `pnpm build` clean, `pnpm lint` zero warnings.
- [ ] CDP screenshots into `screenshots/`: onboarding modal (first-visit),
      Learn as PYP vs Teacher (activities hidden/shown), station page in
      imperial at 390 + 1440, rain tile with non-zero today, top bar
      mid-transition frame, loading→loaded grid swap. Console clean.
- [ ] `docs/PROGRESS.md` updated with session notes.
