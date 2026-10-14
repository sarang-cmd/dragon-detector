'use client';

import * as React from 'react';
import { formatElapsed } from './RelativeTime';

export interface StaleBannerProps {
  isStale: boolean;
  isOffline: boolean;
  seconds: number;
  className?: string;
}

/**
 * Appears when data drifts past the stale/offline thresholds.
 * Rendered inside a grid-rows transition wrapper so the reserved
 * row grows smoothly: the page does not jump when it appears
 * (and the transition is disabled for reduced motion).
 */
export function StaleBanner({
  isStale,
  isOffline,
  seconds,
  className = '',
}: StaleBannerProps) {
  const visible = isStale || isOffline;

  const message = isOffline
    ? `Data last measured ${formatElapsed(seconds)}. The station has not reported in a while; it may be reconnecting.`
    : `Data last measured ${formatElapsed(seconds)}. The station may be reconnecting.`;

  return (
    <div
      className={`grid transition-[grid-template-rows] duration-200 motion-reduce:transition-none ${className}`}
      style={{ gridTemplateRows: visible ? '1fr' : '0fr' }}
      aria-hidden={!visible}
    >
      <div className="min-h-0 overflow-hidden">
        {visible && (
          <div
            role="status"
            aria-live="polite"
            className="mt-4 flex items-start gap-3 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3"
          >
            <span
              className={`mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full ${
                isOffline ? 'bg-[var(--color-muted)]' : 'bg-[var(--accent)]'
              }`}
              aria-hidden="true"
            />
            <p className="m-0 text-sm leading-relaxed text-[var(--color-muted)]">
              {message}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
