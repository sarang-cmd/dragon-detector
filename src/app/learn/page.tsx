'use client';

import * as React from 'react';
import { Printer } from 'lucide-react';
import { concepts } from '@/lib/content/concepts';
import {
  activities,
  allSubjects,
  AGE_BAND_LABELS,
  type AgeBand,
  type Activity,
} from '@/lib/content/activities';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExplainerCard } from '@/components/learn/ExplainerCard';
import { TeacherPanel } from '@/components/learn/TeacherPanel';
import { useWeather } from '@/hooks/useWeather';
import { useUnitSystem } from '@/context/unit-context';

type Audience = 'kids' | 'students';

const AUDIENCE_KEY = 'dis_learn_audience';

function usePersistedAudience(): [Audience, (a: Audience) => void] {
  const [audience, setAudienceState] = React.useState<Audience>('students');

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(AUDIENCE_KEY);
      if (stored === 'kids' || stored === 'students') setAudienceState(stored);
    } catch {
      // localStorage may fail in restricted modes; default stands.
    }
  }, []);

  const setAudience = React.useCallback((next: Audience) => {
    setAudienceState(next);
    try {
      localStorage.setItem(AUDIENCE_KEY, next);
    } catch {
      // ignore write errors
    }
  }, []);

  return [audience, setAudience];
}

function AudienceToggle({
  audience,
  setAudience,
}: {
  audience: Audience;
  setAudience: (a: Audience) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Reading level"
      className="inline-flex h-11 min-h-[44px] items-center rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] p-1 text-xs select-none"
    >
      {(['kids', 'students'] as Audience[]).map((level) => (
        <button
          key={level}
          type="button"
          aria-pressed={audience === level}
          onClick={() => setAudience(level)}
          className={`h-full min-w-[44px] px-4 inline-flex items-center justify-center rounded-[8px] text-xs uppercase tracking-wider transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-[var(--accent)] ${
            audience === level
              ? 'bg-[var(--color-border)] text-[var(--color-text)] font-medium'
              : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
          }`}
        >
          {level === 'kids' ? 'Kids' : 'Students'}
        </button>
      ))}
    </div>
  );
}

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
            {activity.curriculum.programme} ·{' '}
            {activity.curriculum.subjects.join(', ')}
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
  const [audience, setAudience] = usePersistedAudience();
  const [ageBand, setAgeBand] = React.useState<'all' | AgeBand>('all');
  const [subject, setSubject] = React.useState<string>('all');
  const { reading } = useWeather();
  const { unitSystem } = useUnitSystem();

  const subjects = React.useMemo(() => allSubjects(), []);

  const filtered = React.useMemo(
    () =>
      activities.filter(
        (a) =>
          (ageBand === 'all' || a.ageBand === ageBand) &&
          (subject === 'all' || a.curriculum.subjects.includes(subject))
      ),
    [ageBand, subject]
  );

  const selectClass =
    'min-h-[44px] rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] focus-visible:outline-2 focus-visible:outline-[var(--accent)]';

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
            Plain-language explanations of every measurement, classroom
            investigations, and a handout for teachers — all from our own
            school station in Dresden.
          </p>
          <div className="print:hidden">
            <AudienceToggle audience={audience} setAudience={setAudience} />
          </div>
        </div>

        <section aria-labelledby="concepts-heading" className="print:hidden">
          <h2 id="concepts-heading" className="sr-only">
            Measurement concepts
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {concepts.map((concept) => (
              <ExplainerCard
                key={concept.id}
                concept={concept}
                audience={audience}
                reading={reading}
                unitSystem={unitSystem}
              />
            ))}
          </div>
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
                Filter by age and subject, then print the set for your class.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 print:hidden">
              <label htmlFor="age-filter" className="label">
                Age
              </label>
              <select
                id="age-filter"
                value={ageBand}
                onChange={(e) =>
                  setAgeBand(e.target.value as 'all' | AgeBand)
                }
                className={selectClass}
              >
                <option value="all">All ages</option>
                {(Object.keys(AGE_BAND_LABELS) as AgeBand[]).map((band) => (
                  <option key={band} value={band}>
                    {AGE_BAND_LABELS[band]}
                  </option>
                ))}
              </select>
              <label htmlFor="subject-filter" className="label">
                Subject
              </label>
              <select
                id="subject-filter"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className={selectClass}
              >
                <option value="all">All subjects</option>
                {subjects.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
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
          </div>

          {filtered.length === 0 ? (
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
      </main>
      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  );
}
