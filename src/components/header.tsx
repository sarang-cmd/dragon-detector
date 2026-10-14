'use client';

import Link from 'next/link';
import { useTheme } from 'next-themes';
import { usePathname } from 'next/navigation';
import { Sun, Moon, Droplets, ChevronDown } from 'lucide-react';

const nav = [
  { href: '/', label: 'Live' },
  { href: '/data', label: 'Data' },
  { href: '/learn', label: 'Learn' },
  { href: '/station', label: 'Station' },
];

export function Header() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  return (
    <header className="border-b border-[var(--color-border)]">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center">
          <div className="flex h-8 w-28 items-center justify-center rounded-full bg-white shadow-sm">
            <span className="text-lg font-bold uppercase tracking-tight" style={{ color: 'var(--color-text)' }}>
              dis
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={
                "text-sm uppercase tracking-widest transition-colors " +
                (pathname === item.href
                  ? 'text-[var(--color-text)]'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-text)]')
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <button
            className="rounded-full border border-[var(--color-border)] px-3 py-1 text-xs uppercase tracking-widest transition-colors hover:border-[var(--color-text)]"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            <span className="ml-2">{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>

          <UnitToggle />
        </div>
      </div>
    </header>
  );
}

function UnitToggle() {
  // placeholder: unit toggle implementation lives in a later session.
  return null;
}
