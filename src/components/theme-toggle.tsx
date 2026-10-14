'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        type="button"
        className={`h-11 w-11 min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] transition-colors ${className ?? ''}`}
        aria-label="Toggle theme"
        disabled
      >
        <span className="h-4 w-4" />
      </button>
    );
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={`h-11 w-11 min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-text)] active:bg-[var(--color-border)] transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-2 ${className ?? ''}`}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {isDark ? (
        <Sun className="h-4 w-4" strokeWidth={1.5} />
      ) : (
        <Moon className="h-4 w-4" strokeWidth={1.5} />
      )}
    </button>
  );
}
