'use client';

import * as React from 'react';
import Link from 'next/link';
import { HelpCircle } from 'lucide-react';
import { Tooltip } from '@/components/ui/tooltip';
import { Sparkline } from './Sparkline';
import { ValueCrossfade } from './ValueCrossfade';
import { formatTemp, UnitSystem } from '@/lib/units';

export interface HumidityTileProps {
  humidityPct: number;
  dewPointC?: number;
  unitSystem: UnitSystem;
  historyHumidityPct?: number[];
  isOffline?: boolean;
}

/**
 * Plain-language comfort word. Leads with relative humidity (what people
 * read); dew point only escalates inside the neutral band, e.g. a
 * muggy 60 % at 18 C dew point. Never calls 72 % "Dry" as before.
 */
export function comfortWord(humidityPct: number, dewPointC?: number): 'dry' | 'comfortable' | 'humid' {
  if (humidityPct < 35) return 'dry';
  if (humidityPct > 65) return 'humid';
  if (dewPointC != null && dewPointC > 16) return 'humid';
  return 'comfortable';
}

/**
 * Relative Humidity instrument tile per docs/03 and docs/04.
 * Features capacitive humidity, dew point readout, plain-language comfort word,
 * and 24-hour humidity trend sparkline.
 */
export function HumidityTile({
  humidityPct,
  dewPointC,
  unitSystem,
  historyHumidityPct = [],
  isOffline = false,
}: HumidityTileProps) {
  const comfort = comfortWord(humidityPct, dewPointC);
  const formattedDewPoint = dewPointC != null ? formatTemp(dewPointC, unitSystem) : null;

  return (
    <div
      className={`instrument-tile flex flex-col justify-between flex-1 p-5 sm:p-6 min-h-[220px] ${
        isOffline ? 'opacity-70 grayscale-[30%]' : ''
      }`}
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="label select-none">Relative Humidity</span>
          <Tooltip
            content={
              <span>
                What is this? Learn about{' '}
                <span className="font-medium text-[var(--accent)]">
                  Humidity &amp; Dew Point
                </span>
              </span>
            }
            side="left"
          >
            <Link
              href="/learn#humidity"
              aria-label="What is relative humidity? Learn more in our student guide"
              className="inline-flex h-7 w-7 min-h-[44px] min-w-[44px] sm:min-h-[28px] sm:min-w-[28px] items-center justify-center rounded-[6px] text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
            >
              <HelpCircle className="h-4 w-4 stroke-[1.5]" />
            </Link>
          </Tooltip>
        </div>

        {/* Primary Humidity Readout */}
        <div className="flex items-baseline gap-2">
          <ValueCrossfade
            value={Math.round(humidityPct)}
            className="text-3xl sm:text-4xl font-light tracking-tight text-[var(--color-text)]"
          />
          <span className="text-base text-[var(--color-muted)] select-none">%</span>
          <span className="text-xs font-medium text-[var(--color-text)] ml-2 capitalize">
            {comfort}
          </span>
        </div>

        {/* Dew point note */}
        {formattedDewPoint && (
          <p className="mt-2 text-xs text-[var(--color-muted)]">
            Dew point:{' '}
            <span className="numeric text-[var(--color-text)] font-medium">
              {formattedDewPoint.value} {formattedDewPoint.unit}
            </span>
          </p>
        )}
      </div>

      {/* Sparkline */}
      <div className="pt-3 border-t border-[var(--color-border)]">
        <Sparkline
          data={historyHumidityPct}
          unit="%"
          label="24h Relative Humidity"
          height={28}
        />
      </div>
    </div>
  );
}
