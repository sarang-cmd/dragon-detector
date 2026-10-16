'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, RotateCcw, X } from 'lucide-react';
import { concepts } from '@/lib/content/concepts';
import { nodeById, TRACK_NODES, XP_PER_CORRECT } from '@/lib/track/curriculum';
import { ExplainerCard } from '@/components/learn/ExplainerCard';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { useWeather } from '@/hooks/useWeather';
import { useUnitSystem } from '@/context/unit-context';
import { useRole } from '@/context/role-context';
import { useTrackProgress } from '@/hooks/useTrackProgress';

/**
 * One lesson: the concept explainer (role-aware) plus a 3-question check.
 * +10 XP per correct answer, banked once per lesson via completeLesson.
 */
export default function LessonPage() {
  const params = useParams<{ nodeId: string }>();
  const router = useRouter();
  const node = nodeById(params.nodeId);
  const concept = concepts.find((c) => c.id === params.nodeId);

  const { reading } = useWeather();
  const { unitSystem } = useUnitSystem();
  const { readingLevel } = useRole();
  const { completedLessons, completeLesson, loading } = useTrackProgress();

  const [qIndex, setQIndex] = React.useState(0);
  const [picked, setPicked] = React.useState<number | null>(null);
  const [earned, setEarned] = React.useState(0);
  const [finished, setFinished] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  const alreadyDone = node ? completedLessons.includes(node.id) : false;

  React.useEffect(() => {
    if (finished && node && !saved) {
      setSaved(true);
      void completeLesson(node.id, earned);
    }
  }, [finished, node, saved, earned, completeLesson]);

  if (!node || !concept) {
    return (
      <div className="flex min-h-screen flex-col bg-[var(--color-background)]">
        <div className="print:hidden">
          <Header />
        </div>
        <main className="mx-auto w-full max-w-[640px] flex-1 px-4 py-12">
          <h1 className="display text-[var(--color-text)]">No such lesson</h1>
          <Link href="/learn" className="mt-4 inline-block text-[var(--accent)] underline">
            Back to Learn
          </Link>
        </main>
        <div className="print:hidden">
          <Footer />
        </div>
      </div>
    );
  }

  const question = node.quiz[qIndex];
  const nextNode = TRACK_NODES[TRACK_NODES.findIndex((n) => n.id === node.id) + 1];

  const pick = (i: number) => {
    if (picked != null) return;
    setPicked(i);
    if (i === question.answer) setEarned((e) => e + XP_PER_CORRECT);
  };

  const advance = () => {
    if (qIndex + 1 >= node.quiz.length) setFinished(true);
    else {
      setQIndex((i) => i + 1);
      setPicked(null);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-background)]">
      <div className="print:hidden">
        <Header />
      </div>
      <main className="mx-auto w-full max-w-[640px] flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <Link
          href="/learn"
          className="inline-flex min-h-[44px] items-center gap-2 text-sm text-[var(--color-muted)] hover:text-[var(--color-text)]"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Learning track
        </Link>

        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="label">
            {node.unit} · Lesson {TRACK_NODES.findIndex((n) => n.id === node.id) + 1} of {TRACK_NODES.length}
          </span>
          {alreadyDone && (
            <span className="inline-flex items-center gap-1 text-xs text-[var(--color-muted)]">
              <Check aria-hidden="true" className="h-3.5 w-3.5 text-[var(--accent)]" />
              Completed
            </span>
          )}
        </div>

        <div className="mt-6">
          <ExplainerCard
            concept={concept}
            audience={readingLevel}
            reading={reading}
            unitSystem={unitSystem}
          />
        </div>

        <section aria-labelledby="quiz-heading" className="mt-8">
          <h2 id="quiz-heading" className="text-xl font-medium text-[var(--color-text)]">
            Quick check
          </h2>
          {!finished ? (
            <div className="mt-4 rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6">
              <div className="flex items-center justify-between gap-2">
                <span className="label text-[10px]">
                  Question {qIndex + 1} of {node.quiz.length}
                </span>
                <span className="numeric text-xs text-[var(--color-muted)]">+{earned} XP</span>
              </div>
              <div
                role="progressbar"
                aria-valuenow={qIndex}
                aria-valuemin={0}
                aria-valuemax={node.quiz.length}
                aria-label="Quiz progress"
                className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--color-border)]"
              >
                <div
                  className="h-full rounded-full bg-[var(--accent)] transition-all"
                  style={{ width: `${(qIndex / node.quiz.length) * 100}%` }}
                />
              </div>

              <p className="mt-4 text-base font-medium leading-relaxed text-[var(--color-text)] sm:text-lg">
                {question.question}
              </p>

              <div className="mt-4 space-y-2" role="group" aria-label="Answer choices">
                {question.choices.map((choice, i) => {
                  const isAnswer = i === question.answer;
                  const isPicked = picked === i;
                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={picked != null}
                      onClick={() => pick(i)}
                      className={`flex min-h-[44px] w-full items-center justify-between gap-3 rounded-[8px] border px-4 py-3 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent)] disabled:cursor-default ${
                        picked == null
                          ? 'border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-text)]'
                          : isAnswer
                            ? 'border-[var(--accent)] bg-[var(--accent)] font-medium text-[var(--accent-foreground)]'
                            : isPicked
                              ? 'border-red-500 text-[var(--color-text)]'
                              : 'border-[var(--color-border)] text-[var(--color-muted)]'
                      }`}
                    >
                      <span>{choice}</span>
                      {picked != null && isAnswer && (
                        <Check aria-hidden="true" className="h-4 w-4 shrink-0" />
                      )}
                      {picked != null && isPicked && !isAnswer && (
                        <X aria-hidden="true" className="h-4 w-4 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {picked != null && (
                <div className="mt-4 flex items-center justify-between gap-3">
                  <p role="status" className="text-sm text-[var(--color-text)]">
                    {picked === question.answer
                      ? `Correct! +${XP_PER_CORRECT} XP.`
                      : 'Not quite — the highlighted answer is right.'}
                  </p>
                  <Button size="sm" onClick={advance} className="gap-1">
                    {qIndex + 1 >= node.quiz.length ? 'Finish' : 'Next'}
                    <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-4 rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center">
              <p className="display text-[var(--color-text)]">+{earned} XP</p>
              <p className="mt-2 text-sm text-[var(--color-muted)]">
                {alreadyDone
                  ? 'Replay banked — XP only counts the first time through.'
                  : loading
                    ? 'Saving progress…'
                    : 'Progress saved. Nice work.'}
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {nextNode && (
                  <Button onClick={() => router.push(`/learn/track/${nextNode.id}`)} className="gap-1">
                    Next lesson: {nextNode.id}
                    <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
                  </Button>
                )}
                <Button variant="outline" onClick={() => {
                  setQIndex(0);
                  setPicked(null);
                  setEarned(0);
                  setFinished(false);
                  setSaved(false);
                }} className="gap-1">
                  <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
                  Retry quiz
                </Button>
                <Link
                  href="/learn"
                  className="inline-flex min-h-[44px] items-center rounded-[12px] border border-[var(--color-border)] px-4 text-sm text-[var(--color-text)] hover:border-[var(--color-text)]"
                >
                  Track
                </Link>
              </div>
            </div>
          )}
        </section>
      </main>
      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  );
}
