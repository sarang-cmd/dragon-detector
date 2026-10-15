'use client';

import * as React from 'react';
import Link from 'next/link';
import { HelpCircle } from 'lucide-react';
import { Tooltip } from '@/components/ui/tooltip';
import { Sparkline } from './Sparkline';
import { ValueCrossfade } from './ValueCrossfade';
import {
  beaufort,
  compassWord,
  windDirectionLabel,
  windScreenReaderText,
} from '@/lib/beaufort';
import { formatSpeed, UnitSystem, kmhToMph } from '@/lib/units';

export interface WindCompassProps {
  speedKmh: number;
  gustKmh: number;
  directionDeg: number;
  unitSystem: UnitSystem;
  historySpeedKmh?: number[];
  isOffline?: boolean;
}

const CARDINALS = [
  { label: 'N', deg: 0, x: 110, y: 32 },
  { label: 'E', deg: 90, x: 194, y: 115 },
  { label: 'S', deg: 180, x: 110, y: 198 },
  { label: 'W', deg: 270, x: 26, y: 115 },
];

/**
 * Custom 1x2 Wind Compass Instrument per docs/03 and docs/04.
 * Features 16-point dial, spring-recoiling needle pointing in direction wind blows FROM,
 * faint ghost needle for gust smoothing, and screen-reader accessibility.
 */
