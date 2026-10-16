'use client';

import * as React from 'react';
import Link from 'next/link';
import { Check, ChevronRight, Printer } from 'lucide-react';
import { concepts } from '@/lib/content/concepts';
import {
  activities,
  AGE_BAND_LABELS,
  type AgeBand,
  type Activity,
} from '@/lib/content/activities';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Selector } from '@/components/ui/selector';
import { TeacherPanel } from '@/components/learn/TeacherPanel';
import { CONCEPT_ICONS_MAP } from '@/components/learn/ExplainerCard';
import { LearningTrack } from '@/components/learn/LearningTrack';
import { useRole, ROLE_LABELS } from '@/context/role-context';
import { useTrackProgress } from '@/hooks/useTrackProgress';

function ActivitySheet({ activity }: { activity: Activity }) {
  return (
    <Card className="activity-sheet overflow-hidden">
      <CardContent className="space-y-5 p-6">
        <div className="border-b border-[var(--color-border)] pb-4">
          <span className="label">Science activity</span>
          <h3 className="mt-1 text-xl font-medium text-[var(--color-text)]">
            {activity.title}
          </h3>
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            {activity.ageLabel} · {activity.minutes} min ·{' '}
            {activity.curriculum.programme}
          </p>
        </div>

        <div>
          <span className="label text-[10px]">Materials</span>
          <p className="mt-1 text-sm text-[var(--color-text)]">
            {activity.materials.join(' · ')}
          </p>
        </div>

        <div className="space-y-2">
          <span className="label text-[10px]">Steps</span>
          <ol className="list-decimal list-outside space-y-1.5 pl-5 text-sm leading-relaxed text-[var(--color-text)]">
            {activity.steps.map((step, idx) => (
              <li key={idx}>{step}</li>
            ))}
          </ol>
        </div>

        <div className="grid gap-3 border-t border-[var(--color-border)] pt-3 text-xs sm:grid-cols-2">
          <div>
            <span className="label text-[10px]">Expected result</span>
            <p className="mt-1 leading-relaxed text-[var(--color-text)]">
              {activity.expectedResult}
            </p>
          </div>
          <div>
            <span className="label text-[10px]">Extension</span>
            <p className="mt-1 leading-relaxed text-[var(--color-text)]">
              {activity.extension}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function LearnPage() {
  const [ageBand, setAgeBand] = React.useState<'all' | AgeBand>('all');
  const { role, readingLevel, showTeachingContent } = useRole();
  const { completedLessons, xp, loading, cloud } = useTrackProgress();

  const audience = readingLevel;

  const filtered = React.useMemo(
    () =>
      activities.filter(
        (a) => ageBand === 'all' || a.ageBand === ageBand
      ),
    [ageBand]
  );

  return (
    <div
      className={`flex min-h-screen flex-col bg-[var(--color-background)] ${audience === 'kids' ? 'audience-kids' : ''}`}
    >
      <div className="print:hidden">
        <Header />
      </div>
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-10 flex flex-col gap-4">
          <span className="label">Educational resources</span>
          <h1 className="display text-[var(--color-text)]">Learn weather</h1>
          <p className="max-w-2xl text-base leading-relaxed text-[var(--color-muted)] sm:text-lg">
            Follow the path, tap any lesson, earn XP
            {showTeachingContent
              ? ' — plus classroom investigations and a handout for teachers, all from our own school station in Dresden.'
              : ' — all from our own school station in Dresden.'}
            {role && (
              <span className="mt-1 block text-sm">
                Viewing as {ROLE_LABELS[role]}. Change this in the footer.
              </span>
            )}
          </p>
        </div>

        {/* Duolingo-style path */}
        <section aria-labelledby="track-heading">
          <div className="mb-4">
            <span className="label print:hidden">Learning track</span>
            <h2
              id="track-heading"
              className="mt-1 text-2xl font-medium tracking-tight text-[var(--color-text)]"
            >
              Your path
            </h2>
          </div>
          <LearningTrack
            completedLessons={completedLessons}
            xp={xp}
            loading={loading}
            cloud={cloud}
          />
        </section>

        {/* Every measurement is a lesson — fully clickable list */}
        <section aria-labelledby="lessons-heading" className="mt-16 print:hidden">
          <div className="mb-4">
            <span className="label">All lessons</span>
            <h2
              id="lessons-heading"
              className="mt-1 text-2xl font-medium tracking-tight text-[var(--color-text)]"
            >
              Lessons
            </h2>
          </div>
          <ol className="divide-y divide-[var(--color-border)] overflow-hidden rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)]">
            {concepts.map((concept) => {
              const Icon = CONCEPT_ICONS_MAP[concept.icon];
              const done = completedLessons.includes(concept.id);
              const text =
                audience === 'kids' ? concept.kids.summary : concept.students.summary;
              return (
                <li key={concept.id}>
                  <Link
                    id={concept.id}
                    href={`/learn/track/${concept.id}`}
                    aria-label={`${concept.title} lesson${done ? ' (completed)' : ''}`}
                      className="group flex min-h-[44px] items-center gap-4 px-4 py-4 transition-colors hover:bg-[var(--color-background)] focus-visible:outline-2 focus-visible:outline-[var(--accent)] sm:px-5"
                    >
                      <span
                        aria-hidden="true"
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] border border-[var(--color-border)] bg-[var(--color-background)]"
                      >
                        <Icon className="h-5 w-5 stroke-[1.5] text-[var(--color-text)]" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2 text-sm font-medium text-[var(--color-text)] sm:text-base">
                          {concept.title}
                          {done && (
                            <Check aria-hidden="true" className="h-4 w-4 shrink-0 text-[var(--accent)]" />
                          )}
                        </span>
                        <span className="learn-body mt-0.5 block truncate text-xs text-[var(--color-muted)] sm:text-sm">
                          {text}
                        </span>
                      </span>
                      <ChevronRight
                        aria-hidden="true"
                        className="h-5 w-5 shrink-0 text-[var(--color-muted)] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--color-text)]"
                      />
                    </Link>
                </li>
              );
            })}
          </ol>
        </section>

        <section aria-labelledby="activities-heading" className="mt-16">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="label print:hidden">Classroom activities</span>
              <h2
                id="activities-heading"
                className="mt-1 text-2xl font-medium tracking-tight text-[var(--color-text)]"
              >
                Activities
              </h2>
              <p className="mt-1 text-sm text-[var(--color-muted)] print:hidden">
                Filter by age, then print the set for your class.
              </p>
            </div>
            {showTeachingContent && (
              <div className="flex flex-wrap items-center gap-2 print:hidden">
                <span id="age-filter-label" className="label">
                  Age
                </span>
                <Selector
                  label="Age"
                  value={ageBand}
                  options={[
                    { value: 'all' as const, label: 'All ages' },
                    ...(
                      Object.keys(AGE_BAND_LABELS) as AgeBand[]
                    ).map((band) => ({
                      value: band as 'all' | AgeBand,
                      label: AGE_BAND_LABELS[band],
                    })),
                  ]}
                  onChange={setAgeBand}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                  className="gap-2"
                >
                  <Printer className="h-3.5 w-3.5" strokeWidth={1.5} />
                  <span>Print</span>
                </Button>
              </div>
            )}
          </div>

          {!showTeachingContent ? (
            <p className="rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-sm text-[var(--color-muted)] print:hidden">
              Classroom activities and the teacher handout appear when
              viewing as a teacher. You can switch roles in the footer.
            </p>
          ) : filtered.length === 0 ? (
            <p className="rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-sm text-[var(--color-muted)] print:hidden">
              No activities match this filter yet. Try a wider age band.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 print:block print:space-y-0">
              {filtered.map((activity) => (
                <ActivitySheet key={activity.id} activity={activity} />
              ))}
            </div>
          )}
        </section>

        {showTeachingContent && (
          <section aria-labelledby="teachers-heading" className="mt-16 print:hidden">
            <div className="mb-6">
              <span className="label">Teacher handout</span>
              <h2
                id="teachers-heading"
                className="mt-1 text-2xl font-medium tracking-tight text-[var(--color-text)]"
              >
                For teachers
              </h2>
            </div>
            <TeacherPanel />
          </section>
        )}
      </main>
      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  );
}
