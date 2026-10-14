'use client';

import * as React from 'react';

interface ValueCrossfadeProps {
  value: string | number;
  className?: string;
}

/**
 * Crossfades smoothly over 300ms when the displayed value changes,
 * maintaining tabular numbers alignment and respecting prefers-reduced-motion.
 */
export function ValueCrossfade({ value, className = '' }: ValueCrossfadeProps) {
  const [displayValue, setDisplayValue] = React.useState(value);
  const [isTransitioning, setIsTransitioning] = React.useState(false);

  React.useEffect(() => {
    if (value !== displayValue) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setDisplayValue(value);
        setIsTransitioning(false);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [value, displayValue]);

  return (
    <span
      className={`numeric inline-block transition-opacity duration-300 motion-reduce:transition-none ${
        isTransitioning ? 'opacity-20' : 'opacity-100'
      } ${className}`}
    >
      {displayValue}
    </span>
  );
}
