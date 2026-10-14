'use client';

import * as React from 'react';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  className?: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
}

/**
 * Lightweight, accessible tooltip adhering to WCAG 2.2 and anti-AI design rules.
 * No external runtime dependencies; responds to hover and keyboard focus.
 */
export function Tooltip({
  content,
  children,
  className = '',
  side = 'top',
}: TooltipProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const id = React.useId();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const sideClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }[side];

  const trigger = React.cloneElement(children, {
    'aria-describedby': isOpen ? id : undefined,
    onMouseEnter: () => setIsOpen(true),
    onMouseLeave: () => setIsOpen(false),
    onFocus: () => setIsOpen(true),
    onBlur: () => setIsOpen(false),
    onKeyDown: handleKeyDown,
  });

  return (
    <div className="relative inline-flex items-center">
      {trigger}
      {isOpen && (
        <div
          id={id}
          role="tooltip"
          className={`absolute z-50 whitespace-nowrap rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-xs font-normal text-[var(--color-text)] shadow-none pointer-events-none transition-opacity duration-150 ${sideClasses} ${className}`}
        >
          {content}
        </div>
      )}
    </div>
  );
}
