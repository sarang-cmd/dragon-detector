'use client';

import * as React from 'react';

export type LiveStatus = 'live' | 'delayed' | 'offline';

export interface LiveDotProps {
  status: LiveStatus;
  seconds?: number;
  label?: string;
  className?: string;
}

const statusConfig: Record<LiveStatus, { label: string; dotClass: string; textClass: string }> = {
  live: {
    label: 'Live',
    dotClass: 'bg-[#B3D236]',
    textClass: 'text-[var(--color-text)]',
  },
  delayed: {
    label: 'Delayed',
    dotClass: 'bg-[var(--accent)]',
    textClass: 'text-[var(--color-muted)]',
  },
  offline: {
    label: 'Offline',
    dotClass: 'bg-[var(--color-muted)]',
    textClass: 'text-[var(--color-muted)]',
  },
};

export function LiveDot({ status, seconds, label, className = '' }: LiveDotProps) {
  const cfg = statusConfig[status];
  const displayLabel = label ?? cfg.label;

  return (
    <div className={`inline-flex items-center gap-2 ${className}`} role="status">
      <span className="relative flex h-2.5 w-2.5 items-center justify-center">
        {status === 'live' && (
          <span
            className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#B3D236] opacity-75 motion-reduce:hidden"
            aria-hidden="true"
          />
        )}
        <span
          className={`relative inline-block h-2 w-2 rounded-full ${cfg.dotClass}`}
          aria-hidden="true"
        />
      </span>
      <span className={`label text-[11px] ${cfg.textClass}`}>
        {displayLabel}
      </span>
      {seconds != null && status !== 'offline' && (
        <span className="numeric text-xs text-[var(--color-muted)]">
          {seconds < 60
            ? `${seconds}s ago`
            : `${Math.floor(seconds / 60)}m ago`}
        </span>
      )}
    </div>
  );
}
