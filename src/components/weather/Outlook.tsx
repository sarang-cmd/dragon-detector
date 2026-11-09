'use client';

import * as React from 'react';
import useSWR from 'swr';
import { CloudOff, Loader2, RefreshCw, Sparkles, Square } from 'lucide-react';
import type { OutlookPayload } from '@/lib/outlook';
import { displayTemp, hourLabel, outlookAiStatus } from '@/lib/outlook';
import type { UnitSystem } from '@/lib/units';

async function fetcher(url: string): Promise<OutlookPayload> {
  const res = await fetch(url);
  if (!res.ok) throw new Error('outlook unavailable');
  return (await res.json()) as OutlookPayload;
}

function minutesAgo(iso: string): number | null {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.round((Date.now() - t) / 60000));
}

/**
 * Where the sentence under the chart comes from.
 * `idle`        nothing asked for yet (or the statistics are all we have)
 * `generating`  a request to the model is in flight
 * `ready`       the model answered
 * `unavailable` no key, a failed call, or the retries ran out
 * `stopped`     the visitor pressed Stop
 */
type AiPhase = 'idle' | 'generating' | 'ready' | 'unavailable' | 'stopped';

// One automatic retry, then the UI says so instead of spinning forever.
const MAX_AI_ATTEMPTS = 2;

const chipButton =
  'inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--color-border)] px-2.5 py-1 text-[10px] font-medium text-[var(--color-muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]';

/**
 * "Coming up" block for the hero tile: 12-hour temperature curve with
 * precipitation-probability bars, plus one AI or statistical sentence.
 *
 * The statistics arrive first and are rendered immediately; the AI sentence
 * is generated in a second, cancellable request. Every state is visible —
 * no silent empties when the model cannot answer.
 */
