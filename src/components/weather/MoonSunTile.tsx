'use client';

import * as React from 'react';
import Link from 'next/link';
import { HelpCircle, Sunrise, Sunset } from 'lucide-react';
import { Tooltip } from '@/components/ui/tooltip';
import { moonPhase, MoonPhase } from '@/lib/moon';
import { calculateSunTimes, formatSunTime } from '@/lib/sun';
import { SITE_CONFIG } from '@/lib/site';

export interface MoonSunTileProps {
  date?: Date;
  isOffline?: boolean;
}

/**
 * Renders an inline SVG showing lunar illumination based on the computed phase.
 */
function MoonIllustration({ phase, illumination }: { phase: MoonPhase; illumination: number }) {
  const isWaxing = phase.startsWith('waxing') || phase === 'first_quarter';
  const isWaning = phase.startsWith('waning') || phase === 'last_quarter';

  return (
    <svg
      viewBox="0 0 40 40"
      className="h-10 w-10 shrink-0 select-none"
      role="img"
      aria-label={`Moon phase illustration: ${phase.replace('_', ' ')} (${Math.round(illumination * 100)}% illuminated)`}
    >
      {/* Dark lunar disk base */}
      <circle
        cx="20"
        cy="20"
        r="18"
        fill="var(--color-surface)"
        stroke="var(--color-border)"
        strokeWidth="1.5"
      />
      {phase === 'full' ? (
        <circle cx="20" cy="20" r="17" fill="var(--color-text)" opacity="0.9" />
      ) : phase === 'new' ? null : (
        /* Lit crescent / gibbous approximation using masked path */
        <path
          d={
            isWaxing
              ? `M 20 2 A 18 18 0 0 1 20 38 Q ${20 + (illumination - 0.5) * 36} 20 20 2 Z`
              : isWaning
              ? `M 20 2 A 18 18 0 0 0 20 38 Q ${20 - (illumination - 0.5) * 36} 20 20 2 Z`
              : `M 20 2 A 18 18 0 0 1 20 38 Z`
          }
          fill="var(--color-text)"
          opacity="0.85"
        />
      )}
    </svg>
  );
}

/**
 * Moon phase & Solar ephemeris tile per docs/03 and docs/04.
 * Computes lunar illumination client-side.
 * Hides completely if latitude/longitude constants in src/lib/site.ts are not set.
 */
export function MoonSunTile({ date = new Date(), isOffline = false }: MoonSunTileProps) {
  // If coordinates are not provided in site.ts, hide the tile per user instructions
  if (SITE_CONFIG.latitude == null || SITE_CONFIG.longitude == null) {
    return null;
  }

  const moon = moonPhase(date);
  const sun = calculateSunTimes(date, SITE_CONFIG.latitude, SITE_CONFIG.longitude);

  return (
    <div
      className={`instrument-tile flex flex-col justify-between p-5 sm:p-6 min-h-[220px] ${
        isOffline ? 'opacity-70 grayscale-[30%]' : ''
      }`}
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="label select-none">Sun &amp; Moon</span>
          <Tooltip
            content={
              <span>
                What is this? Learn about{' '}
                <span className="font-medium text-[var(--accent)]">
                  Lunar phases &amp; solar ephemeris
                </span>
              </span>
            }
            side="left"
          >
            <Link
              href="/learn#solar"
              aria-label="Learn about solar times and lunar phases"
              className="inline-flex h-7 w-7 min-h-[44px] min-w-[44px] sm:min-h-[28px] sm:min-w-[28px] items-center justify-center rounded-[6px] text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
            >
              <HelpCircle className="h-4 w-4 stroke-[1.5]" />
            </Link>
          </Tooltip>
        </div>

        {/* Lunar readout */}
        <div className="flex items-center gap-3 mt-1">
          <MoonIllustration phase={moon.phase} illumination={moon.illumination} />
          <div>
            <div className="text-base sm:text-lg font-medium text-[var(--color-text)]">
              {moon.name}
            </div>
            <div className="numeric text-xs text-[var(--color-muted)]">
              {Math.round(moon.illumination * 100)}% illuminated
            </div>
          </div>
        </div>
      </div>

      {/* Solar times: Sunrise & Sunset */}
      <div className="mt-4 pt-3 border-t border-[var(--color-border)] grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-2">
          <Sunrise className="h-4 w-4 stroke-[1.5] text-[var(--color-muted)]" />
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
              Sunrise
            </div>
            <div className="numeric font-medium text-[var(--color-text)]">
              {formatSunTime(sun.sunrise)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Sunset className="h-4 w-4 stroke-[1.5] text-[var(--color-muted)]" />
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
              Sunset
            </div>
            <div className="numeric font-medium text-[var(--color-text)]">
              {formatSunTime(sun.sunset)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