export function WindCompass({
  speedKmh,
  gustKmh,
  directionDeg,
  unitSystem,
  historySpeedKmh = [],
  isOffline = false,
}: WindCompassProps) {
  const bResult = beaufort(speedKmh);
  const cWord = compassWord(directionDeg);
  const cLabel = windDirectionLabel(directionDeg);

  const formattedSpeed = formatSpeed(speedKmh, unitSystem);
  const formattedGust = formatSpeed(gustKmh, unitSystem);

  // Shortest-path unwrapping to avoid erratic 350-degree flips across North
  const angleRef = React.useRef(directionDeg);
  const prevTargetRef = React.useRef(directionDeg);

  if (directionDeg !== prevTargetRef.current) {
    const diff = ((directionDeg - (angleRef.current % 360) + 540) % 360) - 180;
    angleRef.current += diff;
    prevTargetRef.current = directionDeg;
  }
  const continuousAngle = angleRef.current;

  // Faint ghost needle for gust smoothing / tracking
  const ghostAngle = continuousAngle + (gustKmh > speedKmh ? 4 : 0);

  const srText = windScreenReaderText({
    directionDeg,
    speed: unitSystem === 'metric' ? speedKmh : Number(formattedSpeed.value),
    gust: unitSystem === 'metric' ? gustKmh : Number(formattedGust.value),
    speedUnit: unitSystem === 'metric' ? 'km/h' : 'mph',
  });

  return (
    <div
      className={`instrument-tile flex flex-col justify-between p-5 sm:p-6 min-h-[380px] lg:min-h-[460px] ${
        isOffline ? 'opacity-70 grayscale-[30%]' : ''
      }`}
    >
      {/* Header */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="label select-none">Wind &amp; Gusts</span>
          <Tooltip
            content={
              <span>
                What is this? Learn about{' '}
                <span className="font-medium text-[var(--accent)]">
                  Wind speed &amp; direction
                </span>
              </span>
            }
            side="left"
          >
            <Link
              href="/learn#wind-speed"
              aria-label="What is wind speed? Learn more in our student guide"
              className="inline-flex h-7 w-7 min-h-[44px] min-w-[44px] sm:min-h-[28px] sm:min-w-[28px] items-center justify-center rounded-[6px] text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
            >
              <HelpCircle className="h-4 w-4 stroke-[1.5]" />
            </Link>
          </Tooltip>
        </div>

        {/* Screen-reader descriptive text */}
        <p className="sr-only">{srText}</p>

        {/* Primary speed readout */}
        <div className="flex items-baseline gap-2">
          <ValueCrossfade
            value={formattedSpeed.value}
            className="text-4xl sm:text-5xl font-light tracking-tight text-[var(--color-text)]"
          />
          <span className="text-base text-[var(--color-muted)] select-none">
            {formattedSpeed.unit}
          </span>
          <span className="text-xs text-[var(--color-muted)] ml-2">
            Gusts <span className="numeric font-medium text-[var(--color-text)]">{formattedGust.value}</span> {formattedGust.unit}
          </span>
        </div>

        <div className="mt-1 flex items-center gap-2 text-xs text-[var(--color-muted)]">
          <span className="font-medium text-[var(--color-text)]">{bResult.name}</span>
          <span>&middot;</span>
          <span>From {cWord} ({cLabel}, {Math.round(directionDeg)}&deg;)</span>
        </div>
      </div>

      {/* SVG Compass Instrument */}
      <div className="my-4 flex items-center justify-center">
        <div className="relative h-[210px] w-[210px] sm:h-[220px] sm:w-[220px]">
          <svg
            viewBox="0 0 220 220"
            className="h-full w-full select-none"
            aria-hidden="true"
          >
            {/* Outer dial ring */}
            <circle
              cx="110"
              cy="110"
              r="96"
              fill="none"
              stroke="var(--color-border)"
              strokeWidth="1"
            />
            <circle
              cx="110"
              cy="110"
              r="76"
              fill="none"
              stroke="var(--color-border)"
              strokeWidth="1"
              strokeDasharray="1 3"
            />

            {/* 16 Dial Ticks */}
            {Array.from({ length: 16 }).map((_, i) => {
              const deg = i * 22.5;
              const isCardinal = i % 4 === 0;
              const rInner = isCardinal ? 84 : 88;
              const rOuter = 96;
              const rad = (deg - 90) * (Math.PI / 180);
              const x1 = 110 + rInner * Math.cos(rad);
              const y1 = 110 + rInner * Math.sin(rad);
              const x2 = 110 + rOuter * Math.cos(rad);
              const y2 = 110 + rOuter * Math.sin(rad);
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={isCardinal ? 'var(--color-text)' : 'var(--color-muted)'}
                  strokeWidth={isCardinal ? 1.5 : 1}
                  opacity={isCardinal ? 0.9 : 0.4}
                />
              );
            })}

            {/* Cardinal Letters (N, E, S, W) */}
            {CARDINALS.map((c) => (
              <text
                key={c.label}
                x={c.x}
                y={c.y}
                textAnchor="middle"
                dominantBaseline="central"
                className="fill-[var(--color-muted)] text-[11px] font-medium tracking-wider"
              >
                {c.label}
              </text>
            ))}

            {/* Faint Ghost Needle for Gust Smoothing */}
            <g
              style={{
                transform: `rotate(${ghostAngle}deg)`,
                transformOrigin: '110px 110px',
                transition:
                  'transform 900ms cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
              className="motion-reduce:transition-none opacity-30"
            >
              <line
                x1="110"
                y1="110"
                x2="110"
                y2="28"
                stroke="var(--accent)"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
            </g>

            {/* Main Spring Needle pointing in the direction wind blows FROM */}
            <g
              style={{
                transform: `rotate(${continuousAngle}deg)`,
                transformOrigin: '110px 110px',
                transition:
                  'transform 600ms cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
              className="motion-reduce:transition-none"
            >
              {/* Back counterweight */}
              <line
                x1="110"
                y1="110"
                x2="110"
                y2="136"
                stroke="var(--color-muted)"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              {/* Pointing stem */}
              <line
                x1="110"
                y1="110"
                x2="110"
                y2="26"
                stroke="var(--accent)"
                strokeWidth="2"
                strokeLinecap="round"
              />
              {/* Needle Arrowhead pointing at perimeter */}
              <polygon
                points="110,18 105,32 115,32"
                fill="var(--accent)"
              />
            </g>

            {/* Center Pivot Boss */}
            <circle
              cx="110"
              cy="110"
              r="5"
              fill="var(--color-surface)"
              stroke="var(--accent)"
              strokeWidth="2"
            />
          </svg>
        </div>
      </div>

      {/* Sparkline & Footer summary */}
      <div className="pt-3 border-t border-[var(--color-border)]">
        <Sparkline
          data={
            unitSystem === 'imperial'
              ? historySpeedKmh.map(kmhToMph)
              : historySpeedKmh
          }
          unit={formattedSpeed.unit}
          label="24h Wind Speed"
          height={32}
        />
      </div>
    </div>
  );
}
