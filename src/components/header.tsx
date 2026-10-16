'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { UnitToggle } from '@/components/unit-toggle';
import { EffectsCycleButton } from '@/components/effects/EffectsControls';
import { AuthButton } from '@/components/auth/AuthButton';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

interface NavItem {
  href: string;
  label: string;
}

const navItems: NavItem[] = [
  { href: '/', label: 'Live' },
  { href: '/data', label: 'Data' },
  { href: '/learn', label: 'Learn' },
  { href: '/station', label: 'Station' },
];

export function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--color-border)] bg-[var(--color-background)]">
      {/* Solid background (no opacity modifier): Tailwind cannot apply /opacity
          to a var() color, which left the sticky header transparent and page
          content scrolling visibly through it. */}
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4 sm:px-6">
        {/* Left: Brand Logo & Title */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-3 transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-[var(--accent)] rounded-[8px]"
            aria-label="DIS Weather Station Home"
          >
            {/* Dragon logo: square JPEG cropped to a circle via rounded-full + object-cover. */}
            <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-[var(--color-border)]">
              <Image
                src="/dragon_detector_logo.rounded.png"
                alt="DIS Weather Station dragon logo"
                width={32}
                height={32}
                priority
                className="h-8 w-8 object-cover"
              />
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text)]">
                Weather Station
              </span>
              <span className="label text-[10px]">
                Dresden
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav
            aria-label="Main Navigation"
            className="hidden md:flex items-center gap-1 lg:gap-2 ml-4"
          >
            {navItems.map((item) => {
              const isActive =
                item.href === '/'
                  ? pathname === '/'
                  : pathname?.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative min-h-[44px] px-3 inline-flex items-center text-sm font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-[var(--accent)] rounded-[8px] ${
                    isActive
                      ? 'text-[var(--color-text)]'
                      : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {item.label}
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute bottom-1.5 left-3 right-3 h-[2px] bg-[var(--accent)] rounded-full"
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: Controls & Mobile Trigger */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:flex items-center gap-2">
            <UnitToggle />
            <EffectsCycleButton />
            <ThemeToggle />
            <AuthButton />
          </div>

          <div className="flex sm:hidden items-center">
            <EffectsCycleButton />
            <ThemeToggle />
          </div>

          {/* Mobile Navigation Sheet */}
          <div className="md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className="inline-flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:border-[var(--color-text)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
                  aria-label="Open navigation menu"
                >
                  <Menu className="h-5 w-5" strokeWidth={1.5} />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="flex flex-col justify-between w-80 max-w-[85vw]">
                <div>
                  <SheetHeader className="mb-6 text-left">
                    <SheetTitle>
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-neutral-200">
                          <Image
                            src="/dragon_detector_logo.rounded.png"
                            alt="DIS Weather Station dragon logo"
                            width={32}
                            height={32}
                            className="h-8 w-8 object-cover"
                          />
                        </div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text)]">
                          Weather
                        </span>
                      </div>
                    </SheetTitle>
                  </SheetHeader>

                  <nav className="flex flex-col gap-1" aria-label="Mobile Navigation">
                    {navItems.map((item) => {
                      const isActive =
                        item.href === '/'
                          ? pathname === '/'
                          : pathname?.startsWith(item.href);

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex min-h-[44px] items-center justify-between rounded-[8px] px-3 text-base transition-colors duration-150 ${
                            isActive
                              ? 'bg-[var(--color-border)] text-[var(--color-text)] font-semibold'
                              : 'text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)]'
                          }`}
                          aria-current={isActive ? 'page' : undefined}
                        >
                          <span>{item.label}</span>
                          {isActive && (
                            <span
                              className="h-2 w-2 rounded-full bg-[var(--accent)]"
                              aria-hidden="true"
                            />
                          )}
                        </Link>
                      );
                    })}
                  </nav>
                </div>

                {/* Mobile Drawer Footer: Unit selector */}
                <div className="border-t border-[var(--color-border)] pt-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="label">Unit System</span>
                    <UnitToggle />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="label">Weather effects</span>
                    <EffectsCycleButton />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="label">Account</span>
                    <AuthButton />
                  </div>
                  <div className="text-[11px] text-[var(--color-muted)]">
                    Sainlogic WS3500 &middot; Dresden
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
