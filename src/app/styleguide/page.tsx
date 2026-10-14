'use client';

import * as React from 'react';
import { notFound } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LiveDot } from '@/components/live-dot';
import { Sparkles, Sun, Moon, ArrowRight, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';

// Relative luminance and contrast calculation per WCAG 2.1
function getLuminance(hex: string): number {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  const [rl, gl, bl] = [r, g, b].map((val) => {
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

function getContrastRatio(fgHex: string, bgHex: string): number {
  const lum1 = getLuminance(fgHex);
  const lum2 = getLuminance(bgHex);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

interface ContrastItem {
  context: string;
  fgName: string;
  fgHex: string;
  bgName: string;
  bgHex: string;
  target: 'normal' | 'large' | 'demonstration';
}

const contrastPairs: ContrastItem[] = [
  // Dark Theme Combinations
  { context: 'Dark Theme', fgName: 'Text (#F5F5F5)', fgHex: '#F5F5F5', bgName: 'Background (#0A0A0A)', bgHex: '#0A0A0A', target: 'normal' },
  { context: 'Dark Theme', fgName: 'Text (#F5F5F5)', fgHex: '#F5F5F5', bgName: 'Surface (#111111)', bgHex: '#111111', target: 'normal' },
  { context: 'Dark Theme', fgName: 'Muted (#8A8A8A)', fgHex: '#8A8A8A', bgName: 'Background (#0A0A0A)', bgHex: '#0A0A0A', target: 'normal' },
  { context: 'Dark Theme', fgName: 'Muted (#8A8A8A)', fgHex: '#8A8A8A', bgName: 'Surface (#111111)', bgHex: '#111111', target: 'normal' },
  { context: 'Dark Theme', fgName: 'DIS Amber (#F6A800)', fgHex: '#F6A800', bgName: 'Background (#0A0A0A)', bgHex: '#0A0A0A', target: 'normal' },
  { context: 'Dark Theme', fgName: 'DIS Amber (#F6A800)', fgHex: '#F6A800', bgName: 'Surface (#111111)', bgHex: '#111111', target: 'normal' },
  { context: 'Dark Theme', fgName: 'DIS Green (#B3D236)', fgHex: '#B3D236', bgName: 'Background (#0A0A0A)', bgHex: '#0A0A0A', target: 'normal' },

  // Light Theme Combinations
  { context: 'Light Theme', fgName: 'Text (#0A0A0A)', fgHex: '#0A0A0A', bgName: 'Background (#FAFAFA)', bgHex: '#FAFAFA', target: 'normal' },
  { context: 'Light Theme', fgName: 'Text (#0A0A0A)', fgHex: '#0A0A0A', bgName: 'Surface (#FFFFFF)', bgHex: '#FFFFFF', target: 'normal' },
  { context: 'Light Theme', fgName: 'Muted (#6B6B6B)', fgHex: '#6B6B6B', bgName: 'Background (#FAFAFA)', bgHex: '#FAFAFA', target: 'normal' },
  { context: 'Light Theme', fgName: 'Muted (#6B6B6B)', fgHex: '#6B6B6B', bgName: 'Surface (#FFFFFF)', bgHex: '#FFFFFF', target: 'normal' },
  { context: 'Light Theme', fgName: 'DIS Blue (#00529E)', fgHex: '#00529E', bgName: 'Background (#FAFAFA)', bgHex: '#FAFAFA', target: 'normal' },
  { context: 'Light Theme', fgName: 'DIS Blue (#00529E)', fgHex: '#00529E', bgName: 'Surface (#FFFFFF)', bgHex: '#FFFFFF', target: 'normal' },

  // Demonstration: Why rules in 03a mandate theme accent swap
  { context: 'Invalid Usage Proof', fgName: 'DIS Blue on Dark (#00529E)', fgHex: '#00529E', bgName: 'Dark Bg (#0A0A0A)', bgHex: '#0A0A0A', target: 'demonstration' },
  { context: 'Invalid Usage Proof', fgName: 'DIS Amber on Light (#F6A800)', fgHex: '#F6A800', bgName: 'Light Bg (#FAFAFA)', bgHex: '#FAFAFA', target: 'demonstration' },
];

export default function StyleguidePage() {
  // Dev-only via env flag (enabled in development or via NEXT_PUBLIC_ENABLE_STYLEGUIDE)
  const isDev = process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_ENABLE_STYLEGUIDE === 'true';

  if (!isDev) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-background)]">
      <Header />
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-8 sm:px-6 sm:py-12 space-y-16">
        {/* Header */}
        <div className="flex flex-col gap-4 border-b border-[var(--color-border)] pb-8">
          <div className="flex items-center gap-2">
            <span className="label text-[var(--accent)] font-semibold">Engineering &amp; Design Spec</span>
            <Badge variant="outline" className="text-[10px]">Dev Only</Badge>
          </div>
          <h1 className="display text-[var(--color-text)]">
            Design Styleguide
          </h1>
          <p className="max-w-2xl text-base sm:text-lg leading-relaxed text-[var(--color-muted)]">
            Live verification of DIS design system tokens, typography scales, tactile components, accessible focus rings, and computed WCAG contrast ratios.
          </p>
        </div>

        {/* 1. Colour Tokens in Both Themes */}
        <section className="space-y-6">
          <div>
            <span className="label">Section 01</span>
            <h2 className="text-2xl font-light text-[var(--color-text)]">Colour Tokens</h2>
            <p className="text-xs text-[var(--color-muted)] mt-1">
              Exact palette per docs/03 Section 3 and 03a Brand Kit.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Dark Theme Swatches */}
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text)]">
                  Dark Theme (Default)
                </h3>
                <span className="label text-[var(--accent)] font-semibold">Active Accent: Amber</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-[8px] bg-[#0A0A0A] border border-[#1F1F1F] text-[#F5F5F5]">
                  <span className="label text-[10px] text-[#8A8A8A] block">background</span>
                  <span className="numeric font-medium">#0A0A0A</span>
                </div>
                <div className="p-3 rounded-[8px] bg-[#111111] border border-[#1F1F1F] text-[#F5F5F5]">
                  <span className="label text-[10px] text-[#8A8A8A] block">surface</span>
                  <span className="numeric font-medium">#111111</span>
                </div>
                <div className="p-3 rounded-[8px] bg-[#1F1F1F] border border-[#333333] text-[#F5F5F5]">
                  <span className="label text-[10px] text-[#8A8A8A] block">border</span>
                  <span className="numeric font-medium">#1F1F1F</span>
                </div>
                <div className="p-3 rounded-[8px] bg-[#0A0A0A] border border-[#1F1F1F] text-[#F5F5F5]">
                  <span className="label text-[10px] text-[#8A8A8A] block">text</span>
                  <span className="numeric font-medium">#F5F5F5</span>
                </div>
                <div className="p-3 rounded-[8px] bg-[#0A0A0A] border border-[#1F1F1F] text-[#8A8A8A]">
                  <span className="label text-[10px] text-[#8A8A8A] block">muted</span>
                  <span className="numeric font-medium">#8A8A8A</span>
                </div>
                <div className="p-3 rounded-[8px] bg-[#F6A800] text-[#0A0A0A] font-semibold">
                  <span className="label text-[10px] text-[#0A0A0A] block">--accent (DIS Amber)</span>
                  <span className="numeric">#F6A800</span>
                </div>
              </div>
            </Card>

            {/* Light Theme Swatches */}
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text)]">
                  Light Theme
                </h3>
                <span className="label text-[#00529E] font-semibold">Active Accent: Blue</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-[8px] bg-[#FAFAFA] border border-[#E5E5E5] text-[#0A0A0A]">
                  <span className="label text-[10px] text-[#6B6B6B] block">background</span>
                  <span className="numeric font-medium">#FAFAFA</span>
                </div>
                <div className="p-3 rounded-[8px] bg-[#FFFFFF] border border-[#E5E5E5] text-[#0A0A0A]">
                  <span className="label text-[10px] text-[#6B6B6B] block">surface</span>
                  <span className="numeric font-medium">#FFFFFF</span>
                </div>
                <div className="p-3 rounded-[8px] bg-[#E5E5E5] border border-[#D4D4D4] text-[#0A0A0A]">
                  <span className="label text-[10px] text-[#6B6B6B] block">border</span>
                  <span className="numeric font-medium">#E5E5E5</span>
                </div>
                <div className="p-3 rounded-[8px] bg-[#FAFAFA] border border-[#E5E5E5] text-[#0A0A0A]">
                  <span className="label text-[10px] text-[#6B6B6B] block">text</span>
                  <span className="numeric font-medium">#0A0A0A</span>
                </div>
                <div className="p-3 rounded-[8px] bg-[#FAFAFA] border border-[#E5E5E5] text-[#6B6B6B]">
                  <span className="label text-[10px] text-[#6B6B6B] block">muted</span>
                  <span className="numeric font-medium">#6B6B6B</span>
                </div>
                <div className="p-3 rounded-[8px] bg-[#00529E] text-[#FFFFFF] font-semibold">
                  <span className="label text-[10px] text-[#FFFFFF] block">--accent (DIS Blue)</span>
                  <span className="numeric">#00529E</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Reserved Status Green */}
          <div className="p-4 rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="h-4 w-4 rounded-full bg-[#B3D236] inline-block shrink-0" />
              <div>
                <span className="label text-[10px] text-[var(--color-muted)]">Status Token</span>
                <div className="text-sm font-medium text-[var(--color-text)]">DIS Green (#B3D236)</div>
              </div>
            </div>
            <p className="text-xs text-[var(--color-muted)] text-right">
              Reserved strictly for live connection and data-fresh signals.
            </p>
          </div>
        </section>

        {/* 2. Typography Scale */}
        <section className="space-y-6">
          <div>
            <span className="label">Section 02</span>
            <h2 className="text-2xl font-light text-[var(--color-text)]">Typography Scale</h2>
            <p className="text-xs text-[var(--color-muted)] mt-1">
              Geist Sans for editorial structure; Geist Mono with tabular numbers for scientific telemetry.
            </p>
          </div>

          <Card className="p-6 divide-y divide-[var(--color-border)]">
            <div className="py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="label">.display (clamp hero typography)</span>
                <span className="numeric text-xs text-[var(--color-muted)]">clamp(2.25rem, 5vw + 1rem, 4.5rem)</span>
              </div>
              <p className="display text-[var(--color-text)]">
                21.4&deg;C Light Breeze
              </p>
            </div>

            <div className="py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="label">Heading 1 (h1)</span>
                <span className="numeric text-xs text-[var(--color-muted)]">32px / 2rem font-light</span>
              </div>
              <h1 className="text-3xl font-light tracking-tight text-[var(--color-text)]">
                Live Campus Meteorology
              </h1>
            </div>

            <div className="py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="label">Heading 2 (h2)</span>
                <span className="numeric text-xs text-[var(--color-muted)]">24px / 1.5rem font-medium</span>
              </div>
              <h2 className="text-2xl font-medium tracking-tight text-[var(--color-text)]">
                Atmospheric Pressure &amp; Barometric Trend
              </h2>
            </div>

            <div className="py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="label">Heading 3 (h3)</span>
                <span className="numeric text-xs text-[var(--color-muted)]">18px / 1.125rem font-medium</span>
              </div>
              <h3 className="text-lg font-medium text-[var(--color-text)]">
                Tipping Bucket Precipitation Gauge
              </h3>
            </div>

            <div className="py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="label">Body (16px min, 1.6 line-height, max 65 ch)</span>
                <span className="numeric text-xs text-[var(--color-muted)]">16px / line-height 1.6</span>
              </div>
              <p className="text-base leading-relaxed text-[var(--color-text)] max-w-[65ch]">
                The weather station operates continuously on the upper roof deck of Dresden International School, measuring ambient conditions every sixteen seconds to deliver real-time data for inquiry-based learning.
              </p>
            </div>

            <div className="py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="label">.label utility</span>
                <span className="numeric text-xs text-[var(--color-muted)]">11-12px uppercase tracking .08em muted</span>
              </div>
              <p className="label">
                Relative Humidity &middot; Capacitive Sensor &middot; 0.1 Resolution
              </p>
            </div>

            <div className="py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="label">.numeric utility (tabular-nums, mono)</span>
                <span className="numeric text-xs text-[var(--color-muted)]">font-variant-numeric: tabular-nums</span>
              </div>
              <div className="numeric text-xl text-[var(--color-text)] space-x-4">
                <span>1013.25 hPa</span>
                <span>00:14:59</span>
                <span>+24.8 &deg;C</span>
                <span>0.00 mm/h</span>
              </div>
            </div>
          </Card>
        </section>

        {/* 3. Buttons & 44px Touch Targets */}
        <section className="space-y-6">
          <div>
            <span className="label">Section 03</span>
            <h2 className="text-2xl font-light text-[var(--color-text)]">Buttons &amp; Interactive Targets</h2>
            <p className="text-xs text-[var(--color-muted)] mt-1">
              Minimum 44px touch targets on all interactive elements, 12px radius, no drop shadows.
            </p>
          </div>

          <Card className="p-6">
            <div className="flex flex-wrap items-center gap-4">
              <Button variant="default">Primary Action</Button>
              <Button variant="secondary">Secondary Button</Button>
              <Button variant="outline">Outline Button</Button>
              <Button variant="ghost">Ghost Button</Button>
              <Button variant="link">Inline Link Action</Button>
              <Button size="icon" variant="outline" aria-label="Icon target sample">
                <Sparkles className="h-4 w-4" strokeWidth={1.5} />
              </Button>
            </div>
            <div className="mt-4 pt-4 border-t border-[var(--color-border)] text-xs text-[var(--color-muted)]">
              All buttons strictly adhere to 12px radius (<code className="numeric">rounded-[12px]</code>), 1px border, and minimum 44px touch targets.
            </div>
          </Card>
        </section>

        {/* 4. Badges & Indicators */}
        <section className="space-y-6">
          <div>
            <span className="label">Section 04</span>
            <h2 className="text-2xl font-light text-[var(--color-text)]">Badges &amp; Live Indicators</h2>
            <p className="text-xs text-[var(--color-muted)] mt-1">
              Non-decorative information tags and live telemetry status.
            </p>
          </div>

          <Card className="p-6">
            <div className="flex flex-wrap items-center gap-4">
              <Badge variant="default">Default Surface Badge</Badge>
              <Badge variant="accent">Accent Highlight</Badge>
              <Badge variant="outline">Telemetry Tag</Badge>
              <Badge variant="live">
                <span className="h-2 w-2 rounded-full bg-[#B3D236]" />
                Live Status
              </Badge>
              <LiveDot status="live" label="Live Stream" />
              <LiveDot status="delayed" label="Stale 12m" />
              <LiveDot status="offline" label="Offline" />
            </div>
          </Card>
        </section>

        {/* 5. Instrument Tile / Card */}
        <section className="space-y-6">
          <div>
            <span className="label">Section 05</span>
            <h2 className="text-2xl font-light text-[var(--color-text)]">Instrument Tile</h2>
            <p className="text-xs text-[var(--color-muted)] mt-1">
              1px border, 12px radius, no drop shadows, 150ms border brightening hover state.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 min-h-[200px] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="label">Wind Direction</span>
                  <Badge variant="outline" className="text-[10px]">Bearing 225&deg;</Badge>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="numeric text-4xl font-light text-[var(--color-text)]">SW</span>
                  <span className="text-xs text-[var(--color-muted)]">South-West</span>
                </div>
                <p className="mt-1 text-xs text-[var(--color-muted)]">
                  Speed 14 km/h &middot; Gusting to 24 km/h
                </p>
              </div>
              <div className="border-t border-[var(--color-border)] pt-3 text-[11px] text-[var(--color-muted)] flex items-center justify-between">
                <span>Beaufort: Light Breeze (Force 3)</span>
                <span className="numeric">16s update</span>
              </div>
            </Card>

            <Card className="p-6 min-h-[200px] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="label">Rain Rate</span>
                  <span className="label text-[var(--accent)] font-semibold">Dry</span>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="numeric text-4xl font-light text-[var(--color-text)]">0.0</span>
                  <span className="text-xs text-[var(--color-muted)]">mm/h</span>
                </div>
                <p className="mt-1 text-xs text-[var(--color-muted)]">
                  Daily total: 0.0 mm &middot; Last rainfall 3 days ago
                </p>
              </div>
              <div className="border-t border-[var(--color-border)] pt-3 text-[11px] text-[var(--color-muted)] flex items-center justify-between">
                <span>Sainlogic Tipping Bucket</span>
                <span className="numeric">Resets 00:00 Berlin</span>
              </div>
            </Card>
          </div>
        </section>

        {/* 6. Accessible Focus Ring */}
        <section className="space-y-6">
          <div>
            <span className="label">Section 06</span>
            <h2 className="text-2xl font-light text-[var(--color-text)]">Accessible Focus Ring</h2>
            <p className="text-xs text-[var(--color-muted)] mt-1">
              Focus rings use 2px solid var(--accent) with 2px offset. Test by pressing Tab or focusing these elements.
            </p>
          </div>

          <Card className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="test-input" className="label block mb-2">Text Input Focus</label>
                <input
                  id="test-input"
                  type="text"
                  placeholder="Focus me with Tab or Click"
                  className="w-full h-11 min-h-[44px] px-3 rounded-[8px] border border-[var(--color-border)] bg-[var(--color-background)] text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:outline-none focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-2"
                />
              </div>

              <div>
                <label htmlFor="test-button" className="label block mb-2">Button Ring</label>
                <button
                  id="test-button"
                  type="button"
                  className="w-full h-11 min-h-[44px] px-4 rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm font-medium text-[var(--color-text)] hover:border-[var(--color-text)] focus:outline-none focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-2 transition-colors"
                >
                  Interactive Focus Target
                </button>
              </div>

              <div>
                <label htmlFor="test-select" className="label block mb-2">Selector Ring</label>
                <select
                  id="test-select"
                  className="w-full h-11 min-h-[44px] px-3 rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text)] focus:outline-none focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-2"
                >
                  <option>Metric Units (&deg;C, km/h, mm)</option>
                  <option>Imperial Units (&deg;F, mph, in)</option>
                </select>
              </div>
            </div>
          </Card>
        </section>

        {/* 7. Computed Contrast Ratios Table */}
        <section className="space-y-6">
          <div>
            <span className="label">Section 07</span>
            <h2 className="text-2xl font-light text-[var(--color-text)]">Computed WCAG Contrast Ratios</h2>
            <p className="text-xs text-[var(--color-muted)] mt-1">
              Ratios calculated in real time using the official WCAG 2.1 relative luminance algorithm. Minimum for AA normal text is 4.5:1; AAA is 7.0:1.
            </p>
          </div>

          <div className="overflow-x-auto rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)]">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[var(--color-border)] bg-[var(--color-background)]/60 text-[var(--color-muted)]">
                <tr>
                  <th className="p-4 label">Theme Context</th>
                  <th className="p-4 label">Foreground</th>
                  <th className="p-4 label">Background</th>
                  <th className="p-4 label">Computed Ratio</th>
                  <th className="p-4 label">WCAG AA (&ge; 4.5:1)</th>
                  <th className="p-4 label">WCAG AAA (&ge; 7.0:1)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)] text-[var(--color-text)]">
                {contrastPairs.map((item, index) => {
                  const ratio = getContrastRatio(item.fgHex, item.bgHex);
                  const passesAA = ratio >= 4.5;
                  const passesAAA = ratio >= 7.0;

                  return (
                    <tr
                      key={index}
                      className={
                        item.target === 'demonstration'
                          ? 'bg-red-500/5 hover:bg-red-500/10 transition-colors'
                          : 'hover:bg-[var(--color-background)]/30 transition-colors'
                      }
                    >
                      <td className="p-4 font-medium text-[var(--color-muted)]">
                        {item.context}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-3.5 w-3.5 rounded border border-neutral-500/30"
                            style={{ backgroundColor: item.fgHex }}
                          />
                          <span>{item.fgName}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-3.5 w-3.5 rounded border border-neutral-500/30"
                            style={{ backgroundColor: item.bgHex }}
                          />
                          <span>{item.bgName}</span>
                        </div>
                      </td>
                      <td className="p-4 font-mono font-bold text-sm">
                        {ratio.toFixed(2)} : 1
                      </td>
                      <td className="p-4">
                        {passesAA ? (
                          <span className="inline-flex items-center gap-1 text-[#B3D236] font-medium">
                            <CheckCircle2 className="h-4 w-4" /> Pass
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-400 font-medium">
                            <XCircle className="h-4 w-4" /> Fail
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        {passesAAA ? (
                          <span className="inline-flex items-center gap-1 text-[#B3D236] font-medium">
                            <CheckCircle2 className="h-4 w-4" /> Pass
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-neutral-500">
                            <XCircle className="h-4 w-4" /> Below 7.0
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="p-4 rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-muted)] leading-relaxed">
            <strong className="text-[var(--color-text)]">Design System Note:</strong> Notice how DIS Amber (#F6A800) delivers an outstanding <strong>9.93:1</strong> on dark backgrounds (exceeding AAA), but collapses to <strong>1.99:1</strong> on light backgrounds. Conversely, DIS Blue (#00529E) delivers <strong>7.41:1</strong> on light backgrounds (exceeding AAA) but collapses to <strong>2.51:1</strong> on dark backgrounds. This mathematical reality verifies why the system token <code className="numeric bg-[var(--color-background)] px-1 py-0.5 rounded border border-[var(--color-border)]">--accent</code> strictly swaps between Amber in dark mode and Blue in light mode.
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