export function Outlook({ unitSystem }: { unitSystem: UnitSystem }) {
  const key = `/api/outlook?units=${unitSystem}`;
  const { data, error, isLoading, mutate } = useSWR<OutlookPayload>(
    key,
    fetcher,
    { dedupingInterval: 15 * 60 * 1000, revalidateOnFocus: false }
  );

  const [phase, setPhase] = React.useState<AiPhase>('idle');
  const [aiText, setAiText] = React.useState<string | null>(null);
  const [runId, setRunId] = React.useState(0);
  const attemptsRef = React.useRef(0);
  const busyRef = React.useRef(false);
  const abortRef = React.useRef<AbortController | null>(null);
  // Set by Retry/Generate: ask the server to ignore a stored failure.
  const forceRef = React.useRef(false);

  // A different unit system is a different cached outlook: start over.
  React.useEffect(() => {
    attemptsRef.current = 0;
    setAiText(null);
    setPhase('idle');
  }, [unitSystem]);

  const status = data ? outlookAiStatus(data) : 'pending';

  // Second pass: ask for the sentence only while the payload says it is
  // missing. The statistics above stay on screen the whole time.
  React.useEffect(() => {
    if (!data || status !== 'pending' || busyRef.current) return;
    if (attemptsRef.current >= MAX_AI_ATTEMPTS) {
      setPhase('unavailable');
      return;
    }
    attemptsRef.current += 1;
    const fresh = forceRef.current;
    forceRef.current = false;
    const controller = new AbortController();
    abortRef.current = controller;
    busyRef.current = true;
    let cancelled = false;
    setPhase('generating');

    fetch(`${key}&ai=1${fresh ? '&fresh=1' : ''}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error('ai unavailable');
        const payload = (await res.json()) as OutlookPayload;
        if (cancelled) return;
        if (payload.ai) {
          setAiText(payload.ai);
          setPhase('ready');
          // Fold the sentence into the cached payload so a later
          // revalidation of the statistics does not lose it again.
          void mutate({ ...data, ...payload }, false);
        } else if (outlookAiStatus(payload) === 'pending') {
          // The run was cancelled upstream; one more attempt is allowed.
          setPhase('idle');
        } else {
          setPhase('unavailable');
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const aborted = (err as { name?: string } | null)?.name === 'AbortError';
        setPhase(aborted ? 'stopped' : 'unavailable');
      })
      .finally(() => {
        busyRef.current = false;
      });

    return () => {
      cancelled = true;
      busyRef.current = false;
      abortRef.current = null;
      controller.abort();
    };
  }, [data, status, key, runId, mutate]);

  const stopAi = React.useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const retryAi = React.useCallback(() => {
    attemptsRef.current = 0;
    forceRef.current = true;
    setPhase('idle');
    setRunId((n) => n + 1);
  }, []);

  const sentence =
    aiText ?? (status === 'ready' && data?.ai ? data.ai : null);
  const age = data ? minutesAgo(data.generatedAt) : null;

  if (error && !data) {
    return (
      <div className="space-y-2">
        <span className="label text-[10px]">Coming up · next 12 hours</span>
        <div
          role="status"
          aria-live="polite"
          className="flex items-start gap-3 rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5"
        >
          <CloudOff
            aria-hidden="true"
            className="mt-0.5 h-3.5 w-3.5 shrink-0 stroke-[1.5] text-[var(--color-muted)]"
          />
          <p className="m-0 flex-1 text-xs leading-relaxed text-[var(--color-muted)]">
            The forecast isn&apos;t loading right now. The station readings
            above are unaffected.
          </p>
          <button
            type="button"
            onClick={() => void mutate()}
            className={chipButton}
          >
            <RefreshCw aria-hidden="true" className="h-2.5 w-2.5 stroke-[1.5]" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    if (!isLoading) return null;
    return (
      <div className="space-y-2">
        <span className="label text-[10px]">Coming up · next 12 hours</span>
        <div
          role="status"
          aria-label="Loading forecast..."
          className="skeleton-shimmer h-[150px] rounded-[8px] border border-[var(--color-border)]"
        />
        <div
          aria-hidden="true"
          className="skeleton-shimmer h-[16px] w-2/3 rounded-[6px] border border-[var(--color-border)]"
        />
      </div>
    );
  }

  const hours = data.hours ?? [];
  const temps = hours.map((h) => h.tempC);
  const finite = temps.filter((t): t is number => t != null);
  const min = finite.length ? Math.min(...finite) : 0;
  const max = finite.length ? Math.max(...finite) : 1;
  const span = max - min || 1;

  const W = 600;
  const H = 150;
  const PAD = 8;
  const x = (i: number) =>
    hours.length > 1 ? PAD + (i / (hours.length - 1)) * (W - PAD * 2) : W / 2;
  const yTemp = (t: number | null) =>
    12 + (1 - ((t ?? min) - min) / span) * 84;
  const barH = (p: number | null) => ((p ?? 0) / 100) * 30;

  const points = hours.map((h, i) => `${x(i)},${yTemp(h.tempC)}`).join(' ');

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="label text-[10px]">Coming up · next 12 hours</span>
        {phase === 'generating' ? (
          <span className="inline-flex items-center gap-1 text-[10px] text-[var(--color-muted)]">
            <Loader2
              aria-hidden="true"
              className="h-3 w-3 animate-spin stroke-[1.5] text-[var(--accent)]"
            />
            Generating…
          </span>
        ) : sentence ? (
          <span className="inline-flex items-center gap-1 text-[10px] text-[var(--color-muted)]">
            <Sparkles
              aria-hidden="true"
              className="h-3 w-3 stroke-[1.5] text-[var(--accent)]"
            />
            AI outlook
            {age != null && age > 0 ? ` · ${age} min ago` : ''}
          </span>
        ) : phase === 'stopped' ? (
          <span className="text-[10px] text-[var(--color-muted)]">
            AI outlook stopped
          </span>
        ) : (
          <span className="text-[10px] text-[var(--color-muted)]">
            Station trends
          </span>
        )}
      </div>

      {hours.length > 1 && (
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-[150px] w-full"
          role="img"
          aria-label={`12-hour forecast: ${displayTemp(data.tempMinNext12h, unitSystem)} to ${displayTemp(data.tempMaxNext12h, unitSystem)}${data.rainExpected ? ', rain likely' : ', staying dry'}`}
          preserveAspectRatio="none"
        >
          {/* Baseline grounding the precipitation bars */}
          <line
            x1={PAD}
            x2={W - PAD}
            y1={132}
            y2={132}
            stroke="var(--color-border)"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
          {/* Precipitation probability bars */}
          {hours.map((h, i) => (
            <rect
              key={`b${i}`}
              x={x(i) - (W / hours.length / 2) * 0.5}
              y={132 - barH(h.precipProb)}
              width={Math.max(2, (W / hours.length) * 0.5)}
              height={barH(h.precipProb)}
              rx={1}
              fill="var(--accent)"
              fillOpacity={0.35}
            />
          ))}
          {/* Temperature curve */}
          <polyline
            points={points}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          {hours.map((h, i) =>
            i % 3 === 0 ? (
              <text
                key={`t${i}`}
                x={x(i)}
                y={H - 2}
                textAnchor="middle"
                fontSize={11}
                fill="var(--color-muted)"
              >
                {hourLabel(h.time)}
              </text>
            ) : null
          )}
          <text x={PAD} y={12} fontSize={12} fill="var(--color-text)" className="numeric">
            {displayTemp(data.tempMaxNext12h, unitSystem)}
          </text>
          <text x={PAD} y={112} fontSize={12} fill="var(--color-muted)" className="numeric">
            {displayTemp(data.tempMinNext12h, unitSystem)}
          </text>
        </svg>
      )}

      {sentence ? (
        <p className="text-xs leading-relaxed text-[var(--color-text)] sm:text-sm">
          {sentence}
        </p>
      ) : (
        <>
          <p className="text-xs leading-relaxed text-[var(--color-muted)] sm:text-sm">
            {data.statisticalHeadline}
          </p>

          {phase === 'generating' && (
            <div
              role="status"
              aria-live="polite"
              className="flex items-center justify-between gap-3 rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2"
            >
              <span className="inline-flex items-center gap-2 text-[11px] text-[var(--color-muted)]">
                <Loader2
                  aria-hidden="true"
                  className="h-3.5 w-3.5 animate-spin stroke-[1.5] text-[var(--accent)]"
                />
                Generating your AI outlook…
              </span>
              <button
                type="button"
                onClick={stopAi}
                className={chipButton}
                title="Stop generating and keep the station trend"
              >
                <Square aria-hidden="true" className="h-2 w-2 fill-current" />
                Stop
              </button>
            </div>
          )}

          {phase === 'stopped' && (
            <div className="flex items-center justify-between gap-3 rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2">
              <span className="text-[11px] text-[var(--color-muted)]">
                Generation stopped. Station trend shown instead.
              </span>
              <button type="button" onClick={retryAi} className={chipButton}>
                <RefreshCw aria-hidden="true" className="h-2.5 w-2.5 stroke-[1.5]" />
                Generate
              </button>
            </div>
          )}

          {phase === 'unavailable' && (
            <div
              role="status"
              aria-live="polite"
              className="flex items-center justify-between gap-3 rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2"
            >
              <span className="text-[11px] text-[var(--color-muted)]">
                AI outlook unavailable — showing the station trend.
              </span>
              <button type="button" onClick={retryAi} className={chipButton}>
                <RefreshCw aria-hidden="true" className="h-2.5 w-2.5 stroke-[1.5]" />
                Retry
              </button>
            </div>
          )}
        </>
      )}

      {data.stale && (
        <p className="text-[10px] leading-relaxed text-[var(--color-muted)]">
          Showing the last saved outlook while the forecast service is
          unreachable.
        </p>
      )}
    </div>
  );
}
