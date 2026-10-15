# Canvas UI: ASCII Sweep (React, WebGL)

A band of glowing ascii characters sweeps across the panel and swaps one set of content for another, growing characters on the exact text lines it passes over. Switch the tabs to fire it.

## Install

\`\`\`sh
npx shadcn@latest add @canvas-ui/ascii-sweep-react
\`\`\`

Or copy the standalone source below into your project as AsciiSweep.tsx.

## Current configuration

The component as configured right now in the docs demo (React syntax; prop values apply to every framework):

\`\`\`tsx
import { AsciiSweep } from "@/components/canvasui/AsciiSweep";

<AsciiSweep
  angle={0}
  duration={2}
  band={0.28}
  softness={0.45}
  turbulence={0.5}
  trail={0.75}
  scale={2}
  spacing={1}
  tint={0.75}
  glow={2}
  aberration={5}
  flicker={0.35}
  density={0.9}
  displace={14}
  contrast={1.2}
  brightness={0}
  invert={0}
  threshold={0.1}
  fade={0.75}
  charset="ascii"
  blend="auto"
  color="#4ade80"
>
  {/\* your content \*/}
</AsciiSweep>
\`\`\`

## Props

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| children | ReactNode |  | Panels to sweep between. Each child is one panel, and only the two panels involved in a sweep stay mounted. |
| index | number | 0 | Index of the panel to show. Changing it sweeps to that panel. |
| directional | boolean | true | Flip the sweep 180 degrees when moving to an earlier panel, so tabs sweep the way you travel. |
| angle | number | 0 | Sweep direction in degrees. 0 sweeps left to right, 90 sweeps bottom to top. |
| duration | number | 2 | Seconds the sweep takes from one panel to the other. |
| band | number | 0.28 | Width of the ascii band as a fraction of the travel (0 to 1). |
| softness | number | 0.45 | Feather of the band edges as a fraction of the band (0 to 1). |
| turbulence | number | 0.5 | How ragged the sweep edge is. Higher tears the boundary apart row by row. |
| trail | number | 0.75 | Length of the glowing trail left behind the band, as a fraction of the band. |
| progress | number | -1 | Drives the sweep manually from 0 to 1. Set to -1 to let the component animate itself. |
| scale | number | 2 | Size of one glyph pixel in CSS pixels. Characters are 5x5 glyph pixels. |
| spacing | number | 1 | Empty glyph pixels around each character (0 to 3). |
| charset | "ascii" | "blocks" | "binary" | "ascii" | Built-in character ramp: real ascii glyphs, shade blocks, or binary digits. |
| glyphs | number[] | [] | Custom ramp of packed 5x5 bitmaps (dark to bright), overrides charset. |
| color | string | "#4ade80" | Color of the sweeping characters, as any CSS color. |
| tint | number | 0.75 | How strongly the ink color replaces the content color (0 to 1). |
| glow | number | 2 | Soft phosphor glow around the characters (0 to 1). |
| aberration | number | 5 | Chromatic aberration across the band, in CSS pixels. |
| flicker | number | 0.35 | How much characters flicker on and off as the band passes (0 to 1). |
| density | number | 0.9 | Share of cells inside the band that light up (0 to 1). |
| displace | number | 14 | Horizontal tearing of content rows inside the band, in CSS pixels. |
| contrast | number | 1.2 | Contrast applied to character density before picking a glyph. |
| brightness | number | 0 | Density offset applied before picking a glyph (-1 to 1). |
| invert | number | 0 | Invert character density inside the band (0 to 1). |
| threshold | number | 0.1 | Contrast against the background above which a pixel counts as content and grows characters. |
| fade | number | 0.75 | How far the content dims underneath the band (0 to 1). |
| blend | "auto" | "add" | "over" | "auto" | How characters composite over the content. "auto" adds on dark pages and paints over on light ones. |
| background | string | "auto" | Color of the page behind the content, as any CSS color, or "auto" to read it from the DOM. |
| onSweepStart | (to: number) => void |  | Called with the destination panel index when a sweep starts. |
| onSweepEnd | (to: number) => void |  | Called with the destination panel index once the sweep has settled. |

## AsciiSweep.tsx

\`\`\`tsx
"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";

const canvasDimensionLimits = new WeakMap<WebGLRenderingContext | WebGL2RenderingContext, number>();

/\*\* Keep the existing DPR budget, then account for browser pinch zoom. \*/
function getCanvasPixelRatio(
  element: HTMLElement,
  context?: WebGLRenderingContext | WebGL2RenderingContext,
): number {
  const scale = window.visualViewport?.scale || 1;
  const requested = Math.min(window.devicePixelRatio || 1, 2) \* scale;
  const width = Math.max(element.clientWidth, 1);
  const height = Math.max(element.clientHeight, 1);
  let maxDimension = 8192;
  if (context) {
    let limit = canvasDimensionLimits.get(context);
    if (limit === undefined) {
      limit = Math.min(
        maxDimension,
        context.getParameter(context.MAX\_TEXTURE\_SIZE),
        context.getParameter(context.MAX\_RENDERBUFFER\_SIZE),
      );
      canvasDimensionLimits.set(context, limit);
    }
    maxDimension = limit;
  }
  // Rendering the full element preserves its CSS position and native input
  // geometry while panning. Bound allocations when zooming large canvases.
  return Math.min(
    requested,
    maxDimension / Math.max(width, height),
    Math.sqrt(16\_777\_216 / (width \* height)),
  );
}

/\*\* Pinch zoom changes visualViewport without resizing the element's CSS box. \*/
function createCanvasResizeObserver(onResize: () => void) {
  const viewport = window.visualViewport;
  let frame = 0;
  let disconnected = false;
  const schedule = () => {
    if (frame || disconnected) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      onResize();
    });
  };
  const observer = new ResizeObserver(schedule);
  window.addEventListener("resize", schedule, { passive: true });
  viewport?.addEventListener("resize", schedule, { passive: true });
  return {
    observe(element: Element, options?: ResizeObserverOptions) {
      observer.observe(element, options);
    },
    unobserve(element: Element) {
      observer.unobserve(element);
    },
    disconnect() {
      disconnected = true;
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", schedule);
      viewport?.removeEventListener("resize", schedule);
    },
  };
}

type HtmlInCanvasContext = CanvasRenderingContext2D & {
  drawElementImage: (element: Element, x: number, y: number) => DOMMatrix | void;
};

type HtmlInCanvasElement = HTMLCanvasElement & {
  updateElementGeometry?: (
    element: Element,
    options: { canvasTransform: DOMMatrix },
  ) => void;
};

/\*\* Configure the capture subtree for both generations of the experimental API. \*/
function prepareHtmlInCanvas(source: HTMLCanvasElement, content: HTMLElement) {
  if ("content" in source) {
    source.setAttribute("content", "drawable");
    content.setAttribute("drawable", "");
  } else {
    source.setAttribute("layoutsubtree", "");
  }
}

/\*\* Capture pixels and keep the native DOM hit-test region aligned with them. \*/
function drawHtmlInCanvas(
  source: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  content: HTMLElement,
) {
  const transform = (context as HtmlInCanvasContext).drawElementImage(content, 0, 0);
  const canvas = source as HtmlInCanvasElement;
  // Chrome 154 decoupled geometry from drawing before enabling automatic 2D
  // synchronization. Older versions have no update method; newer versions
  // synchronize automatically and return void. Use the returned matrix as-is:
  // drawElementImage already accounts for the canvas's pixel density.
  if (transform && typeof canvas.updateElementGeometry === "function") {
    canvas.updateElementGeometry(content, { canvasTransform: transform });
  }
}

export type AsciiSweepCharset = "ascii" | "blocks" | "binary";

export type AsciiSweepBlend = "auto" | "add" | "over";

export interface AsciiSweepOptions {
  /\*\* Sweep direction in degrees. 0 sweeps left to right, 90 sweeps bottom to top. \*/
  angle?: number;
  /\*\* Seconds the sweep takes from one panel to the other. \*/
  duration?: number;
  /\*\* Width of the ascii band as a fraction of the travel (0 to 1). \*/
  band?: number;
  /\*\* Feather of the band edges as a fraction of the band (0 to 1). \*/
  softness?: number;
  /\*\* How ragged the sweep edge is. Higher tears the boundary apart row by row. \*/
  turbulence?: number;
  /\*\* Length of the glowing trail left behind the band, as a fraction of the band. \*/
  trail?: number;
  /\*\* Drives the sweep manually from 0 to 1. Set to -1 to let the component animate itself. \*/
  progress?: number;
  /\*\* Size of one glyph pixel in CSS pixels. Characters are 5x5 glyph pixels. \*/
  scale?: number;
  /\*\* Empty glyph pixels around each character (0 to 3). \*/
  spacing?: number;
  /\*\* Built-in character ramp: real ascii glyphs, shade blocks, or binary digits. \*/
  charset?: AsciiSweepCharset;
  /\*\* Custom ramp of packed 5x5 bitmaps (dark to bright), overrides charset. \*/
  glyphs?: number[];
  /\*\* Color of the sweeping characters, as any CSS color. \*/
  color?: string;
  /\*\* How strongly the ink color replaces the content color (0 to 1). \*/
  tint?: number;
  /\*\* Soft phosphor glow around the characters (0 to 1). \*/
  glow?: number;
  /\*\* Chromatic aberration across the band, in CSS pixels. \*/
  aberration?: number;
  /\*\* How much characters flicker on and off as the band passes (0 to 1). \*/
  flicker?: number;
  /\*\* Share of cells inside the band that light up (0 to 1). \*/
  density?: number;
  /\*\* Horizontal tearing of content rows inside the band, in CSS pixels. \*/
  displace?: number;
  /\*\* Contrast applied to character density before picking a glyph. \*/
  contrast?: number;
  /\*\* Density offset applied before picking a glyph (-1 to 1). \*/
  brightness?: number;
  /\*\* Invert character density inside the band (0 to 1). \*/
  invert?: number;
  /\*\* Contrast against the background above which a pixel counts as content and grows characters. \*/
  threshold?: number;
  /\*\* How far the content dims underneath the band (0 to 1). \*/
  fade?: number;
  /\*\* How characters composite over the content. "auto" adds on dark pages and paints over on light ones. \*/
  blend?: AsciiSweepBlend;
  /\*\* Color of the page behind the content, as any CSS color, or "auto" to read it from the DOM. \*/
  background?: string;
  /\*\* Called when a sweep starts. \*/
  onSweepStart?: (to: number) => void;
  /\*\* Called once the sweep has fully settled on its destination panel. \*/
  onSweepEnd?: (to: number) => void;
}

export interface AsciiSweepSlot {
  /\*\* Canvas with layoutsubtree that hosts this panel's HTML. \*/
  source: HTMLCanvasElement;
  /\*\* The element inside the source canvas that gets captured. \*/
  content: HTMLElement;
}

export interface AsciiSweepElements {
  /\*\* The two panel slots the effect sweeps between. \*/
  slots: [AsciiSweepSlot, AsciiSweepSlot];
  /\*\* Canvas the WebGL effect renders to. \*/
  output: HTMLCanvasElement;
}

export interface AsciiSweepInstance {
  /\*\* Update effect options live. \*/
  setOptions: (options: AsciiSweepOptions) => void;
  /\*\* Sweep to slot 0 or 1. Pass an angle to override the configured direction for this sweep only. \*/
  sweep: (to: 0 | 1, options?: { angle?: number }) => void;
  /\*\* The slot the effect is resting on, or animating toward. \*/
  current: () => 0 | 1;
  /\*\* Force both panels to be captured again. \*/
  capture: () => void;
  /\*\* Re-read canvas size. Call when the element is resized. \*/
  resize: () => void;
  /\*\* Stop the loop and release all GPU resources. \*/
  destroy: () => void;
}

const CHARSETS: Record<AsciiSweepCharset, number[]> = {
  ascii: [
    0, 128, 131200, 14336, 459200, 469440, 4357252, 18157905, 11512810,
    15724526,
  ],
  blocks: [0, 328000, 22041621, 22369621, 11512810, 33554431],
  binary: [0, 4591758, 15324974],
};

/\*\* Seconds the settled effect takes to dissolve away. \*/
const FADE\_OUT\_S = 0.45;

const MAX\_GLYPHS = 16;
const FALLBACK\_CAPTURE\_DELAY = 500;

const DEFAULTS: Required<AsciiSweepOptions> = {
  angle: 0,
  duration: 2,
  band: 0.28,
  softness: 0.45,
  turbulence: 0.5,
  trail: 0.75,
  progress: -1,
  scale: 2,
  spacing: 1,
  charset: "ascii",
  glyphs: [],
  color: "#4ade80",
  tint: 0.75,
  glow: 2,
  aberration: 5,
  flicker: 0.35,
  density: 0.9,
  displace: 14,
  contrast: 1.2,
  brightness: 0,
  invert: 0,
  threshold: 0.1,
  fade: 0.75,
  blend: "auto",
  background: "auto",
  onSweepStart: () => {},
  onSweepEnd: () => {},
};

type PaintableCanvas = HTMLCanvasElement & {
  onpaint?: (() => void) | null;
  requestPaint?: () => void;
};

type ElementImageContext = CanvasRenderingContext2D & {
  drawElementImage?: (element: Element, x: number, y: number) => void;
};

const VERT = \`#version 300 es
precision highp float;
layout(location = 0) in vec2 aPos;
out vec2 vUv;
void main () {
  vUv = aPos \* 0.5 + 0.5;
  gl\_Position = vec4(aPos, 0.0, 1.0);
}\`;

const FRAG = \`#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;

uniform sampler2D uFrom;
uniform sampler2D uTo;
uniform vec2 uResolution;
uniform float uProgress;
uniform vec2 uDir;
uniform float uBand;
uniform float uSoftness;
uniform float uTurbulence;
uniform float uTrail;
uniform float uGlyphPx;
uniform float uSpacing;
uniform uint uGlyphs[${MAX\_GLYPHS}];
uniform int uGlyphCount;
uniform vec3 uInk;
uniform float uTint;
uniform float uGlow;
uniform float uAberration;
uniform float uFlicker;
uniform float uDensity;
uniform float uDisplace;
uniform float uContrast;
uniform float uBrightness;
uniform float uInvert;
uniform float uThreshold;
uniform float uFade;
uniform float uAdditive;
uniform vec3 uBg;
uniform float uBgLum;
uniform float uTime;
uniform float uLod;
uniform float uActive;
uniform float uMaxX;

#define S(a, b, t) smoothstep(a, b, t)

float glyphBit (int index, ivec2 p) {
  if (p.x < 0 || p.x > 4 || p.y < 0 || p.y > 4) return 0.0;
  uint bits = uGlyphs[index];
  return float((bits >> uint((4 - p.x) + 5 \* p.y)) & 1u);
}

float hash21 (vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) \* 43758.5453);
}

float hash31 (vec3 p) {
  return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) \* 43758.5453);
}

vec4 panel (sampler2D tex, vec2 uv, float lod, vec2 fringe) {
  vec4 c = textureLod(tex, uv, lod);
  if (uAberration > 0.001) {
    c.r = textureLod(tex, uv + fringe, lod).r;
    c.b = textureLod(tex, uv - fringe, lod).b;
  }
  return c;
}

void main () {
  if (uActive < 0.001) {
    outColor = vec4(0.0);
    return;
  }

  vec2 uv = vUv;
  // Leave the panel's scrollbar alone. The output canvas spans the whole
  // container, but the captured content stops where the scrollbar begins.
  if (uv.x > uMaxX) {
    outColor = vec4(0.0);
    return;
  }
  float cellPx = max((5.0 + 2.0 \* uSpacing) \* uGlyphPx, 1.0);
  vec2 frag = uv \* uResolution;
  vec2 cell = floor(frag / cellPx);
  vec2 cellUv = (cell + 0.5) \* cellPx / uResolution;

  // Normalized coordinate along the sweep axis: 0 where the band enters, 1 where it leaves.
  float extent = max(0.5 \* (abs(uDir.x) + abs(uDir.y)), 1e-4);
  float axis = dot(cellUv - 0.5, uDir) / (2.0 \* extent) + 0.5;

  float band = max(uBand, 1e-3);

  // Tear the edge apart per text row so the boundary eats lines instead of
  // cutting straight. Seeds are time independent so the edge does not crawl.
  float rowSeed = hash21(vec2(floor(cell.y \* 0.5), 19.7)) - 0.5;
  float cellSeed = hash21(cell \* 0.37 + 3.1) - 0.5;
  float jitter = (rowSeed \* 0.8 + cellSeed \* 0.4) \* uTurbulence \* band;
  axis += jitter;

  float feather = max(clamp(uSoftness, 0.0, 1.0) \* band, 1e-4);

  // The head travels just past the far edge, far enough for the character band
  // and its jittered edge to clear. Any glow still lingering past that is
  // dissolved by the fade out, rather than by stretching the travel further,
  // which would race the band across and leave the tail playing offscreen.
  float glowSpan = band \* (1.0 + uTrail) + feather;
  float travel = 1.0 + band \* (1.0 + uTrail) + uTurbulence \* band;
  float head = uProgress \* travel;
  float behind = head - axis;
  // Swap inside the band, where the characters are densest, so the change is
  // hidden. A wide crossfade would show both panels at once and read as ghosting.
  float swap = S(band \* 0.30, band \* 0.62, behind);
  float enter = S(0.0, feather, behind);
  float leave = 1.0 - S(band, band + max(uTrail, 0.001) \* band, behind);
  float ascii = clamp(enter \* leave, 0.0, 1.0);

  // A wider, softer envelope than the character band itself, used for bloom so
  // the glow reaches past the glyphs the way a phosphor tube does.
  float aura = (1.0 - S(0.0, glowSpan, abs(behind - band \* 0.5)))
    \* S(-feather \* 2.0, feather, behind);

  vec2 fringe = (uDir \* uAberration \* max(ascii, aura \* 0.5))
    / max(uResolution, vec2(1.0));

  vec2 texUv = vec2(uv.x, 1.0 - uv.y);
  if (uDisplace > 0.001) {
    // Displace in coarse horizontal slices that hold for a few frames, which
    // reads as tape tearing rather than per-frame noise.
    float sliceH = max(cellPx \* 1.6, 2.0);
    float slice = floor(frag.y / sliceH);
    float tick = floor(uTime \* 12.0);
    float pick = hash21(vec2(slice, tick));
    float tear = (hash21(vec2(slice \* 1.7, tick \* 0.31)) - 0.5)
      \* step(0.45, pick);
    texUv.x += (tear \* 2.0 \* uDisplace \* ascii) / max(uResolution.x, 1.0);
  }

  vec4 rawFrom = panel(uFrom, texUv, 0.0, fringe);
  vec4 rawTo = panel(uTo, texUv, 0.0, fringe);

  vec3 base = mix(
    mix(uBg, rawFrom.rgb, rawFrom.a),
    mix(uBg, rawTo.rgb, rawTo.a),
    swap);
  // Cover wherever either panel has ink, so the live DOM never shows through
  // mid-sweep and the two panels never appear stacked.
  float alpha = max(rawFrom.a, rawTo.a);

  vec2 cellTexUv = vec2(cellUv.x, 1.0 - cellUv.y);

  if (aura > 0.002) {
    // Bloom follows the edges the characters land on, not raw brightness.
    // Gating on absolute contrast would light up every filled region, so a
    // photo or a dark panel would bloom as one solid block. Comparing a sharp
    // sample against a broad one leaves only text, icons and real detail.
    vec2 spread = vec2(cellPx) / max(uResolution, vec2(1.0));
    float edge = 0.0;
    for (int i = 0; i < 5; i++) {
      vec2 tap = vec2(
        float(i == 1) - float(i == 2),
        float(i == 3) - float(i == 4)) \* spread;
      vec4 sFrom = textureLod(uFrom, texUv + tap, uLod);
      vec4 sTo = textureLod(uTo, texUv + tap, uLod);
      vec4 bFrom = textureLod(uFrom, texUv + tap, uLod + 2.5);
      vec4 bTo = textureLod(uTo, texUv + tap, uLod + 2.5);
      vec3 sharpRgb = mix(
        mix(uBg, sFrom.rgb, sFrom.a), mix(uBg, sTo.rgb, sTo.a), swap);
      vec3 broadRgb = mix(
        mix(uBg, bFrom.rgb, bFrom.a), mix(uBg, bTo.rgb, bTo.a), swap);
      edge += abs(
        dot(sharpRgb, vec3(0.299, 0.587, 0.114)) -
        dot(broadRgb, vec3(0.299, 0.587, 0.114)));
    }
    edge = clamp(edge / (5.0 \* 0.16), 0.0, 1.0);
    float haze = edge \* aura \* clamp(uGlow, 0.0, 2.0) \* 0.5;
    base += uInk \* haze \* (0.55 + 0.85 \* uAdditive);
    alpha = max(alpha, haze \* 0.8);
  }

  if (ascii > 0.002) {
    vec4 cellFrom = panel(uFrom, cellTexUv, uLod, fringe);
    vec4 cellTo = panel(uTo, cellTexUv, uLod, fringe);
    vec3 cellRgb = mix(
      mix(uBg, cellFrom.rgb, cellFrom.a),
      mix(uBg, cellTo.rgb, cellTo.a),
      swap);

    float lum = dot(cellRgb, vec3(0.299, 0.587, 0.114));
    float ink = abs(lum - uBgLum);
    float present = S(uThreshold \* 0.5, uThreshold + 0.02, ink);

    // Characters trace detail, not brightness. A broad average of the same
    // spot tells us whether this cell sits on an edge (text, icons, the fine
    // structure of a photo) or inside a flat region. Without this every cell
    // over a photo or a filled panel passes the ink test at once and the band
    // floods into a solid block of characters instead of following content.
    vec4 broadFrom = textureLod(uFrom, cellTexUv, uLod + 2.5);
    vec4 broadTo = textureLod(uTo, cellTexUv, uLod + 2.5);
    vec3 broadRgb = mix(
      mix(uBg, broadFrom.rgb, broadFrom.a),
      mix(uBg, broadTo.rgb, broadTo.a),
      swap);
    float detail = abs(lum - dot(broadRgb, vec3(0.299, 0.587, 0.114)));
    present \*= mix(0.5, 1.0, S(0.01, uThreshold + 0.06, detail));

    present \*= step(hash21(cell + 11.3), clamp(uDensity, 0.0, 1.0));
    if (uFlicker > 0.001) {
      float roll = hash31(vec3(cell, floor(uTime \* 18.0)));
      present \*= 1.0 - clamp(uFlicker, 0.0, 1.0) \* step(roll, 0.4);
    }

    // A cell averaged over a glyph rarely exceeds a third of full contrast, so
    // normalize into that range before picking a character. Without this every
    // cell lands on the blank end of the ramp.
    float t = clamp(ink / 0.35, 0.0, 1.0);
    float amount = clamp((t - 0.5) \* uContrast + 0.5 + uBrightness, 0.0, 1.0);
    amount = mix(amount, 1.0 - amount, clamp(uInvert, 0.0, 1.0));

    // Nudge the character choice per cell and per tick. Neighbouring cells then
    // land on different glyphs, which is what makes the band read as churning
    // text rather than as a regular screen of identical marks.
    float churn = hash31(vec3(cell, floor(uTime \* 15.0))) - 0.5;
    float picked = clamp(amount + churn \* 0.25, 0.0, 1.0);
    int index = min(int(picked \* float(uGlyphCount)), uGlyphCount - 1);

    ivec2 local = ivec2(floor((frag - cell \* cellPx) / max(uGlyphPx, 0.001)));
    int pad = int(uSpacing);
    float on = glyphBit(index, ivec2(local.x - pad, local.y - pad));

    // Push the sampled color away from the background so faint text still
    // reads as ink rather than fading into the page.
    vec3 contentInk = clamp(uBg + (cellRgb - uBg) / max(ink, 0.2), 0.0, 1.0);
    vec3 glyphColor = mix(contentInk, uInk, clamp(uTint, 0.0, 1.0));
    // Characters sit at their own brightness, so the band has depth instead of
    // every mark burning at one level.
    float level = 0.72 + 0.28 \* hash21(cell \* 0.91 + 7.7);
    glyphColor \*= level;
    // The brightest characters burn toward white, like a hot phosphor core.
    glyphColor = mix(glyphColor, vec3(1.0),
      amount \* amount \* level \* 0.55 \* uAdditive);

    float strength = ascii \* present;
    float lit = on \* strength;

    // Dim from the continuous band envelope rather than the per-cell mask, so
    // the paper behind the characters darkens smoothly instead of in squares.
    base = mix(base, uBg, clamp(uFade, 0.0, 1.0) \* ascii \* (1.0 - on));
    base = mix(mix(base, glyphColor, lit), base + glyphColor \* lit, uAdditive);
    alpha = max(alpha, lit);
  }

  base = clamp(base, 0.0, 1.0);
  alpha = clamp(alpha, 0.0, 1.0) \* uActive;
  outColor = vec4(base \* alpha, alpha);
}\`;

export function supportsHtmlInCanvas(): boolean {
  if (typeof document === "undefined") return false;
  const probe = document.createElement("canvas") as PaintableCanvas;
  const ctx = probe.getContext("2d") as ElementImageContext | null;
  return Boolean(
    ctx &&
    typeof ctx.drawElementImage === "function" &&
    typeof probe.requestPaint === "function",
  );
}

interface FallbackRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

interface FallbackPaintState {
  style: CSSStyleDeclaration;
  visible: boolean;
  opacity: number;
  clip: FallbackRect;
  childrenClip: FallbackRect;
}

function intersectFallbackRects(
  first: FallbackRect,
  second: FallbackRect,
): FallbackRect {
  return {
    left: Math.max(first.left, second.left),
    top: Math.max(first.top, second.top),
    right: Math.min(first.right, second.right),
    bottom: Math.min(first.bottom, second.bottom),
  };
}

function paintFallbackSnapshot(
  content: HTMLElement,
  canvas: HTMLCanvasElement,
  dpr: number,
) {
  const rootRect = content.getBoundingClientRect();
  const width = Math.max(1, Math.round(rootRect.width \* dpr));
  const height = Math.max(1, Math.round(rootRect.height \* dpr));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas is unavailable");
  ctx.resetTransform();
  ctx.clearRect(0, 0, width, height);
  ctx.scale(dpr, dpr);

  const rootClip: FallbackRect = {
    left: rootRect.left,
    top: rootRect.top,
    right: rootRect.right,
    bottom: rootRect.bottom,
  };
  const states = new WeakMap<Element, FallbackPaintState>();

  function resolveState(element: Element): FallbackPaintState {
    const cached = states.get(element);
    if (cached) return cached;

    const parent = element.parentElement;
    const parentState =
      parent && content.contains(parent) ? resolveState(parent) : null;
    const style = getComputedStyle(element);
    const ownOpacity = Number.parseFloat(style.opacity);
    const opacity =
      (parentState?.opacity ?? 1) \*
      (Number.isFinite(ownOpacity) ? ownOpacity : 1);
    const visible =
      (parentState?.visible ?? true) &&
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      style.visibility !== "collapse" &&
      opacity > 0;
    const clip = parentState?.childrenClip ?? rootClip;
    const rect = element.getBoundingClientRect();
    const childrenClip = { ...clip };
    if (style.overflowX !== "visible") {
      childrenClip.left = Math.max(childrenClip.left, rect.left);
      childrenClip.right = Math.min(childrenClip.right, rect.right);
    }
    if (style.overflowY !== "visible") {
      childrenClip.top = Math.max(childrenClip.top, rect.top);
      childrenClip.bottom = Math.min(childrenClip.bottom, rect.bottom);
    }

    const state = { style, visible, opacity, clip, childrenClip };
    states.set(element, state);
    return state;
  }

  const walker = document.createTreeWalker(content, NodeFilter.SHOW\_ELEMENT);
  let current: Node | null = walker.currentNode;
  while (current) {
    const element = current as HTMLElement;
    const rect = element.getBoundingClientRect();
    const state = resolveState(element);
    const visibleRect = intersectFallbackRects(rect, state.clip);
    if (
      state.visible &&
      visibleRect.right > visibleRect.left &&
      visibleRect.bottom > visibleRect.top
    ) {
      const { style } = state;
      ctx.save();
      ctx.beginPath();
      ctx.rect(
        state.clip.left - rootRect.left,
        state.clip.top - rootRect.top,
        state.clip.right - state.clip.left,
        state.clip.bottom - state.clip.top,
      );
      ctx.clip();
      ctx.globalAlpha = state.opacity;
      const x = rect.left - rootRect.left;
      const y = rect.top - rootRect.top;

      if (style.backgroundColor !== "transparent") {
        ctx.fillStyle = style.backgroundColor;
        ctx.fillRect(x, y, rect.width, rect.height);
      }

      paintFallbackMedia(ctx, element, style, rect, rootRect);
      paintFallbackText(ctx, element, style, rootRect);
      paintFallbackBorders(ctx, style, rect, rootRect);
      ctx.restore();
    }
    current = walker.nextNode();
  }
  ctx.globalAlpha = 1;
}

function paintFallbackMedia(
  ctx: CanvasRenderingContext2D,
  element: HTMLElement,
  style: CSSStyleDeclaration,
  rect: DOMRect,
  rootRect: DOMRect,
) {
  const drawable =
    element instanceof HTMLImageElement
      ? element.complete && element.naturalWidth > 0
        ? element
        : null
      : element instanceof HTMLCanvasElement
        ? element
        : element instanceof HTMLVideoElement && element.readyState >= 2
          ? element
          : null;
  if (!drawable) return;
  if (!isFallbackMediaOriginClean(drawable)) return;

  const sourceWidth =
    drawable instanceof HTMLImageElement
      ? drawable.naturalWidth
      : drawable instanceof HTMLVideoElement
        ? drawable.videoWidth
        : drawable.width;
  const sourceHeight =
    drawable instanceof HTMLImageElement
      ? drawable.naturalHeight
      : drawable instanceof HTMLVideoElement
        ? drawable.videoHeight
        : drawable.height;
  if (!(sourceWidth > 0 && sourceHeight > 0)) return;

  let sourceX = 0;
  let sourceY = 0;
  let cropWidth = sourceWidth;
  let cropHeight = sourceHeight;
  let targetX = rect.left - rootRect.left;
  let targetY = rect.top - rootRect.top;
  let targetWidth = rect.width;
  let targetHeight = rect.height;
  const [positionX, positionY] = resolveObjectPosition(style.objectPosition);
  if (style.objectFit === "cover") {
    const scale = Math.max(
      rect.width / sourceWidth,
      rect.height / sourceHeight,
    );
    cropWidth = rect.width / scale;
    cropHeight = rect.height / scale;
    sourceX = (sourceWidth - cropWidth) \* positionX;
    sourceY = (sourceHeight - cropHeight) \* positionY;
  } else if (
    style.objectFit === "contain" ||
    style.objectFit === "scale-down"
  ) {
    const containScale = Math.min(
      rect.width / sourceWidth,
      rect.height / sourceHeight,
      style.objectFit === "scale-down" ? 1 : Number.POSITIVE\_INFINITY,
    );
    targetWidth = sourceWidth \* containScale;
    targetHeight = sourceHeight \* containScale;
    targetX += (rect.width - targetWidth) \* positionX;
    targetY += (rect.height - targetHeight) \* positionY;
  }

  try {
    ctx.drawImage(
      drawable,
      sourceX,
      sourceY,
      cropWidth,
      cropHeight,
      targetX,
      targetY,
      targetWidth,
      targetHeight,
    );
  } catch {}
}

function isFallbackMediaOriginClean(
  drawable: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement,
): boolean {
  const probe = document.createElement("canvas");
  probe.width = probe.height = 1;
  const ctx = probe.getContext("2d", { willReadFrequently: true });
  if (!ctx) return false;
  try {
    ctx.drawImage(drawable, 0, 0, 1, 1);
    ctx.getImageData(0, 0, 1, 1);
    return true;
  } catch {
    return false;
  }
}

function resolveObjectPosition(position: string): [number, number] {
  const [x = "50%", y = "50%"] = position.split(/\\s+/);
  return [
    resolvePositionValue(x, "left", "right"),
    resolvePositionValue(y, "top", "bottom"),
  ];
}

function resolvePositionValue(
  value: string,
  start: string,
  end: string,
): number {
  if (value === start) return 0;
  if (value === end) return 1;
  if (value === "center") return 0.5;
  if (value.endsWith("%")) {
    return Math.min(1, Math.max(0, Number.parseFloat(value) / 100));
  }
  return 0.5;
}

function paintFallbackText(
  ctx: CanvasRenderingContext2D,
  element: HTMLElement,
  style: CSSStyleDeclaration,
  rootRect: DOMRect,
) {
  const textNodes = Array.from(element.childNodes).filter(
    (node) => node.nodeType === Node.TEXT\_NODE && node.textContent?.trim(),
  );
  if (textNodes.length === 0) return;

  ctx.fillStyle = style.color;
  ctx.font = \`${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}\`;
  ctx.textBaseline = "alphabetic";
  if ("letterSpacing" in ctx) {
    ctx.letterSpacing =
      style.letterSpacing === "normal" ? "0px" : style.letterSpacing;
  }
  const textAlign: CanvasTextAlign =
    style.textAlign === "center" ||
    style.textAlign === "right" ||
    style.textAlign === "start" ||
    style.textAlign === "end"
      ? style.textAlign
      : "left";
  const direction: CanvasDirection = style.direction === "rtl" ? "rtl" : "ltr";
  ctx.textAlign = textAlign;
  ctx.direction = direction;

  const whiteSpace = style.whiteSpace;
  const preservesNewlines =
    whiteSpace === "pre" ||
    whiteSpace === "pre-wrap" ||
    whiteSpace === "pre-line" ||
    whiteSpace === "break-spaces";
  const preservesSpaces = preservesNewlines && whiteSpace !== "pre-line";

  const anchor =
    textAlign === "center"
      ? 0.5
      : textAlign === "right" ||
          (textAlign === "end" && direction === "ltr") ||
          (textAlign === "start" && direction === "rtl")
        ? 1
        : 0;

  function transform(text: string): string {
    if (style.textTransform === "uppercase") return text.toUpperCase();
    if (style.textTransform === "lowercase") return text.toLowerCase();
    return text;
  }

  function drawAcrossRects(text: string, rects: DOMRect[]) {
    const visible = rects.filter(
      (rect) =>
        rect.right > rootRect.left &&
        rect.left < rootRect.right &&
        rect.bottom > rootRect.top &&
        rect.top < rootRect.bottom,
    );
    if (visible.length === 0) return;
    const totalWidth = visible.reduce((sum, rect) => sum + rect.width, 0);
    let offset = 0;
    for (let index = 0; index < visible.length; index++) {
      const rect = visible[index];
      const remaining = text.length - offset;
      if (remaining <= 0) break;
      const count =
        index === visible.length - 1
          ? remaining
          : Math.min(
              remaining,
              Math.max(1, Math.round((text.length \* rect.width) / totalWidth)),
            );
      const slice = text.slice(offset, offset + count);
      offset += count;
      const line = preservesSpaces ? slice : slice.trim();
      if (!line.trim()) continue;
      const x = rect.left - rootRect.left + rect.width \* anchor;
      const metrics = ctx.measureText(line);
      const ascent = metrics.fontBoundingBoxAscent ?? 0;
      const descent = metrics.fontBoundingBoxDescent ?? 0;
      const y =
        ascent > 0
          ? rect.top -
            rootRect.top +
            (rect.height - ascent - descent) / 2 +
            ascent
          : rect.bottom - rootRect.top - rect.height \* 0.2;
      ctx.fillText(line, x, y, Math.max(rect.width, 1));
    }
  }

  for (const node of textNodes) {
    const raw = node.textContent ?? "";
    const range = document.createRange();

    if (preservesNewlines) {
      let position = 0;
      for (const part of raw.split("\\n")) {
        const start = position;
        position += part.length + 1;
        if (!part.trim()) continue;
        range.setStart(node, start);
        range.setEnd(node, start + part.length);
        const text = transform(
          preservesSpaces ? part : part.replace(/\\s+/g, " ").trim(),
        );
        drawAcrossRects(text, Array.from(range.getClientRects()));
      }
      continue;
    }

    const text = transform(raw.replace(/\\s+/g, " ").trim());
    if (!text) continue;
    range.selectNodeContents(node);
    drawAcrossRects(text, Array.from(range.getClientRects()));
  }
}

function paintFallbackBorders(
  ctx: CanvasRenderingContext2D,
  style: CSSStyleDeclaration,
  rect: DOMRect,
  rootRect: DOMRect,
) {
  const x = rect.left - rootRect.left;
  const y = rect.top - rootRect.top;
  const top = Number.parseFloat(style.borderTopWidth);
  const right = Number.parseFloat(style.borderRightWidth);
  const bottom = Number.parseFloat(style.borderBottomWidth);
  const left = Number.parseFloat(style.borderLeftWidth);
  if (top > 0) {
    ctx.fillStyle = style.borderTopColor;
    ctx.fillRect(x, y, rect.width, top);
  }
  if (right > 0) {
    ctx.fillStyle = style.borderRightColor;
    ctx.fillRect(x + rect.width - right, y, right, rect.height);
  }
  if (bottom > 0) {
    ctx.fillStyle = style.borderBottomColor;
    ctx.fillRect(x, y + rect.height - bottom, rect.width, bottom);
  }
  if (left > 0) {
    ctx.fillStyle = style.borderLeftColor;
    ctx.fillRect(x, y, left, rect.height);
  }
}

export function createAsciiSweep(
  elements: AsciiSweepElements,
  options: AsciiSweepOptions = {},
): AsciiSweepInstance | null {
  try {
    return initializeAsciiSweep(elements, options);
  } catch (error) {
    console.error("AsciiSweep initialization failed:", error);
    return null;
  }
}

interface SlotState {
  source: HTMLCanvasElement;
  content: HTMLElement;
  ctx: ElementImageContext | null;
  paintable: PaintableCanvas;
  texture: WebGLTexture;
  fallbackCanvas: HTMLCanvasElement | null;
  dirty: boolean;
  /\*\* Timestamp of the most recent capture that reached the texture. \*/
  stamp: number;
  captureTimer: number;
  captureDeadline: number;
  scrollTimer: number;
  capturedScrollLeft: number;
  capturedScrollTop: number;
  captureErrorLogged: boolean;
  uploadErrorLogged: boolean;
}

function initializeAsciiSweep(
  elements: AsciiSweepElements,
  options: AsciiSweepOptions,
): AsciiSweepInstance | null {
  const config = { ...DEFAULTS, ...options };
  const { slots, output } = elements;
  if (!slots || slots.length !== 2) {
    throw new Error("AsciiSweep needs exactly two slots");
  }

  const gl = output.getContext("webgl2", {
    alpha: true,
    depth: false,
    stencil: false,
    antialias: false,
    premultipliedAlpha: true,
  });
  if (!gl || gl.isContextLost()) return null;

  const probeCtx = (() => {
    const probe = document.createElement("canvas");
    probe.width = probe.height = 1;
    return probe.getContext("2d", { willReadFrequently: true });
  })();

  function parseColor(value: string): [number, number, number] | null {
    if (!probeCtx || !value) return null;
    probeCtx.clearRect(0, 0, 1, 1);
    probeCtx.fillStyle = "#000";
    probeCtx.fillStyle = value;
    const resolved = probeCtx.fillStyle;
    probeCtx.clearRect(0, 0, 1, 1);
    probeCtx.fillStyle = resolved;
    probeCtx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = probeCtx.getImageData(0, 0, 1, 1).data;
    if (a === 0) return null;
    return [r / 255, g / 255, b / 255];
  }

  let destroyed = false;
  let wake = () => {};

  function compile(type: number, text: string): WebGLShader {
    const shader = gl!.createShader(type)!;
    gl!.shaderSource(shader, text);
    gl!.compileShader(shader);
    if (!gl!.getShaderParameter(shader, gl!.COMPILE\_STATUS)) {
      const message = gl!.getShaderInfoLog(shader) || "Unknown shader error";
      gl!.deleteShader(shader);
      throw new Error(message);
    }
    return shader;
  }

  const vertexShader = compile(gl.VERTEX\_SHADER, VERT);
  const fragmentShader = compile(gl.FRAGMENT\_SHADER, FRAG);
  const program = gl.createProgram()!;
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK\_STATUS)) {
    const message =
      gl.getProgramInfoLog(program) || "Unknown program link error";
    gl.deleteProgram(program);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    throw new Error(message);
  }

  const uniforms: Record<string, WebGLUniformLocation> = {};
  const uniformCount = gl.getProgramParameter(program, gl.ACTIVE\_UNIFORMS);
  for (let i = 0; i < uniformCount; i++) {
    const info = gl.getActiveUniform(program, i)!;
    uniforms[info.name] = gl.getUniformLocation(program, info.name)!;
  }

  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY\_BUFFER, quad);
  gl.bufferData(
    gl.ARRAY\_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC\_DRAW,
  );
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  function createSlotTexture(): WebGLTexture {
    const texture = gl!.createTexture()!;
    gl!.bindTexture(gl!.TEXTURE\_2D, texture);
    gl!.texParameteri(
      gl!.TEXTURE\_2D,
      gl!.TEXTURE\_MIN\_FILTER,
      gl!.LINEAR\_MIPMAP\_LINEAR,
    );
    gl!.texParameteri(gl!.TEXTURE\_2D, gl!.TEXTURE\_MAG\_FILTER, gl!.LINEAR);
    gl!.texParameteri(gl!.TEXTURE\_2D, gl!.TEXTURE\_WRAP\_S, gl!.CLAMP\_TO\_EDGE);
    gl!.texParameteri(gl!.TEXTURE\_2D, gl!.TEXTURE\_WRAP\_T, gl!.CLAMP\_TO\_EDGE);
    gl!.texImage2D(
      gl!.TEXTURE\_2D,
      0,
      gl!.RGBA,
      1,
      1,
      0,
      gl!.RGBA,
      gl!.UNSIGNED\_BYTE,
      new Uint8Array([0, 0, 0, 0]),
    );
    return texture;
  }

  const firstCtx = slots[0].source.getContext(
    "2d",
  ) as ElementImageContext | null;
  const htmlInCanvas = Boolean(
    firstCtx &&
    typeof firstCtx.drawElementImage === "function" &&
    typeof (slots[0].source as PaintableCanvas).requestPaint === "function",
  );

  if (htmlInCanvas) {
    for (const slot of slots) prepareHtmlInCanvas(slot.source, slot.content);
  }

  const states: SlotState[] = slots.map((slot, index) => ({
    source: slot.source,
    content: slot.content,
    ctx:
      index === 0
        ? firstCtx
        : (slot.source.getContext("2d") as ElementImageContext | null),
    paintable: slot.source as PaintableCanvas,
    texture: createSlotTexture(),
    fallbackCanvas: null,
    dirty: false,
    stamp: 0,
    captureTimer: 0,
    captureDeadline: 0,
    scrollTimer: 0,
    capturedScrollLeft: 0,
    capturedScrollTop: 0,
    captureErrorLogged: false,
    uploadErrorLogged: false,
  }));

  if (htmlInCanvas) {
    for (const state of states) {
      state.paintable.onpaint = () => {
        try {
          state.ctx!.reset();
          drawHtmlInCanvas(state.source, state.ctx!, state.content);
          state.dirty = true;
          wake();
        } catch {}
      };
    }
  }

  function queueCapture(state: SlotState, immediate = false) {
    if (htmlInCanvas || destroyed) return;
    const delay = immediate ? 0 : FALLBACK\_CAPTURE\_DELAY;
    const deadline = performance.now() + delay;
    if (state.captureTimer && state.captureDeadline <= deadline) return;
    window.clearTimeout(state.captureTimer);
    state.captureDeadline = deadline;
    state.captureTimer = window.setTimeout(
      () => captureFallback(state),
      delay,
    );
  }

  function captureFallback(state: SlotState) {
    window.clearTimeout(state.captureTimer);
    window.clearTimeout(state.scrollTimer);
    state.captureTimer = 0;
    state.scrollTimer = 0;
    try {
      paintFallbackSnapshot(state.content, state.source, getCanvasPixelRatio(output, gl!));
      if (destroyed) return;
      state.fallbackCanvas = state.source;
      state.capturedScrollLeft = state.content.scrollLeft;
      state.capturedScrollTop = state.content.scrollTop;
      state.dirty = true;
      state.captureErrorLogged = false;
      wake();
    } catch (error) {
      if (!destroyed && !state.captureErrorLogged) {
        state.captureErrorLogged = true;
        console.warn("AsciiSweep could not capture its HTML fallback:", error);
      }
    }
  }

  function requestCapture(immediate = false) {
    for (const state of states) {
      if (htmlInCanvas) state.paintable.requestPaint?.();
      else queueCapture(state, immediate);
    }
  }

  /\*\*
   \* Both panels stay visible and captured at all times, because a panel that
   \* is hidden when the browser repaints captures as an empty texture, and
   \* sweeping back to it would then reveal nothing. Instead the panel on show
   \* is stacked on top and painted opaque, so it occludes the other one while
   \* the effect is at rest and the real DOM stays live and selectable.
   \*/
  function applyStacking(shown: 0 | 1) {
    states.forEach((state, index) => {
      const front = index === shown;
      // The stacking layer is the source canvas under html-in-canvas, because
      // the two canvases are the siblings that overlap. In the DOM fallback the
      // content element is itself the layer.
      const layer = htmlInCanvas ? state.source : state.content;
      // Scrollbars are deliberately left alone. Both panels are the same size
      // and scroll together, so whichever is in front shows a scrollbar in the
      // same place. Toggling it per panel would add and remove a scrollbar
      // mid sweep and reflow the content underneath.
      layer.style.zIndex = front ? "1" : "0";
      layer.style.pointerEvents = front ? "" : "none";
      // The captured element carries the page background so the front panel is
      // opaque and fully occludes the one behind it.
      state.content.style.backgroundColor = backgroundCss;
      // Keep the panel behind out of the tab order and the accessibility tree,
      // so assistive tech never sees both panels at once.
      if (front) layer.removeAttribute("aria-hidden");
      else layer.setAttribute("aria-hidden", "true");
      layer.inert = !front;
    });
  }

  let contentMaxX = 1;

  function syncCanvasSize(): boolean {
    let changed = false;
    // clientWidth excludes the panel's own scrollbar, so this is the fraction
    // of the output the captured content actually covers.
    contentMaxX = Math.min(
      1,
      Math.max(
        0.05,
        states[0].content.clientWidth / Math.max(output.clientWidth, 1),
      ),
    );
    const dpr = getCanvasPixelRatio(output, gl!);
    const width = Math.max(1, Math.round(output.clientWidth \* dpr));
    const height = Math.max(1, Math.round(output.clientHeight \* dpr));
    if (output.width !== width || output.height !== height) {
      output.width = width;
      output.height = height;
      changed = true;
    }
    if (htmlInCanvas) {
      for (const state of states) {
        const sourceWidth = Math.max(1, Math.round(state.source.clientWidth \* dpr));
        const sourceHeight = Math.max(1, Math.round(state.source.clientHeight \* dpr));
        if (
          state.source.width !== sourceWidth ||
          state.source.height !== sourceHeight
        ) {
          state.source.width = sourceWidth;
          state.source.height = sourceHeight;
          changed = true;
        }
        state.paintable.requestPaint?.();
      }
    }
    return changed;
  }

  syncCanvasSize();

  let backingRgb: [number, number, number] = [1, 1, 1];
  let backingLum = 1;
  let inkRgb: [number, number, number] = [0.29, 0.87, 0.5];
  let backgroundCss = "#ffffff";

  function syncBacking() {
    let resolved: [number, number, number] | null = null;
    let resolvedCss: string | null = null;
    if (config.background && config.background !== "auto") {
      resolved = parseColor(config.background);
      if (resolved) resolvedCss = config.background;
    }
    if (!resolved) {
      let el: Element | null = states[0].content;
      while (el) {
        const bg = getComputedStyle(el).backgroundColor;
        if (bg && bg !== "transparent") {
          const parsed = parseColor(bg);
          if (parsed) {
            resolved = parsed;
            resolvedCss = bg;
            break;
          }
        }
        el = el.parentElement;
      }
    }
    backingRgb = resolved ?? [1, 1, 1];
    backingLum =
      0.299 \* backingRgb[0] + 0.587 \* backingRgb[1] + 0.114 \* backingRgb[2];
    backgroundCss = resolvedCss ?? "#ffffff";
    inkRgb = parseColor(config.color) ?? [0.29, 0.87, 0.5];
  }

  syncBacking();

  const glyphData = new Uint32Array(MAX\_GLYPHS);

  function resolveGlyphs(): number {
    const ramp =
      config.glyphs.length > 1
        ? config.glyphs
        : (CHARSETS[config.charset] ?? CHARSETS.ascii);
    const count = Math.min(ramp.length, MAX\_GLYPHS);
    glyphData.fill(0);
    for (let i = 0; i < count; i++) glyphData[i] = ramp[i] >>> 0;
    return count;
  }

  function uploadSlot(state: SlotState) {
    const bitmap = htmlInCanvas ? state.source : state.fallbackCanvas;
    if (!bitmap || !state.dirty) return;
    if (bitmap.width < 1 || bitmap.height < 1) return;
    state.dirty = false;
    try {
      gl!.bindTexture(gl!.TEXTURE\_2D, state.texture);
      gl!.texImage2D(
        gl!.TEXTURE\_2D,
        0,
        gl!.RGBA,
        gl!.RGBA,
        gl!.UNSIGNED\_BYTE,
        bitmap,
      );
      gl!.generateMipmap(gl!.TEXTURE\_2D);
      state.stamp = performance.now();
      state.uploadErrorLogged = false;
    } catch (error) {
      if (!state.uploadErrorLogged) {
        state.uploadErrorLogged = true;
        console.warn("AsciiSweep could not upload a panel texture:", error);
      }
    }
  }

  let currentSlot: 0 | 1 = 0;
  let fromSlot: 0 | 1 = 0;
  let toSlot: 0 | 1 = 1;
  let progress = 0;
  let sweeping = false;
  let sweepStart = 0;
  let sweepClockSet = false;
  let sweepAngle = config.angle;
  let settleFrames = 0;
  let active = 0;
  let fadingOut = false;

  const controlled = () => config.progress >= 0;

  function render(now: number) {
    for (const state of states) uploadSlot(state);

    const from = states[fromSlot];
    const to = states[toSlot];

    gl!.useProgram(program);
    gl!.activeTexture(gl!.TEXTURE0);
    gl!.bindTexture(gl!.TEXTURE\_2D, from.texture);
    gl!.uniform1i(uniforms.uFrom, 0);
    gl!.activeTexture(gl!.TEXTURE1);
    gl!.bindTexture(gl!.TEXTURE\_2D, to.texture);
    gl!.uniform1i(uniforms.uTo, 1);

    gl!.uniform2f(uniforms.uResolution, output.width, output.height);
    gl!.uniform1f(uniforms.uProgress, progress);

    const radians = (sweepAngle \* Math.PI) / 180;
    gl!.uniform2f(uniforms.uDir, Math.cos(radians), Math.sin(radians));

    const dpr = output.width / Math.max(output.clientWidth, 1);
    const glyphCss = Math.max(config.scale, 0.5);
    const spacing = Math.round(Math.min(Math.max(config.spacing, 0), 3));
    gl!.uniform1f(uniforms.uGlyphPx, glyphCss \* dpr);
    gl!.uniform1f(uniforms.uSpacing, spacing);
    // The content texture is in device pixels, so the LOD that averages a cell
    // has to be derived in device pixels too.
    gl!.uniform1f(
      uniforms.uLod,
      Math.max(0, Math.log2((5 + 2 \* spacing) \* glyphCss \* dpr) - 1),
    );

    const glyphCount = resolveGlyphs();
    gl!.uniform1uiv(uniforms["uGlyphs[0]"], glyphData);
    gl!.uniform1i(uniforms.uGlyphCount, glyphCount);

    gl!.uniform1f(uniforms.uBand, Math.min(Math.max(config.band, 0.02), 1));
    gl!.uniform1f(uniforms.uSoftness, config.softness);
    gl!.uniform1f(uniforms.uTurbulence, Math.max(config.turbulence, 0));
    gl!.uniform1f(uniforms.uTrail, Math.max(config.trail, 0));
    gl!.uniform3f(uniforms.uInk, inkRgb[0], inkRgb[1], inkRgb[2]);
    gl!.uniform1f(uniforms.uTint, config.tint);
    gl!.uniform1f(uniforms.uGlow, config.glow);
    gl!.uniform1f(uniforms.uAberration, Math.max(config.aberration, 0) \* dpr);
    gl!.uniform1f(uniforms.uFlicker, config.flicker);
    gl!.uniform1f(uniforms.uDensity, config.density);
    gl!.uniform1f(uniforms.uDisplace, Math.max(config.displace, 0) \* dpr);
    gl!.uniform1f(uniforms.uContrast, Math.max(config.contrast, 0));
    gl!.uniform1f(uniforms.uBrightness, config.brightness);
    gl!.uniform1f(uniforms.uInvert, config.invert);
    gl!.uniform1f(uniforms.uThreshold, Math.max(config.threshold, 0.001));
    gl!.uniform1f(uniforms.uFade, config.fade);
    gl!.uniform1f(
      uniforms.uAdditive,
      config.blend === "add"
        ? 1
        : config.blend === "over"
          ? 0
          : backingLum < 0.5
            ? 1
            : 0,
    );
    gl!.uniform3f(uniforms.uBg, backingRgb[0], backingRgb[1], backingRgb[2]);
    gl!.uniform1f(uniforms.uBgLum, backingLum);
    gl!.uniform1f(uniforms.uTime, now / 1000);
    gl!.uniform1f(uniforms.uActive, active);
    gl!.uniform1f(uniforms.uMaxX, contentMaxX);

    gl!.bindFramebuffer(gl!.FRAMEBUFFER, null);
    gl!.viewport(0, 0, output.width, output.height);
    gl!.clearColor(0, 0, 0, 0);
    gl!.clear(gl!.COLOR\_BUFFER\_BIT);
    gl!.drawArrays(gl!.TRIANGLE\_STRIP, 0, 4);
  }

  let raf = 0;
  let running = false;
  let lastFrame = performance.now();
  let visible = true;
  let pageVisible =
    typeof document === "undefined" || document.visibilityState !== "hidden";

  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reducedMotion = motionQuery.matches;

  function ease(t: number): number {
    // Ease out. Velocity is highest at the very start, so the band reacts the
    // instant the panel changes instead of easing in from a standstill.
    const c = 1 - Math.min(Math.max(t, 0), 1);
    return 1 - c \* c \* c;
  }

  /\*\* Exact inverse of ease(), used to re-anchor the clock mid sweep. \*/
  function easeInverse(p: number): number {
    return 1 - Math.cbrt(1 - Math.min(Math.max(p, 0), 1));
  }

  function frame(now: number) {
    if (destroyed) return;
    if (!visible || !pageVisible) {
      running = false;
      return;
    }

    if (controlled()) {
      progress = Math.min(Math.max(config.progress, 0), 1);
      fromSlot = 0;
      toSlot = 1;
      const shown: 0 | 1 = progress >= 0.5 ? 1 : 0;
      if (shown !== currentSlot) {
        currentSlot = shown;
        applyStacking(currentSlot);
      }
      active = 1;
      render(now);
      running = false;
      return;
    }

    if (sweeping) {
      // Start timing from the first frame that actually renders. The first
      // sweep pays for the initial panel paints, texture uploads and mipmap
      // builds, and starting the clock at the click would spend that setup
      // time out of the animation, leaving the band parked at the edge.
      if (!sweepClockSet) {
        sweepClockSet = true;
        sweepStart = now;
      }
      const duration = Math.max(config.duration, 0.05);
      const linear = reducedMotion
        ? 1
        : Math.min(1, (now - sweepStart) / 1000 / duration);
      progress = ease(linear);
      if (linear >= 1) {
        progress = 1;
        sweeping = false;
        // Hold the effect for a couple of frames after it lands so the panel
        // underneath is fully painted before the canvas goes transparent.
        settleFrames = 2;
        config.onSweepEnd?.(currentSlot);
      }
    }

    if (fadingOut) {
      // Ease the whole effect out rather than switching it off, so any glow
      // still lingering at the end of the travel dissolves instead of popping.
      const step = reducedMotion ? 1 : (now - lastFrame) / 1000 / FADE\_OUT\_S;
      active = Math.max(0, active - Math.max(step, 0));
      if (active <= 0.001) {
        active = 0;
        fadingOut = false;
      }
    }
    lastFrame = now;

    render(now);

    if (!sweeping && !fadingOut) {
      if (settleFrames > 0) {
        settleFrames -= 1;
        if (settleFrames === 0) fadingOut = true;
      } else if (active === 0) {
        running = false;
        return;
      }
    }

    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (destroyed || running || !visible || !pageVisible) return;
    running = true;
    lastFrame = performance.now();
    raf = requestAnimationFrame(frame);
  }

  wake = start;
  applyStacking(currentSlot);
  requestCapture(true);
  start();

  function sweep(to: 0 | 1, sweepOptions?: { angle?: number }) {
    if (destroyed || controlled()) return;
    const target: 0 | 1 = to === 1 ? 1 : 0;
    // Already resting on this panel, or already on the way to it.
    if (sweeping ? target === toSlot : target === currentSlot) return;

    if (sweeping) {
      // Interrupting a sweep in flight. Run the band backwards from wherever
      // it currently is instead of restarting it at the edge, which would make
      // it jump across the panel. Mirroring the progress and the direction
      // together keeps the band in the same place on screen, and the swap it
      // has already made is hidden under the characters as it passes back.
      progress = 1 - progress;
      const previousFrom = fromSlot;
      fromSlot = toSlot;
      toSlot = previousFrom;
      // Wrapped, so a long run of reversals cannot drift the angle.
      sweepAngle = (sweepAngle + 180) % 360;
      // Anchor the clock to the progress being resumed so the band keeps its
      // speed. The remaining travel then takes exactly as long as it should:
      // an immediate change of mind snaps back, a late one has further to go.
      sweepStart =
        performance.now() -
        easeInverse(progress) \* Math.max(config.duration, 0.05) \* 1000;
      sweepClockSet = true;
    } else {
      fromSlot = currentSlot;
      toSlot = target;
      progress = 0;
      sweepAngle = sweepOptions?.angle ?? config.angle;
      // Anchor on the first rendered frame instead, so the one-off cost of the
      // first paint and texture upload is not deducted from the animation.
      sweepClockSet = false;
    }

    currentSlot = target;
    sweeping = true;
    settleFrames = 0;
    fadingOut = false;
    active = 1;
    // Raise the destination panel now. Both panels are always captured, so the
    // textures for either side of the sweep are already valid.
    applyStacking(currentSlot);
    requestCapture(true);
    config.onSweepStart?.(target);
    start();
  }

  function onMotionChange() {
    reducedMotion = motionQuery.matches;
    start();
  }
  motionQuery.addEventListener("change", onMotionChange);

  let themeTimer = 0;
  function onThemeShift() {
    syncBacking();
    start();
    window.clearTimeout(themeTimer);
    themeTimer = window.setTimeout(() => {
      syncBacking();
      requestCapture();
      start();
    }, 300);
  }

  const themeObserver = new MutationObserver(onThemeShift);
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class", "style", "data-theme"],
  });
  const schemeQuery = window.matchMedia("(prefers-color-scheme: dark)");
  schemeQuery.addEventListener("change", onThemeShift);

  const resizeObserver = createCanvasResizeObserver(() => {
    if (syncCanvasSize()) requestCapture();
    start();
  });
  resizeObserver.observe(output);
  for (const state of states) resizeObserver.observe(state.content);

  const intersection = new IntersectionObserver((entries) => {
    visible = entries[entries.length - 1]?.isIntersecting ?? true;
    if (visible) start();
  });
  intersection.observe(output);

  // Keep both panels at the same scroll offset. The panel behind is inert, so
  // it never scrolls on its own, and a sweep would otherwise reveal the
  // incoming content at the top while the outgoing one sits further down.
  let syncingScroll = false;
  function onPanelScroll(event: Event) {
    if (syncingScroll || destroyed) return;
    const source = event.target as HTMLElement | null;
    if (!source) return;
    syncingScroll = true;
    for (const state of states) {
      if (state.content === source) continue;
      if (state.content.scrollTop !== source.scrollTop) {
        state.content.scrollTop = source.scrollTop;
      }
      if (state.content.scrollLeft !== source.scrollLeft) {
        state.content.scrollLeft = source.scrollLeft;
      }
    }
    syncingScroll = false;
    requestCapture();
    start();
  }
  for (const state of states) {
    state.content.addEventListener("scroll", onPanelScroll, { passive: true });
  }

  function onPageVisibility() {
    pageVisible = document.visibilityState !== "hidden";
    if (pageVisible) start();
  }
  document.addEventListener("visibilitychange", onPageVisibility);

  const contentObservers = htmlInCanvas
    ? []
    : states.map((state) => {
        const observer = new MutationObserver(() => queueCapture(state));
        observer.observe(state.content, {
          attributes: true,
          attributeFilter: ["class", "hidden", "src", "srcset", "style"],
          characterData: true,
          childList: true,
          subtree: true,
        });
        return observer;
      });

  function onFallbackVisualChange() {
    for (const state of states) queueCapture(state);
  }

  if (!htmlInCanvas) {
    for (const state of states) {
      state.content.addEventListener("load", onFallbackVisualChange, true);
      state.content.addEventListener(
        "loadeddata",
        onFallbackVisualChange,
        true,
      );
      state.content.addEventListener("input", onFallbackVisualChange, true);
      state.content.addEventListener("change", onFallbackVisualChange, true);
      state.content.addEventListener(
        "transitionend",
        onFallbackVisualChange,
        true,
      );
      state.content.addEventListener(
        "animationend",
        onFallbackVisualChange,
        true,
      );
    }
    document.fonts?.addEventListener("loadingdone", onFallbackVisualChange);
  }

  return {
    setOptions(next) {
      let changed = false;
      for (const [key, value] of Object.entries(next)) {
        if (typeof value === "function") continue;
        const prev = config[key as keyof typeof config];
        if (Array.isArray(value) && Array.isArray(prev)) {
          if (
            value.length !== prev.length ||
            value.some((item, i) => item !== prev[i])
          ) {
            changed = true;
            break;
          }
        } else if (prev !== value) {
          changed = true;
          break;
        }
      }
      Object.assign(config, next);
      if (!changed) return;
      syncBacking();
      start();
    },
    sweep,
    current: () => currentSlot,
    capture: () => {
      requestCapture(true);
      start();
    },
    resize() {
      syncCanvasSize();
      syncBacking();
      requestCapture();
      start();
    },
    destroy() {
      destroyed = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(themeTimer);
      resizeObserver.disconnect();
      intersection.disconnect();
      themeObserver.disconnect();
      for (const observer of contentObservers) observer.disconnect();
      schemeQuery.removeEventListener("change", onThemeShift);
      motionQuery.removeEventListener("change", onMotionChange);
      document.removeEventListener("visibilitychange", onPageVisibility);
      if (!htmlInCanvas) {
        for (const state of states) {
          state.content.removeEventListener("load", onFallbackVisualChange, true);
          state.content.removeEventListener(
            "loadeddata",
            onFallbackVisualChange,
            true,
          );
          state.content.removeEventListener(
            "input",
            onFallbackVisualChange,
            true,
          );
          state.content.removeEventListener(
            "change",
            onFallbackVisualChange,
            true,
          );
          state.content.removeEventListener(
            "transitionend",
            onFallbackVisualChange,
            true,
          );
          state.content.removeEventListener(
            "animationend",
            onFallbackVisualChange,
            true,
          );
        }
        document.fonts?.removeEventListener(
          "loadingdone",
          onFallbackVisualChange,
        );
      }
      for (const state of states) {
        state.content.removeEventListener("scroll", onPanelScroll);
        window.clearTimeout(state.captureTimer);
        window.clearTimeout(state.scrollTimer);
        gl!.deleteTexture(state.texture);
        if (htmlInCanvas) state.paintable.onpaint = null;
      }
      gl!.deleteProgram(program);
      gl!.deleteShader(vertexShader);
      gl!.deleteShader(fragmentShader);
      gl!.deleteBuffer(quad);
    },
  };
}

export interface AsciiSweepProps extends AsciiSweepOptions {
  /\*\* The first panel. \*/
  children: ReactNode;
  /\*\* The second panel, swapped in when index is 1. \*/
  alternate?: ReactNode;
  /\*\* Which panel to show. Changing it sweeps to that panel. \*/
  index?: number;
  /\*\* Flip the sweep 180 degrees when sweeping back to the first panel. \*/
  directional?: boolean;
  className?: string;
  style?: CSSProperties;
}

const emptySubscribe = () => () => {};

const panelStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  overflow: "auto",
};

export function AsciiSweep({
  children,
  alternate,
  index = 0,
  directional = true,
  className,
  style,
  ...options
}: AsciiSweepProps) {
  const sourceA = useRef<HTMLCanvasElement>(null);
  const sourceB = useRef<HTMLCanvasElement>(null);
  const contentA = useRef<HTMLDivElement>(null);
  const contentB = useRef<HTMLDivElement>(null);
  const outputRef = useRef<HTMLCanvasElement>(null);
  const instanceRef = useRef<AsciiSweepInstance | null>(null);

  const [initialOptions] = useState(options);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);

  const supported = useSyncExternalStore(
    emptySubscribe,
    supportsHtmlInCanvas,
    () => false,
  );
  const native = supported && !failed;

  useEffect(() => {
    const output = outputRef.current;
    if (
      !output ||
      !sourceA.current ||
      !sourceB.current ||
      !contentA.current ||
      !contentB.current
    ) {
      return;
    }
    instanceRef.current = createAsciiSweep(
      {
        slots: [
          { source: sourceA.current, content: contentA.current },
          { source: sourceB.current, content: contentB.current },
        ],
        output,
      },
      initialOptions,
    );
    if (native && !instanceRef.current) setFailed(true);
    if (instanceRef.current) setReady(true);
    return () => {
      instanceRef.current?.destroy();
      instanceRef.current = null;
      setReady(false);
    };
  }, [initialOptions, native]);

  // Both panels are hidden apart from the first until the engine has taken
  // over stacking. Re-capture once they are all visible, so the panel that
  // started hidden is not baked into the textures as blank.
  useEffect(() => {
    if (ready) instanceRef.current?.capture();
  }, [ready]);

  useEffect(() => {
    instanceRef.current?.setOptions(options);
  });

  useEffect(() => {
    const slot = index >= 1 ? 1 : 0;
    const instance = instanceRef.current;
    if (!instance || instance.current() === slot) return;
    const base = options.angle ?? 0;
    instance.sweep(slot, {
      angle: directional && slot === 0 ? base + 180 : base,
    });
  }, [index, directional, options.angle]);

  const panels = [children, alternate];
  const initialSlot = index >= 1 ? 1 : 0;

  // Before the engine runs, the panels would paint stacked on top of each
  // other. Hide all but the starting one so the first frame is clean. Once the
  // engine is ready it owns stacking, and this stops being rendered.
  const initialHidden = (slot: 0 | 1): CSSProperties =>
    ready || slot === initialSlot ? panelStyle : { ...panelStyle, visibility: "hidden" };

  return (
    <div className={className} style={{ position: "relative", ...style }}>
      {([0, 1] as const).map((slot) => (
        <canvas
          key={slot}
          ref={slot === 0 ? sourceA : sourceB}
          // @ts-expect-error experimental html-in-canvas attribute
          layoutsubtree="true"
          suppressHydrationWarning
          style={native ? initialHidden(slot) : { display: "none" }}
        >
          {native ? (
            <div
              ref={slot === 0 ? contentA : contentB}
              style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "auto",
              }}
            >
              {panels[slot]}
            </div>
          ) : null}
        </canvas>
      ))}
      {!native
        ? ([0, 1] as const).map((slot) => (
            <div
              key={slot}
              ref={slot === 0 ? contentA : contentB}
              style={initialHidden(slot)}
            >
              {panels[slot]}
            </div>
          ))
        : null}
      <canvas
        ref={outputRef}
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />
    </div>
  );
}


export default AsciiSweep;
\`\`\`
# Canvas UI: Clouds (React, WebGL)

Fog drifts over the page and blurs whatever it covers. Move the cursor and the wind parts the clouds along your trail.

## Install

\`\`\`sh
npx shadcn@latest add @canvas-ui/clouds-react
\`\`\`

Or copy the standalone source below into your project as Clouds.tsx.

## Current configuration

The component as configured right now in the docs demo (React syntax; prop values apply to every framework):

\`\`\`tsx
import { Clouds } from "@/components/canvasui/Clouds";

<Clouds
  scale={1}
  speed={0.6}
  cover={0.1}
  density={2.5}
  shading={0.1}
  opacity={0.64}
  shadow={0.06}
  shadowOffsetX={200}
  shadowOffsetY={-10}
  shadowSoftness={1}
  wind={0.6}
  windRadius={350}
  refraction={0}
  fogBlur={0}
  quality={1}
  color="auto"
>
  {/\* your content \*/}
</Clouds>
\`\`\`

## Props

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| scale | number | 1 | Cloud pattern scale (0.3 to 3). Lower values make bigger clouds. |
| speed | number | 0.6 | Drift speed multiplier (0 to 5). 0 freezes the sky. |
| cover | number | 0.1 | Base cloud coverage added everywhere (0 to 1). |
| density | number | 2.5 | How sharply the cloud shapes condense out of the noise field (0 to 16). |
| shading | number | 0.1 | Strength of the internal depth shading of the clouds (0 to 1). Darkens crevices on light backgrounds, lifts highlights on dark ones. |
| color | [number, number, number] | "auto" | "auto" | Cloud color as RGB in the 0 to 1 range, or "auto" to resolve the page background so content dissolves into it. Re-resolves on theme changes. |
| opacity | number | 0.64 | Maximum opacity of the cloud layer over the content (0 to 1). At 1 the thickest clouds fully hide the content. |
| shadow | number | 0.06 | Strength of the shadows the clouds cast on the content (0 to 1). |
| shadowOffsetX | number | 200 | Horizontal shadow displacement in CSS pixels. Positive shifts shadows right. |
| shadowOffsetY | number | -10 | Vertical shadow displacement in CSS pixels. Positive shifts shadows down. |
| shadowSoftness | number | 1 | How diffuse the shadow edges are (0 to 1). |
| wind | number | 0.6 | How strongly cursor movement parts the clouds (0 to 1). The clearing drifts shut again after the pointer passes. |
| windRadius | number | 350 | Radius of the cursor wind clearing in CSS pixels. |
| refraction | number | 0 | How far the fog bends the captured page in CSS pixels. Only active where the mist is thick, and only when html-in-canvas is available. |
| fogBlur | number | 0 | How much the fog blurs the captured page underneath it (0 to 1). Only active when html-in-canvas is available. |
| quality | number | 1 | Internal render resolution of the cloud field as a fraction of the viewport (0.2 to 1). Clouds are soft, so lower values look nearly identical and cost far less. |
| className | string |  | Classes applied to the wrapper element. |

## Clouds.tsx

\`\`\`tsx
"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

const canvasDimensionLimits = new WeakMap<WebGLRenderingContext | WebGL2RenderingContext, number>();

/\*\* Keep the existing DPR budget, then account for browser pinch zoom. \*/
function getCanvasPixelRatio(
  element: HTMLElement,
  context?: WebGLRenderingContext | WebGL2RenderingContext,
): number {
  const scale = window.visualViewport?.scale || 1;
  const requested = Math.min(window.devicePixelRatio || 1, 2) \* scale;
  const width = Math.max(element.clientWidth, 1);
  const height = Math.max(element.clientHeight, 1);
  let maxDimension = 8192;
  if (context) {
    let limit = canvasDimensionLimits.get(context);
    if (limit === undefined) {
      limit = Math.min(
        maxDimension,
        context.getParameter(context.MAX\_TEXTURE\_SIZE),
        context.getParameter(context.MAX\_RENDERBUFFER\_SIZE),
      );
      canvasDimensionLimits.set(context, limit);
    }
    maxDimension = limit;
  }
  // Rendering the full element preserves its CSS position and native input
  // geometry while panning. Bound allocations when zooming large canvases.
  return Math.min(
    requested,
    maxDimension / Math.max(width, height),
    Math.sqrt(16\_777\_216 / (width \* height)),
  );
}

/\*\* Pinch zoom changes visualViewport without resizing the element's CSS box. \*/
function createCanvasResizeObserver(onResize: () => void) {
  const viewport = window.visualViewport;
  let frame = 0;
  let disconnected = false;
  const schedule = () => {
    if (frame || disconnected) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      onResize();
    });
  };
  const observer = new ResizeObserver(schedule);
  window.addEventListener("resize", schedule, { passive: true });
  viewport?.addEventListener("resize", schedule, { passive: true });
  return {
    observe(element: Element, options?: ResizeObserverOptions) {
      observer.observe(element, options);
    },
    unobserve(element: Element) {
      observer.unobserve(element);
    },
    disconnect() {
      disconnected = true;
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", schedule);
      viewport?.removeEventListener("resize", schedule);
    },
  };
}

type HtmlInCanvasContext = CanvasRenderingContext2D & {
  drawElementImage: (element: Element, x: number, y: number) => DOMMatrix | void;
};

type HtmlInCanvasElement = HTMLCanvasElement & {
  updateElementGeometry?: (
    element: Element,
    options: { canvasTransform: DOMMatrix },
  ) => void;
};

/\*\* Configure the capture subtree for both generations of the experimental API. \*/
function prepareHtmlInCanvas(source: HTMLCanvasElement, content: HTMLElement) {
  if ("content" in source) {
    source.setAttribute("content", "drawable");
    content.setAttribute("drawable", "");
  } else {
    source.setAttribute("layoutsubtree", "");
  }
}

/\*\* Capture pixels and keep the native DOM hit-test region aligned with them. \*/
function drawHtmlInCanvas(
  source: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  content: HTMLElement,
) {
  const transform = (context as HtmlInCanvasContext).drawElementImage(content, 0, 0);
  const canvas = source as HtmlInCanvasElement;
  // Chrome 154 decoupled geometry from drawing before enabling automatic 2D
  // synchronization. Older versions have no update method; newer versions
  // synchronize automatically and return void. Use the returned matrix as-is:
  // drawElementImage already accounts for the canvas's pixel density.
  if (transform && typeof canvas.updateElementGeometry === "function") {
    canvas.updateElementGeometry(content, { canvasTransform: transform });
  }
}

function createRectCache(element: Element) {
  let current = element.getBoundingClientRect();

  const refresh = () => {
    current = element.getBoundingClientRect();
  };

  const observer = new ResizeObserver(refresh);
  observer.observe(element);
  window.addEventListener("resize", refresh, { passive: true });
  window.addEventListener("scroll", refresh, {
    capture: true,
    passive: true,
  });

  return {
    get current() {
      return current;
    },
    destroy() {
      observer.disconnect();
      window.removeEventListener("resize", refresh);
      window.removeEventListener("scroll", refresh, true);
    },
  };
}

export interface CloudsOptions {
  scale?: number;
  speed?: number;
  cover?: number;
  density?: number;
  shading?: number;
  color?: [number, number, number] | "auto";
  opacity?: number;
  shadow?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  shadowSoftness?: number;
  wind?: number;
  windRadius?: number;
  refraction?: number;
  fogBlur?: number;
  quality?: number;
}

export interface CloudsElements {
  source: HTMLCanvasElement;
  content: HTMLElement;
  output: HTMLCanvasElement;
}

export interface CloudsInstance {
  setOptions: (options: CloudsOptions) => void;
  resize: () => void;
  destroy: () => void;
}

type PaintableCanvas = HTMLCanvasElement & {
  requestPaint?: () => void;
  onpaint: (() => void) | null;
};

type ElementImageContext = CanvasRenderingContext2D & {
  drawElementImage?: (element: Element, x: number, y: number) => void;
};

const DEFAULTS: Required<CloudsOptions> = {
  scale: 1,
  speed: 0.6,
  cover: 0.1,
  density: 2.5,
  shading: 0.1,
  color: "auto",
  opacity: 0.64,
  shadow: 0.06,
  shadowOffsetX: 200,
  shadowOffsetY: -10,
  shadowSoftness: 1,
  wind: 0.6,
  windRadius: 350,
  refraction: 0,
  fogBlur: 0,
  quality: 1,
};

const VERT = \`#version 300 es
precision highp float;
layout(location = 0) in vec2 aPos;
void main () {
  gl\_Position = vec4(aPos, 0.0, 1.0);
}\`;

const FIELD\_FRAG = \`#version 300 es
precision highp float;
out vec4 outColor;
uniform vec2 uResolution;
uniform vec2 uOffset;
uniform float uTime;
uniform float uScale;
uniform float uCover;
uniform float uDensity;

const mat2 m = mat2(1.6, 1.2, -1.2, 1.6);

vec2 hash (vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return -1.0 + 2.0 \* fract(sin(p) \* 43758.5453123);
}

float noise (vec2 p) {
  const float K1 = 0.366025404;
  const float K2 = 0.211324865;
  vec2 i = floor(p + (p.x + p.y) \* K1);
  vec2 a = p - i + (i.x + i.y) \* K2;
  vec2 o = (a.x > a.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec2 b = a - o + K2;
  vec2 c = a - 1.0 + 2.0 \* K2;
  vec3 h = max(0.5 - vec3(dot(a, a), dot(b, b), dot(c, c)), 0.0);
  vec3 n = h \* h \* h \* h
    \* vec3(dot(a, hash(i)), dot(b, hash(i + o)), dot(c, hash(i + 1.0)));
  return dot(n, vec3(70.0));
}

float fbm (vec2 n) {
  float total = 0.0;
  float amplitude = 0.1;
  for (int i = 0; i < 7; i++) {
    total += noise(n) \* amplitude;
    n = m \* n;
    amplitude \*= 0.4;
  }
  return total;
}

void main () {
  vec2 p = gl\_FragCoord.xy / uResolution + uOffset;
  vec2 asp = vec2(uResolution.x / uResolution.y, 1.0);
  float q = fbm(p \* asp \* uScale \* 0.5);

  float r = 0.0;
  vec2 uv = p \* asp \* uScale;
  uv -= q - uTime;
  float weight = 0.8;
  for (int i = 0; i < 8; i++) {
    r += abs(weight \* noise(uv));
    uv = m \* uv + uTime;
    weight \*= 0.7;
  }

  float f = 0.0;
  uv = p \* asp \* uScale;
  uv -= q - uTime;
  weight = 0.7;
  for (int i = 0; i < 8; i++) {
    f += weight \* noise(uv);
    uv = m \* uv + uTime;
    weight \*= 0.6;
  }
  f \*= r + f;

  float c = 0.0;
  float t2 = uTime \* 2.0;
  uv = p \* asp \* uScale \* 2.0;
  uv -= q - t2;
  weight = 0.4;
  for (int i = 0; i < 7; i++) {
    c += weight \* noise(uv);
    uv = m \* uv + t2;
    weight \*= 0.6;
  }

  float c1 = 0.0;
  float t3 = uTime \* 3.0;
  uv = p \* asp \* uScale \* 3.0;
  uv -= q - t3;
  weight = 0.4;
  for (int i = 0; i < 7; i++) {
    c1 += abs(weight \* noise(uv));
    uv = m \* uv + t3;
    weight \*= 0.6;
  }
  c += c1;

  float coverage = clamp(uCover + uDensity \* f \* r + c, 0.0, 1.0);
  outColor = vec4(coverage, clamp(c, 0.0, 1.0), 0.0, 1.0);
}\`;

const WIND\_FRAG = \`#version 300 es
precision highp float;
out vec4 outColor;
uniform sampler2D uPrev;
uniform vec2 uResolution;
uniform float uDecay;
uniform vec2 uA;
uniform vec2 uB;
uniform float uRadius;
uniform float uStrength;

void main () {
  vec2 uv = gl\_FragCoord.xy / uResolution;
  float prev = texture(uPrev, uv).r \* uDecay;
  vec2 asp = vec2(uResolution.x / uResolution.y, 1.0);
  vec2 p = uv \* asp;
  vec2 a = uA \* asp;
  vec2 b = uB \* asp;
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
  float d = length(pa - ba \* h) / max(uRadius, 1e-4);
  float stamp = exp(-d \* d \* 3.0) \* uStrength;
  outColor = vec4(clamp(prev + stamp, 0.0, 1.0), 0.0, 0.0, 1.0);
}\`;

const COMPOSITE\_FRAG = \`#version 300 es
precision highp float;
out vec4 outColor;
uniform sampler2D uField;
uniform sampler2D uContent;
uniform sampler2D uWind;
uniform vec2 uResolution;
uniform vec2 uContentScale;
uniform vec3 uBase;
uniform float uShading;
uniform float uOpacity;
uniform float uShadow;
uniform vec2 uShadowShift;
uniform float uShadowLod;
uniform float uWindAmt;
uniform float uRefraction;
uniform float uFogBlur;
uniform float uHasContent;

void main () {
  vec2 uv = gl\_FragCoord.xy / uResolution;
  vec2 field = texture(uField, uv).rg;
  float wind = texture(uWind, uv).r \* uWindAmt;
  float cov = field.r - wind;
  float mist = smoothstep(0.04, 0.9, cov);
  float cloudA = mist \* uOpacity;

  float lum = dot(uBase, vec3(0.299, 0.587, 0.114));
  float sh = clamp(field.g, 0.0, 1.0);
  float k = uShading \* 0.35;
  vec3 cloudRGB = lum > 0.5
    ? uBase - vec3((1.0 - sh) \* k)
    : uBase + vec3(sh \* k);
  cloudRGB = clamp(cloudRGB, 0.0, 1.0);

  vec2 sUv = uv + uShadowShift;
  float s = textureLod(uField, sUv, uShadowLod).r
    - texture(uWind, sUv).r \* uWindAmt;
  float shadowA = smoothstep(0.35, 1.0, s) \* uShadow \* (1.0 - mist);

  float a;
  vec3 rgb;
  if (uHasContent > 0.5) {
    vec2 e = vec2(8.0) / uResolution;
    float gx = texture(uField, uv + vec2(e.x, 0.0)).r
      - texture(uField, uv - vec2(e.x, 0.0)).r;
    float gy = texture(uField, uv + vec2(0.0, e.y)).r
      - texture(uField, uv - vec2(0.0, e.y)).r;
    vec2 rUv = uv + vec2(gx, gy) \* uRefraction \* mist;
    vec3 fogged = textureLod(
      uContent, vec2(rUv.x, 1.0 - rUv.y) \* uContentScale, mist \* uFogBlur \* 5.0
    ).rgb;
    vec3 layer = mix(fogged, cloudRGB, cloudA) \* (1.0 - shadowA);
    float aF = smoothstep(0.02, 0.2, mist);
    a = aF + shadowA \* (1.0 - aF);
    rgb = layer \* aF;
  } else {
    a = cloudA + shadowA \* (1.0 - cloudA);
    rgb = cloudRGB \* cloudA;
  }
  outColor = vec4(rgb, a);
}\`;

export function supportsHtmlInCanvas(): boolean {
  if (typeof document === "undefined") return false;
  const probe = document.createElement("canvas") as PaintableCanvas;
  const ctx = probe.getContext("2d") as ElementImageContext | null;
  return Boolean(
    ctx &&
    typeof ctx.drawElementImage === "function" &&
    typeof probe.requestPaint === "function",
  );
}

export function createClouds(
  elements: CloudsElements,
  options: CloudsOptions = {},
): CloudsInstance | null {
  const config = { ...DEFAULTS, ...options };
  const { source, content, output } = elements;

  const gl = output.getContext("webgl2", {
    alpha: true,
    depth: false,
    stencil: false,
    antialias: false,
    premultipliedAlpha: true,
  });
  if (!gl || gl.isContextLost()) return null;

  const sourceCtx = source.getContext("2d") as ElementImageContext | null;
  const paintable = source as PaintableCanvas;
  const htmlInCanvas = Boolean(
    sourceCtx &&
    typeof sourceCtx.drawElementImage === "function" &&
    typeof paintable.requestPaint === "function",
  );

  if (htmlInCanvas) prepareHtmlInCanvas(source, content);

  let contentDirty = false;
  let wake = () => {};

  if (htmlInCanvas) {
    paintable.onpaint = () => {
      try {
        sourceCtx!.reset();
        drawHtmlInCanvas(source, sourceCtx!, content);
        contentDirty = true;
        wake();
      } catch {}
    };
  }

  function compile(type: number, text: string): WebGLShader {
    const shader = gl!.createShader(type)!;
    gl!.shaderSource(shader, text);
    gl!.compileShader(shader);
    if (!gl!.getShaderParameter(shader, gl!.COMPILE\_STATUS)) {
      console.error("Clouds shader error:", gl!.getShaderInfoLog(shader));
    }
    return shader;
  }

  function link(fragSource: string) {
    const vs = compile(gl!.VERTEX\_SHADER, VERT);
    const fs = compile(gl!.FRAGMENT\_SHADER, fragSource);
    const program = gl!.createProgram()!;
    gl!.attachShader(program, vs);
    gl!.attachShader(program, fs);
    gl!.linkProgram(program);
    const uniforms: Record<string, WebGLUniformLocation> = {};
    const count = gl!.getProgramParameter(program, gl!.ACTIVE\_UNIFORMS);
    for (let i = 0; i < count; i++) {
      const info = gl!.getActiveUniform(program, i)!;
      uniforms[info.name] = gl!.getUniformLocation(program, info.name)!;
    }
    return { program, vs, fs, uniforms };
  }

  const field = link(FIELD\_FRAG);
  const windPass = link(WIND\_FRAG);
  const composite = link(COMPOSITE\_FRAG);

  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY\_BUFFER, quad);
  gl.bufferData(
    gl.ARRAY\_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC\_DRAW,
  );
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const fieldTexture = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE\_2D, fieldTexture);
  gl.texParameteri(
    gl.TEXTURE\_2D,
    gl.TEXTURE\_MIN\_FILTER,
    gl.LINEAR\_MIPMAP\_LINEAR,
  );
  gl.texParameteri(gl.TEXTURE\_2D, gl.TEXTURE\_MAG\_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE\_2D, gl.TEXTURE\_WRAP\_S, gl.CLAMP\_TO\_EDGE);
  gl.texParameteri(gl.TEXTURE\_2D, gl.TEXTURE\_WRAP\_T, gl.CLAMP\_TO\_EDGE);

  const contentTexture = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE\_2D, contentTexture);
  gl.texParameteri(
    gl.TEXTURE\_2D,
    gl.TEXTURE\_MIN\_FILTER,
    gl.LINEAR\_MIPMAP\_LINEAR,
  );
  gl.texParameteri(gl.TEXTURE\_2D, gl.TEXTURE\_MAG\_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE\_2D, gl.TEXTURE\_WRAP\_S, gl.CLAMP\_TO\_EDGE);
  gl.texParameteri(gl.TEXTURE\_2D, gl.TEXTURE\_WRAP\_T, gl.CLAMP\_TO\_EDGE);
  gl.texImage2D(
    gl.TEXTURE\_2D,
    0,
    gl.RGBA,
    1,
    1,
    0,
    gl.RGBA,
    gl.UNSIGNED\_BYTE,
    new Uint8Array([0, 0, 0, 255]),
  );
  gl.generateMipmap(gl.TEXTURE\_2D);

  function makeWindTexture() {
    const texture = gl!.createTexture()!;
    gl!.bindTexture(gl!.TEXTURE\_2D, texture);
    gl!.texParameteri(gl!.TEXTURE\_2D, gl!.TEXTURE\_MIN\_FILTER, gl!.LINEAR);
    gl!.texParameteri(gl!.TEXTURE\_2D, gl!.TEXTURE\_MAG\_FILTER, gl!.LINEAR);
    gl!.texParameteri(gl!.TEXTURE\_2D, gl!.TEXTURE\_WRAP\_S, gl!.CLAMP\_TO\_EDGE);
    gl!.texParameteri(gl!.TEXTURE\_2D, gl!.TEXTURE\_WRAP\_T, gl!.CLAMP\_TO\_EDGE);
    return texture;
  }
  const windTextures = [makeWindTexture(), makeWindTexture()];
  let windIndex = 0;

  const fbo = gl.createFramebuffer();

  let fieldW = 0;
  let fieldH = 0;
  let contentScaleX = 1;
  let contentScaleY = 1;

  let baseColor: [number, number, number] = [1, 1, 1];
  const probe = document.createElement("canvas");
  probe.width = probe.height = 1;
  const probeCtx = probe.getContext("2d", { willReadFrequently: true });

  function syncBaseColor() {
    if (config.color !== "auto") {
      baseColor = config.color;
      return;
    }
    if (!probeCtx) return;
    let el: Element | null = content;
    while (el) {
      const bg = getComputedStyle(el).backgroundColor;
      if (bg && bg !== "transparent") {
        probeCtx.clearRect(0, 0, 1, 1);
        probeCtx.fillStyle = bg;
        probeCtx.fillRect(0, 0, 1, 1);
        const [r, g, b, a] = probeCtx.getImageData(0, 0, 1, 1).data;
        if (a > 0) {
          baseColor = [r / 255, g / 255, b / 255];
          return;
        }
      }
      el = el.parentElement;
    }
    baseColor = [1, 1, 1];
  }

  function syncCanvasSize() {
    const cw = content.clientWidth;
    const ch = content.clientHeight;
    if (cw > 0 && ch > 0) {
      const wpx = \`${cw}px\`;
      const hpx = \`${ch}px\`;
      if (output.style.width !== wpx) output.style.width = wpx;
      if (output.style.height !== hpx) output.style.height = hpx;
    }
    const dpr = getCanvasPixelRatio(output, gl!);
    const width = Math.max(1, Math.round(output.clientWidth \* dpr));
    const height = Math.max(1, Math.round(output.clientHeight \* dpr));
    if (output.width !== width || output.height !== height) {
      output.width = width;
      output.height = height;
    }
    contentScaleX = htmlInCanvas
      ? Math.min(1, cw / Math.max(source.clientWidth, 1))
      : 1;
    contentScaleY = htmlInCanvas
      ? Math.min(1, ch / Math.max(source.clientHeight, 1))
      : 1;
    const quality = Math.min(Math.max(config.quality, 0.2), 1);
    const cap = 1440 / Math.max(output.clientWidth, 1);
    const q = Math.min(quality, cap);
    const nextW = Math.max(16, Math.round(output.clientWidth \* q));
    const nextH = Math.max(16, Math.round(output.clientHeight \* q));
    if (nextW !== fieldW || nextH !== fieldH) {
      fieldW = nextW;
      fieldH = nextH;
      gl!.bindTexture(gl!.TEXTURE\_2D, fieldTexture);
      gl!.texImage2D(
        gl!.TEXTURE\_2D,
        0,
        gl!.RGBA,
        fieldW,
        fieldH,
        0,
        gl!.RGBA,
        gl!.UNSIGNED\_BYTE,
        null,
      );
      gl!.generateMipmap(gl!.TEXTURE\_2D);
      for (const texture of windTextures) {
        gl!.bindTexture(gl!.TEXTURE\_2D, texture);
        gl!.texImage2D(
          gl!.TEXTURE\_2D,
          0,
          gl!.RGBA,
          fieldW,
          fieldH,
          0,
          gl!.RGBA,
          gl!.UNSIGNED\_BYTE,
          null,
        );
      }
    }
    if (htmlInCanvas) {
      const sourceWidth = Math.max(1, Math.round(source.clientWidth \* dpr));
      const sourceHeight = Math.max(1, Math.round(source.clientHeight \* dpr));
      if (source.width !== sourceWidth || source.height !== sourceHeight) {
        source.width = sourceWidth;
        source.height = sourceHeight;
      }
      paintable.requestPaint!();
    }
  }

  syncCanvasSize();
  syncBaseColor();

  function uploadContent() {
    if (!htmlInCanvas || !contentDirty) return;
    contentDirty = false;
    gl!.bindTexture(gl!.TEXTURE\_2D, contentTexture);
    gl!.texImage2D(
      gl!.TEXTURE\_2D,
      0,
      gl!.RGBA,
      gl!.RGBA,
      gl!.UNSIGNED\_BYTE,
      source,
    );
    gl!.generateMipmap(gl!.TEXTURE\_2D);
  }

  let pointerX = 0.5;
  let pointerY = 0.5;
  let prevPointerX = 0.5;
  let prevPointerY = 0.5;
  let hasPointer = false;
  let lastPointerMove = 0;

  let time = Math.random() \* 64;

  function render(delta: number) {
    uploadContent();

    gl!.bindFramebuffer(gl!.FRAMEBUFFER, fbo);
    gl!.framebufferTexture2D(
      gl!.FRAMEBUFFER,
      gl!.COLOR\_ATTACHMENT0,
      gl!.TEXTURE\_2D,
      fieldTexture,
      0,
    );
    gl!.viewport(0, 0, fieldW, fieldH);
    gl!.useProgram(field.program);
    gl!.uniform2f(field.uniforms.uResolution, fieldW, fieldH);
    gl!.uniform2f(
      field.uniforms.uOffset,
      content.scrollLeft / Math.max(content.clientWidth, 1),
      -content.scrollTop / Math.max(content.clientHeight, 1),
    );
    gl!.uniform1f(field.uniforms.uTime, time);
    gl!.uniform1f(field.uniforms.uScale, Math.max(config.scale, 0.05));
    gl!.uniform1f(field.uniforms.uCover, Math.max(config.cover, 0));
    gl!.uniform1f(field.uniforms.uDensity, Math.max(config.density, 0));
    gl!.drawArrays(gl!.TRIANGLE\_STRIP, 0, 4);

    const prevWind = windTextures[windIndex];
    const nextWind = windTextures[1 - windIndex];
    windIndex = 1 - windIndex;
    gl!.framebufferTexture2D(
      gl!.FRAMEBUFFER,
      gl!.COLOR\_ATTACHMENT0,
      gl!.TEXTURE\_2D,
      nextWind,
      0,
    );
    gl!.useProgram(windPass.program);
    gl!.activeTexture(gl!.TEXTURE0);
    gl!.bindTexture(gl!.TEXTURE\_2D, prevWind);
    gl!.uniform1i(windPass.uniforms.uPrev, 0);
    gl!.uniform2f(windPass.uniforms.uResolution, fieldW, fieldH);
    gl!.uniform1f(windPass.uniforms.uDecay, Math.pow(0.5, delta / 0.7));
    const moved = Math.hypot(pointerX - prevPointerX, pointerY - prevPointerY);
    const stamping = hasPointer && moved > 0;
    gl!.uniform2f(windPass.uniforms.uA, prevPointerX, prevPointerY);
    gl!.uniform2f(windPass.uniforms.uB, pointerX, pointerY);
    gl!.uniform1f(
      windPass.uniforms.uRadius,
      Math.max(config.windRadius, 1) / Math.max(output.clientHeight, 1),
    );
    gl!.uniform1f(
      windPass.uniforms.uStrength,
      stamping ? Math.min(0.2 + moved \* 12, 1) \* 0.5 : 0,
    );
    gl!.drawArrays(gl!.TRIANGLE\_STRIP, 0, 4);
    prevPointerX = pointerX;
    prevPointerY = pointerY;

    gl!.bindFramebuffer(gl!.FRAMEBUFFER, null);
    gl!.bindTexture(gl!.TEXTURE\_2D, fieldTexture);
    gl!.generateMipmap(gl!.TEXTURE\_2D);

    gl!.viewport(0, 0, output.width, output.height);
    gl!.useProgram(composite.program);
    gl!.activeTexture(gl!.TEXTURE0);
    gl!.bindTexture(gl!.TEXTURE\_2D, fieldTexture);
    gl!.uniform1i(composite.uniforms.uField, 0);
    gl!.activeTexture(gl!.TEXTURE1);
    gl!.bindTexture(gl!.TEXTURE\_2D, contentTexture);
    gl!.uniform1i(composite.uniforms.uContent, 1);
    gl!.activeTexture(gl!.TEXTURE2);
    gl!.bindTexture(gl!.TEXTURE\_2D, nextWind);
    gl!.uniform1i(composite.uniforms.uWind, 2);
    gl!.uniform2f(composite.uniforms.uResolution, output.width, output.height);
    gl!.uniform2f(
      composite.uniforms.uContentScale,
      contentScaleX,
      contentScaleY,
    );
    gl!.uniform3f(
      composite.uniforms.uBase,
      baseColor[0],
      baseColor[1],
      baseColor[2],
    );
    gl!.uniform1f(
      composite.uniforms.uOpacity,
      Math.min(Math.max(config.opacity, 0), 1),
    );
    gl!.uniform1f(composite.uniforms.uShading, Math.max(config.shading, 0));
    gl!.uniform1f(
      composite.uniforms.uShadow,
      Math.min(Math.max(config.shadow, 0), 1),
    );
    gl!.uniform2f(
      composite.uniforms.uShadowShift,
      -config.shadowOffsetX / Math.max(output.clientWidth, 1),
      config.shadowOffsetY / Math.max(output.clientHeight, 1),
    );
    gl!.uniform1f(
      composite.uniforms.uShadowLod,
      Math.min(Math.max(config.shadowSoftness, 0), 1) \* 4,
    );
    gl!.uniform1f(
      composite.uniforms.uWindAmt,
      Math.min(Math.max(config.wind, 0), 1),
    );
    gl!.uniform1f(
      composite.uniforms.uRefraction,
      Math.max(config.refraction, 0) / Math.max(output.clientWidth, 1),
    );
    gl!.uniform1f(
      composite.uniforms.uFogBlur,
      Math.min(Math.max(config.fogBlur, 0), 1),
    );
    gl!.uniform1f(composite.uniforms.uHasContent, htmlInCanvas ? 1 : 0);
    gl!.drawArrays(gl!.TRIANGLE\_STRIP, 0, 4);
  }

  let raf = 0;
  let lastTime = performance.now();
  let destroyed = false;
  let running = false;
  let visible = true;

  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reducedMotion = motionQuery.matches;

  function frame(now: number) {
    if (destroyed) return;
    if (!visible) {
      running = false;
      return;
    }
    const delta = Math.min((now - lastTime) / 1000, 1 / 30);
    lastTime = now;
    if (!reducedMotion) time += delta \* config.speed \* 0.03;
    render(delta);
    const windActive = now - lastPointerMove < 3000;
    if (reducedMotion && !windActive && !contentDirty) {
      running = false;
      return;
    }
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (destroyed || running || !visible) return;
    running = true;
    lastTime = performance.now();
    raf = requestAnimationFrame(frame);
  }

  wake = start;

  start();

  function onMotionChange() {
    reducedMotion = motionQuery.matches;
    start();
  }
  motionQuery.addEventListener("change", onMotionChange);

  const observer = createCanvasResizeObserver(() => {
    syncCanvasSize();
    start();
  });
  observer.observe(output);
  observer.observe(content);

  const intersection = new IntersectionObserver((entries) => {
    visible = entries[entries.length - 1]?.isIntersecting ?? true;
    if (visible) start();
  });
  intersection.observe(output);

  const rectCache = createRectCache(output);

  function onPointerMove(event: PointerEvent) {
    const rect = rectCache.current;
    const x = (event.clientX - rect.left) / Math.max(rect.width, 1);
    const y = 1 - (event.clientY - rect.top) / Math.max(rect.height, 1);
    if (!hasPointer) {
      prevPointerX = x;
      prevPointerY = y;
      hasPointer = true;
    }
    pointerX = x;
    pointerY = y;
    lastPointerMove = performance.now();
    start();
  }

  function onPointerLeave() {
    hasPointer = false;
  }

  content.addEventListener("pointermove", onPointerMove, { passive: true });
  content.addEventListener("pointerleave", onPointerLeave, { passive: true });
  content.addEventListener("scroll", start, { passive: true });

  let themeTimer = 0;
  function onThemeShift() {
    syncBaseColor();
    start();
    window.clearTimeout(themeTimer);
    themeTimer = window.setTimeout(() => {
      syncBaseColor();
      start();
    }, 300);
  }

  const themeObserver = new MutationObserver(onThemeShift);
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class", "style", "data-theme"],
  });
  const schemeQuery = window.matchMedia("(prefers-color-scheme: dark)");
  schemeQuery.addEventListener("change", onThemeShift);

  return {
    setOptions(next) {
      if (
        !Object.entries(next).some(
          ([key, value]) => config[key as keyof CloudsOptions] !== value,
        )
      )
        return;
      Object.assign(config, next);
      syncCanvasSize();
      syncBaseColor();
      start();
    },
    resize() {
      syncCanvasSize();
      start();
    },
    destroy() {
      destroyed = true;
      rectCache.destroy();
      cancelAnimationFrame(raf);
      observer.disconnect();
      intersection.disconnect();
      themeObserver.disconnect();
      schemeQuery.removeEventListener("change", onThemeShift);
      window.clearTimeout(themeTimer);
      motionQuery.removeEventListener("change", onMotionChange);
      content.removeEventListener("pointermove", onPointerMove);
      content.removeEventListener("pointerleave", onPointerLeave);
      content.removeEventListener("scroll", start);
      if (htmlInCanvas) paintable.onpaint = null;
      gl!.deleteTexture(fieldTexture);
      gl!.deleteTexture(contentTexture);
      gl!.deleteTexture(windTextures[0]);
      gl!.deleteTexture(windTextures[1]);
      gl!.deleteFramebuffer(fbo);
      gl!.deleteProgram(field.program);
      gl!.deleteProgram(windPass.program);
      gl!.deleteProgram(composite.program);
      gl!.deleteShader(field.vs);
      gl!.deleteShader(field.fs);
      gl!.deleteShader(windPass.vs);
      gl!.deleteShader(windPass.fs);
      gl!.deleteShader(composite.vs);
      gl!.deleteShader(composite.fs);
      gl!.deleteBuffer(quad);
    },
  };
}

export interface CloudsProps extends CloudsOptions {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const emptySubscribe = () => () => {};

export function Clouds({
  children,
  className,
  style,
  ...options
}: CloudsProps) {
  const sourceRef = useRef<HTMLCanvasElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const outputRef = useRef<HTMLCanvasElement>(null);
  const instanceRef = useRef<CloudsInstance | null>(null);
  const [initialOptions] = useState(options);
  const [failed, setFailed] = useState(false);

  const supported = useSyncExternalStore(
    emptySubscribe,
    supportsHtmlInCanvas,
    () => false,
  );
  const native = supported && !failed;

  useEffect(() => {
    const source = sourceRef.current;
    const content = contentRef.current;
    const output = outputRef.current;
    if (!source || !content || !output) return;
    instanceRef.current = createClouds(
      { source, content, output },
      initialOptions,
    );
    if (native && !instanceRef.current) setFailed(true);
    return () => {
      instanceRef.current?.destroy();
      instanceRef.current = null;
    };
  }, [initialOptions, native]);

  useEffect(() => {
    instanceRef.current?.setOptions(options);
  });

  return (
    <div className={className} style={{ position: "relative", ...style }}>
      <canvas
        ref={sourceRef}
        // @ts-expect-error experimental html-in-canvas attribute
        layoutsubtree="true"
        suppressHydrationWarning
        style={
          native
            ? { position: "absolute", inset: 0, width: "100%", height: "100%" }
            : { display: "none" }
        }
      >
        {native ? (
          <div
            ref={contentRef}
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
              overflow: "auto",
            }}
          >
            {children}
          </div>
        ) : null}
      </canvas>
      {!native ? (
        <div
          ref={contentRef}
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            overflow: "auto",
          }}
        >
          {children}
        </div>
      ) : null}
      <canvas
        ref={outputRef}
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}


export default Clouds;
\`\`\`
# Canvas UI: Droplets (React, WebGL)

Rain runs down the screen and refracts the page behind it. It is raining on this page right now.

## Install

\`\`\`sh
npx shadcn@latest add @canvas-ui/droplets-react
\`\`\`

Or copy the standalone source below into your project as Droplets.tsx.

## Current configuration

The component as configured right now in the docs demo (React syntax; prop values apply to every framework):

\`\`\`tsx
import { Droplets } from "@/components/canvasui/Droplets";

<Droplets
  intensity={0.5}
  speed={1}
  scale={0.4}
  dropWidth={1}
  dropLength={1}
  refraction={0.2}
  blur={0}
  vignette={0}
  fallSpeed={1}
  wiggle={1}
  staticDrops={0.2}
  interactionRadius={0.3}
  interactionStrength={0.6}
  interactionDistortion={3}
  tintStrength={0}
  tint={[0.5608, 0.7059, 1]}
>
  {/\* your content \*/}
</Droplets>
\`\`\`

## Props

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| intensity | number | 0.5 | How much rain falls, from a light drizzle to a downpour (0 to 1.25). |
| speed | number | 1 | Animation speed multiplier. |
| scale | number | 0.4 | Size of the droplet pattern. Higher means smaller drops. |
| dropWidth | number | 1 | Width of the droplets and their trails. |
| dropLength | number | 1 | How elongated the falling droplets are. |
| refraction | number | 0.2 | How strongly droplets refract the content behind them. |
| blur | number | 0 | Background blur outside the droplets, like a fogged up window. |
| vignette | number | 0 | Darkens the edges of the canvas (0 to 1). |
| fallSpeed | number | 1 | How fast the running drops slide down. |
| wiggle | number | 1 | Horizontal wiggle of the running drops. |
| staticDrops | number | 0.2 | Multiplier for the small static droplets. |
| interactive | boolean | true | Wipe drops off the glass with the pointer. |
| interactionRadius | number | 0.3 | Radius of the cursor wipe, relative to the screen height. |
| interactionStrength | number | 0.6 | How strongly the cursor wipes drops off the glass (0 to 1). |
| interactionDistortion | number | 3 | How much the wipe distorts the content behind it. |
| tint | [number, number, number] | [1, 1, 1] | Tint color layered over the content as [r, g, b] in 0-1 range. |
| tintStrength | number | 0 | Strength of the tint (0 to 1). |
| className | string |  | Classes applied to the wrapper element. |

## Droplets.tsx

\`\`\`tsx
"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

const canvasDimensionLimits = new WeakMap<WebGLRenderingContext | WebGL2RenderingContext, number>();

/\*\* Keep the existing DPR budget, then account for browser pinch zoom. \*/
function getCanvasPixelRatio(
  element: HTMLElement,
  context?: WebGLRenderingContext | WebGL2RenderingContext,
): number {
  const scale = window.visualViewport?.scale || 1;
  const requested = Math.min(window.devicePixelRatio || 1, 2) \* scale;
  const width = Math.max(element.clientWidth, 1);
  const height = Math.max(element.clientHeight, 1);
  let maxDimension = 8192;
  if (context) {
    let limit = canvasDimensionLimits.get(context);
    if (limit === undefined) {
      limit = Math.min(
        maxDimension,
        context.getParameter(context.MAX\_TEXTURE\_SIZE),
        context.getParameter(context.MAX\_RENDERBUFFER\_SIZE),
      );
      canvasDimensionLimits.set(context, limit);
    }
    maxDimension = limit;
  }
  // Rendering the full element preserves its CSS position and native input
  // geometry while panning. Bound allocations when zooming large canvases.
  return Math.min(
    requested,
    maxDimension / Math.max(width, height),
    Math.sqrt(16\_777\_216 / (width \* height)),
  );
}

/\*\* Pinch zoom changes visualViewport without resizing the element's CSS box. \*/
function createCanvasResizeObserver(onResize: () => void) {
  const viewport = window.visualViewport;
  let frame = 0;
  let disconnected = false;
  const schedule = () => {
    if (frame || disconnected) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      onResize();
    });
  };
  const observer = new ResizeObserver(schedule);
  window.addEventListener("resize", schedule, { passive: true });
  viewport?.addEventListener("resize", schedule, { passive: true });
  return {
    observe(element: Element, options?: ResizeObserverOptions) {
      observer.observe(element, options);
    },
    unobserve(element: Element) {
      observer.unobserve(element);
    },
    disconnect() {
      disconnected = true;
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", schedule);
      viewport?.removeEventListener("resize", schedule);
    },
  };
}

type HtmlInCanvasContext = CanvasRenderingContext2D & {
  drawElementImage: (element: Element, x: number, y: number) => DOMMatrix | void;
};

type HtmlInCanvasElement = HTMLCanvasElement & {
  updateElementGeometry?: (
    element: Element,
    options: { canvasTransform: DOMMatrix },
  ) => void;
};

/\*\* Configure the capture subtree for both generations of the experimental API. \*/
function prepareHtmlInCanvas(source: HTMLCanvasElement, content: HTMLElement) {
  if ("content" in source) {
    source.setAttribute("content", "drawable");
    content.setAttribute("drawable", "");
  } else {
    source.setAttribute("layoutsubtree", "");
  }
}

/\*\* Capture pixels and keep the native DOM hit-test region aligned with them. \*/
function drawHtmlInCanvas(
  source: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  content: HTMLElement,
) {
  const transform = (context as HtmlInCanvasContext).drawElementImage(content, 0, 0);
  const canvas = source as HtmlInCanvasElement;
  // Chrome 154 decoupled geometry from drawing before enabling automatic 2D
  // synchronization. Older versions have no update method; newer versions
  // synchronize automatically and return void. Use the returned matrix as-is:
  // drawElementImage already accounts for the canvas's pixel density.
  if (transform && typeof canvas.updateElementGeometry === "function") {
    canvas.updateElementGeometry(content, { canvasTransform: transform });
  }
}

function createRectCache(element: Element) {
  let current = element.getBoundingClientRect();

  const refresh = () => {
    current = element.getBoundingClientRect();
  };

  const observer = new ResizeObserver(refresh);
  observer.observe(element);
  window.addEventListener("resize", refresh, { passive: true });
  window.addEventListener("scroll", refresh, {
    capture: true,
    passive: true,
  });

  return {
    get current() {
      return current;
    },
    destroy() {
      observer.disconnect();
      window.removeEventListener("resize", refresh);
      window.removeEventListener("scroll", refresh, true);
    },
  };
}

export interface DropletsOptions {
  /\*\* How much rain falls, from a light drizzle to a downpour (0 to 1.25). \*/
  intensity?: number;
  /\*\* Animation speed multiplier. \*/
  speed?: number;
  /\*\* Size of the droplet pattern. Higher means smaller drops. \*/
  scale?: number;
  /\*\* Width of the droplets and their trails. \*/
  dropWidth?: number;
  /\*\* How elongated the falling droplets are. \*/
  dropLength?: number;
  /\*\* How strongly droplets refract the content behind them. \*/
  refraction?: number;
  /\*\* Background blur outside the droplets, like a fogged up window. \*/
  blur?: number;
  /\*\* Darkens the edges of the canvas (0 to 1). \*/
  vignette?: number;
  /\*\* How fast the running drops slide down. \*/
  fallSpeed?: number;
  /\*\* Horizontal wiggle of the running drops. \*/
  wiggle?: number;
  /\*\* Multiplier for the small static droplets. \*/
  staticDrops?: number;
  /\*\* Wipe drops off the glass with the pointer. \*/
  interactive?: boolean;
  /\*\* Radius of the cursor wipe, relative to the screen height. \*/
  interactionRadius?: number;
  /\*\* How strongly the cursor wipes drops off the glass (0 to 1). \*/
  interactionStrength?: number;
  /\*\* How much the wipe distorts the content behind it. \*/
  interactionDistortion?: number;
  /\*\* Tint color layered over the content as [r, g, b] in 0-1 range. \*/
  tint?: [number, number, number];
  /\*\* Strength of the tint (0 to 1). \*/
  tintStrength?: number;
}

export interface DropletsElements {
  /\*\* Canvas with layoutsubtree that hosts the HTML content. \*/
  source: HTMLCanvasElement;
  /\*\* The element inside the source canvas that gets captured. \*/
  content: HTMLElement;
  /\*\* Canvas the WebGL effect renders to. \*/
  output: HTMLCanvasElement;
}

export interface DropletsInstance {
  /\*\* Update effect options live. \*/
  setOptions: (options: DropletsOptions) => void;
  /\*\* Re-read canvas size. Call when the element is resized. \*/
  resize: () => void;
  /\*\* Stop the loop and release all GPU resources. \*/
  destroy: () => void;
}

const DEFAULTS: Required<DropletsOptions> = {
  intensity: 0.5,
  speed: 1,
  scale: 0.4,
  dropWidth: 1,
  dropLength: 1,
  refraction: 0.2,
  blur: 0,
  vignette: 0,
  fallSpeed: 1,
  wiggle: 1,
  staticDrops: 0.2,
  interactive: true,
  interactionRadius: 0.3,
  interactionStrength: 0.6,
  interactionDistortion: 3,
  tint: [1, 1, 1],
  tintStrength: 0,
};

type PaintableCanvas = HTMLCanvasElement & {
  onpaint?: (() => void) | null;
  requestPaint?: () => void;
};

type ElementImageContext = CanvasRenderingContext2D & {
  drawElementImage?: (element: Element, x: number, y: number) => void;
};

const VERT = \`#version 300 es
precision highp float;
layout(location = 0) in vec2 aPos;
out vec2 vUv;
void main () {
  vUv = aPos \* 0.5 + 0.5;
  gl\_Position = vec4(aPos, 0.0, 1.0);
}\`;

const FRAG = \`#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uContent;
uniform vec2 uResolution;
uniform vec2 uOffset;
uniform float uTime;
uniform float uIntensity;
uniform float uScale;
uniform float uDropWidth;
uniform float uDropLength;
uniform float uRefraction;
uniform float uBlur;
uniform float uVignette;
uniform float uFallSpeed;
uniform float uWiggle;
uniform float uStaticDrops;
uniform float uMaxX;
uniform sampler2D uTrail;
uniform float uWipe;
uniform float uWipeDistort;
uniform vec3 uTint;
uniform float uTintStrength;
uniform float uHasContent;

#define S(a, b, t) smoothstep(a, b, t)

vec3 N13 (float p) {
  vec3 p3 = fract(vec3(p) \* vec3(0.1031, 0.11369, 0.13787));
  p3 += dot(p3, p3.yzx + 19.19);
  return fract(vec3(
    (p3.x + p3.y) \* p3.z,
    (p3.x + p3.z) \* p3.y,
    (p3.y + p3.z) \* p3.x
  ));
}

float N (float t) {
  return fract(sin(t \* 12345.564) \* 7658.76);
}

float Saw (float b, float t) {
  return S(0.0, b, t) \* S(1.0, b, t);
}

float sdEgg (vec2 p, float ra, float rb) {
  const float k = 1.7320508;
  p.x = abs(p.x);
  float r = ra - rb;
  return ((p.y < 0.0) ? length(vec2(p.x, p.y)) - r :
          (k \* (p.x + r) < p.y) ? length(vec2(p.x, p.y - k \* r)) :
          length(vec2(p.x + r, p.y)) - 2.0 \* r) - rb;
}

vec2 DropLayer (vec2 uv, float t) {
  vec2 UV = uv;
  vec2 a = vec2(6.0, 1.0);
  vec2 grid = a \* 2.0;

  vec2 id = floor(uv \* grid);
  float gridFall = N(id.x) / 3.0 + 0.5;
  uv.y += t \* gridFall / a.y;
  id = floor(uv \* grid);
  uv.y += N(id.x);

  id = floor(uv \* grid);
  vec2 st = fract(uv \* grid) - vec2(0.5, 0.0);
  vec3 n = N13(id.x \* 35.2 + id.y \* 2376.1);

  float x = n.x - 0.5;
  float lambda = UV.y \* 20.0;
  float wiggle = sin(lambda + sin(lambda));
  x += wiggle \* (0.5 - abs(x)) \* (n.z - 0.5) \* uWiggle;
  x \*= 0.6;

  float slowStart = 0.85;
  float ti = fract(t \* (gridFall + 0.1) + n.z);
  float y = (Saw(slowStart, ti) - 0.5) \* 0.9 + 0.5;
  vec2 p = vec2(x, y);

  float dropShape = (ti > slowStart)
    ? -sin(6.2831853 \* ti / (1.0 - slowStart)) \* 0.5 - 0.5
    : 0.0;
  float d = sdEgg((st - p) \* a.yx / vec2(uDropWidth, uDropLength), 0.0, dropShape);
  float diameter = N(id.x + id.y) / 7.0 + 0.2;
  float mainDrop = S(diameter / 1.5, 0.0, d);

  float r2 = S(1.0, y, st.y);
  float r = sqrt(r2);
  float cd = abs(st.x - x);
  float thickness = diameter \* 0.95 \* uDropWidth;
  float trail = S(thickness \* r, 0.0, cd);
  float trailFront = S(-0.02, 0.02, st.y - y);
  trail \*= r2 \* trailFront \* 0.5;

  y = UV.y;
  float trail2 = S((thickness - 0.15) \* r, 0.0, cd);
  trail2 \*= trailFront \* n.z;
  float rndX = N(id.x) / 1.5 + 0.5;
  float rndY = N(st.y) / 40.0 + 0.05;
  y = fract(y \* 11.0 \* rndX) + (st.y - 0.5);
  float dd = length(st - vec2(x, y));
  float droplets = S(trail2 + rndY, 0.0, dd);

  float m = mainDrop + droplets \* r \* trailFront;
  return vec2(m, trail);
}

float StaticDrops (vec2 uv, float t) {
  uv \*= 40.0;

  vec2 id = floor(uv);
  vec3 n = N13(id.x \* 107.45 + id.y \* 3543.654);
  vec2 p = (n.xy - 0.5) \* 0.6;
  uv = fract(uv) - 0.5;

  float d = length(uv - p);
  float drop = S(0.3 \* clamp(uDropWidth, 0.4, 1.4), 0.0, d);

  float fade = Saw(0.1, fract(t + n.y));
  float intensity = fract(n.x \* 27.0);
  return drop \* fade \* intensity;
}

vec2 Drops (vec2 uv, float t, float tFall, float l0, float l1, float l2, float wipe) {
  float s = StaticDrops(uv, t) \* l0 \* (1.0 - wipe);
  vec2 m1 = DropLayer(uv, tFall) \* (l1 \* (1.0 - wipe \* 0.8));
  vec2 m2 = DropLayer(uv \* 1.85, tFall) \* (l2 \* (1.0 - wipe \* 0.8));

  float c = s + m1.x + m2.x;
  c = S(0.3, 1.0, c);

  return vec2(c, m1.y + m2.y);
}

void main () {
  vec2 uv = vUv;

  if (uv.x > uMaxX) {
    outColor = vec4(0.0);
    return;
  }

  vec2 aspectUv = (uv + uOffset - 0.5) \* vec2(uResolution.x / uResolution.y, 1.0);
  float t = uTime \* 0.2;
  float dropScale = clamp(min(uResolution.x, uResolution.y) / 900.0, 0.75, 1.35) \* uScale;
  vec2 scaledUv = aspectUv \* dropScale;

  float rainAmount = clamp(uIntensity, 0.0, 1.25);

  float staticDrops = S(-0.5, 1.0, rainAmount) \* 2.0 \* uStaticDrops;
  float layer1 = S(0.25, 0.75, rainAmount);
  float layer2 = S(0.0, 0.5, rainAmount);
  float tFall = t \* uFallSpeed;

  float wipeMask = texture(uTrail, uv).r;
  float wipe = wipeMask \* clamp(uWipe, 0.0, 1.0);

  vec2 c = Drops(scaledUv, t, tFall, staticDrops, layer1, layer2, wipe);

  vec2 e = vec2(0.001, 0.0);
  float cx = Drops(scaledUv + e, t, tFall, staticDrops, layer1, layer2, wipe).x;
  float cy = Drops(scaledUv + e.yx, t, tFall, staticDrops, layer1, layer2, wipe).x;
  vec2 normal = vec2(cx - c.x, cy - c.x);

  vec2 e2 = vec2(0.012, 0.0);
  float wx = texture(uTrail, uv + e2).r;
  float wy = texture(uTrail, uv + e2.yx).r;
  normal += vec2(wipeMask - wx, wipeMask - wy) \* 0.05 \* uWipeDistort \* clamp(uWipe, 0.0, 1.0);

  vec2 refractedUv = clamp(uv + normal \* uRefraction, vec2(0.001), vec2(uMaxX - 0.004, 0.999));
  float fog = clamp(uBlur, 0.0, 8.0) \* mix(0.7, 1.0, rainAmount);
  float back = fog \* (1.0 - clamp(c.y \* 2.0, 0.0, 1.0)) \* (1.0 - wipe);
  float focus = mix(back, 0.0, S(0.1, 0.2, c.x));

  if (uHasContent < 0.5) {
    float mask = S(0.02, 0.14, c.x);
    vec3 n3 = normalize(vec3(normal \* 42.0, 1.0));
    vec3 L = normalize(vec3(-0.35, 0.75, 0.55));
    float spec = pow(max(dot(reflect(vec3(0.0, 0.0, -1.0), n3), L), 0.0), 34.0);
    float rim = clamp(length(normal) \* 26.0, 0.0, 1.0);
    vec3 dropCol = mix(vec3(0.72), uTint, clamp(uTintStrength, 0.0, 1.0));
    vec3 colF = dropCol \* (0.12 + 0.5 \* rim) + vec3(spec);
    float alphaF = mask \* clamp(0.1 + rim \* 0.5 + spec \* 0.9, 0.0, 1.0);
    outColor = vec4(clamp(colF, 0.0, 1.0) \* alphaF, alphaF);
    return;
  }

  vec4 content = textureLod(uContent, vec2(refractedUv.x, 1.0 - refractedUv.y), focus);
  vec3 col = content.rgb;

  col = mix(col, uTint, clamp(uTintStrength, 0.0, 1.0) \* 0.35);

  vec2 vignetteUv = uv - 0.5;
  col \*= 1.0 - dot(vignetteUv, vignetteUv) \* clamp(uVignette, 0.0, 1.0) \* 2.0;

  outColor = vec4(col \* content.a, content.a);
}\`;

const TRAIL\_FRAG = \`#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uPrev;
uniform vec2 uFrom;
uniform vec2 uTo;
uniform float uAspect;
uniform float uRadius;
uniform float uDecay;
uniform float uDrain;
uniform float uSplat;

float capsule (vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
  return length(pa - ba \* h);
}

void main () {
  float prev = max(texture(uPrev, vUv).r \* uDecay - uDrain, 0.0);
  vec2 p = vec2(vUv.x \* uAspect, vUv.y);
  vec2 a = vec2(uFrom.x \* uAspect, uFrom.y);
  vec2 b = vec2(uTo.x \* uAspect, uTo.y);
  float d = capsule(p, a, b);
  float m = smoothstep(uRadius, uRadius \* 0.5, d) \* uSplat;
  outColor = vec4(max(prev, m), 0.0, 0.0, 1.0);
}\`;

export function supportsHtmlInCanvas(): boolean {
  if (typeof document === "undefined") return false;
  const probe = document.createElement("canvas") as PaintableCanvas;
  const ctx = probe.getContext("2d") as ElementImageContext | null;
  return Boolean(
    ctx &&
    typeof ctx.drawElementImage === "function" &&
    typeof probe.requestPaint === "function",
  );
}

export function createDroplets(
  elements: DropletsElements,
  options: DropletsOptions = {},
): DropletsInstance | null {
  const config = { ...DEFAULTS, ...options };
  const { source, content, output } = elements;

  const gl = output.getContext("webgl2", {
    alpha: true,
    depth: false,
    stencil: false,
    antialias: false,
    premultipliedAlpha: true,
  });
  if (!gl || gl.isContextLost()) return null;

  const sourceCtx = source.getContext("2d") as ElementImageContext | null;
  const paintable = source as PaintableCanvas;
  const htmlInCanvas = Boolean(
    sourceCtx &&
    typeof sourceCtx.drawElementImage === "function" &&
    typeof paintable.requestPaint === "function",
  );

  if (htmlInCanvas) prepareHtmlInCanvas(source, content);

  let contentDirty = false;
  let wake = () => {};

  if (htmlInCanvas) {
    paintable.onpaint = () => {
      try {
        sourceCtx!.reset();
        drawHtmlInCanvas(source, sourceCtx!, content);
        contentDirty = true;
        wake();
      } catch {}
    };
  }

  function compile(type: number, text: string): WebGLShader {
    const shader = gl!.createShader(type)!;
    gl!.shaderSource(shader, text);
    gl!.compileShader(shader);
    if (!gl!.getShaderParameter(shader, gl!.COMPILE\_STATUS)) {
      console.error("Droplets shader error:", gl!.getShaderInfoLog(shader));
    }
    return shader;
  }

  const vertexShader = compile(gl.VERTEX\_SHADER, VERT);
  const fragmentShader = compile(gl.FRAGMENT\_SHADER, FRAG);
  const trailShader = compile(gl.FRAGMENT\_SHADER, TRAIL\_FRAG);

  function link(fragment: WebGLShader) {
    const prog = gl!.createProgram()!;
    gl!.attachShader(prog, vertexShader);
    gl!.attachShader(prog, fragment);
    gl!.linkProgram(prog);
    const locations: Record<string, WebGLUniformLocation> = {};
    const total = gl!.getProgramParameter(prog, gl!.ACTIVE\_UNIFORMS);
    for (let i = 0; i < total; i++) {
      const info = gl!.getActiveUniform(prog, i)!;
      locations[info.name] = gl!.getUniformLocation(prog, info.name)!;
    }
    return { program: prog, uniforms: locations };
  }

  const { program, uniforms } = link(fragmentShader);
  const { program: trailProgram, uniforms: trailUniforms } = link(trailShader);

  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY\_BUFFER, quad);
  gl.bufferData(
    gl.ARRAY\_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC\_DRAW,
  );
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const contentTexture = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE\_2D, contentTexture);
  gl.texParameteri(
    gl.TEXTURE\_2D,
    gl.TEXTURE\_MIN\_FILTER,
    gl.LINEAR\_MIPMAP\_LINEAR,
  );
  gl.texParameteri(gl.TEXTURE\_2D, gl.TEXTURE\_MAG\_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE\_2D, gl.TEXTURE\_WRAP\_S, gl.CLAMP\_TO\_EDGE);
  gl.texParameteri(gl.TEXTURE\_2D, gl.TEXTURE\_WRAP\_T, gl.CLAMP\_TO\_EDGE);
  gl.texImage2D(
    gl.TEXTURE\_2D,
    0,
    gl.RGBA,
    1,
    1,
    0,
    gl.RGBA,
    gl.UNSIGNED\_BYTE,
    new Uint8Array([0, 0, 0, 0]),
  );
  gl.generateMipmap(gl.TEXTURE\_2D);

  let contentMaxX = 1;

  function syncCanvasSize() {
    const dpr = getCanvasPixelRatio(output, gl!);
    const width = Math.max(1, Math.round(output.clientWidth \* dpr));
    const height = Math.max(1, Math.round(output.clientHeight \* dpr));
    if (output.width !== width || output.height !== height) {
      output.width = width;
      output.height = height;
    }
    contentMaxX = Math.min(
      1,
      Math.max(0.05, content.clientWidth / Math.max(output.clientWidth, 1)),
    );
    if (htmlInCanvas) {
      const sourceWidth = Math.max(1, Math.round(source.clientWidth \* dpr));
      const sourceHeight = Math.max(1, Math.round(source.clientHeight \* dpr));
      if (source.width !== sourceWidth || source.height !== sourceHeight) {
        source.width = sourceWidth;
        source.height = sourceHeight;
      }
      paintable.requestPaint!();
    }
  }

  syncCanvasSize();

  let trailWidth = 0;
  let trailHeight = 0;
  const trailTextures: WebGLTexture[] = [];
  const trailFramebuffers: WebGLFramebuffer[] = [];
  let trailIndex = 0;

  function ensureTrailTargets() {
    const width = Math.max(1, Math.round(output.width / 4));
    const height = Math.max(1, Math.round(output.height / 4));
    if (width === trailWidth && height === trailHeight && trailTextures.length)
      return;
    trailWidth = width;
    trailHeight = height;
    for (const texture of trailTextures) gl!.deleteTexture(texture);
    for (const framebuffer of trailFramebuffers)
      gl!.deleteFramebuffer(framebuffer);
    trailTextures.length = 0;
    trailFramebuffers.length = 0;
    for (let i = 0; i < 2; i++) {
      const texture = gl!.createTexture()!;
      gl!.bindTexture(gl!.TEXTURE\_2D, texture);
      gl!.texParameteri(gl!.TEXTURE\_2D, gl!.TEXTURE\_MIN\_FILTER, gl!.LINEAR);
      gl!.texParameteri(gl!.TEXTURE\_2D, gl!.TEXTURE\_MAG\_FILTER, gl!.LINEAR);
      gl!.texParameteri(gl!.TEXTURE\_2D, gl!.TEXTURE\_WRAP\_S, gl!.CLAMP\_TO\_EDGE);
      gl!.texParameteri(gl!.TEXTURE\_2D, gl!.TEXTURE\_WRAP\_T, gl!.CLAMP\_TO\_EDGE);
      gl!.texImage2D(
        gl!.TEXTURE\_2D,
        0,
        gl!.RGBA,
        width,
        height,
        0,
        gl!.RGBA,
        gl!.UNSIGNED\_BYTE,
        null,
      );
      const framebuffer = gl!.createFramebuffer()!;
      gl!.bindFramebuffer(gl!.FRAMEBUFFER, framebuffer);
      gl!.framebufferTexture2D(
        gl!.FRAMEBUFFER,
        gl!.COLOR\_ATTACHMENT0,
        gl!.TEXTURE\_2D,
        texture,
        0,
      );
      gl!.clearColor(0, 0, 0, 1);
      gl!.clear(gl!.COLOR\_BUFFER\_BIT);
      trailTextures.push(texture);
      trailFramebuffers.push(framebuffer);
    }
    gl!.bindFramebuffer(gl!.FRAMEBUFFER, null);
  }

  const pointer = {
    x: 0.5,
    y: 0.5,
    px: 0.5,
    py: 0.5,
    seen: false,
    moved: false,
  };

  function updateTrail(delta: number) {
    ensureTrailTargets();
    gl!.useProgram(trailProgram);
    gl!.activeTexture(gl!.TEXTURE0);
    gl!.bindTexture(gl!.TEXTURE\_2D, trailTextures[trailIndex]);
    gl!.uniform1i(trailUniforms.uPrev, 0);
    gl!.uniform1f(trailUniforms.uDecay, Math.exp(-delta \* 0.5));
    gl!.uniform1f(trailUniforms.uDrain, delta \* 0.3);
    gl!.uniform1f(
      trailUniforms.uAspect,
      output.width / Math.max(output.height, 1),
    );
    gl!.uniform2f(trailUniforms.uFrom, pointer.px, pointer.py);
    gl!.uniform2f(trailUniforms.uTo, pointer.x, pointer.y);
    gl!.uniform1f(
      trailUniforms.uRadius,
      Math.max(config.interactionRadius, 0.01),
    );
    gl!.uniform1f(
      trailUniforms.uSplat,
      config.interactive && pointer.moved ? 1 : 0,
    );
    gl!.bindFramebuffer(gl!.FRAMEBUFFER, trailFramebuffers[1 - trailIndex]);
    gl!.viewport(0, 0, trailWidth, trailHeight);
    gl!.drawArrays(gl!.TRIANGLE\_STRIP, 0, 4);
    gl!.bindFramebuffer(gl!.FRAMEBUFFER, null);
    trailIndex = 1 - trailIndex;
    pointer.px = pointer.x;
    pointer.py = pointer.y;
    pointer.moved = false;
  }

  function uploadContent() {
    if (!htmlInCanvas || !contentDirty) return;
    contentDirty = false;
    gl!.bindTexture(gl!.TEXTURE\_2D, contentTexture);
    gl!.texImage2D(
      gl!.TEXTURE\_2D,
      0,
      gl!.RGBA,
      gl!.RGBA,
      gl!.UNSIGNED\_BYTE,
      source,
    );
    gl!.generateMipmap(gl!.TEXTURE\_2D);
  }

  function render(timeSec: number) {
    uploadContent();
    gl!.useProgram(program);
    gl!.activeTexture(gl!.TEXTURE0);
    gl!.bindTexture(gl!.TEXTURE\_2D, contentTexture);
    gl!.uniform1i(uniforms.uContent, 0);
    gl!.uniform1f(uniforms.uHasContent, htmlInCanvas ? 1 : 0);
    gl!.uniform2f(uniforms.uResolution, output.width, output.height);
    gl!.uniform2f(
      uniforms.uOffset,
      content.scrollLeft / Math.max(content.clientWidth, 1),
      -content.scrollTop / Math.max(content.clientHeight, 1),
    );
    gl!.uniform1f(uniforms.uTime, timeSec);
    gl!.uniform1f(uniforms.uIntensity, config.intensity);
    gl!.uniform1f(uniforms.uScale, Math.max(config.scale, 0.01));
    gl!.uniform1f(uniforms.uDropWidth, Math.max(config.dropWidth, 0.05));
    gl!.uniform1f(uniforms.uDropLength, Math.max(config.dropLength, 0.05));
    gl!.uniform1f(uniforms.uRefraction, config.refraction);
    gl!.uniform1f(uniforms.uBlur, Math.max(config.blur, 0));
    gl!.uniform1f(uniforms.uVignette, config.vignette);
    gl!.uniform1f(uniforms.uFallSpeed, config.fallSpeed);
    gl!.uniform1f(uniforms.uWiggle, config.wiggle);
    gl!.uniform1f(uniforms.uStaticDrops, config.staticDrops);
    gl!.uniform1f(uniforms.uMaxX, contentMaxX);
    gl!.activeTexture(gl!.TEXTURE1);
    gl!.bindTexture(gl!.TEXTURE\_2D, trailTextures[trailIndex]);
    gl!.uniform1i(uniforms.uTrail, 1);
    gl!.uniform1f(
      uniforms.uWipe,
      config.interactive
        ? Math.min(Math.max(config.interactionStrength, 0), 1)
        : 0,
    );
    gl!.uniform1f(
      uniforms.uWipeDistort,
      Math.max(config.interactionDistortion, 0),
    );
    gl!.uniform3f(
      uniforms.uTint,
      config.tint[0],
      config.tint[1],
      config.tint[2],
    );
    gl!.uniform1f(uniforms.uTintStrength, config.tintStrength);
    gl!.bindFramebuffer(gl!.FRAMEBUFFER, null);
    gl!.viewport(0, 0, output.width, output.height);
    gl!.drawArrays(gl!.TRIANGLE\_STRIP, 0, 4);
  }

  let raf = 0;
  let lastTime = performance.now();
  let elapsed = 0;
  let destroyed = false;
  let running = false;
  let visible = true;

  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reducedMotion = motionQuery.matches;

  function frame(now: number) {
    if (destroyed) return;
    if (!visible) {
      running = false;
      return;
    }
    const delta = Math.min((now - lastTime) / 1000, 1 / 30);
    lastTime = now;
    elapsed += delta \* config.speed;
    updateTrail(delta);
    render(elapsed);
    if (reducedMotion && !contentDirty) {
      running = false;
      return;
    }
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (destroyed || running || !visible) return;
    running = true;
    lastTime = performance.now();
    raf = requestAnimationFrame(frame);
  }

  wake = start;
  start();

  function onMotionChange() {
    reducedMotion = motionQuery.matches;
    start();
  }
  motionQuery.addEventListener("change", onMotionChange);

  const observer = createCanvasResizeObserver(() => {
    syncCanvasSize();
    start();
  });
  observer.observe(output);
  observer.observe(content);

  const intersection = new IntersectionObserver((entries) => {
    visible = entries[entries.length - 1]?.isIntersecting ?? true;
    if (visible) start();
  });
  intersection.observe(output);

  const listenTarget = output.parentElement ?? output;

  const rectCache = createRectCache(output);

  function onPointerMove(event: PointerEvent) {
    if (!config.interactive || reducedMotion) return;
    const rect = rectCache.current;
    const x = (event.clientX - rect.left) / Math.max(rect.width, 1);
    const y = 1 - (event.clientY - rect.top) / Math.max(rect.height, 1);
    if (!pointer.seen) {
      pointer.seen = true;
      pointer.px = x;
      pointer.py = y;
    }
    pointer.x = x;
    pointer.y = y;
    pointer.moved = true;
    start();
  }

  function onPointerLeave() {
    pointer.seen = false;
  }

  listenTarget.addEventListener("pointermove", onPointerMove, { passive: true });
  listenTarget.addEventListener("pointerleave", onPointerLeave, { passive: true });
  content.addEventListener("scroll", start, { passive: true });

  return {
    setOptions(next) {
      if (
        !Object.entries(next).some(
          ([key, value]) => config[key as keyof DropletsOptions] !== value,
        )
      )
        return;
      Object.assign(config, next);
      start();
    },
    resize() {
      syncCanvasSize();
      start();
    },
    destroy() {
      destroyed = true;
      rectCache.destroy();
      cancelAnimationFrame(raf);
      observer.disconnect();
      intersection.disconnect();
      motionQuery.removeEventListener("change", onMotionChange);
      listenTarget.removeEventListener("pointermove", onPointerMove);
      listenTarget.removeEventListener("pointerleave", onPointerLeave);
      content.removeEventListener("scroll", start);
      gl!.deleteTexture(contentTexture);
      for (const texture of trailTextures) gl!.deleteTexture(texture);
      for (const framebuffer of trailFramebuffers)
        gl!.deleteFramebuffer(framebuffer);
      gl!.deleteProgram(program);
      gl!.deleteProgram(trailProgram);
      gl!.deleteShader(vertexShader);
      gl!.deleteShader(fragmentShader);
      gl!.deleteShader(trailShader);
      gl!.deleteBuffer(quad);
      if (htmlInCanvas) paintable.onpaint = null;
    },
  };
}

export interface DropletsProps extends DropletsOptions {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const emptySubscribe = () => () => {};

export function Droplets({
  children,
  className,
  style,
  ...options
}: DropletsProps) {
  const sourceRef = useRef<HTMLCanvasElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const outputRef = useRef<HTMLCanvasElement>(null);
  const instanceRef = useRef<DropletsInstance | null>(null);
  const [initialOptions] = useState(options);
  const [failed, setFailed] = useState(false);

  const supported = useSyncExternalStore(
    emptySubscribe,
    supportsHtmlInCanvas,
    () => false,
  );
  const native = supported && !failed;

  useEffect(() => {
    const source = sourceRef.current;
    const content = contentRef.current;
    const output = outputRef.current;
    if (!source || !content || !output) return;
    instanceRef.current = createDroplets(
      { source, content, output },
      initialOptions,
    );
    if (native && !instanceRef.current) setFailed(true);
    return () => {
      instanceRef.current?.destroy();
      instanceRef.current = null;
    };
  }, [initialOptions, native]);

  useEffect(() => {
    instanceRef.current?.setOptions(options);
  });

  return (
    <div className={className} style={{ position: "relative", ...style }}>
      <canvas
        ref={sourceRef}
        // @ts-expect-error experimental html-in-canvas attribute
        layoutsubtree="true"
        suppressHydrationWarning
        style={
          native
            ? { position: "absolute", inset: 0, width: "100%", height: "100%" }
            : { display: "none" }
        }
      >
        {native ? (
          <div
            ref={contentRef}
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
              overflow: "auto",
            }}
          >
            {children}
          </div>
        ) : null}
      </canvas>
      {!native ? (
        <div
          ref={contentRef}
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            overflow: "auto",
          }}
        >
          {children}
        </div>
      ) : null}
      <canvas
        ref={outputRef}
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}


export default Droplets;
\`\`\`
# Canvas UI: Frost (React, WebGL)

A pane of ice over your live page. Hover to melt a hole through the frost and watch it freeze back over.

## Install

\`\`\`sh
npx shadcn@latest add @canvas-ui/frost-react
\`\`\`

Or copy the standalone source below into your project as Frost.tsx.

## Current configuration

The component as configured right now in the docs demo (React syntax; prop values apply to every framework):

\`\`\`tsx
import { Frost } from "@/components/canvasui/Frost";

<Frost
  frost={0.05}
  strength={0.7}
  contrast={3}
  crispness={1}
  highlight={0.3}
  haze={0.5}
  tintStrength={0.3}
  refraction={1}
  detail={2}
  textureScale={2}
  meltRadius={0.25}
  meltNoise={0.25}
  meltStrength={0.75}
  refreeze={2}
  opacity={0.6}
  shimmer={0}
  meltEdges
  tintThin={[0.8196, 0.8588, 1]}
  tintThick={[0.9176, 0.9608, 1]}
>
  {/\* your content \*/}
</Frost>
\`\`\`

## Props

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| frost | number | 0.05 | Base frozen coverage added on top of the frost pattern. |
| strength | number | 0.7 | Multiplier on the frost noise pattern. Higher freezes more. |
| contrast | number | 3 | Contrast of the frost noise pattern. |
| crispness | number | 1 | Contrast of the final frost mask. Higher is crisper edges. |
| highlight | number | 0.3 | How much sparkling grain mixes into the frost. |
| highlightStrength | number | 0.8 | How strongly the sparkles tint toward white. |
| haze | number | 0.5 | Base blur haze over the content, even outside thick frost. |
| tintThin | [number, number, number] | [0.82, 0.86, 1.05] | Frost color where the layer is thin, as [r, g, b] in 0-1. |
| tintThick | [number, number, number] | [0.92, 0.96, 1.1] | Frost color where the layer is thick, as [r, g, b] in 0-1. |
| tintStrength | number | 0.3 | How much the frost tint colors the frozen areas. |
| saturation | number | 1.2 | Saturation multiplier applied to the frosted content. |
| brightness | number | 0.85 | Brightness multiplier applied to the frosted content. |
| refraction | number | 1 | How far the icy surface bends light. 0 disables it. |
| ior | number | 1.31 | Index of refraction of the ice. Water ice is about 1.31. |
| detail | number | 2 | Strength of the fine surface detail in the refraction. |
| textureScale | number | 2 | Scale of the icy relief pattern. Higher is larger features. |
| fresnel | number | 0.8 | Fresnel boost of the refraction at grazing angles. |
| meltRadius | number | 0.25 | Radius of the melt spot under the cursor. |
| meltNoise | number | 0.25 | Irregularity of the melt edge. 0 is a clean circle. |
| meltStrength | number | 0.75 | How quickly hovering melts the frost. |
| refreeze | number | 2 | How fast melted areas freeze back over. 0 never refreezes. |
| edgeFade | number | 0.1 | Keeps the edges of the pane frozen. 0 lets everything melt. |
| meltEdges | boolean | true | Lets the frozen borders of the pane melt too. |
| introDuration | number | 2.5 | Seconds for the frost to grow in from the edges on load. 0 disables. |
| opacity | number | 0.6 | Overall opacity of the frost layer. Lower shows more content. |
| shimmer | number | 0 | Animated twinkle of the highlight grain. 0 is static. |
| quality | number | 1 | Resolution multiplier for the blur passes (0.25-1). |
| className | string |  | Classes applied to the wrapper element. |

## Frost.tsx

\`\`\`tsx
"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

const canvasDimensionLimits = new WeakMap<WebGLRenderingContext | WebGL2RenderingContext, number>();

/\*\* Keep the existing DPR budget, then account for browser pinch zoom. \*/
function getCanvasPixelRatio(
  element: HTMLElement,
  context?: WebGLRenderingContext | WebGL2RenderingContext,
): number {
  const scale = window.visualViewport?.scale || 1;
  const requested = Math.min(window.devicePixelRatio || 1, 2) \* scale;
  const width = Math.max(element.clientWidth, 1);
  const height = Math.max(element.clientHeight, 1);
  let maxDimension = 8192;
  if (context) {
    let limit = canvasDimensionLimits.get(context);
    if (limit === undefined) {
      limit = Math.min(
        maxDimension,
        context.getParameter(context.MAX\_TEXTURE\_SIZE),
        context.getParameter(context.MAX\_RENDERBUFFER\_SIZE),
      );
      canvasDimensionLimits.set(context, limit);
    }
    maxDimension = limit;
  }
  // Rendering the full element preserves its CSS position and native input
  // geometry while panning. Bound allocations when zooming large canvases.
  return Math.min(
    requested,
    maxDimension / Math.max(width, height),
    Math.sqrt(16\_777\_216 / (width \* height)),
  );
}

/\*\* Pinch zoom changes visualViewport without resizing the element's CSS box. \*/
function createCanvasResizeObserver(onResize: () => void) {
  const viewport = window.visualViewport;
  let frame = 0;
  let disconnected = false;
  const schedule = () => {
    if (frame || disconnected) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      onResize();
    });
  };
  const observer = new ResizeObserver(schedule);
  window.addEventListener("resize", schedule, { passive: true });
  viewport?.addEventListener("resize", schedule, { passive: true });
  return {
    observe(element: Element, options?: ResizeObserverOptions) {
      observer.observe(element, options);
    },
    unobserve(element: Element) {
      observer.unobserve(element);
    },
    disconnect() {
      disconnected = true;
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", schedule);
      viewport?.removeEventListener("resize", schedule);
    },
  };
}

type HtmlInCanvasContext = CanvasRenderingContext2D & {
  drawElementImage: (element: Element, x: number, y: number) => DOMMatrix | void;
};

type HtmlInCanvasElement = HTMLCanvasElement & {
  updateElementGeometry?: (
    element: Element,
    options: { canvasTransform: DOMMatrix },
  ) => void;
};

/\*\* Configure the capture subtree for both generations of the experimental API. \*/
function prepareHtmlInCanvas(source: HTMLCanvasElement, content: HTMLElement) {
  if ("content" in source) {
    source.setAttribute("content", "drawable");
    content.setAttribute("drawable", "");
  } else {
    source.setAttribute("layoutsubtree", "");
  }
}

/\*\* Capture pixels and keep the native DOM hit-test region aligned with them. \*/
function drawHtmlInCanvas(
  source: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  content: HTMLElement,
) {
  const transform = (context as HtmlInCanvasContext).drawElementImage(content, 0, 0);
  const canvas = source as HtmlInCanvasElement;
  // Chrome 154 decoupled geometry from drawing before enabling automatic 2D
  // synchronization. Older versions have no update method; newer versions
  // synchronize automatically and return void. Use the returned matrix as-is:
  // drawElementImage already accounts for the canvas's pixel density.
  if (transform && typeof canvas.updateElementGeometry === "function") {
    canvas.updateElementGeometry(content, { canvasTransform: transform });
  }
}

function createRectCache(element: Element) {
  let current = element.getBoundingClientRect();

  const refresh = () => {
    current = element.getBoundingClientRect();
  };

  const observer = new ResizeObserver(refresh);
  observer.observe(element);
  window.addEventListener("resize", refresh, { passive: true });
  window.addEventListener("scroll", refresh, {
    capture: true,
    passive: true,
  });

  return {
    get current() {
      return current;
    },
    destroy() {
      observer.disconnect();
      window.removeEventListener("resize", refresh);
      window.removeEventListener("scroll", refresh, true);
    },
  };
}

export interface FrostOptions {
  /\*\* Base frozen coverage added on top of the frost pattern (0-1). \*/
  frost?: number;
  /\*\* Multiplier on the frost noise pattern. Higher freezes more of the pane. \*/
  strength?: number;
  /\*\* Contrast of the frost noise pattern. \*/
  contrast?: number;
  /\*\* Contrast of the final frost mask. Higher gives crisper frost edges. \*/
  crispness?: number;
  /\*\* How much sparkling highlight grain mixes into the frost (0-1). \*/
  highlight?: number;
  /\*\* How strongly highlights tint toward white (0-1). \*/
  highlightStrength?: number;
  /\*\* Base blur haze mixed over the content, even outside thick frost (0-1). \*/
  haze?: number;
  /\*\* Frost color where the layer is thin, as [r, g, b] in 0-1 range. \*/
  tintThin?: [number, number, number];
  /\*\* Frost color where the layer is thick, as [r, g, b] in 0-1 range. \*/
  tintThick?: [number, number, number];
  /\*\* How much the frost tint colors the frozen areas (0-1). \*/
  tintStrength?: number;
  /\*\* Saturation multiplier applied to the frosted content. \*/
  saturation?: number;
  /\*\* Brightness multiplier applied to the frosted content. \*/
  brightness?: number;
  /\*\* How far the icy surface bends light. 0 disables refraction. \*/
  refraction?: number;
  /\*\* Index of refraction of the ice. Water ice is about 1.31. \*/
  ior?: number;
  /\*\* Strength of the fine surface detail in the refraction. \*/
  detail?: number;
  /\*\* Scale of the icy relief pattern. Higher is larger features. \*/
  textureScale?: number;
  /\*\* Fresnel boost at grazing angles (0-2). \*/
  fresnel?: number;
  /\*\* Radius of the melt spot under the cursor (0-1, fraction of height). \*/
  meltRadius?: number;
  /\*\* Irregularity of the melt edge. 0 is a clean circle. \*/
  meltNoise?: number;
  /\*\* How quickly hovering melts the frost (0-1). \*/
  meltStrength?: number;
  /\*\* How fast melted areas freeze back over. 0 never refreezes. \*/
  refreeze?: number;
  /\*\* Keeps the edges of the pane frozen. 0 lets everything melt. \*/
  edgeFade?: number;
  /\*\* Lets the frozen borders of the pane melt too. \*/
  meltEdges?: boolean;
  /\*\* Seconds for the frost to grow in from the edges on load. 0 disables. \*/
  introDuration?: number;
  /\*\* Overall opacity of the frost layer (0-1). Lower shows more content. \*/
  opacity?: number;
  /\*\* Animated twinkle of the highlight grain (0-1). 0 is static. \*/
  shimmer?: number;
  /\*\* Resolution multiplier for the blur passes (0.25-1). \*/
  quality?: number;
}

export interface FrostElements {
  /\*\* Canvas with layoutsubtree that hosts the HTML content. \*/
  source: HTMLCanvasElement;
  /\*\* The element inside the source canvas that gets captured. \*/
  content: HTMLElement;
  /\*\* Canvas the WebGL effect renders to. \*/
  output: HTMLCanvasElement;
}

export interface FrostInstance {
  /\*\* Melt a spot at (x, y) in [0,1] space, top-left origin.
   \* Keeps the newest 32 pending calls while suspended; applies at most 4 per frame.
   \*/
  melt: (x: number, y: number) => void;
  /\*\* Update options live. \*/
  setOptions: (options: FrostOptions) => void;
  /\*\* Re-read canvas size. Call when the element is resized. \*/
  resize: () => void;
  /\*\* Stop the loop and release all GPU resources. \*/
  destroy: () => void;
}

const DEFAULTS: Required<FrostOptions> = {
  frost: 0.05,
  strength: 0.7,
  contrast: 3,
  crispness: 1,
  highlight: 0.3,
  highlightStrength: 0.8,
  haze: 0.5,
  tintThin: [0.82, 0.86, 1.05],
  tintThick: [0.92, 0.96, 1.1],
  tintStrength: 0.3,
  saturation: 1.2,
  brightness: 0.85,
  refraction: 1,
  ior: 1.31,
  detail: 2,
  textureScale: 2,
  fresnel: 0.8,
  meltRadius: 0.25,
  meltNoise: 0.25,
  meltStrength: 0.75,
  refreeze: 2,
  edgeFade: 0.1,
  meltEdges: true,
  introDuration: 2.5,
  opacity: 0.6,
  shimmer: 0,
  quality: 1,
};

const BLUR\_KERNEL = 10;
const HEIGHT\_RES = 512;
const NOISE\_RES = 1024;

type PaintableCanvas = HTMLCanvasElement & {
  onpaint?: (() => void) | null;
  requestPaint?: () => void;
};

type ElementImageContext = CanvasRenderingContext2D & {
  drawElementImage?: (element: Element, x: number, y: number) => void;
};

const VERT = \`#version 300 es
precision highp float;
layout(location = 0) in vec2 aPos;
out vec2 vUv;
void main () {
  vUv = aPos \* 0.5 + 0.5;
  gl\_Position = vec4(aPos, 0.0, 1.0);
}\`;

const FRAG\_NOISE = \`#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
float prnd (vec2 n, float period) {
  n = mod(n, period);
  float dt = dot(n, vec2(0.129898, 0.78233));
  return fract(sin(mod(dt, 3.14159265)) \* 437.585453);
}
float pnoise (vec2 p, float period) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f \* f \* (3.0 - 2.0 \* f);
  float a = prnd(i, period);
  float b = prnd(i + vec2(1.0, 0.0), period);
  float c = prnd(i + vec2(0.0, 1.0), period);
  float d = prnd(i + vec2(1.0, 1.0), period);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float pfbm (vec2 p, float period, int octaves) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    if (i >= octaves) break;
    v += a \* pnoise(p, period);
    p = p \* 2.0 + vec2(17.0, 31.0);
    period \*= 2.0;
    a \*= 0.5;
  }
  return v;
}
float pwarp (vec2 p, float period, float g) {
  float val = 0.0;
  for (int i = 0; i < 2; i++) {
    val = pfbm(
      p + g \* vec2(cos(6.28318 \* val), sin(6.28318 \* val)), period, 4);
  }
  return val;
}
void main () {
  float pattern = pwarp(vUv \* 20.0, 20.0, 4.0);
  float mottle = pfbm(vUv \* 26.0, 26.0, 3);
  float sparkle =
    smoothstep(0.8, 0.95, pnoise(vUv \* 200.0, 200.0)) \*
    (0.35 + 0.65 \* pnoise(vUv \* 50.0, 50.0));
  float meltEdge = pfbm(vUv \* 9.0, 9.0, 3);
  outColor = vec4(pattern, mottle, sparkle, meltEdge);
}\`;

const FRAG\_HEIGHT = \`#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
float prnd (vec2 n, float period) {
  n = mod(n, period);
  float dt = dot(n, vec2(0.129898, 0.78233));
  return fract(sin(mod(dt, 3.14159265)) \* 437.585453);
}
float pnoise (vec2 p, float period) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f \* f \* (3.0 - 2.0 \* f);
  float a = prnd(i, period);
  float b = prnd(i + vec2(1.0, 0.0), period);
  float c = prnd(i + vec2(0.0, 1.0), period);
  float d = prnd(i + vec2(1.0, 1.0), period);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float pfbm (vec2 p, float period, int octaves) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    if (i >= octaves) break;
    v += a \* pnoise(p, period);
    p \*= 2.0;
    period \*= 2.0;
    a \*= 0.5;
  }
  return v;
}
void main () {
  float broad = pfbm(vUv \* 6.0, 6.0, 4);
  broad = broad \* broad \* 1.4;
  float fine = pfbm(vUv \* 28.0, 28.0, 3);
  outColor = vec4(broad, fine, 0.0, 1.0);
}\`;

const FRAG\_BLUR = \`#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uScene;
uniform vec2 uTexelSize;
uniform vec2 uStep;
uniform float uFlipY;
WEIGHTS\_PLACEHOLDER
vec2 srcUv (vec2 uv) {
  return uFlipY > 0.5 ? vec2(uv.x, 1.0 - uv.y) : uv;
}
void main () {
  vec4 sum = texture(uScene, srcUv(vUv)) \* WEIGHT\_CENTER;
  for (int i = 1; i < KERNEL\_SIZE; i++) {
    vec2 delta = float(i) \* uTexelSize \* uStep;
    sum += texture(uScene, srcUv(clamp(vUv + delta, 0.0, 1.0))) \* WEIGHTS[i - 1];
    sum += texture(uScene, srcUv(clamp(vUv - delta, 0.0, 1.0))) \* WEIGHTS[i - 1];
  }
  outColor = sum;
}\`;

const FRAG\_POINTER = \`#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uBack;
uniform sampler2D uNoise;
uniform vec2 uPoint;
uniform vec2 uPrevPoint;
uniform vec2 uBackShift;
uniform vec2 uScroll;
uniform float uAspect;
uniform float uTextureScale;
uniform float uDecay;
uniform float uMeltNoise;
uniform float uMeltStrength;
uniform float uRadius;
uniform float uEdgeFade;
uniform float uTouching;
float sdSegment (vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
  return length(pa - ba \* h);
}
void main () {
  vec2 backUv = vUv + uBackShift;
  vec4 back = texture(uBack, backUv);
  float inside =
    step(0.0, backUv.x) \* step(backUv.x, 1.0) \*
    step(0.0, backUv.y) \* step(backUv.y, 1.0);
  float melt = clamp(back.r \* inside - uDecay, 0.0, 1.0);

  vec2 nUv = (vUv + uScroll) \* vec2(uAspect, 1.0)
    / max(uTextureScale, 0.05);
  float n = texture(uNoise, nUv).a - 0.5;

  vec2 p = vUv \* vec2(uAspect, 1.0);
  vec2 a = uPrevPoint \* vec2(uAspect, 1.0);
  vec2 b = uPoint \* vec2(uAspect, 1.0);
  float d = sdSegment(p, a, b) + n \* uMeltNoise;

  float m =
    (1.0 - smoothstep(uRadius \* 0.35, uRadius, d)) \* uMeltStrength;
  vec2 dSide = min(vUv, 1.0 - vUv);
  float side = smoothstep(0.0, max(uEdgeFade, 1e-4), min(dSide.x, dSide.y));
  m \*= mix(1.0, side, step(1e-3, uEdgeFade));
  m \*= uTouching;

  melt = clamp(melt + m, 0.0, 1.0);
  outColor = vec4(vec3(melt), 1.0);
}\`;

const FRAG\_FROST = \`#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uContent;
uniform sampler2D uBlur;
uniform sampler2D uNoise;
uniform sampler2D uPointer;
uniform vec2 uScroll;
uniform float uAspect;
uniform float uTextureScale;
uniform float uMeltEdges;
uniform float uIntro;
uniform float uHighlight;
uniform float uStrength;
uniform float uFrost;
uniform float uContrast;
uniform float uCrispness;
uniform float uHaze;
uniform vec3 uTintThin;
uniform vec3 uTintThick;
uniform float uTintStrength;
uniform float uHighlightStrength;
uniform float uSaturation;
uniform float uBrightness;
uniform float uShimmer;
uniform float uTime;
uniform float uOpacity;
uniform float uHasContent;
float contrastFn (float x, float strength) {
  return clamp((x - 0.5) \* strength + 0.5, 0.0, 1.0);
}
float rand2 (vec2 uv) {
  uv = floor(uv \* 5000.0) / 5000.0;
  float a = dot(uv, vec2(92.0, 80.0));
  float b = dot(uv, vec2(41.0, 62.0));
  return fract(sin(a) + cos(b) \* 51.0);
}
vec3 hsv2rgb (vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) \* 6.0 - K.www);
  return c.z \* mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}
vec3 rgb2hsv (vec3 c) {
  vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
  float d = q.x - min(q.w, q.y);
  float e = 1.0e-10;
  return vec3(abs(q.z + (q.w - q.y) / (6.0 \* d + e)), d / (q.x + e), q.x);
}
void main () {
  vec2 nUv = (vUv + uScroll) \* vec2(uAspect, 1.0)
    / max(uTextureScale, 0.05);
  vec4 noise = texture(uNoise, nUv);
  float warpN = noise.r;

  float meltRaw = texture(uPointer, vUv).r;

  vec2 edgeDist = min(vUv, 1.0 - vUv);
  float edgeBoost =
    (1.0 - smoothstep(0.0, 0.4, min(edgeDist.x, edgeDist.y)))
    \* (1.0 - uMeltEdges \* smoothstep(0.0, 0.5, meltRaw));
  float strength = uStrength \* (0.62 + 0.65 \* edgeBoost);

  float ed = min(edgeDist.x, edgeDist.y)
    + (0.5 - warpN) \* 0.34 + (0.5 - noise.g) \* 0.16;
  float local = clamp((uIntro \* 3.0 - ed \* 2.0 - 0.3) / 1.1, 0.0, 1.0);
  strength \*= local;

  float body = contrastFn(warpN \* strength + uFrost \* local, uContrast);

  vec2 gUv = vUv + uScroll;
  float h = rand2(gUv + warpN \* 0.05);
  float grain = h \* warpN;
  float glint = smoothstep(0.85, 1.0, h);
  glint \*= mix(
    1.0,
    0.5 + 0.5 \* sin(uTime \* 2.4 + h \* 6.28),
    clamp(uShimmer, 0.0, 1.0)
  );
  float micro = mix(grain, glint, uHighlight);

  float m = clamp(meltRaw \* (1.1 + (noise.a - 0.5) \* 0.9), 0.0, 1.0);

  float d = body - m \* (0.9 + 0.35 \* body);
  float frozen = smoothstep(0.0, 0.22, d);
  float wet = (1.0 - frozen) \* (1.0 - smoothstep(0.0, 0.55, -d));
  wet \*= smoothstep(0.01, 0.1, m);

  float cover = smoothstep(0.03, 0.35, body);
  float ice = clamp(
    contrastFn(micro \* cover \* frozen + body, uCrispness), 0.0, 1.0);
  float frostMask = ice \* frozen;

  vec2 wobble = vec2(noise.a - 0.5, noise.g - 0.5) \* wet \* 0.018;

  vec3 icy = mix(uTintThin, uTintThick, body);
  vec4 base;
  vec4 blur;
  if (uHasContent > 0.5) {
    vec2 cUv = clamp(vUv + wobble, 0.0, 1.0);
    base = texture(uContent, vec2(cUv.x, 1.0 - cUv.y));
    blur = texture(uBlur, cUv);
  } else {
    base = vec4(icy, 1.0);
    blur = base;
  }
  float blurMix = clamp(
    frostMask + uHaze \* max(frozen, wet \* 0.5), 0.0, 1.0);
  vec4 color = mix(base, blur, blurMix);

  vec3 hsv = rgb2hsv(color.rgb);
  hsv.y = clamp(hsv.y \* uSaturation, 0.0, 1.0);
  hsv.z = clamp(hsv.z \* uBrightness, 0.0, 1.0);
  vec3 adjusted = hsv2rgb(hsv);
  color.rgb = mix(color.rgb, adjusted, frostMask);

  vec3 frostTint = mix(uTintThin, uTintThick, body);
  vec3 frostColor = mix(color.rgb, frostTint, uTintStrength);
  frostColor = mix(
    frostColor,
    vec3(1.0),
    glint \* uHighlightStrength \* step(0.001, uHighlight));

  color.rgb = mix(color.rgb, frostColor, frostMask);
  color.rgb += wet \* glint \* 0.25;

  float op = clamp(uOpacity, 0.0, 1.0);
  color.rgb = mix(base.rgb, color.rgb, op);
  outColor = vec4(clamp(color.rgb, 0.0, 1.0), frostMask \* op);
}\`;

const FRAG\_OUTPUT = \`#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uFrost;
uniform sampler2D uHeights;
uniform float uIor;
uniform float uRefraction;
uniform float uDetail;
uniform float uTextureScale;
uniform float uFresnel;
uniform vec2 uScrollPx;
uniform float uHasContent;
uniform float uFallbackAlpha;

const float TEXEL = 1.0 / ${HEIGHT\_RES}.0;

vec3 heightNormal (float channel, vec2 mapUv, float bump) {
  vec2 hx = vec2(TEXEL, 0.0);
  vec2 hy = vec2(0.0, TEXEL);
  vec2 c = texture(uHeights, mapUv).rg;
  vec2 x = texture(uHeights, mapUv + hx).rg;
  vec2 y = texture(uHeights, mapUv + hy).rg;
  float dx = channel < 0.5 ? x.r - c.r : x.g - c.g;
  float dy = channel < 0.5 ? y.r - c.r : y.g - c.g;
  return normalize(vec3(-dx \* bump, -dy \* bump, 1.0));
}

void main () {
  vec2 baseUv = vUv;
  float frostMask = texture(uFrost, baseUv).a;

  vec3 V = vec3(0.0, 0.0, 1.0);

  float mainScale = max(uTextureScale, 0.05) \* 900.0;
  float subScale = max(uTextureScale, 0.05) \* 260.0;
  vec2 mapCoord = gl\_FragCoord.xy + uScrollPx;
  vec2 mainUv = mapCoord / mainScale;
  vec2 subUv = mapCoord / subScale;

  vec3 nMain = heightNormal(0.0, mainUv, 14.0);
  vec3 nSub = heightNormal(1.0, subUv, 8.0);

  float heightW = smoothstep(0.1, 0.95, texture(uHeights, mainUv).r);

  vec3 R1 = refract(-V, nMain, 1.0 / uIor);
  vec3 R2 = refract(-V, nSub, 1.0 / uIor);
  vec2 offset = (R1.xy \* 0.3 + R2.xy \* uDetail \* heightW \* 0.5)
    \* uRefraction \* 0.2;

  vec2 refractedUv = clamp(baseUv + offset, 0.0, 1.0);

  vec4 baseColor = texture(uFrost, vUv);
  vec4 refractedColor = texture(uFrost, refractedUv);

  float cosTheta = clamp(dot(-V, nMain), 0.0, 1.0);
  float F0 = pow((uIor - 1.0) / (uIor + 1.0), 2.0);
  float fresnel = F0 + (1.0 - F0) \* pow(1.0 - cosTheta, 5.0);

  float refractionMix = frostMask;
  refractionMix = clamp(refractionMix \* (1.0 + fresnel \* uFresnel), 0.0, 1.0);

  vec4 mixed = mix(baseColor, refractedColor, refractionMix);
  if (uHasContent > 0.5) {
    outColor = vec4(mixed.rgb, 1.0);
  } else {
    float alpha = clamp(mixed.a \* uFallbackAlpha, 0.0, 1.0);
    outColor = vec4(mixed.rgb \* alpha, alpha);
  }
}\`;

interface Target {
  fbo: WebGLFramebuffer;
  texture: WebGLTexture;
  width: number;
  height: number;
}

interface DoubleTarget {
  read: Target;
  write: Target;
  swap: () => void;
}

export function supportsHtmlInCanvas(): boolean {
  if (typeof document === "undefined") return false;
  const probe = document.createElement("canvas") as PaintableCanvas;
  const ctx = probe.getContext("2d") as ElementImageContext | null;
  return Boolean(
    ctx &&
    typeof ctx.drawElementImage === "function" &&
    typeof probe.requestPaint === "function",
  );
}

function buildBlurWeights(kernel: number): string {
  const weights: number[] = [];
  let total = 0;
  for (let i = 0; i < kernel; i++) {
    const w = Math.exp((-0.5 \* (i \* i)) / (kernel \* kernel \* 0.25));
    weights.push(w);
    total += i === 0 ? w : w \* 2;
  }
  const normalized = weights.map((w) => (w / total).toFixed(6));
  return [
    \`#define KERNEL\_SIZE ${kernel}\`,
    \`#define WEIGHT\_CENTER ${normalized[0]}\`,
    \`const float WEIGHTS[KERNEL\_SIZE - 1] = float[KERNEL\_SIZE - 1](${normalized
      .slice(1)
      .join(", ")});\`,
  ].join("\\n");
}

export function createFrost(
  elements: FrostElements,
  options: FrostOptions = {},
): FrostInstance | null {
  const config = { ...DEFAULTS, ...options };
  const { source, content, output } = elements;

  const gl = output.getContext("webgl2", {
    alpha: true,
    depth: false,
    stencil: false,
    antialias: false,
    premultipliedAlpha: true,
  });
  if (!gl || gl.isContextLost()) return null;

  const sourceCtx = source.getContext("2d") as ElementImageContext | null;
  const paintable = source as PaintableCanvas;
  const htmlInCanvas = Boolean(
    sourceCtx &&
    typeof sourceCtx.drawElementImage === "function" &&
    typeof paintable.requestPaint === "function",
  );

  if (htmlInCanvas) prepareHtmlInCanvas(source, content);

  let contentDirty = false;
  let contentReady = !htmlInCanvas;
  let wake = () => {};

  function captureContent() {
    try {
      sourceCtx!.reset();
      drawHtmlInCanvas(source, sourceCtx!, content);
      contentDirty = true;
      wake();
    } catch {}
  }

  if (htmlInCanvas) {
    paintable.onpaint = captureContent;
  }

  const halfFloat = Boolean(gl.getExtension("EXT\_color\_buffer\_float"));

  const shaders: WebGLShader[] = [];
  const programs: WebGLProgram[] = [];

  function compile(type: number, text: string): WebGLShader {
    const shader = gl!.createShader(type)!;
    gl!.shaderSource(shader, text);
    gl!.compileShader(shader);
    if (!gl!.getShaderParameter(shader, gl!.COMPILE\_STATUS)) {
      console.error("Frost shader error:", gl!.getShaderInfoLog(shader));
    }
    shaders.push(shader);
    return shader;
  }

  const vertexShader = compile(gl.VERTEX\_SHADER, VERT);

  interface Program {
    program: WebGLProgram;
    uniforms: Record<string, WebGLUniformLocation>;
  }

  function createProgram(fragSource: string): Program {
    const program = gl!.createProgram()!;
    gl!.attachShader(program, vertexShader);
    gl!.attachShader(program, compile(gl!.FRAGMENT\_SHADER, fragSource));
    gl!.linkProgram(program);
    programs.push(program);
    const uniforms: Record<string, WebGLUniformLocation> = {};
    const count = gl!.getProgramParameter(program, gl!.ACTIVE\_UNIFORMS);
    for (let i = 0; i < count; i++) {
      const info = gl!.getActiveUniform(program, i)!;
      uniforms[info.name] = gl!.getUniformLocation(program, info.name)!;
    }
    return { program, uniforms };
  }

  const noiseProgram = createProgram(FRAG\_NOISE);
  const heightProgram = createProgram(FRAG\_HEIGHT);
  const blurProgram = createProgram(
    FRAG\_BLUR.replace("WEIGHTS\_PLACEHOLDER", buildBlurWeights(BLUR\_KERNEL)),
  );
  const pointerProgram = createProgram(FRAG\_POINTER);
  const frostProgram = createProgram(FRAG\_FROST);
  const outputProgram = createProgram(FRAG\_OUTPUT);

  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY\_BUFFER, quad);
  gl.bufferData(
    gl.ARRAY\_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC\_DRAW,
  );
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  function createTarget(
    width: number,
    height: number,
    useHalfFloat: boolean,
    wrap: number,
  ): Target {
    const texture = gl!.createTexture()!;
    gl!.bindTexture(gl!.TEXTURE\_2D, texture);
    gl!.texParameteri(gl!.TEXTURE\_2D, gl!.TEXTURE\_MIN\_FILTER, gl!.LINEAR);
    gl!.texParameteri(gl!.TEXTURE\_2D, gl!.TEXTURE\_MAG\_FILTER, gl!.LINEAR);
    gl!.texParameteri(gl!.TEXTURE\_2D, gl!.TEXTURE\_WRAP\_S, wrap);
    gl!.texParameteri(gl!.TEXTURE\_2D, gl!.TEXTURE\_WRAP\_T, wrap);
    gl!.texImage2D(
      gl!.TEXTURE\_2D,
      0,
      useHalfFloat ? gl!.RGBA16F : gl!.RGBA8,
      width,
      height,
      0,
      gl!.RGBA,
      useHalfFloat ? gl!.HALF\_FLOAT : gl!.UNSIGNED\_BYTE,
      null,
    );
    const fbo = gl!.createFramebuffer()!;
    gl!.bindFramebuffer(gl!.FRAMEBUFFER, fbo);
    gl!.framebufferTexture2D(
      gl!.FRAMEBUFFER,
      gl!.COLOR\_ATTACHMENT0,
      gl!.TEXTURE\_2D,
      texture,
      0,
    );
    gl!.viewport(0, 0, width, height);
    gl!.clearColor(0, 0, 0, 0);
    gl!.clear(gl!.COLOR\_BUFFER\_BIT);
    return { fbo, texture, width, height };
  }

  function releaseTarget(target: Target | null) {
    if (!target) return;
    gl!.deleteFramebuffer(target.fbo);
    gl!.deleteTexture(target.texture);
  }

  function createDoubleTarget(
    width: number,
    height: number,
    useHalfFloat: boolean,
  ): DoubleTarget {
    let read = createTarget(width, height, useHalfFloat, gl!.CLAMP\_TO\_EDGE);
    let write = createTarget(width, height, useHalfFloat, gl!.CLAMP\_TO\_EDGE);
    return {
      get read() {
        return read;
      },
      get write() {
        return write;
      },
      swap() {
        const t = read;
        read = write;
        write = t;
      },
    };
  }

  let frostTarget: Target | null = null;
  let blurA: Target | null = null;
  let blurB: Target | null = null;
  let pointer: DoubleTarget | null = null;

  const heightTarget = createTarget(HEIGHT\_RES, HEIGHT\_RES, false, gl.REPEAT);
  const noiseTarget = createTarget(NOISE\_RES, NOISE\_RES, false, gl.REPEAT);

  function blit(target: Target | null) {
    if (target) {
      gl!.bindFramebuffer(gl!.FRAMEBUFFER, target.fbo);
      gl!.viewport(0, 0, target.width, target.height);
    } else {
      gl!.bindFramebuffer(gl!.FRAMEBUFFER, null);
      gl!.viewport(0, 0, output.width, output.height);
    }
    gl!.drawArrays(gl!.TRIANGLE\_STRIP, 0, 4);
  }

  function bindTexture(texture: WebGLTexture, unit: number): number {
    gl!.activeTexture(gl!.TEXTURE0 + unit);
    gl!.bindTexture(gl!.TEXTURE\_2D, texture);
    return unit;
  }

  gl.useProgram(heightProgram.program);
  blit(heightTarget);
  gl.useProgram(noiseProgram.program);
  blit(noiseTarget);

  const contentTexture = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE\_2D, contentTexture);
  gl.texParameteri(gl.TEXTURE\_2D, gl.TEXTURE\_MIN\_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE\_2D, gl.TEXTURE\_MAG\_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE\_2D, gl.TEXTURE\_WRAP\_S, gl.CLAMP\_TO\_EDGE);
  gl.texParameteri(gl.TEXTURE\_2D, gl.TEXTURE\_WRAP\_T, gl.CLAMP\_TO\_EDGE);
  gl.texImage2D(
    gl.TEXTURE\_2D,
    0,
    gl.RGBA,
    1,
    1,
    0,
    gl.RGBA,
    gl.UNSIGNED\_BYTE,
    new Uint8Array([0, 0, 0, 0]),
  );

  let blurDirty = true;
  let targetsReady = false;

  function rebuildTargets() {
    const width = Math.max(output.width, 1);
    const height = Math.max(output.height, 1);
    const blurScale = 0.35 \* Math.min(Math.max(config.quality, 0.25), 1);
    const bw = Math.max(1, Math.round(width \* blurScale));
    const bh = Math.max(1, Math.round(height \* blurScale));
    releaseTarget(frostTarget);
    releaseTarget(blurA);
    releaseTarget(blurB);
    if (pointer) {
      releaseTarget(pointer.read);
      releaseTarget(pointer.write);
    }
    frostTarget = createTarget(width, height, false, gl!.CLAMP\_TO\_EDGE);
    blurA = createTarget(bw, bh, false, gl!.CLAMP\_TO\_EDGE);
    blurB = createTarget(bw, bh, false, gl!.CLAMP\_TO\_EDGE);
    pointer = createDoubleTarget(
      Math.max(1, Math.round(width \* 0.5)),
      Math.max(1, Math.round(height \* 0.5)),
      halfFloat,
    );
    targetsReady = true;
    blurDirty = true;
  }

  function syncCanvasSize() {
    const dpr = getCanvasPixelRatio(output, gl!);
    const width = Math.max(1, Math.round(output.clientWidth \* dpr));
    const height = Math.max(1, Math.round(output.clientHeight \* dpr));
    if (output.width !== width || output.height !== height) {
      output.width = width;
      output.height = height;
      rebuildTargets();
    } else if (!targetsReady) {
      rebuildTargets();
    }
    if (htmlInCanvas) {
      const sourceWidth = Math.max(1, Math.round(source.clientWidth \* dpr));
      const sourceHeight = Math.max(1, Math.round(source.clientHeight \* dpr));
      if (source.width !== sourceWidth || source.height !== sourceHeight) {
        source.width = sourceWidth;
        source.height = sourceHeight;
      }
      paintable.requestPaint!();
    }
  }

  syncCanvasSize();

  if (htmlInCanvas) captureContent();

  function uploadContent() {
    if (!htmlInCanvas || !contentDirty) return;
    contentDirty = false;
    blurDirty = true;
    gl!.bindTexture(gl!.TEXTURE\_2D, contentTexture);
    gl!.texImage2D(
      gl!.TEXTURE\_2D,
      0,
      gl!.RGBA,
      gl!.RGBA,
      gl!.UNSIGNED\_BYTE,
      source,
    );
    if (!contentReady) {
      contentReady = true;
      introStart = performance.now();
    }
  }

  function renderBlur() {
    if (!blurDirty || !htmlInCanvas || !blurA || !blurB) return;
    blurDirty = false;
    gl!.useProgram(blurProgram.program);
    gl!.uniform2f(
      blurProgram.uniforms.uTexelSize,
      1 / blurA.width,
      1 / blurA.height,
    );
    gl!.uniform1i(blurProgram.uniforms.uScene, bindTexture(contentTexture, 0));
    gl!.uniform2f(blurProgram.uniforms.uStep, 0, 1);
    gl!.uniform1f(blurProgram.uniforms.uFlipY, 1);
    blit(blurA);
    gl!.uniform1i(blurProgram.uniforms.uScene, bindTexture(blurA.texture, 0));
    gl!.uniform2f(blurProgram.uniforms.uStep, 1, 0);
    gl!.uniform1f(blurProgram.uniforms.uFlipY, 0);
    blit(blurB);
  }

  let pointerOn = false;
  let pointerX = 0.5;
  let pointerY = 0.5;
  let prevPointerX = 0.5;
  let prevPointerY = 0.5;
  let lastScrollX = 0;
  let lastScrollY = 0;
  const MAX\_PENDING\_MELTS = 32;
  const MAX\_MELTS\_PER\_FRAME = 4;
  const queuedMelts: Array<[number, number]> = [];

  function renderPointer() {
    if (!pointer) {
      queuedMelts.length = 0;
      return;
    }
    const cssW = Math.max(output.clientWidth, 1);
    const cssH = Math.max(output.clientHeight, 1);
    const sx = content.scrollLeft;
    const sy = content.scrollTop;
    gl!.useProgram(pointerProgram.program);
    gl!.uniform1i(
      pointerProgram.uniforms.uBack,
      bindTexture(pointer.read.texture, 0),
    );
    gl!.uniform1i(
      pointerProgram.uniforms.uNoise,
      bindTexture(noiseTarget.texture, 1),
    );
    gl!.uniform1f(
      pointerProgram.uniforms.uAspect,
      output.width / Math.max(output.height, 1),
    );
    gl!.uniform2f(
      pointerProgram.uniforms.uBackShift,
      (sx - lastScrollX) / cssW,
      -(sy - lastScrollY) / cssH,
    );
    gl!.uniform2f(pointerProgram.uniforms.uScroll, sx / cssW, -sy / cssH);
    gl!.uniform1f(pointerProgram.uniforms.uTextureScale, config.textureScale);
    gl!.uniform1f(pointerProgram.uniforms.uDecay, config.refreeze \* 0.001);
    gl!.uniform1f(pointerProgram.uniforms.uMeltNoise, config.meltNoise);
    gl!.uniform1f(
      pointerProgram.uniforms.uMeltStrength,
      config.meltStrength \* 0.2,
    );
    gl!.uniform1f(pointerProgram.uniforms.uRadius, config.meltRadius);
    gl!.uniform1f(
      pointerProgram.uniforms.uEdgeFade,
      config.meltEdges ? 0 : config.edgeFade,
    );
    if (queuedMelts.length > 0) {
      const count = Math.min(queuedMelts.length, MAX\_MELTS\_PER\_FRAME);
      for (let i = 0; i < count; i++) {
        const [mx, my] = queuedMelts.shift()!;
        gl!.uniform2f(pointerProgram.uniforms.uPoint, mx, 1 - my);
        gl!.uniform2f(pointerProgram.uniforms.uPrevPoint, mx, 1 - my);
        gl!.uniform1f(pointerProgram.uniforms.uTouching, 1);
        blit(pointer.write);
        pointer.swap();
        gl!.uniform1i(
          pointerProgram.uniforms.uBack,
          bindTexture(pointer.read.texture, 0),
        );
        gl!.uniform2f(pointerProgram.uniforms.uBackShift, 0, 0);
      }
    } else {
      gl!.uniform2f(pointerProgram.uniforms.uPoint, pointerX, 1 - pointerY);
      gl!.uniform2f(
        pointerProgram.uniforms.uPrevPoint,
        prevPointerX,
        1 - prevPointerY,
      );
      gl!.uniform1f(pointerProgram.uniforms.uTouching, pointerOn ? 1 : 0);
      blit(pointer.write);
      pointer.swap();
    }
    lastScrollX = sx;
    lastScrollY = sy;
    prevPointerX = pointerX;
    prevPointerY = pointerY;
  }

  function renderFrost(now: number) {
    if (!frostTarget || !pointer || !blurB) return;
    const cssW = Math.max(output.clientWidth, 1);
    const cssH = Math.max(output.clientHeight, 1);
    gl!.useProgram(frostProgram.program);
    gl!.uniform1i(
      frostProgram.uniforms.uContent,
      bindTexture(contentTexture, 0),
    );
    gl!.uniform1i(frostProgram.uniforms.uBlur, bindTexture(blurB.texture, 1));
    gl!.uniform1i(
      frostProgram.uniforms.uNoise,
      bindTexture(noiseTarget.texture, 2),
    );
    gl!.uniform1i(
      frostProgram.uniforms.uPointer,
      bindTexture(pointer.read.texture, 3),
    );
    gl!.uniform2f(
      frostProgram.uniforms.uScroll,
      content.scrollLeft / cssW,
      -content.scrollTop / cssH,
    );
    gl!.uniform1f(
      frostProgram.uniforms.uAspect,
      output.width / Math.max(output.height, 1),
    );
    gl!.uniform1f(frostProgram.uniforms.uTextureScale, config.textureScale);
    gl!.uniform1f(frostProgram.uniforms.uMeltEdges, config.meltEdges ? 1 : 0);
    gl!.uniform1f(frostProgram.uniforms.uIntro, introProgress(now));
    gl!.uniform1f(frostProgram.uniforms.uHighlight, config.highlight);
    gl!.uniform1f(frostProgram.uniforms.uStrength, config.strength);
    gl!.uniform1f(frostProgram.uniforms.uFrost, config.frost);
    gl!.uniform1f(frostProgram.uniforms.uContrast, config.contrast);
    gl!.uniform1f(frostProgram.uniforms.uCrispness, config.crispness);
    gl!.uniform1f(frostProgram.uniforms.uHaze, config.haze);
    gl!.uniform3f(
      frostProgram.uniforms.uTintThin,
      config.tintThin[0],
      config.tintThin[1],
      config.tintThin[2],
    );
    gl!.uniform3f(
      frostProgram.uniforms.uTintThick,
      config.tintThick[0],
      config.tintThick[1],
      config.tintThick[2],
    );
    gl!.uniform1f(frostProgram.uniforms.uTintStrength, config.tintStrength);
    gl!.uniform1f(
      frostProgram.uniforms.uHighlightStrength,
      config.highlightStrength,
    );
    gl!.uniform1f(frostProgram.uniforms.uSaturation, config.saturation);
    gl!.uniform1f(frostProgram.uniforms.uBrightness, config.brightness);
    gl!.uniform1f(frostProgram.uniforms.uShimmer, config.shimmer);
    gl!.uniform1f(frostProgram.uniforms.uTime, now / 1000);
    gl!.uniform1f(
      frostProgram.uniforms.uOpacity,
      Math.min(Math.max(config.opacity, 0), 1),
    );
    gl!.uniform1f(frostProgram.uniforms.uHasContent, htmlInCanvas ? 1 : 0);
    blit(frostTarget);
  }

  function renderOutput() {
    if (!frostTarget) return;
    const dpr = output.width / Math.max(output.clientWidth, 1);
    gl!.useProgram(outputProgram.program);
    gl!.uniform1i(
      outputProgram.uniforms.uFrost,
      bindTexture(frostTarget.texture, 0),
    );
    gl!.uniform1i(
      outputProgram.uniforms.uHeights,
      bindTexture(heightTarget.texture, 2),
    );
    gl!.uniform1f(outputProgram.uniforms.uIor, Math.max(config.ior, 1.01));
    gl!.uniform1f(outputProgram.uniforms.uRefraction, config.refraction);
    gl!.uniform1f(outputProgram.uniforms.uDetail, config.detail);
    gl!.uniform1f(outputProgram.uniforms.uTextureScale, config.textureScale);
    gl!.uniform1f(outputProgram.uniforms.uFresnel, config.fresnel);
    gl!.uniform2f(
      outputProgram.uniforms.uScrollPx,
      content.scrollLeft \* dpr,
      -content.scrollTop \* dpr,
    );
    gl!.uniform1f(outputProgram.uniforms.uHasContent, htmlInCanvas ? 1 : 0);
    gl!.uniform1f(outputProgram.uniforms.uFallbackAlpha, 0.85);
    blit(null);
  }

  let raf = 0;
  let destroyed = false;
  let running = false;
  let visible = true;
  let activeUntil = 0;
  let introStart = performance.now();

  function introProgress(now: number) {
    const introMs = Math.max(config.introDuration, 0) \* 1000;
    if (introMs <= 0 || reducedMotion) return 1;
    const t = Math.min(Math.max((now - introStart) / introMs, 0), 1);
    return t \* t \* (3 - 2 \* t);
  }

  function refreezeDelayMs() {
    const decay = Math.max(config.refreeze \* 0.001, 1e-5);
    return (1 / decay / 60) \* 1000 + 500;
  }

  function frame(now: number) {
    if (destroyed) return;
    if (!visible || document.hidden) {
      running = false;
      return;
    }
    gl!.disable(gl!.BLEND);
    uploadContent();
    if (!contentReady) {
      running = false;
      return;
    }
    renderBlur();
    if (queuedMelts.length > 0) activeUntil = now + refreezeDelayMs();
    renderPointer();
    renderFrost(now);
    renderOutput();

    const animating =
      pointerOn ||
      now < activeUntil ||
      now < introStart + Math.max(config.introDuration, 0) \* 1000 + 120 ||
      contentDirty ||
      config.shimmer > 0.001 ||
      queuedMelts.length > 0;
    if (!animating) {
      running = false;
      return;
    }
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (destroyed || running || !visible || document.hidden) return;
    running = true;
    raf = requestAnimationFrame(frame);
  }

  wake = start;
  start();

  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reducedMotion = motionQuery.matches;

  function onMotionChange() {
    reducedMotion = motionQuery.matches;
    if (!reducedMotion) start();
  }
  motionQuery.addEventListener("change", onMotionChange);

  const rectCache = createRectCache(output);

  function suspend() {
    cancelAnimationFrame(raf);
    running = false;
    pointerOn = false;
    prevPointerX = pointerX;
    prevPointerY = pointerY;
  }

  function onVisibilityChange() {
    if (document.hidden) suspend();
    else start();
  }
  document.addEventListener("visibilitychange", onVisibilityChange);

  function onPointerMove(event: PointerEvent) {
    if (destroyed || reducedMotion || !visible || document.hidden) return;
    const rect = rectCache.current;
    pointerX = (event.clientX - rect.left) / Math.max(rect.width, 1);
    pointerY = (event.clientY - rect.top) / Math.max(rect.height, 1);
    pointerOn = true;
    activeUntil = performance.now() + refreezeDelayMs();
    start();
  }

  function onPointerLeave() {
    pointerOn = false;
    activeUntil = performance.now() + refreezeDelayMs();
    start();
  }

  const listenTarget = output.parentElement ?? output;
  listenTarget.addEventListener("pointermove", onPointerMove as EventListener, { passive: true });
  listenTarget.addEventListener("pointerdown", onPointerMove as EventListener, { passive: true });
  listenTarget.addEventListener(
    "pointerleave",
    onPointerLeave as EventListener,
  );
  listenTarget.addEventListener(
    "pointercancel",
    onPointerLeave as EventListener,
  );

  function onScroll() {
    activeUntil = Math.max(activeUntil, performance.now() + 400);
    if (htmlInCanvas) paintable.requestPaint?.();
    start();
  }
  content.addEventListener("scroll", onScroll, { passive: true });

  const observer = createCanvasResizeObserver(() => {
    if (destroyed) return;
    syncCanvasSize();
    start();
  });
  observer.observe(output);

  const intersection = new IntersectionObserver((entries) => {
    visible = entries[entries.length - 1]?.isIntersecting ?? true;
    if (destroyed) return;
    if (visible) start();
    else suspend();
  });
  intersection.observe(output);

  return {
    melt(x, y) {
      if (destroyed || reducedMotion) return;
      // Explicit API input is retained while suspended, up to the queue limit.
      if (queuedMelts.length >= MAX\_PENDING\_MELTS) queuedMelts.shift();
      queuedMelts.push([x, y]);
      activeUntil = performance.now() + refreezeDelayMs();
      start();
    },
    setOptions(next) {
      if (destroyed) return;
      if (
        !Object.entries(next).some(
          ([key, value]) => config[key as keyof FrostOptions] !== value,
        )
      )
        return;
      const { quality, ...rest } = next;
      const qualityChanged =
        quality !== undefined && quality !== config.quality;
      Object.assign(config, rest);
      if (qualityChanged) {
        config.quality = quality!;
        rebuildTargets();
      }
      activeUntil = Math.max(activeUntil, performance.now() + 100);
      start();
    },
    resize() {
      if (destroyed) return;
      syncCanvasSize();
      start();
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      queuedMelts.length = 0;
      suspend();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      rectCache.destroy();
      cancelAnimationFrame(raf);
      observer.disconnect();
      intersection.disconnect();
      motionQuery.removeEventListener("change", onMotionChange);
      releaseTarget(noiseTarget);
      releaseTarget(frostTarget);
      releaseTarget(blurA);
      releaseTarget(blurB);
      if (pointer) {
        releaseTarget(pointer.read);
        releaseTarget(pointer.write);
      }
      releaseTarget(heightTarget);
      gl!.deleteTexture(contentTexture);
      programs.forEach((program) => gl!.deleteProgram(program));
      shaders.forEach((shader) => gl!.deleteShader(shader));
      gl!.deleteBuffer(quad);
      if (htmlInCanvas) paintable.onpaint = null;
      content.removeEventListener("scroll", onScroll);
      listenTarget.removeEventListener(
        "pointermove",
        onPointerMove as EventListener,
      );
      listenTarget.removeEventListener(
        "pointerdown",
        onPointerMove as EventListener,
      );
      listenTarget.removeEventListener(
        "pointerleave",
        onPointerLeave as EventListener,
      );
      listenTarget.removeEventListener(
        "pointercancel",
        onPointerLeave as EventListener,
      );
    },
  };
}

export interface FrostProps extends FrostOptions {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const emptySubscribe = () => () => {};

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

export function Frost({ children, className, style, ...options }: FrostProps) {
  const sourceRef = useRef<HTMLCanvasElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const outputRef = useRef<HTMLCanvasElement>(null);
  const instanceRef = useRef<FrostInstance | null>(null);
  const [initialOptions] = useState(options);
  const [failed, setFailed] = useState(false);

  const supported = useSyncExternalStore(
    emptySubscribe,
    supportsHtmlInCanvas,
    () => false,
  );
  const native = supported && !failed;

  useIsomorphicLayoutEffect(() => {
    const source = sourceRef.current;
    const content = contentRef.current;
    const output = outputRef.current;
    if (!source || !content || !output) return;
    instanceRef.current = createFrost(
      { source, content, output },
      initialOptions,
    );
    if (native && !instanceRef.current) setFailed(true);
    return () => {
      instanceRef.current?.destroy();
      instanceRef.current = null;
    };
  }, [initialOptions, native]);

  useEffect(() => {
    instanceRef.current?.setOptions(options);
  });

  return (
    <div className={className} style={{ position: "relative", ...style }}>
      <canvas
        ref={sourceRef}
        // @ts-expect-error experimental html-in-canvas attribute
        layoutsubtree="true"
        suppressHydrationWarning
        style={
          native
            ? { position: "absolute", inset: 0, width: "100%", height: "100%" }
            : { display: "none" }
        }
      >
        {native ? (
          <div
            ref={contentRef}
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
              overflow: "auto",
            }}
          >
            {children}
          </div>
        ) : null}
      </canvas>
      {!native ? (
        <div
          ref={contentRef}
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            overflow: "auto",
          }}
        >
          {children}
        </div>
      ) : null}
      <canvas
        ref={outputRef}
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}


export default Frost;
\`\`\`
# Canvas UI: Glitch

Broadcast glitch bursts over the live page.

Docs: https://canvasui.dev/docs/components/glitch

## Install

\`\`\`sh
npx shadcn@latest add @canvas-ui/glitch-react
\`\`\`

## Usage, configured in the Canvas UI playground

Use the component with these exact prop values:

\`\`\`tsx
import { Glitch } from "@/components/canvasui/Glitch";

<Glitch
  intensity={1}
  interval={3}
  duration={0.4}
  slices={24}
  shift={30}
  rgbShift={4}
  blocks={0.5}
  noise={0.35}
>
  {/\* your content \*/}
</Glitch>
\`\`\`
# Canvas UI: VHS (React, WebGL)

Your page plays back like a worn VHS tape. Tape wave, head-switch noise, chroma bleed, grain, and scanlines. This page is the demo.

## Install

\`\`\`sh
npx shadcn@latest add @canvas-ui/vhs-react
\`\`\`

Or copy the standalone source below into your project as VHS.tsx.

## Current configuration

The component as configured right now in the docs demo (React syntax; prop values apply to every framework):

\`\`\`tsx
import { VHS } from "@/components/canvasui/VHS";

<VHS
  speed={0.5}
  wave={1}
  jitter={0.25}
  crease={0.1}
  switching={0.05}
  switchingHeight={0.02}
  bloom={0.4}
  aberration={2}
  acBeat={1}
  grain={0.1}
  scanlines={0.1}
  vignette={0}
  barrel={0}
  saturation={1}
  exposure={1}
>
  {/\* your content \*/}
</VHS>
\`\`\`

## Props

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| speed | number | 0.5 | Playback speed of the tape artifacts. 1 is normal speed. |
| wave | number | 1 | Strength of the slow horizontal tape wave (0 to 3). |
| jitter | number | 0.25 | Strength of the fine per-line horizontal jitter (0 to 3). |
| crease | number | 0.1 | Strength of the travelling tape crease band (0 to 3). |
| switching | number | 0.05 | Strength of the head-switching noise at the bottom (0 to 3). |
| switchingHeight | number | 0.02 | Height of the head-switching band as a fraction of the screen. |
| bloom | number | 0.4 | Strength of the horizontal glow bleed (0 to 1). |
| aberration | number | 2 | RGB channel misalignment in CSS pixels. |
| acBeat | number | 1 | Strength of the slow brightness beat rolling down the frame (0 to 1). |
| grain | number | 0.1 | Amount of animated static grain (0 to 1). |
| scanlines | number | 0.1 | Intensity of the CRT scanline overlay (0 to 1). |
| vignette | number | 0 | Darkening toward the frame corners (0 to 1). |
| barrel | number | 0 | CRT tube curvature bending the content inward like a tube TV (0 to 1). The page around the curved glass stays untouched. 0 disables. |
| saturation | number | 1 | Color saturation. 1 keeps the content's colors, 0 is grayscale. |
| exposure | number | 1 | Extra brightness multiplier applied at the end. |
| className | string |  | Classes applied to the wrapper element. |

## VHS.tsx

\`\`\`tsx
"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

const canvasDimensionLimits = new WeakMap<WebGLRenderingContext | WebGL2RenderingContext, number>();

/\*\* Keep the existing DPR budget, then account for browser pinch zoom. \*/
function getCanvasPixelRatio(
  element: HTMLElement,
  context?: WebGLRenderingContext | WebGL2RenderingContext,
): number {
  const scale = window.visualViewport?.scale || 1;
  const requested = Math.min(window.devicePixelRatio || 1, 2) \* scale;
  const width = Math.max(element.clientWidth, 1);
  const height = Math.max(element.clientHeight, 1);
  let maxDimension = 8192;
  if (context) {
    let limit = canvasDimensionLimits.get(context);
    if (limit === undefined) {
      limit = Math.min(
        maxDimension,
        context.getParameter(context.MAX\_TEXTURE\_SIZE),
        context.getParameter(context.MAX\_RENDERBUFFER\_SIZE),
      );
      canvasDimensionLimits.set(context, limit);
    }
    maxDimension = limit;
  }
  // Rendering the full element preserves its CSS position and native input
  // geometry while panning. Bound allocations when zooming large canvases.
  return Math.min(
    requested,
    maxDimension / Math.max(width, height),
    Math.sqrt(16\_777\_216 / (width \* height)),
  );
}

/\*\* Pinch zoom changes visualViewport without resizing the element's CSS box. \*/
function createCanvasResizeObserver(onResize: () => void) {
  const viewport = window.visualViewport;
  let frame = 0;
  let disconnected = false;
  const schedule = () => {
    if (frame || disconnected) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      onResize();
    });
  };
  const observer = new ResizeObserver(schedule);
  window.addEventListener("resize", schedule, { passive: true });
  viewport?.addEventListener("resize", schedule, { passive: true });
  return {
    observe(element: Element, options?: ResizeObserverOptions) {
      observer.observe(element, options);
    },
    unobserve(element: Element) {
      observer.unobserve(element);
    },
    disconnect() {
      disconnected = true;
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", schedule);
      viewport?.removeEventListener("resize", schedule);
    },
  };
}

type HtmlInCanvasContext = CanvasRenderingContext2D & {
  drawElementImage: (element: Element, x: number, y: number) => DOMMatrix | void;
};

type HtmlInCanvasElement = HTMLCanvasElement & {
  updateElementGeometry?: (
    element: Element,
    options: { canvasTransform: DOMMatrix },
  ) => void;
};

/\*\* Configure the capture subtree for both generations of the experimental API. \*/
function prepareHtmlInCanvas(source: HTMLCanvasElement, content: HTMLElement) {
  if ("content" in source) {
    source.setAttribute("content", "drawable");
    content.setAttribute("drawable", "");
  } else {
    source.setAttribute("layoutsubtree", "");
  }
}

/\*\* Capture pixels and keep the native DOM hit-test region aligned with them. \*/
function drawHtmlInCanvas(
  source: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  content: HTMLElement,
) {
  const transform = (context as HtmlInCanvasContext).drawElementImage(content, 0, 0);
  const canvas = source as HtmlInCanvasElement;
  // Chrome 154 decoupled geometry from drawing before enabling automatic 2D
  // synchronization. Older versions have no update method; newer versions
  // synchronize automatically and return void. Use the returned matrix as-is:
  // drawElementImage already accounts for the canvas's pixel density.
  if (transform && typeof canvas.updateElementGeometry === "function") {
    canvas.updateElementGeometry(content, { canvasTransform: transform });
  }
}

export interface VHSOptions {
  /\*\* Playback speed of the tape artifacts. 1 is normal speed. \*/
  speed?: number;
  /\*\* Strength of the slow horizontal tape wave (0 to 3). \*/
  wave?: number;
  /\*\* Strength of the fine per-line horizontal jitter (0 to 3). \*/
  jitter?: number;
  /\*\* Strength of the travelling tape crease band (0 to 3). \*/
  crease?: number;
  /\*\* Strength of the head-switching noise at the bottom (0 to 3). \*/
  switching?: number;
  /\*\* Height of the head-switching band as a fraction of the screen. \*/
  switchingHeight?: number;
  /\*\* Strength of the horizontal glow bleed (0 to 1). \*/
  bloom?: number;
  /\*\* RGB channel misalignment in CSS pixels. \*/
  aberration?: number;
  /\*\* Strength of the slow brightness beat rolling down the frame (0 to 1). \*/
  acBeat?: number;
  /\*\* Amount of animated static grain (0 to 1). \*/
  grain?: number;
  /\*\* Intensity of the CRT scanline overlay (0 to 1). \*/
  scanlines?: number;
  /\*\* Darkening toward the frame corners (0 to 1). \*/
  vignette?: number;
  /\*\* CRT tube curvature bending the frame inward (0 to 1). 0 disables. \*/
  barrel?: number;
  /\*\* Color saturation. 1 keeps the content's colors, 0 is grayscale. \*/
  saturation?: number;
  /\*\* Extra brightness multiplier applied at the end. \*/
  exposure?: number;
}

export interface VHSElements {
  /\*\* Canvas with layoutsubtree that hosts the HTML content. \*/
  source: HTMLCanvasElement;
  /\*\* The element inside the source canvas that gets captured. \*/
  content: HTMLElement;
  /\*\* Canvas the WebGL effect renders to. \*/
  output: HTMLCanvasElement;
}

export interface VHSInstance {
  /\*\* Update effect options live. \*/
  setOptions: (options: VHSOptions) => void;
  /\*\* Re-read canvas size. Call when the element is resized. \*/
  resize: () => void;
  /\*\* Stop the loop and release all GPU resources. \*/
  destroy: () => void;
}

const DEFAULTS: Required<VHSOptions> = {
  speed: 0.5,
  wave: 1,
  jitter: 0.25,
  crease: 0.1,
  switching: 0.05,
  switchingHeight: 0.02,
  bloom: 0.4,
  aberration: 2,
  acBeat: 1,
  grain: 0.1,
  scanlines: 0.1,
  vignette: 0,
  barrel: 0,
  saturation: 1,
  exposure: 1,
};

type PaintableCanvas = HTMLCanvasElement & {
  onpaint?: (() => void) | null;
  requestPaint?: () => void;
};

type ElementImageContext = CanvasRenderingContext2D & {
  drawElementImage?: (element: Element, x: number, y: number) => void;
};

const VERT = \`#version 300 es
precision highp float;
layout(location = 0) in vec2 aPos;
out vec2 vUv;
void main () {
  vUv = aPos \* 0.5 + 0.5;
  gl\_Position = vec4(aPos, 0.0, 1.0);
}\`;

const FRAG = \`#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uContent;
uniform vec2 uResolution;
uniform float uTime;
uniform float uWave;
uniform float uJitter;
uniform float uCrease;
uniform float uSwitching;
uniform float uSwitchHeight;
uniform float uBloom;
uniform float uAberration;
uniform float uAcBeat;
uniform float uGrain;
uniform float uScanlines;
uniform float uVignette;
uniform float uSaturation;
uniform float uExposure;
uniform float uBarrel;
uniform vec3 uBezel;
uniform float uCreaseNoise;
uniform float uMaxX;

#define PI 3.14159265

float hash (vec2 v) {
  return fract(sin(dot(v, vec2(89.44, 19.36))) \* 22189.22);
}

float iHash (vec2 v, vec2 r) {
  float h00 = hash(floor(v \* r + vec2(0.0, 0.0)) / r);
  float h10 = hash(floor(v \* r + vec2(1.0, 0.0)) / r);
  float h01 = hash(floor(v \* r + vec2(0.0, 1.0)) / r);
  float h11 = hash(floor(v \* r + vec2(1.0, 1.0)) / r);
  vec2 ip = smoothstep(vec2(0.0), vec2(1.0), mod(v \* r, 1.0));
  return (h00 \* (1.0 - ip.x) + h10 \* ip.x) \* (1.0 - ip.y)
    + (h01 \* (1.0 - ip.x) + h11 \* ip.x) \* ip.y;
}

float noise (vec2 v) {
  float sum = 0.0;
  float s = 2.0;
  for (int i = 1; i < 7; i++) {
    sum += iHash(v + vec2(i), vec2(2.0 \* s)) / s;
    s \*= 2.0;
  }
  return sum;
}

vec4 tape (vec2 p) {
  p.x = clamp(p.x, 0.0005, uMaxX - 0.0005);
  p.y = clamp(p.y, 0.0005, 0.9995);
  return texture(uContent, vec2(p.x, 1.0 - p.y));
}

void main () {
  vec2 uv = vUv;
  if (uv.x > uMaxX) {
    outColor = vec4(0.0);
    return;
  }

  float edgeMask = 1.0;
  if (uBarrel > 0.0) {
    vec2 c = vec2(uv.x / uMaxX, uv.y) \* 2.0 - 1.0;
    c \*= 1.0 + uBarrel \* 0.15 \* dot(c, c);
    float m = max(abs(c.x), abs(c.y));
    edgeMask = 1.0 - smoothstep(1.0 - 0.12 \* uBarrel, 1.0, m);
    if (edgeMask <= 0.0) {
      outColor = vec4(uBezel, 1.0);
      return;
    }
    uv = vec2((c.x \* 0.5 + 0.5) \* uMaxX, c.y \* 0.5 + 0.5);
  }

  vec2 uvn = uv;
  float t = uTime;

  float lineNoise = 0.0;
  if (uJitter + uCrease + uSwitching > 0.0) {
    lineNoise = noise(vec2(uvn.y \* 100.0, t \* 10.0));
  }

  if (uWave > 0.0) {
    uvn.x += (noise(vec2(uvn.y, t)) - 0.5) \* 0.005 \* uWave;
  }
  uvn.x += (lineNoise - 0.5) \* 0.01 \* uJitter;

  float tcPhase = clamp(
    (sin(uvn.y \* 8.0 - t \* PI \* 1.2) - 0.92) \* uCreaseNoise,
    0.0, 0.01
  ) \* 10.0 \* uCrease;
  float tcNoise = max(lineNoise - 0.5, 0.0);
  uvn.x -= tcNoise \* tcPhase;

  float snPhase = smoothstep(max(uSwitchHeight, 1e-4), 0.0, uvn.y) \* uSwitching;
  uvn.y += snPhase \* 0.3;
  uvn.x += snPhase \* ((lineNoise - 0.5) \* 0.2);

  vec4 base = tape(uvn);
  vec3 col = base.rgb;
  col \*= 1.0 - tcPhase;

  col = mix(col, col.yzx, clamp(snPhase, 0.0, 1.0));

  if (uBloom > 0.0) {
    float px = uAberration / max(uResolution.x, 1.0);
    vec3 bloomSum = vec3(0.0);
    for (int i = -8; i <= 2; i++) {
      vec3 s = tape(uvn + vec2(float(i) \* px, 0.0)).rgb;
      if (i >= -4) bloomSum.r += s.r;
      if (i >= -6 && i <= 0) bloomSum.g += s.g;
      if (i <= -2) bloomSum.b += s.b;
    }
    bloomSum \*= 0.1;

    col = mix(col, (col + bloomSum) / 1.7, clamp(uBloom, 0.0, 1.0));
  }

  if (uAcBeat > 0.0) {
    col \*= 1.0 + clamp(
      noise(vec2(0.0, uv.y + t \* 0.2)) \* 0.6 - 0.25, 0.0, 0.1
    ) \* uAcBeat;
  }

  float g = hash(uv \* uResolution + fract(t) \* vec2(127.1, 311.7)) - 0.5;
  col += g \* uGrain;

  float scan = sin(uv.y \* uResolution.y \* PI) \* 0.5;
  col \*= 1.0 - uScanlines \* 0.35 \* scan;

  vec2 vd = (uv - 0.5) \* vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);
  col \*= 1.0 - uVignette \* smoothstep(0.4, 1.1, length(vd));

  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(vec3(lum), col, clamp(uSaturation, 0.0, 2.0));

  col \*= uExposure;

  float alpha = max(base.a, clamp(snPhase + tcPhase, 0.0, 1.0));

  if (uBarrel > 0.0) {
    col = mix(uBezel, col, edgeMask);
    alpha = 1.0;
  }
  outColor = vec4(col, alpha);
}\`;

export function supportsHtmlInCanvas(): boolean {
  if (typeof document === "undefined") return false;
  const probe = document.createElement("canvas") as PaintableCanvas;
  const ctx = probe.getContext("2d") as ElementImageContext | null;
  return Boolean(
    ctx &&
    typeof ctx.drawElementImage === "function" &&
    typeof probe.requestPaint === "function",
  );
}

export function createVHS(
  elements: VHSElements,
  options: VHSOptions = {},
): VHSInstance | null {
  const config = { ...DEFAULTS, ...options };
  const { source, content, output } = elements;

  const gl = output.getContext("webgl2", {
    alpha: true,
    depth: false,
    stencil: false,
    antialias: false,
    premultipliedAlpha: false,
  });
  if (!gl || gl.isContextLost()) return null;

  const sourceCtx = source.getContext("2d") as ElementImageContext | null;
  const paintable = source as PaintableCanvas;
  const htmlInCanvas = Boolean(
    sourceCtx &&
    typeof sourceCtx.drawElementImage === "function" &&
    typeof paintable.requestPaint === "function",
  );

  if (htmlInCanvas) prepareHtmlInCanvas(source, content);

  let contentDirty = false;
  let wake = () => {};

  if (htmlInCanvas) {
    paintable.onpaint = () => {
      try {
        sourceCtx!.reset();
        drawHtmlInCanvas(source, sourceCtx!, content);
        contentDirty = true;
        wake();
      } catch {}
    };
  }

  function compile(type: number, text: string): WebGLShader {
    const shader = gl!.createShader(type)!;
    gl!.shaderSource(shader, text);
    gl!.compileShader(shader);
    if (!gl!.getShaderParameter(shader, gl!.COMPILE\_STATUS)) {
      console.error("VHS shader error:", gl!.getShaderInfoLog(shader));
    }
    return shader;
  }

  const vertexShader = compile(gl.VERTEX\_SHADER, VERT);
  const fragmentShader = compile(gl.FRAGMENT\_SHADER, FRAG);
  const program = gl.createProgram()!;
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  const uniforms: Record<string, WebGLUniformLocation> = {};
  const count = gl.getProgramParameter(program, gl.ACTIVE\_UNIFORMS);
  for (let i = 0; i < count; i++) {
    const info = gl.getActiveUniform(program, i)!;
    uniforms[info.name] = gl.getUniformLocation(program, info.name)!;
  }

  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY\_BUFFER, quad);
  gl.bufferData(
    gl.ARRAY\_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC\_DRAW,
  );
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const contentTexture = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE\_2D, contentTexture);
  gl.texParameteri(gl.TEXTURE\_2D, gl.TEXTURE\_MIN\_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE\_2D, gl.TEXTURE\_MAG\_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE\_2D, gl.TEXTURE\_WRAP\_S, gl.CLAMP\_TO\_EDGE);
  gl.texParameteri(gl.TEXTURE\_2D, gl.TEXTURE\_WRAP\_T, gl.CLAMP\_TO\_EDGE);
  gl.texImage2D(
    gl.TEXTURE\_2D,
    0,
    gl.RGBA,
    1,
    1,
    0,
    gl.RGBA,
    gl.UNSIGNED\_BYTE,
    new Uint8Array([0, 0, 0, 0]),
  );

  let contentMaxX = 1;

  let bezel: [number, number, number] = [0, 0, 0];
  const bezelProbe = document.createElement("canvas");
  bezelProbe.width = bezelProbe.height = 1;
  const bezelCtx = bezelProbe.getContext("2d", { willReadFrequently: true });

  function syncBezelColor() {
    if (!bezelCtx) return;
    let el: Element | null = content;
    while (el) {
      const bg = getComputedStyle(el).backgroundColor;
      if (bg && bg !== "transparent") {
        bezelCtx.clearRect(0, 0, 1, 1);
        bezelCtx.fillStyle = bg;
        bezelCtx.fillRect(0, 0, 1, 1);
        const [r, g, b, a] = bezelCtx.getImageData(0, 0, 1, 1).data;
        if (a > 0) {
          bezel = [r / 255, g / 255, b / 255];
          return;
        }
      }
      el = el.parentElement;
    }
    bezel = [0, 0, 0];
  }

  function syncCanvasSize() {
    const dpr = getCanvasPixelRatio(output, gl!);
    const width = Math.max(1, Math.round(output.clientWidth \* dpr));
    const height = Math.max(1, Math.round(output.clientHeight \* dpr));
    if (output.width !== width || output.height !== height) {
      output.width = width;
      output.height = height;
    }
    contentMaxX = Math.min(
      1,
      Math.max(0.05, content.clientWidth / Math.max(output.clientWidth, 1)),
    );
    if (htmlInCanvas) {
      const sourceWidth = Math.max(1, Math.round(source.clientWidth \* dpr));
      const sourceHeight = Math.max(1, Math.round(source.clientHeight \* dpr));
      if (source.width !== sourceWidth || source.height !== sourceHeight) {
        source.width = sourceWidth;
        source.height = sourceHeight;
      }
      paintable.requestPaint!();
    }
  }

  syncCanvasSize();
  syncBezelColor();

  function uploadContent() {
    if (!htmlInCanvas || !contentDirty) return;
    contentDirty = false;
    syncBezelColor();
    gl!.bindTexture(gl!.TEXTURE\_2D, contentTexture);
    gl!.texImage2D(
      gl!.TEXTURE\_2D,
      0,
      gl!.RGBA,
      gl!.RGBA,
      gl!.UNSIGNED\_BYTE,
      source,
    );
  }

  let time = 0;

  const fract = (x: number) => x - Math.floor(x);
  const hash2 = (x: number, y: number) =>
    fract(Math.sin(x \* 89.44 + y \* 19.36) \* 22189.22);
  const smooth01 = (x: number) => x \* x \* (3 - 2 \* x);
  function iHashCpu(vx: number, vy: number, r: number) {
    const fx = Math.floor(vx \* r);
    const fy = Math.floor(vy \* r);
    const h00 = hash2(fx / r, fy / r);
    const h10 = hash2((fx + 1) / r, fy / r);
    const h01 = hash2(fx / r, (fy + 1) / r);
    const h11 = hash2((fx + 1) / r, (fy + 1) / r);
    const ix = smooth01(fract(vx \* r));
    const iy = smooth01(fract(vy \* r));
    return (
      (h00 \* (1 - ix) + h10 \* ix) \* (1 - iy) + (h01 \* (1 - ix) + h11 \* ix) \* iy
    );
  }
  function noiseCpu(vx: number, vy: number) {
    let sum = 0;
    let s = 2;
    for (let i = 1; i < 7; i++) {
      sum += iHashCpu(vx + i, vy + i, 2 \* s) / s;
      s \*= 2;
    }
    return sum;
  }

  function render() {
    uploadContent();
    gl!.useProgram(program);
    gl!.activeTexture(gl!.TEXTURE0);
    gl!.bindTexture(gl!.TEXTURE\_2D, contentTexture);
    gl!.uniform1i(uniforms.uContent, 0);
    gl!.uniform2f(uniforms.uResolution, output.width, output.height);
    gl!.uniform1f(uniforms.uTime, time);
    gl!.uniform1f(uniforms.uWave, Math.max(config.wave, 0));
    gl!.uniform1f(uniforms.uJitter, Math.max(config.jitter, 0));
    gl!.uniform1f(uniforms.uCrease, Math.max(config.crease, 0));
    gl!.uniform1f(uniforms.uSwitching, Math.max(config.switching, 0));
    gl!.uniform1f(uniforms.uSwitchHeight, Math.max(config.switchingHeight, 0));
    gl!.uniform1f(uniforms.uBloom, config.bloom);
    const dpr = output.width / Math.max(output.clientWidth, 1);
    gl!.uniform1f(uniforms.uAberration, Math.max(config.aberration, 0) \* dpr);
    gl!.uniform1f(uniforms.uAcBeat, Math.max(config.acBeat, 0));
    gl!.uniform1f(uniforms.uGrain, Math.max(config.grain, 0));
    gl!.uniform1f(uniforms.uScanlines, Math.max(config.scanlines, 0));
    gl!.uniform1f(uniforms.uVignette, Math.max(config.vignette, 0));
    gl!.uniform1f(
      uniforms.uBarrel,
      htmlInCanvas ? Math.max(config.barrel, 0) : 0,
    );
    gl!.uniform3f(uniforms.uBezel, bezel[0], bezel[1], bezel[2]);
    gl!.uniform1f(uniforms.uCreaseNoise, noiseCpu(time, time));
    gl!.uniform1f(uniforms.uSaturation, config.saturation);
    gl!.uniform1f(uniforms.uExposure, Math.max(config.exposure, 0));
    gl!.uniform1f(uniforms.uMaxX, contentMaxX);
    gl!.bindFramebuffer(gl!.FRAMEBUFFER, null);
    gl!.viewport(0, 0, output.width, output.height);
    gl!.drawArrays(gl!.TRIANGLE\_STRIP, 0, 4);
  }

  let raf = 0;
  let lastTime = performance.now();
  let destroyed = false;
  let running = false;
  let visible = true;

  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reducedMotion = motionQuery.matches;

  function frame(now: number) {
    if (destroyed) return;
    if (!visible) {
      running = false;
      return;
    }
    const delta = Math.min((now - lastTime) / 1000, 1 / 30);
    lastTime = now;
    if (!reducedMotion) time += delta \* config.speed;
    render();
    if (reducedMotion && !contentDirty) {
      running = false;
      return;
    }
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (destroyed || running || !visible) return;
    running = true;
    lastTime = performance.now();
    raf = requestAnimationFrame(frame);
  }

  wake = start;
  start();

  function onMotionChange() {
    reducedMotion = motionQuery.matches;
    start();
  }
  motionQuery.addEventListener("change", onMotionChange);

  const observer = createCanvasResizeObserver(() => {
    syncCanvasSize();
    start();
  });
  observer.observe(output);
  observer.observe(content);

  const intersection = new IntersectionObserver((entries) => {
    visible = entries[entries.length - 1]?.isIntersecting ?? true;
    if (visible) start();
  });
  intersection.observe(output);

  return {
    setOptions(next) {
      if (
        !Object.entries(next).some(
          ([key, value]) => config[key as keyof VHSOptions] !== value,
        )
      )
        return;
      Object.assign(config, next);
      start();
    },
    resize() {
      syncCanvasSize();
      start();
    },
    destroy() {
      destroyed = true;
      cancelAnimationFrame(raf);
      observer.disconnect();
      intersection.disconnect();
      motionQuery.removeEventListener("change", onMotionChange);
      gl!.deleteTexture(contentTexture);
      gl!.deleteProgram(program);
      gl!.deleteShader(vertexShader);
      gl!.deleteShader(fragmentShader);
      gl!.deleteBuffer(quad);
      if (htmlInCanvas) paintable.onpaint = null;
    },
  };
}

export interface VHSProps extends VHSOptions {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const emptySubscribe = () => () => {};

export function VHS({ children, className, style, ...options }: VHSProps) {
  const sourceRef = useRef<HTMLCanvasElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const outputRef = useRef<HTMLCanvasElement>(null);
  const instanceRef = useRef<VHSInstance | null>(null);
  const [initialOptions] = useState(options);
  const [failed, setFailed] = useState(false);

  const supported = useSyncExternalStore(
    emptySubscribe,
    supportsHtmlInCanvas,
    () => false,
  );
  const native = supported && !failed;

  useEffect(() => {
    const source = sourceRef.current;
    const content = contentRef.current;
    const output = outputRef.current;
    if (!source || !content || !output) return;
    instanceRef.current = createVHS(
      { source, content, output },
      initialOptions,
    );
    if (native && !instanceRef.current) setFailed(true);
    return () => {
      instanceRef.current?.destroy();
      instanceRef.current = null;
    };
  }, [initialOptions, native]);

  useEffect(() => {
    instanceRef.current?.setOptions(options);
  });

  return (
    <div className={className} style={{ position: "relative", ...style }}>
      <canvas
        ref={sourceRef}
        // @ts-expect-error experimental html-in-canvas attribute
        layoutsubtree="true"
        suppressHydrationWarning
        style={
          native
            ? { position: "absolute", inset: 0, width: "100%", height: "100%" }
            : { display: "none" }
        }
      >
        {native ? (
          <div
            ref={contentRef}
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
              overflow: "auto",
            }}
          >
            {children}
          </div>
        ) : null}
      </canvas>
      {!native ? (
        <div
          ref={contentRef}
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            overflow: "auto",
          }}
        >
          {children}
        </div>
      ) : null}
      <canvas
        ref={outputRef}
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}


export default VHS;
\`\`\`


(combine vhs and glitch)