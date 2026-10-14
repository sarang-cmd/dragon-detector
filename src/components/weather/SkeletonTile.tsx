'use client';

import * as React from 'react';

export interface SkeletonTileProps {
  className?: string;
  minHeightClass?: string;
}

/**
 * Skeleton placeholder that strictly matches final tile geometry to prevent layout shift.
 */
export function SkeletonTile({
  className = '',
  minHeightClass = 'min-h-[220px]',
}: SkeletonTileProps) {
  return (
    <div
      className={`instrument-tile p-5 sm:p-6 flex flex-col justify-between ${minHeightClass} ${className} animate-pulse motion-reduce:animate-none`}
      role="status"
      aria-label="Loading meteorological observations..."
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="h-3 w-24 bg-[var(--color-border)] rounded-[4px]" />
          <div className="h-4 w-4 bg-[var(--color-border)] rounded-full" />
        </div>
        <div className="h-10 w-32 bg-[var(--color-border)] rounded-[6px] my-3" />
        <div className="h-3 w-40 bg-[var(--color-border)] rounded-[4px]" />
      </div>
      <div className="pt-4 border-t border-[var(--color-border)] flex items-center justify-between">
        <div className="h-2 w-28 bg-[var(--color-border)] rounded-[2px]" />
        <div className="h-2 w-16 bg-[var(--color-border)] rounded-[2px]" />
      </div>
    </div>
  );
}

export function HeroSkeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`instrument-tile p-6 sm:p-8 flex flex-col justify-between min-h-[380px] lg:min-h-[460px] ${className} animate-pulse motion-reduce:animate-none`}
      role="status"
      aria-label="Loading hero observations..."
    >
      <div className="flex items-center justify-between">
        <div className="h-4 w-32 bg-[var(--color-border)] rounded-[4px]" />
        <div className="h-4 w-4 bg-[var(--color-border)] rounded-full" />
      </div>

      <div className="my-8">
        <div className="h-24 sm:h-32 w-56 bg-[var(--color-border)] rounded-[8px] mb-4" />
        <div className="h-4 w-36 bg-[var(--color-border)] rounded-[4px]" />
      </div>

      <div className="space-y-3 pt-6 border-t border-[var(--color-border)]">
        <div className="h-2 w-full bg-[var(--color-border)] rounded-full" />
        <div className="h-4 w-3/4 bg-[var(--color-border)] rounded-[4px]" />
        <div className="h-3 w-1/2 bg-[var(--color-border)] rounded-[4px]" />
      </div>
    </div>
  );
}
