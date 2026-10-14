# 03a: DIS Brand Kit (overrides brand parts of doc 03)

Colors pixel-sampled from the DIS tagline banner you sent. Logos provided: round "DIS Dragons" badge, "30 years 1996-2026" logo, horizontal "dis Dresden International School" logo, tagline banner.

## Palette
| Role | Name | Hex | Source |
|---|---|---|---|
| Brand blue | DIS Blue | #00529E | "Inspire." block, logo ring, big "30" |
| Brand amber | DIS Amber | #F6A800 | "Move Forward." block, dragon badge, globe |
| Brand green | DIS Green | #B3D236 | "Give Back." block |
Tagline: "Inspire. Move Forward. Give Back." Slogan: "World Citizens Made in Dresden." Founded 1996; 30-year anniversary in 2026.

## Contrast check (WCAG)
| Color | On #0A0A0A | On #FAFAFA |
|---|---|---|
| Blue #00529E | 2.5:1 FAIL | 7.4:1 pass |
| Amber #F6A800 | 9.9:1 pass | 1.9:1 FAIL as text |
| Green #B3D236 | 11.5:1 pass | 1.7:1 FAIL as text |
Rule: **dark mode accent = Amber, light mode accent = Blue.** One `--accent` variable swaps per theme.

## Usage rules
- Accent appears only in: LiveDot, active chart series, focus ring, one highlighted value, link hover.
- Green only as a "data fresh / live" status color.
- Never use blue and amber together inside one component.
- Optional: 4 px blue/amber/green strip above the footer, echoing the school banner. One place only.
- Header: horizontal "dis" logo, 28-32 px tall. It has a white background and dark text, so on dark mode place it on a small white rounded plate or request a white knockout SVG.
- Dragon badge: /station About section only. 30 Years logo: small footer mark through 2026.
- Do not recolor, stretch or crop logos. Do not copy dresden-is.de layout.

## CSS
```css
:root { --dis-blue:#00529E; --dis-amber:#F6A800; --dis-green:#B3D236; --accent:var(--dis-blue); }
.dark { --accent: var(--dis-amber); }
```

## Tone of voice
Warm, confident, international, short. Examples: "Dresden, right now." / "Measured on our school grounds." (confirm the real mounting spot).

## Still needed
Transparent SVG logo and white version; the school's font if IT knows it (else Geist).
