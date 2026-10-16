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
  const dataSource = (process.env.DATA_SOURCE || 'openmeteo').toLowerCase();
  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-background)]">
      <Header />
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-8 flex flex-col gap-4">
          <span className="label">Archive &amp; Analytics</span>
          <h1 className="display text-[var(--color-text)]">Historical Data</h1>
          <p className="max-w-2xl text-base leading-relaxed text-[var(--color-muted)] sm:text-lg">
            {dataSource === 'ecowitt' ? (
              <>
                Sensor time-series captured from our Dresden campus station for
                classroom research and student analysis. Measured on our school
                grounds.
              </>
            ) : dataSource === 'mock' ? (
              <>Simulated sensor time-series for development and classroom demos. Switch to live data when the station link is configured.</>
            ) : (
              <>
                Model time-series for our Dresden campus area for classroom
                research and student analysis. Sourced from Open-Meteo; our own
                recorded history accumulates on top.
              </>
            )}
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
