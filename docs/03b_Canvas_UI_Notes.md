# 03b: Canvas UI Integration Notes (from canvasui.dev)

- Open-source library of html-in-canvas components (WebGL or WebGPU), 35 components, framework agnostic. License reported as MIT + Commons Clause: fine for a school site, not for reselling the components. Re-check the license on the repo before launch.
- Install per component through shadcn, e.g. `npx shadcn@latest add @canvas-ui/particle-reveal-react`; code is copied into your repo. A registry/MCP exists so an agent can browse and install.
- Effects named on the site: Blaze, Liquid, Laser, Clouds, Bubble, Droplets, Glass, Magnify, Grid, Ripple, Shatter, Particle Reveal, VHS.
- Browser support: components that render live HTML into canvas need an experimental Chrome flag; otherwise content shows as normal HTML. Pure overlay effects run broadly. WebGPU versions need a recent Chrome, Edge, Safari or Firefox. Always test in the browsers on school laptops.
- Performance notes from the site: pauses off-screen, cleans up on unmount, respects reduced motion.

## Weather-themed picks (verify in live demos)
| Idea | Component | Use |
|---|---|---|
| Rain tile reacts to real rain | Droplets | Only when rain_rate > 0 |
| Cloud layer in hero | Clouds | Subtle, monochrome, opacity tied to humidity |
| Hover on temperature | Magnify or Glass | Desktop only |
| Page entrance | Particle Reveal | One use, /learn hero |
Keep to 1-2 effects. Premium means restraint.

## Prompt addition for Prompt 8
```
Use the shadcn CLI or MCP to install Canvas UI components. Prefer overlay effects that work in all browsers (Clouds, Droplets). Wire Droplets to rainRateMmH > 0 and Clouds opacity to humidity. Everything must degrade to plain HTML, pause off-screen and honor prefers-reduced-motion. Monochrome only, tinted with var(--accent) at most 20% opacity.
```
