'use client';

import * as React from 'react';
import type { UnitSystem } from '@/lib/units';
import { cToF } from '@/lib/units';

const SCALE_MIN = -12;
const SCALE_MAX = 32;

function toDisplay(celsius: number, unitSystem: UnitSystem): string {
  const v = unitSystem === 'metric' ? celsius : cToF(celsius);
  return `${v.toFixed(1)} °${unitSystem === 'metric' ? 'C' : 'F'}`;
}

export interface UncertaintyDemoProps {
  liveTempC: number | null;
  unitSystem: UnitSystem;
}

/**
 * Interactive ±1 °C band demo (docs/06 + docs/07 accuracy figures).
 * Drag the "true temperature" slider; the highlighted band shows every
 * value our WS3500 station is allowed to report for it.
 */
export function UncertaintyDemo({ liveTempC, unitSystem }: UncertaintyDemoProps) {
  const [trueTemp, setTrueTemp] = React.useState<number>(() =>
    liveTempC != null && Number.isFinite(liveTempC)
      ? Math.round(liveTempC * 2) / 2
      : 11
  );

  const lo = trueTemp - 1;
  const hi = trueTemp + 1;
  const span = SCALE_MAX - SCALE_MIN;
  const bandLeft = ((lo - SCALE_MIN) / span) * 100;
  const bandWidth = ((hi - lo) / span) * 100;
  const markerLeft = ((trueTemp - SCALE_MIN) / span) * 100;

  return (
    <div className="rounded-[8px] border border-[var(--color-border)] bg-[var(--color-background)] p-4">
      <label
        htmlFor="uncertainty-true-temp"
        className="label font-semibold text-[var(--color-text)]"
      >
        Try it: set the true temperature
      </label>
      <input
        id="uncertainty-true-temp"
        type="range"
        min={-10}
        max={30}
        step={0.5}
        value={trueTemp}
        onChange={(e) => setTrueTemp(Number(e.target.value))}
        className="mt-3 h-[44px] w-full accent-[var(--accent)]"
        aria-describedby="uncertainty-result"
      />
      <div
        aria-hidden="true"
        className="relative mt-1 h-8 rounded-[6px] border border-[var(--color-border)]"
      >
        <div
          className="absolute top-0 h-full rounded-[6px] border-x-2 border-[var(--accent)] bg-[var(--color-border)]"
          style={{ left: `${bandLeft}%`, width: `${bandWidth}%` }}
        />
        <div
          className="absolute top-0 h-full w-[2px] bg-[var(--color-text)]"
          style={{ left: `${markerLeft}%` }}
        />
      </div>
      <div
        aria-hidden="true"
        className="numeric mt-1 flex justify-between text-[10px] text-[var(--color-muted)]"
      >
        <span>
          {unitSystem === 'metric' ? `${SCALE_MIN} °C` : `${cToF(SCALE_MIN).toFixed(0)} °F`}
        </span>
        <span>
          {unitSystem === 'metric' ? `${SCALE_MAX} °C` : `${cToF(SCALE_MAX).toFixed(0)} °F`}
        </span>
      </div>
      <p
        id="uncertainty-result"
        role="status"
        className="mt-3 text-sm leading-relaxed text-[var(--color-text)]"
      >
        If the true air temperature is{' '}
        <span className="numeric font-medium">{toDisplay(trueTemp, unitSystem)}</span>,
        our station may honestly report anything from{' '}
        <span className="numeric font-medium">{toDisplay(lo, unitSystem)}</span>{' '}
        to <span className="numeric font-medium">{toDisplay(hi, unitSystem)}</span>.
      </p>
      <p className="mt-2 text-xs leading-relaxed text-[var(--color-muted)]">
        Official DWD stations use ventilated, calibrated instruments on open
        ground at standard heights. Our courtyard has walls and roofs nearby,
        so small differences from Dresden’s official reading are expected —
        not errors.
      </p>
    </div>
  );
}
