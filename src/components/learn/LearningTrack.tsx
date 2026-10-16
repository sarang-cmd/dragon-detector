'use client';

import * as React from 'react';
import Link from 'next/link';
import { Check, Lock, RotateCcw } from 'lucide-react';
import { TRACK_NODES, TRACK_UNITS, XP_PER_CORRECT } from '@/lib/track/curriculum';

export const MAX_XP = TRACK_NODES.length * 3 * XP_PER_CORRECT;

interface LearningTrackProps {
  completedLessons: string[];
  xp: number;
  loading: boolean;
  cloud: boolean;
  onReset: () => Promise<void>;
}

/**
 * Duolingo-style winding path: one node per measurement, grouped in units.
 * Node i unlocks when node i-1 is done. Completed nodes link back for replay
 * (replays bank no extra XP).
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

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)] text-sm font-bold text-[var(--accent-foreground)] numeric"
          >
            {loading ? '·' : xp}
          </span>
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
          </div>
        </div>
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

      <ol className="space-y-8">
        {TRACK_UNITS.map((unit) => (
          <li key={unit}>
            <h3 className="label mb-3">{unit}</h3>
            <ol className="flex flex-col items-center gap-2">
              {TRACK_NODES.map((node, i) => {
                if (node.unit !== unit) return null;
                const done = isDone(node.id);
                const prevDone = i === 0 || isDone(TRACK_NODES[i - 1].id);
                const locked = !prevDone;
                const current = prevDone && !done;
                // Gentle snake: alternate the lateral offset per position
                // inside the unit.
                const unitIdx = TRACK_NODES.filter((n) => n.unit === unit).findIndex(
                  (n) => n.id === node.id
                );
                const offset = ['sm:translate-x-0', 'sm:-translate-x-10', 'sm:translate-x-10', 'sm:-translate-x-5', 'sm:translate-x-5'][unitIdx % 5];

                const inner = (
                  <>
                    {done ? (
                      <Check aria-hidden="true" className="h-5 w-5 stroke-[2]" />
                    ) : locked ? (
                      <Lock aria-hidden="true" className="h-5 w-5 stroke-[1.5]" />
                    ) : (
                      <span aria-hidden="true" className="text-sm font-bold numeric">
                        {i + 1}
                      </span>
                    )}
                  </>
                );

                const cls = `flex h-16 w-16 items-center justify-center rounded-full border-2 transition-all focus-visible:outline-2 focus-visible:outline-[var(--accent)] ${offset} ${
                  done
                    ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-foreground)]'
                    : current
                      ? 'animate-pulse border-[var(--accent)] bg-[var(--color-surface)] text-[var(--color-text)]'
                      : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)]'
                }`;

                return (
                  <li key={node.id}>
                    {locked ? (
                      <span className={cls} aria-label={`${node.id} (locked, finish the previous lesson first)`} role="img">
                        {inner}
                      </span>
                    ) : (
                      <Link
                        href={`/learn/track/${node.id}`}
                        aria-label={`${node.id} lesson${done ? ' (completed, replay)' : current ? ' (up next)' : ''}`}
                        className={`${cls} min-h-[44px] min-w-[44px] hover:scale-105`}
                      >
                        {inner}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ol>
          </li>
        ))}
      </ol>
    </div>
  );
}
