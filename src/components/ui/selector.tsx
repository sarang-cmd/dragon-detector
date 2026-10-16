'use client';

import * as React from 'react';
import { Check, ChevronDown } from 'lucide-react';

export interface SelectorOption<T extends string> {
  value: T;
  label: string;
}

export interface SelectorProps<T extends string> {
  id?: string;
  label: string;
  value: T;
  options: SelectorOption<T>[];
  onChange: (value: T) => void;
  className?: string;
}

/**
 * Custom listbox replacing native `<select>` elements.
 * Pill button + popover, 12px radius, accent focus ring — visually consistent
 * with UnitToggle. Full keyboard support: Enter/Space opens, arrows move,
 * Home/End jump, Esc closes and refocuses, Tab closes.
 */
export function Selector<T extends string>({
  id,
  label,
  value,
  options,
  onChange,
  className = '',
}: SelectorProps<T>) {
  const [open, setOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(() =>
    Math.max(
      0,
      options.findIndex((o) => o.value === value)
    )
  );
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  const listId = React.useId();

  const selectedLabel =
    options.find((o) => o.value === value)?.label ?? value;

  const close = React.useCallback(() => setOpen(false), []);

  // Close on outside click / Escape anywhere; keep Tab behaviour native.
  React.useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const root = listRef.current?.parentElement;
      if (root && !root.contains(e.target as Node)) close();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        close();
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, close]);

  // Keep the active option aligned with the current value when opening.
  React.useEffect(() => {
    if (open) {
      setActiveIndex(Math.max(0, options.findIndex((o) => o.value === value)));
    }
  }, [open, options, value]);

  const choose = (next: T) => {
    onChange(next);
    close();
    buttonRef.current?.focus();
  };

  const onButtonKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setOpen(true);
    }
  };

  const onListKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % options.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + options.length) % options.length);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActiveIndex(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setActiveIndex(options.length - 1);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      choose(options[activeIndex].value);
    }
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        ref={buttonRef}
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onButtonKeyDown}
        className="inline-flex min-h-[44px] items-center gap-2 rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] transition-colors duration-150 hover:border-[var(--color-text)] focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
      >
        <span className="numeric">{selectedLabel}</span>
        <ChevronDown
          aria-hidden="true"
          className={`h-4 w-4 stroke-[1.5] text-[var(--color-muted)] transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label={label}
          tabIndex={-1}
          onKeyDown={onListKeyDown}
          className="absolute z-50 mt-2 min-w-full overflow-hidden rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] p-1 shadow-none"
        >
          {options.map((option, i) => {
            const selected = option.value === value;
            const active = i === activeIndex;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => choose(option.value)}
                onMouseEnter={() => setActiveIndex(i)}
                className={`flex min-h-[44px] w-full items-center justify-between gap-3 whitespace-nowrap rounded-[8px] px-3 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent)] ${
                  active
                    ? 'bg-[var(--color-border)] text-[var(--color-text)]'
                    : selected
                      ? 'text-[var(--color-text)]'
                      : 'text-[var(--color-muted)]'
                }`}
              >
                <span>{option.label}</span>
                {selected && (
                  <Check
                    aria-hidden="true"
                    className="h-4 w-4 shrink-0 stroke-[1.5] text-[var(--accent)]"
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
