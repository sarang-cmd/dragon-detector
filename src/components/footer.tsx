import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { EffectsModeControl } from '@/components/effects/EffectsControls';
import { RoleSwitcher } from '@/components/onboarding/RoleSwitcher';
import { TourRestartButton } from '@/components/tour/TourRestartButton';

export function Footer() {
  // Server-rendered truth about the backend. DATA_SOURCE defaults to live
  // Open-Meteo model data; explicit `mock` is the simulator; `ecowitt` is
  // the real station link. Never claim a source we are not using.
  const dataSource = (process.env.DATA_SOURCE || 'openmeteo').toLowerCase();
  return (
    <footer className="mt-auto w-full border-t border-[var(--color-border)] bg-[var(--color-background)]">
      {/* 4px blue/amber/green strip echoing the school banner per docs/03a section 4 */}
      <div className="grid h-1 w-full grid-cols-3" aria-hidden="true">
        <div className="h-1 bg-[#00529E]" />
        <div className="h-1 bg-[#F6A800]" />
        <div className="h-1 bg-[#B3D236]" />
      </div>

      <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          {/* Left: Station info & club credits */}
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-x-2 text-sm font-medium text-[var(--color-text)]">
              <span>Sainlogic WS3500, Dresden</span>
              <span className="text-[var(--color-muted)]">&middot;</span>
              {dataSource === 'mock' ? (
                <span className="text-[var(--accent)]">Demo data: simulated readings</span>
              ) : dataSource === 'ecowitt' ? (
                <span className="text-[var(--color-muted)]">Source: Ecowitt Cloud API</span>
              ) : (
                <span className="text-[var(--color-muted)]">Source: Open-Meteo (area model)</span>
              )}
            </div>
            <p className="text-xs text-[var(--color-muted)]">
              Built by the DIS Weather Club
            </p>
          </div>

          {/* Right: Role switcher, 30 Years mark & Legal links */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <RoleSwitcher />
            {/* 30 Years logo as small mark */}
            <div className="flex items-center gap-2">
              <div className="flex h-8 items-center justify-center rounded-[8px] bg-white px-2 py-0.5 border border-neutral-200">
                <Image
                  src="/brand/dis-30-years-logo.jpg"
                  alt="Dresden International School - 30 Years (1996-2026)"
                  width={64}
                  height={26}
                  className="h-6 w-auto object-contain"
                />
              </div>
            </div>

            <nav aria-label="Footer Legal Links" className="flex items-center gap-2 text-xs">
              <TourRestartButton />
              <span className="text-[var(--color-border)]" aria-hidden="true">|</span>
              <Link
                href="/privacy"
                className="min-h-[44px] px-2 inline-flex items-center text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent)] rounded-[6px]"
              >
                Privacy
              </Link>
              <span className="text-[var(--color-border)]" aria-hidden="true">|</span>
              <Link
                href="/imprint"
                className="min-h-[44px] px-2 inline-flex items-center text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent)] rounded-[6px]"
              >
                Imprint
              </Link>
            </nav>
          </div>
        </div>

        <div className="mt-6 border-t border-[var(--color-border)] pt-4">
          <EffectsModeControl />
        </div>

        <div className="mt-6 border-t border-[var(--color-border)] pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[11px] text-[var(--color-muted)]">
          <p>&copy; {new Date().getFullYear()} Dresden International School &middot; Annenstraße 9, 01067 Dresden-Altstadt, Germany</p>
          <p className="numeric">51.0497&deg; N, 13.7284&deg; E &middot; Elevation 112 m</p>
        </div>
      </div>
    </footer>
  );
}
