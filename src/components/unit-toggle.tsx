'use client';

import * as React from 'react';
import { useUnitSystem } from '@/context/unit-context';

export function UnitToggle({ className }: { className?: string }) {
  const { unitSystem, setUnitSystem } = useUnitSystem();

  return (
    <div
      role="group"
      aria-label="Unit system selector"
      className={`inline-flex h-11 min-h-[44px] items-center rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] p-1 select-none ${className ?? ''}`}
    >
      <button
        type="button"
        role="radio"
        aria-checked={unitSystem === 'metric'}
        aria-label="Set units to Metric (Celsius, km/h, mm, hPa)"
        onClick={() => setUnitSystem('metric')}
        className={`h-full min-w-[44px] px-3 inline-flex items-center justify-center rounded-[8px] text-xs uppercase tracking-wider transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-[var(--accent)] ${
          unitSystem === 'metric'
            ? 'bg-[var(--color-border)] text-[var(--color-text)] font-medium'
            : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
        }`}
      >
        Metric
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={unitSystem === 'imperial'}
        aria-label="Set units to Imperial (Fahrenheit, mph, in, inHg)"
        onClick={() => setUnitSystem('imperial')}
        className={`h-full min-w-[44px] px-3 inline-flex items-center justify-center rounded-[8px] text-xs uppercase tracking-wider transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-[var(--accent)] ${
          unitSystem === 'imperial'
            ? 'bg-[var(--color-border)] text-[var(--color-text)] font-medium'
            : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
        }`}
      >
        Imperial
      </button>
    </div>
  );
}
