'use client';

import * as React from 'react';
import Link from 'next/link';
import { HelpCircle } from 'lucide-react';
import { Tooltip } from '@/components/ui/tooltip';
import { ValueCrossfade } from './ValueCrossfade';

export interface MetricProps {
  label: string;
  conceptId?: string;
  conceptTitle?: string;
  value?: string | number;
  unit?: string;
  secondary?: React.ReactNode;
  isOffline?: boolean;
  minHeightClass?: string;
  className?: string;
  children?: React.ReactNode;
  sparkline?: React.ReactNode;
}

/**
 * Core reusable tile component for instrument readings per docs/03 and docs/04.
 * Features stable minimum height, learn button with tooltip, tabular-numeric display,
 * and offline state greying.
 */
export function Metric({
  label,
  conceptId,
  conceptTitle,
  value,
  unit,
  secondary,
  isOffline = false,
  minHeightClass = 'min-h-[190px]',
  className = '',
  children,
  sparkline,
}: MetricProps) {
  const hasValue = value != null;

  return (
    <div
      className={`instrument-tile flex flex-col justify-between p-5 sm:p-6 ${minHeightClass} ${className} ${
        isOffline ? 'opacity-70 grayscale-[30%]' : ''
      }`}
    >
      {/* Tile Header: Label & "What is this?" link */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="label select-none">{label}</span>
          {conceptId && (
            <Tooltip
              content={
                <span>
                  What is this? Learn about{' '}
                  <span className="font-medium text-[var(--accent)]">
                    {conceptTitle ?? label}
                  </span>
                </span>
              }
              side="left"
            >
              <Link
                href={`/learn#${conceptId}`}
                aria-label={`What is ${label}? Learn more in our student guide`}
                className="inline-flex h-7 w-7 min-h-[44px] min-w-[44px] sm:min-h-[28px] sm:min-w-[28px] items-center justify-center rounded-[6px] text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
              >
                <HelpCircle className="h-4 w-4 stroke-[1.5]" />
              </Link>
            </Tooltip>
          )}
        </div>

        {/* Primary Value Display (if provided) */}
        {hasValue && (
          <div className="flex items-baseline gap-1.5 mt-1">
            <ValueCrossfade
              value={value}
              className="text-3xl sm:text-4xl font-light tracking-tight text-[var(--color-text)]"
            />
            {unit && (
              <span className="text-sm sm:text-base text-[var(--color-muted)] select-none">
                {unit}
              </span>
            )}
          </div>
        )}

        {/* Secondary description or reading */}
        {secondary && (
          <div className="mt-2 text-xs text-[var(--color-muted)] leading-relaxed">
            {secondary}
          </div>
        )}
      </div>

      {/* Custom Body / Visual Component */}
      {children && <div className="mt-4 flex-1">{children}</div>}

      {/* Sparkline Slot at Bottom */}
      {sparkline && <div className="mt-4 pt-3 border-t border-[var(--color-border)]">{sparkline}</div>}
    </div>
  );
}
