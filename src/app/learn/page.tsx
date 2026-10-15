'use client';

import { useState } from 'react';
import { conceptCards, type ConceptKind } from '@/lib/content/concepts';
import { activities } from '@/lib/content/activities';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Card, CardContent } from '@/components/ui/card';

type Tab = 'cards' | 'activities';

function ConceptCardShell({ card }: { card: (typeof conceptCards)[number] }) {
  const [mode, setMode] = useState<ConceptKind>('students');

  return (
    <Card
      id={card.id}
      className="overflow-hidden scroll-mt-28"
    >
      <CardContent className="p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--color-border)] pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-[8px] border border-[var(--color-border)] bg-[var(--color-background)] text-lg">
              {card.icon}
            </span>
            <div>
              <span className="label">Measurement Concept</span>
              <h3 className="text-xl font-medium text-[var(--color-text)]">
                {card.title}
              </h3>
            </div>
          </div>

          <div
            role="group"
            aria-label="Reading audience level"
            className="inline-flex h-9 items-center rounded-[8px] border border-[var(--color-border)] bg-[var(--color-background)] p-1 text-xs select-none self-start sm:self-auto"
          >
            <button
              type="button"
              className={`h-full min-w-[44px] px-3 inline-flex items-center justify-center rounded-[6px] text-xs uppercase tracking-wider transition-colors duration-150 ${
                mode === 'kids'
                  ? 'bg-[var(--color-border)] text-[var(--color-text)] font-semibold'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
              }`}
              onClick={() => setMode('kids')}
            >
              Kids
            </button>
            <button
              type="button"
              className={`h-full min-w-[44px] px-3 inline-flex items-center justify-center rounded-[6px] text-xs uppercase tracking-wider transition-colors duration-150 ${
                mode === 'students'
                  ? 'bg-[var(--color-border)] text-[var(--color-text)] font-semibold'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
              }`}
              onClick={() => setMode('students')}
            >
              Students
            </button>
          </div>
        </div>

        <p className="text-base sm:text-lg leading-relaxed text-[var(--color-text)]">
          {mode === 'kids' ? card.kids : card.students}
        </p>

        <dl className="grid gap-3 text-xs text-[var(--color-muted)] sm:grid-cols-2 rounded-[8px] border border-[var(--color-border)] bg-[var(--color-background)] p-4">
          <div>
            <dt className="label text-[10px]">What is measured</dt>
            <dd className="mt-1 text-[var(--color-text)]">{card.measured}</dd>
          </div>
          <div>
            <dt className="label text-[10px]">Standard Units</dt>
            <dd className="mt-1 text-[var(--color-text)]">{card.units}</dd>
          </div>
          <div className="sm:col-span-2 border-t border-[var(--color-border)] pt-2">
            <dt className="label text-[10px]">Typical Dresden climate</dt>
            <dd className="mt-1 text-[var(--color-text)]">{card.typicalDresden}</dd>
          </div>
        </dl>

        <div className="border-t border-[var(--color-border)] pt-3">
          <span className="label text-[var(--accent)] font-semibold">Classroom question:</span>
          <p className="mt-1 text-sm text-[var(--color-text)]">{card.tryThis}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ActivityCard({ activity }: { activity: (typeof activities)[number] }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[var(--color-border)] pb-4">
          <div>
            <span className="label">Science Activity</span>
            <h3 className="text-xl font-medium text-[var(--color-text)]">
              {activity.title}
            </h3>
          </div>
        </div>

        <dl className="grid gap-2 text-xs text-[var(--color-muted)] sm:grid-cols-3 rounded-[8px] border border-[var(--color-border)] bg-[var(--color-background)] p-3">
          <div>
            <dt className="label text-[10px]">Target Grades</dt>
            <dd className="mt-0.5 text-[var(--color-text)]">{activity.ages}</dd>
          </div>
          <div>
            <dt className="label text-[10px]">Estimated Time</dt>
            <dd className="mt-0.5 text-[var(--color-text)]">{activity.time}</dd>
          </div>
          <div>
            <dt className="label text-[10px]">Required Materials</dt>
            <dd className="mt-0.5 text-[var(--color-text)]">{activity.materials.join(', ')}</dd>
          </div>
        </dl>

        <div className="space-y-2">
          <span className="label">Investigation Steps</span>
          <ol className="list-decimal list-inside space-y-1.5 text-sm text-[var(--color-text)]">
            {activity.steps.map((step, idx) => (
              <li key={idx} className="leading-relaxed">{step}</li>
            ))}
          </ol>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 border-t border-[var(--color-border)] pt-3 text-xs">
          <div>
            <span className="label text-[10px]">Expected scientific result</span>
            <p className="mt-1 text-[var(--color-text)] leading-relaxed">{activity.expected}</p>
          </div>
          <div>
            <span className="label text-[10px]">Suggested extension</span>
            <p className="mt-1 text-[var(--color-text)] leading-relaxed">{activity.extension}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function LearnPage() {
  const [tab, setTab] = useState<Tab>('cards');

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-background)]">
      <Header />
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <div className="flex flex-col gap-4 mb-10">
          <span className="label">Educational Resources</span>
          <h1 className="display text-[var(--color-text)]">
            Learn Weather
          </h1>
          <p className="max-w-2xl text-base sm:text-lg leading-relaxed text-[var(--color-muted)]">
            Plain-language explanations, classroom investigations, and science activities designed for students studying meteorology at DIS.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 border-b border-[var(--color-border)] pb-4 mb-8">
          <button
            type="button"
            className={`min-h-[44px] px-4 inline-flex items-center justify-center rounded-[8px] text-xs uppercase tracking-wider transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-[var(--accent)] ${
              tab === 'cards'
                ? 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] font-semibold'
                : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
            }`}
            onClick={() => setTab('cards')}
          >
            Concept Cards ({conceptCards.length})
          </button>
          <button
            type="button"
            className={`min-h-[44px] px-4 inline-flex items-center justify-center rounded-[8px] text-xs uppercase tracking-wider transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-[var(--accent)] ${
              tab === 'activities'
                ? 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] font-semibold'
                : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
            }`}
            onClick={() => setTab('activities')}
          >
            Classroom Activities ({activities.length})
          </button>
        </div>

        {tab === 'cards' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {conceptCards.map((card) => (
              <ConceptCardShell key={card.id} card={card} />
            ))}
          </div>
        )}

        {tab === 'activities' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activities.map((activity) => (
              <ActivityCard key={activity.id} activity={activity} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
