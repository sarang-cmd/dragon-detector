import * as React from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { DataClient } from '@/components/data/data-client';

export const metadata = {
  title: 'Historical Data',
  description:
    'Historical meteorological measurements and sensor time-series recorded at Dresden International School.',
};

export default function DataPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-background)]">
      <Header />
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-8 flex flex-col gap-4">
          <span className="label">Archive &amp; Analytics</span>
          <h1 className="display text-[var(--color-text)]">Historical Data</h1>
          <p className="max-w-2xl text-base leading-relaxed text-[var(--color-muted)] sm:text-lg">
            Sensor time-series captured from our Dresden campus station for
            classroom research and student analysis. Measured on our school
            grounds.
          </p>
        </div>

        <React.Suspense
          fallback={
            <div aria-label="Loading history" aria-busy="true">
              <div className="h-[52px] animate-pulse rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)]" />
              <div className="mt-4 h-[320px] animate-pulse rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)]" />
            </div>
          }
        >
          <DataClient />
        </React.Suspense>
      </main>
      <Footer />
    </div>
  );
}
