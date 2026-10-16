'use client';

import * as React from 'react';
import Link from 'next/link';
import { Check, Lock, RotateCcw } from 'lucide-react';
import { concepts } from '@/lib/content/concepts';
import { TRACK_NODES, TRACK_UNITS, XP_PER_CORRECT } from '@/lib/track/curriculum';
import { Mascot } from '@/components/learn/Mascot';

export const MAX_XP = TRACK_NODES.length * 3 * XP_PER_CORRECT;

const TITLES: Record<string, string> = Object.fromEntries(
  concepts.map((c) => [c.id, c.title])
);

interface LearningTrackProps {
  completedLessons: string[];
  xp: number;
  loading: boolean;
  cloud: boolean;
  onReset: () => Promise<void>;
}

/**
 * Duolingo-style winding path: one node per measurement, grouped in units.
 * The path enforces order (node i unlocks when node i-1 is done); the lesson
 * list below stays open for free browsing. XP counts once per lesson.
 */
export function LearningTrack({
  completedLessons,
  xp,
  loading,
  cloud,
  onReset,
}: LearningTrackProps) {
  const [confirmingReset, setConfirmingReset] = React.useState(false);
  const isDone = (id: string) => completedLessons.includes(id);
  const nextIndex = TRACK_NODES.findIndex((n) => !isDone(n.id));

  return (
    <div data-tour="track">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <div className="flex items-center gap-3">
          <Mascot size={48} mood={xp > 0 ? 'happy' : 'thinking'} />
          <div>
            <p className="text-sm font-medium text-[var(--color-text)]">
              {loading ? 'Loading progress…' : `${xp} XP of ${MAX_XP}`}
            </p>
            <div
              role="progressbar"
              aria-valuenow={xp}
              aria-valuemin={0}
              aria-valuemax={MAX_XP}
              aria-label="Learning track progress"
              className="mt-1 h-1.5 w-40 overflow-hidden rounded-full bg-[var(--color-border)]"
            >
              <div
                className="h-full rounded-full bg-[var(--accent)] transition-all duration-500"
                style={{ width: `${Math.min(100, (xp / MAX_XP) * 100)}%` }}
              />
            </div>
            {!loading && nextIndex >= 0 && (
              <p className="mt-1 text-xs text-[var(--color-muted)]">
                Up next: {TITLES[TRACK_NODES[nextIndex].id]}. Finish each quiz
                to unlock the next lesson.
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          {!cloud && !loading && (
            <Link
              href="/login"
              className="text-xs text-[var(--color-muted)] underline decoration-[var(--accent)] underline-offset-4 hover:text-[var(--color-text)]"
            >
              Sign in to sync progress everywhere
            </Link>
          )}
          {(xp > 0 || completedLessons.length > 0) && !loading && (
            <button
              type="button"
              onClick={() => {
                if (confirmingReset) {
                  setConfirmingReset(false);
                  void onReset();
                } else {
                  setConfirmingReset(true);
                }
              }}
              onBlur={() => setConfirmingReset(false)}
              className="inline-flex min-h-[44px] items-center gap-1 text-xs text-[var(--color-muted)] hover:text-[var(--color-text)] focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
            >
              <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
              {confirmingReset ? 'Tap again to confirm reset' : 'Reset progress'}
            </button>
          )}
        </div>
      </div>

      <ol className="space-y-8">
        {TRACK_UNITS.map((unit) => (
          <li key={unit}>
            <h3 className="label mb-3">{unit}</h3>
            <ol className="flex flex-col items-center gap-1">
              {TRACK_NODES.map((node, i) => {
                if (node.unit !== unit) return null;
                const done = isDone(node.id);
                const prevDone = i === 0 || isDone(TRACK_NODES[i - 1].id);
                const locked = !prevDone;
                const current = prevDone && !done;
                const unitIdx = TRACK_NODES.filter((n) => n.unit === unit).findIndex(
                  (n) => n.id === node.id
                );
                const offset = ['sm:translate-x-0', 'sm:-translate-x-10', 'sm:translate-x-10', 'sm:-translate-x-5', 'sm:translate-x-5'][unitIdx % 5];

                const cls = `flex h-16 w-16 items-center justify-center rounded-full border-2 transition-all focus-visible:outline-2 focus-visible:outline-[var(--accent)] ${offset} ${
                  done
                    ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-foreground)]'
                    : current
                      ? 'animate-pulse border-[var(--accent)] bg-[var(--color-surface)] text-[var(--color-text)]'
                      : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)]'
                }`;

                return (
                  <li key={node.id} className="flex flex-col items-center gap-1 pb-1">
                    {locked ? (
                      <span
                        className={cls}
                        aria-label={`${TITLES[node.id]} (locked, finish the previous lesson first)`}
                        role="img"
                        title="Finish the previous lesson to unlock this one"
                      >
                        <Lock aria-hidden="true" className="h-5 w-5 stroke-[1.5]" />
                      </span>
                    ) : (
                      <Link
                        href={`/learn/track/${node.id}`}
                        aria-label={`${TITLES[node.id]} lesson${done ? ' (completed, replay for fun)' : current ? ' (up next)' : ''}`}
                        className={`${cls} min-h-[44px] min-w-[44px] hover:scale-105`}
                      >
                        {done ? (
                          <Check aria-hidden="true" className="h-5 w-5 stroke-[2]" />
                        ) : (
                          <span aria-hidden="true" className="text-sm font-bold numeric">
                            {i + 1}
                          </span>
                        )}
                      </Link>
                    )}
                    <span className="flex items-center gap-1 text-[11px] text-[var(--color-muted)]">
                      {TITLES[node.id]}
                      {current && (
                        <span className="rounded-full bg-[var(--accent)] px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-[var(--accent-foreground)]">
                          Up next
                        </span>
                      )}
                      {done && (
                        <Check aria-hidden="true" className="h-3 w-3 text-[var(--accent)]" />
                      )}
                    </span>
                  </li>
                );
              })}
            </ol>
          </li>
        ))}
      </ol>
      <p className="mt-4 text-center text-xs text-[var(--color-muted)]">
        Quizzes guard the path: finish each lesson to unlock the next one. XP
        counts the first time you clear a lesson.
      </p>
    </div>
  );
}
