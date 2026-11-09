import * as React from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { StatsClient } from '@/components/stats/StatsClient';

export const metadata = {
  title: 'Statistics',
  description:
    'Records, daily summaries, rainfall totals, wind distribution and project numbers from the DIS weather station archive.',
};

export default function StatsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-background)]">
      <Header />
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-8 flex flex-col gap-4">
          <span className="label">Records &amp; Analytics</span>
          <h1 className="display text-[var(--color-text)]">Statistics</h1>
          <p className="max-w-2xl text-base leading-relaxed text-[var(--color-muted)] sm:text-lg">
            Everything the station has measured, counted up: records with the
            moment they were set, a day-by-day table, rainfall totals, the wind
            rose and the streaks in between — plus the numbers behind this
            website itself.
          </p>
        </div>

        <React.Suspense
          fallback={
            <div aria-label="Loading statistics" aria-busy="true" className="space-y-4">
              <div className="h-[92px] animate-pulse rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)]" />
              <div className="h-[260px] animate-pulse rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)]" />
            </div>
          }
        >
          <StatsClient />
        </React.Suspense>
      </main>
      <Footer />
    </div>
  );
}
