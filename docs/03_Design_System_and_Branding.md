# Design System and Branding

## 1. Direction
Premium, quiet, editorial. Black and white with one restrained DIS accent (see 03a). Reference: canvasui.dev (high contrast, big type, tactile details, generous space). A scientific instrument, not a SaaS landing page.

## 2. Brand inputs
See `03a_DIS_Brand_Kit.md` (colors, logo rules, contrast fixes).

## 3. Tokens
| Token | Dark (default) | Light |
|---|---|---|
| background | #0A0A0A | #FAFAFA |
| surface | #111111 | #FFFFFF |
| border | #1F1F1F | #E5E5E5 |
| text | #F5F5F5 | #0A0A0A |
| muted | #8A8A8A | #6B6B6B |
| accent | DIS Amber | DIS Blue |
Dark/light toggle, default follows system. WCAG AA contrast.

## 4. Typography
- Geist Sans for UI; Geist Mono or JetBrains Mono for numbers with `font-variant-numeric: tabular-nums`.
- Hero temperature 120-200 px, weight 300-400, tracking -0.04em.
- Labels 11-12 px uppercase, tracking 0.08em, muted. Body 16 px min, line-height 1.6, max 65 ch.

## 5. Layout
12-column grid, 24 px gutters (16 px mobile), max width 1200 px. Tiles: 1 px border, radius 12 px, no shadows, one subtle radial glow in hero only. Bento: hero 2x2, wind compass 1x2, others 1x1. Spacing scale 4, 8, 12, 16, 24, 40, 64, 96.

## 6. Anti "AI look" rules (hard rules for agents)
1. No purple/blue gradients, no glassmorphism everywhere, no neon glows.
2. No emoji icons. Lucide at 1.5 stroke or custom SVG.
3. No centered hero with "Welcome to..." and three feature cards.
4. No gradient text, floating blobs, or "AI-powered" wording.
5. Specific human copy: "Wind from the south-west, gusting 24 km/h", never "Experience real-time insights".
6. Real numbers, units and timestamps everywhere; real station and school names.
7. One accent color, one display font.
8. Every element earns its place; delete decorative cards.
9. Strict grid alignment and consistent padding.
10. Hover/focus is subtle (border brightens, 150 ms).

## 7. Components
- shadcn: Card, Tabs, Tooltip, Dialog, Sheet, Toggle, Select, Skeleton, Badge, Separator, Table.
- Custom: HeroReading, Metric, WindCompass (SVG, animated needle, gust ghost needle), RainGauge, Sparkline, LiveDot, StaleBanner, UnitToggle, ExplainerCard.
- Canvas UI: see `03b_Canvas_UI_Notes.md`. Max 1-2 effects, always with fallback.

## 8. Motion
Number changes 300 ms crossfade; compass spring 600 ms; tile stagger 40 ms (max 400 ms); respect `prefers-reduced-motion`.

## 9. Accessibility
Compass has text equivalent; color never the only signal; visible focus ring; 44 px tap targets; charts have table view; Kids mode uses larger type and simple words.

## 10. Brand extraction prompt (optional re-run)
"Look at the attached DIS logos and screenshots. Extract primary/secondary hex colors, font style guess, button radius, tone of voice and spacing density. Output JSON tokens and 5 rules for adapting this to a black-and-white premium weather dashboard without copying the school website layout."
