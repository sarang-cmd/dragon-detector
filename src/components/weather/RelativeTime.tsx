'use client';

import * as React from 'react';

/** English elapsed formatting shared with tests: "just now", "40 s ago", "2 min ago", "1 h 5 min ago". */
export function formatElapsed(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  if (s < 5) return 'just now';
  if (s < 60) return `${s} s ago`;
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return m > 0 ? `${h} h ${m} min ago` : `${h} h ago`;
}

export interface RelativeTimeProps {
  /** Seconds since the measurement (already ticking from useWeather). */
  seconds: number;
  /** Prefix before the elapsed text, defaults to "measured". */
  prefix?: string;
  className?: string;
}

export function RelativeTime({
  seconds,
  prefix = 'measured',
  className = '',
}: RelativeTimeProps) {
  return (
    <span className={className}>
      {prefix}{' '}
      <span className="numeric">{formatElapsed(seconds)}</span>
    </span>
  );
}
