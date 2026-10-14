'use client';

import * as React from 'react';
import Link from 'next/link';
import { BookOpen, Tv } from 'lucide-react';

/**
 * Editorial link strip per docs/03 and docs/04.
 * Connects the live dashboard with curriculum educational materials (/learn)
 * and fullscreen lobby kiosk mode (/display).
 */
export function LearnHintStrip({ className = '' }: { className?: string }) {
  return (
    <div
      className={`instrument-tile p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-8 ${className}`}
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="label text-[var(--accent)] select-none">
            Learning &amp; Campus Displays
          </span>
        </div>
        <p className="text-sm text-[var(--color-text)]">
          New to weather data? Explore how each sensor works or view the fullscreen campus display.
        </p>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <Link
          href="/learn"
          className="inline-flex h-9 min-h-[44px] sm:min-h-[36px] items-center gap-2 rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-xs font-medium text-[var(--color-text)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
        >
          <BookOpen className="h-3.5 w-3.5 stroke-[1.5]" />
          <span>Student Guide</span>
        </Link>
        <Link
          href="/display"
          className="inline-flex h-9 min-h-[44px] sm:min-h-[36px] items-center gap-2 rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-xs font-medium text-[var(--color-text)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
        >
          <Tv className="h-3.5 w-3.5 stroke-[1.5]" />
          <span>Lobby Display</span>
        </Link>
      </div>
    </div>
  );
}
