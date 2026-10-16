'use client';

import * as React from 'react';
import useSWR from 'swr';
import { Sparkles } from 'lucide-react';
import type { ForecastHour } from '@/lib/outlook';
import { displayTemp, hourLabel } from '@/lib/outlook';
import type { UnitSystem } from '@/lib/units';

interface OutlookPayload {
  generatedAt: string;
  units: UnitSystem;
  statisticalHeadline: string;
  tempDirection: 'rising' | 'falling' | 'steady';
  rainExpected: boolean;
  ai: string | null;
  aiModel: string | null;
  hours: ForecastHour[];
  tempMinNext12h: number | null;
  tempMaxNext12h: number | null;
}

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
 * "Coming up" block for the hero tile: 12-hour temperature curve with
 * precipitation-probability bars, plus one AI or statistical sentence.
 * Silent on error — the hero stays useful without it.
 */
export function Outlook({ unitSystem }: { unitSystem: UnitSystem }) {
  const { data, isLoading } = useSWR<OutlookPayload>(
    `/api/outlook?units=${unitSystem}`,
    fetcher,
    { dedupingInterval: 15 * 60 * 1000, revalidateOnFocus: false }
  );

  if (!isLoading && !data) return null;
  if (!isLoading && data && data.hours.length === 0 && !data.ai) {
    return (
      <p className="text-xs leading-relaxed text-[var(--color-muted)] sm:text-sm">
        {data.statisticalHeadline}
      </p>
    );
  }

  const hours = data?.hours ?? [];
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
  const age = data ? minutesAgo(data.generatedAt) : null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="label text-[10px]">Coming up · next 12 hours</span>
        {data?.ai ? (
          <span className="inline-flex items-center gap-1 text-[10px] text-[var(--color-muted)]">
            <Sparkles aria-hidden="true" className="h-3 w-3 stroke-[1.5] text-[var(--accent)]" />
            AI outlook
            {age != null && age > 0 ? ` · ${age} min ago` : ''}
          </span>
        ) : (
          <span className="text-[10px] text-[var(--color-muted)]">Station trends</span>
        )}
      </div>

      {isLoading || !data ? (
        <div
          role="status"
          aria-label="Loading forecast..."
          className="skeleton-shimmer h-[150px] rounded-[8px] border border-[var(--color-border)]"
        />
      ) : (
        <>
          {hours.length > 1 && (
            <svg
              viewBox={`0 0 ${W} ${H}`}
              className="h-[150px] w-full"
              role="img"
              aria-label={`12-hour forecast: ${displayTemp(data.tempMinNext12h, unitSystem)} to ${displayTemp(data.tempMaxNext12h, unitSystem)}${data.rainExpected ? ', rain likely' : ', staying dry'}`}
              preserveAspectRatio="none"
            >
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
          <p className="text-xs leading-relaxed text-[var(--color-text)] sm:text-sm">
            {data.ai ?? data.statisticalHeadline}
          </p>
        </>
      )}
    </div>
  );
}
