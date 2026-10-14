'use client';

import { useState } from 'react';
import { conceptCards, type ConceptKind } from '@/lib/content/concepts';
import { activities } from '@/lib/content/activities';
// shadcn/ui primitives are added in a later prompt; for now render the Learn page with a thin local card shell.

function ConceptCardShell({ card }: { card: (typeof conceptCards)[number] }) {
  const [mode, setMode] = useState<ConceptKind>('students');

  return (
    <div>
      <div className="flex items-center gap-3 rounded-full border border-[var(--color-border)] px-3 py-1">
        <button
          className={`rounded-full px-3 py-1 text-xs uppercase tracking-widest transition-colors ${
            mode === 'kids'
              ? 'bg-[var(--accent)] text-[var(--color-background)]'
              : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
          }`}
          onClick={() => setMode('kids')}
        >
          Kids
        </button>
        <button
          className={`rounded-full px-3 py-1 text-xs uppercase tracking-widest transition-colors ${
            mode === 'students'
              ? 'bg-[var(--accent)] text-[var(--color-background)]'
              : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
          }`}
          onClick={() => setMode('students')}
        >
          Students
        </button>
      </div>
      <LocalCard className="mt-4 overflow-hidden">
        <LocalCardContent className="p-5 space-y-4">
          <div className="flex items-start gap-3">
            <span className="mt-1 rounded-full bg-[var(--color-surface)] p-2 text-[var(--color-muted)]">
              {card.icon}
            </span>
            <div>
              <h3 className="text-lg font-semibold uppercase tracking-wider text-[var(--color-text)]">
                {card.title}
              </h3>
              <p className={mode === 'kids' ? 'text-lg leading-relaxed text-[var(--color-text)]' : 'text-base leading-relaxed text-[var(--color-text)]'}>
                {mode === 'kids' ? card.kids : card.students}
              </p>
            </div>
          </div>
          <dl className="grid gap-2 text-sm text-[var(--color-muted)] sm:grid-cols-2">
            <div className="flex gap-2">
              <dt className="uppercase tracking-widest">Measured</dt>
              <dd>{card.measured}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="uppercase tracking-widest">Units</dt>
              <dd>{card.units}</dd>
            </div>
            <div className="flex gap-2 col-span-2">
              <dt className="uppercase tracking-widest">Typical Dresden values</dt>
              <dd>{card.typicalDresden}</dd>
            </div>
          </dl>
          <hr className="border-[var(--color-border)]" />
          <p className="font-medium text-[var(--color-text)]">Try this:</p>
          <p className="text-[var(--color-text)]">{card.tryThis}</p>
        </LocalCardContent>
      </LocalCard>
    </div>
  );
}

export default function LearnPage() {
  return (
    <main>
      <div className="mx-auto max-w-4xl px-4 pb-16 pt-10 sm:px-6 sm:pt-14">
        <h1 className="text-4xl font-light tracking-tight text-[var(--color-text)] sm:text-5xl">
          Learn
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-[var(--color-muted)]">
          Every measurement on the dashboard has a plain-language explanation, a “why it matters” line and a classroom question.
          Switch between Kids and Students to change the text and the size of the words.
        </p>          <div className="mt-10">
          <TabsList>
            <TabsTrigger value="cards">Concept cards</TabsTrigger>
            <TabsTrigger            value="activities">Activities</TabsTrigger>
          </TabsList>

          <div className="mt-8 space-y-10">
            {conceptCards.map((card) => (
              <ConceptCardShell key={card.id} card={card} />
            ))}
          </div>

          <div className="mt-8 space-y-8">
            {activities.map((activity) => (
              <LocalCard key={activity.id} className="overflow-hidden">
                <LocalCardContent className="p-5 space-y-4">
                  <h3 className="text-lg font-semibold uppercase tracking-wider text-[var(--color-text)]">
                    {activity.title}
                  </h3>
                  <dl className="grid gap-2 text-sm text-[var(--color-muted)] sm:grid-cols-3">
                    <div className="flex gap-2">
                      <dt className="uppercase tracking-widest">Ages</dt>
                      <dd>{activity.ages}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="uppercase tracking-widest">Time</dt>
                      <dd>{activity.time}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="uppercase tracking-widest">Materials</dt>
                      <dd className="flex flex-wrap gap-1">
                        {activity.materials.map((m) => (
                          <span key={m} className="rounded-full bg-[var(--color-surface)] px-2 text-xs">
                            {m}
                          </span>
                        ))}
                      </dd>
                    </div>
                  </dl>
                  <h4 className="font-medium text-[var(--color-text)]">Steps</h4>
                  <ol className="list-decimal list-inside space-y-1 text-[var(--color-text)]">
                    {activity.steps.map((step) => (
                      <li key={step} className="text-[var(--color-text)]">{step}</li>
                    ))}
                  </ol>
                  <hr className="border-[var(--color-border)]" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-[var(--color-text)]">Expected result</p>
                    <p className="text-[var(--color-text)]">{activity.expected}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-[var(--color-text)]">Extension</p>
                    <p className="text-[var(--color-text)]">{activity.extension}</p>
                  </div>
                </LocalCardContent>
              </LocalCard>
            ))}
          </div>
      </div>
    </main>
  );
}
