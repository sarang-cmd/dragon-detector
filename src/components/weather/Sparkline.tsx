'use client';

import * as React from 'react';

export interface SparklineProps {
  data: number[];
  height?: number;
  label?: string;
  unit?: string;
  className?: string;
}

/**
 * 24-hour inline SVG sparkline per docs/03 and docs/04.
 * Uses strict 1.5px stroke in var(--accent), no decorative area fills or gradients.
 * Includes accessible aria-label with min and max metrics.
 */
export function Sparkline({
  data,
  height = 32,
  label = '24-hour trend',
  unit = '',
  className = '',
}: SparklineProps) {
  if (!data || data.length < 2) {
    return null;
  }

  const validValues = data.filter((v) => !Number.isNaN(v));
  if (validValues.length < 2) return null;

  const min = Math.min(...validValues);
  const max = Math.max(...validValues);
  const range = max - min || 1;

  const width = 200;
  const paddingY = 4;
  const usableHeight = height - paddingY * 2;

  const points = validValues.map((val, idx) => {
    const x = (idx / (validValues.length - 1)) * width;
    // Invert y because SVG 0 is top
    const y = height - paddingY - ((val - min) / range) * usableHeight;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const pathD = `M ${points.join(' L ')}`;

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between text-[11px] text-[var(--color-muted)] mb-1">
        <span className="uppercase tracking-wider text-[10px] select-none">24h Trend</span>
        <span className="numeric text-[10px]">
          {min.toFixed(1)}–{max.toFixed(1)} {unit}
        </span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full overflow-visible"
        style={{ height: `${height}px` }}
        role="img"
        aria-label={`${label}: minimum ${min.toFixed(1)} ${unit}, maximum ${max.toFixed(1)} ${unit} over 24 hours.`}
      >
        {/* Subtle baseline */}
        <line
          x1="0"
          y1={height - paddingY}
          x2={width}
          y2={height - paddingY}
          stroke="var(--color-border)"
          strokeWidth="1"
          strokeDasharray="2 2"
        />
        {/* Metric trend line */}
        <path
          d={pathD}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
