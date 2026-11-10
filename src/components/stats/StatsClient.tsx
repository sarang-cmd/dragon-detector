'use client';

import * as React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Droplets, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RelativeTime } from '@/components/weather/RelativeTime';
import { useHistory, type HistoryRange } from '@/hooks/useHistory';
import { useWeather } from '@/hooks/useWeather';
import { useUnitSystem } from '@/context/unit-context';
import {
  computeStationStats,
  formatHours,
  formatSpan,
  type StationStats,
} from '@/lib/stats';
import {
  formatPressure,
  formatRain,
  formatSpeed,
  formatTemp,
  cToF,
} from '@/lib/units';
import { windDirectionLabel } from '@/lib/beaufort';
import { formatStatTime } from '@/lib/history';
import projectStats from '@/lib/project-stats.json';

/**
 * Every number on this page comes from the same history window the Data page
 * uses, crunched by `computeStationStats` (pure, tested in
 * `src/lib/stats.test.ts`). Nothing here invents a figure: a sensor the
 * station never reported simply has no row.
 */

const RANGES: { value: HistoryRange; label: string }[] = [
  { value: '24h', label: '24 hours' },
  { value: '7d', label: '7 days' },
];

const SOURCE_LABELS: Record<string, string> = {
  ecowitt: 'School station · Ecowitt WS3500',
  openmeteo: 'Open-Meteo model (no station link)',
  mock: 'Simulator (development data)',
};

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="instrument-tile p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-base font-medium text-[var(--color-text)]">{title}</h2>
        {hint ? (
          <p className="text-[11px] text-[var(--color-muted)]">{hint}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function TileGrid({ children }: { children: React.ReactNode }) {
  return (
    <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">{children}</dl>
  );
}

function StatTile({
  label,
  value,
  unit,
  sub,
}: {
  label: string;
  value: React.ReactNode;
  /** Rendered small and muted beside the number, so the two never split. */
  unit?: string;
  sub?: React.ReactNode;
}) {
  return (
    <div className="stat-tile rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
      <dt className="label stat-label">{label}</dt>
      <dd className="numeric stat-value mt-1 text-[var(--color-text)]">
        {value}
        {unit ? <span className="stat-unit">&#160;{unit}</span> : null}
      </dd>
      {sub ? (
        <dd className="stat-sub mt-0.5 text-[11px] leading-snug text-[var(--color-muted)]">
          {sub}
        </dd>
      ) : null}
    </div>
  );
}

function RecordRow({
  label,
  value,
  when,
}: {
  label: string;
  value: string;
  when?: string | null;
}) {
  return (
    <tr className="border-b border-[var(--color-border)] last:border-0">
      <th
        scope="row"
        className="whitespace-nowrap px-4 py-2 text-left text-sm font-normal text-[var(--color-muted)]"
      >
        {label}
      </th>
      <td className="numeric whitespace-nowrap px-4 py-2 text-sm text-[var(--color-text)]">
        {value}
      </td>
      <td className="whitespace-nowrap px-4 py-2 text-[11px] text-[var(--color-muted)]">
        {when ? formatStatTime(when) : '—'}
      </td>
    </tr>
  );
}

function RecordTable({
  caption,
  rows,
}: {
  caption: string;
  rows: { label: string; value: string; when?: string | null }[];
}) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-[var(--color-muted)]">
        No sensor in this window reported this yet.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto rounded-[12px] border border-[var(--color-border)]">
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-[var(--color-surface)]">
          <tr className="border-b border-[var(--color-border)]">
            <th scope="col" className="label px-4 py-3 text-left">
              Record
            </th>
            <th scope="col" className="label px-4 py-3 text-left">
              Value
            </th>
            <th scope="col" className="label px-4 py-3 text-left">
              When (Berlin)
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <RecordRow key={row.label} {...row} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HourTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value?: number | string | null }>;
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const value = payload[0]?.value;
  if (typeof value !== 'number') return null;
  return (
    <div className="rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2">
      <div className="text-[11px] uppercase tracking-wider text-[var(--color-muted)]">
        {label}:00
      </div>
      <div className="numeric text-sm text-[var(--color-text)]">
        {value.toFixed(1)}°
      </div>
    </div>
  );
}

function SkeletonBlock() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading statistics">
      <div className="skeleton-shimmer h-[92px] rounded-[12px] border border-[var(--color-border)]" />
      <div className="skeleton-shimmer h-[260px] rounded-[12px] border border-[var(--color-border)]" />
      <div className="skeleton-shimmer h-[180px] rounded-[12px] border border-[var(--color-border)]" />
    </div>
  );
}

export function StatsClient() {
  const { unitSystem } = useUnitSystem();
  const [range, setRange] = React.useState<HistoryRange>('7d');
  const { points, isLoading, error, retry } = useHistory(range);
  const weather = useWeather();

  const stats: StationStats = React.useMemo(
    () => computeStationStats(points ?? []),
    [points]
  );

  const t = React.useCallback(
    (c: number | null | undefined) => {
      if (c == null) return '—';
      const f = formatTemp(c, unitSystem);
      return `${f.value} ${f.unit}`;
    },
    [unitSystem]
  );
  const wind = React.useCallback(
    (kmh: number | null | undefined) => {
      if (kmh == null) return '—';
      const f = formatSpeed(kmh, unitSystem);
      return `${f.value} ${f.unit}`;
    },
    [unitSystem]
  );
  const rain = React.useCallback(
    (mm: number | null | undefined) => {
      if (mm == null) return '—';
      const f = formatRain(mm, unitSystem);
      return `${f.value} ${f.unit}`;
    },
    [unitSystem]
  );
  const pressure = React.useCallback(
    (hpa: number | null | undefined) => {
      if (hpa == null) return '—';
      const f = formatPressure(hpa, unitSystem);
      return `${f.value} ${f.unit}`;
    },
    [unitSystem]
  );
  const pct = (v: number | null | undefined, digits = 0) =>
    v == null ? '—' : `${v.toFixed(digits)} %`;

  // Same numbers as `wind`/`pct` but split, so a tile can keep the figure and
  // its unit on one line and set the unit in a smaller face.
  const windParts = React.useCallback(
    (kmh: number | null | undefined): { value: string; unit?: string } => {
      if (kmh == null) return { value: '—' };
      const f = formatSpeed(kmh, unitSystem);
      return { value: f.value, unit: f.unit };
    },
    [unitSystem]
  );
  const pctParts = (v: number | null | undefined, digits = 0): { value: string; unit?: string } =>
    v == null ? { value: '—' } : { value: v.toFixed(digits), unit: '%' };

  const { coverage, rain: rainTotals, streaks, wind: windSummary } = stats;
  const hasData = coverage.points > 0;

  const records = [
    { label: 'Highest temperature', value: t(stats.temperature?.max), when: stats.temperature?.maxTime },
    { label: 'Lowest temperature', value: t(stats.temperature?.min), when: stats.temperature?.minTime },
    { label: 'Highest feels-like', value: t(stats.feelsLike?.max), when: stats.feelsLike?.maxTime },
    { label: 'Lowest feels-like', value: t(stats.feelsLike?.min), when: stats.feelsLike?.minTime },
    { label: 'Strongest gust', value: wind(windSummary.maxGust), when: windSummary.maxGustTime },
    { label: 'Highest sustained wind', value: wind(stats.windSpeed?.max), when: stats.windSpeed?.maxTime },
    {
      label: 'Heaviest rain rate',
      value: stats.rainRate?.max == null ? '—' : `${rain(stats.rainRate.max)}/h`,
      when: stats.rainRate?.maxTime,
    },
    { label: 'Highest pressure', value: pressure(stats.pressure?.max), when: stats.pressure?.maxTime },
    { label: 'Lowest pressure', value: pressure(stats.pressure?.min), when: stats.pressure?.minTime },
    { label: 'Most humid', value: pct(stats.humidity?.max), when: stats.humidity?.maxTime },
    { label: 'Driest air', value: pct(stats.humidity?.min), when: stats.humidity?.minTime },
    { label: 'Highest dew point', value: t(stats.dewPoint?.max), when: stats.dewPoint?.maxTime },
    {
      label: 'Peak UV index',
      value: stats.uv?.max == null ? '—' : stats.uv.max.toFixed(1),
      when: stats.uv?.maxTime,
    },
    {
      label: 'Peak solar irradiance',
      value: stats.solar?.max == null ? '—' : `${Math.round(stats.solar.max)} W/m²`,
      when: stats.solar?.maxTime,
    },
  ].filter((row) => row.value !== '—');

  const hourBars = stats.hourly.map((h) => ({
    label: String(h.hour).padStart(2, '0'),
    temp:
      h.avgTemp == null
        ? null
        : unitSystem === 'metric'
          ? Math.round(h.avgTemp * 10) / 10
          : Math.round(cToF(h.avgTemp) * 10) / 10,
  }));

  const stepMinutes = Math.max(1, Math.round(coverage.stepHours * 60));
  const sourceLabel =
    SOURCE_LABELS[weather.reading?.source ?? ''] ??
    (weather.reading?.source ?? 'unknown');

  return (
    <div className="space-y-6">
      {/* Range switch */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div role="group" aria-label="Time range" className="flex items-center gap-2">
          <span className="label">Window</span>
          <div className="inline-flex rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] p-1 text-xs">
            {RANGES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRange(r.value)}
                aria-pressed={range === r.value}
                className={`min-h-[44px] inline-flex items-center justify-center rounded-[6px] px-4 transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent)] ${
                  range === r.value
                    ? 'bg-[var(--color-border)] font-medium text-[var(--color-text)]'
                    : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
        <p className="text-[11px] text-[var(--color-muted)]">
          {hasData
            ? `${coverage.points} readings · every ${stepMinutes} min · ${formatSpan(coverage.spanHours)}`
            : 'Waiting for readings'}
        </p>
      </div>

      {error && !hasData ? (
        <div
          role="status"
          className="instrument-tile flex flex-wrap items-center justify-between gap-3 p-4"
        >
          <p className="text-sm text-[var(--color-muted)]">
            Statistics could not be loaded from the station archive.
          </p>
          <Button variant="outline" size="sm" onClick={retry} className="gap-2">
            <RefreshCw className="h-3.5 w-3.5" strokeWidth={1.5} />
            Try again
          </Button>
        </div>
      ) : null}

      {!hasData && isLoading ? <SkeletonBlock /> : null}

      {!hasData && !isLoading && !error ? (
        <div className="instrument-tile p-6">
          <p className="text-sm text-[var(--color-muted)]">
            No readings in this window yet. The station archive fills as the
            console reports in — try the 7-day window, or check back after the
            next upload.
          </p>
        </div>
      ) : null}

      {hasData ? (
        <>
          {/* At a glance */}
          <Section
            title="At a glance"
            hint={`${formatStatTime(coverage.from ?? '')} – ${formatStatTime(coverage.to ?? '')} (Berlin)`}
          >
            <TileGrid>
              <StatTile
                label="Readings analysed"
                value={coverage.points.toLocaleString('en-GB')}
                sub={`of ${coverage.expected.toLocaleString('en-GB')} expected`}
              />
              <StatTile
                label="Record coverage"
                value={`${Math.round(coverage.percent)} %`}
                sub={
                  coverage.percent >= 99.5
                    ? 'No gaps in this window'
                    : `${coverage.expected - coverage.points} readings missing`
                }
              />
              <StatTile
                label="Mean temperature"
                value={t(stats.temperature?.avg)}
                sub={`${t(stats.temperature?.min)} to ${t(stats.temperature?.max)}`}
              />
              <StatTile
                label="Rain in window"
                value={rain(rainTotals.windowMm)}
                sub={rainTotals.wettestDay ? `wettest ${rainTotals.wettestDay.date}` : 'no rain recorded'}
              />
            </TileGrid>
          </Section>

          {/* Records */}
          <Section title="Records" hint="Highest and lowest value of each sensor, and when it happened">
            <RecordTable
              caption={`Station records over the last ${range === '24h' ? '24 hours' : '7 days'}`}
              rows={records}
            />
          </Section>

          {/* Day by day */}
          <Section
            title="Day by day"
            hint={`${stats.daily.length} calendar ${stats.daily.length === 1 ? 'day' : 'days'} in this window`}
          >
            <div className="max-h-[420px] overflow-auto rounded-[12px] border border-[var(--color-border)]">
              <table className="w-full border-collapse text-sm">
                <caption className="sr-only">
                  Daily summary: minimum, maximum and mean temperature, rainfall and strongest gust
                </caption>
                <thead className="sticky top-0 bg-[var(--color-surface)]">
                  <tr className="border-b border-[var(--color-border)]">
                    <th scope="col" className="label whitespace-nowrap px-4 py-3 text-left">Date</th>
                    <th scope="col" className="label whitespace-nowrap px-4 py-3 text-left">Min</th>
                    <th scope="col" className="label whitespace-nowrap px-4 py-3 text-left">Max</th>
                    <th scope="col" className="label whitespace-nowrap px-4 py-3 text-left">Mean</th>
                    <th scope="col" className="label whitespace-nowrap px-4 py-3 text-left">Rain</th>
                    <th scope="col" className="label whitespace-nowrap px-4 py-3 text-left">Max gust</th>
                    <th scope="col" className="label whitespace-nowrap px-4 py-3 text-left">Humidity</th>
                    <th scope="col" className="label whitespace-nowrap px-4 py-3 text-left">Readings</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.daily.map((day) => (
                    <tr key={day.date} className="border-b border-[var(--color-border)] last:border-0">
                      <th scope="row" className="numeric whitespace-nowrap px-4 py-2 text-left font-normal text-[var(--color-muted)]">
                        {day.date}
                      </th>
                      <td className="numeric whitespace-nowrap px-4 py-2 text-[var(--color-text)]">{t(day.min)}</td>
                      <td className="numeric whitespace-nowrap px-4 py-2 text-[var(--color-text)]">{t(day.max)}</td>
                      <td className="numeric whitespace-nowrap px-4 py-2 text-[var(--color-text)]">{t(day.avg)}</td>
                      <td className="numeric whitespace-nowrap px-4 py-2 text-[var(--color-text)]">{rain(day.rainMm)}</td>
                      <td className="numeric whitespace-nowrap px-4 py-2 text-[var(--color-text)]">{wind(day.maxGust)}</td>
                      <td className="numeric whitespace-nowrap px-4 py-2 text-[var(--color-text)]">{pct(day.avgHumidity)}</td>
                      <td className="numeric whitespace-nowrap px-4 py-2 text-[var(--color-muted)]">{day.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          {/* Rain and streaks */}
          <Section title="Rain and runs" hint="Totals are rain rate × sampling interval, so they match the bucket resolution">
            <TileGrid>
              <StatTile label="Rain, whole window" value={rain(rainTotals.windowMm)} />
              <StatTile
                label="Wettest day"
                value={rainTotals.wettestDay ? rain(rainTotals.wettestDay.rainMm) : '—'}
                sub={rainTotals.wettestDay?.date}
              />
              <StatTile
                label="Wet / dry days"
                value={`${rainTotals.wetDays} / ${rainTotals.dryDays}`}
                sub="days with and without rain"
              />
              <StatTile
                label="Longest dry run"
                value={formatHours(streaks.longestDryHours)}
                sub={`${formatHours(streaks.dryHours)} dry in total`}
              />
              <StatTile
                label="Longest wet run"
                value={formatHours(streaks.longestWetHours)}
                sub={`${formatHours(streaks.wetHours)} with rain in total`}
              />
              <StatTile
                label="Longest frost"
                value={formatHours(streaks.longestFrostHours)}
                sub={`${formatHours(streaks.frostHours)} below 0 °C in total`}
              />
              <StatTile
                label="Dry right now"
                value={formatHours(streaks.currentDryHours)}
                sub="ongoing run at the newest reading"
              />
              <StatTile
                label="Frost right now"
                value={formatHours(streaks.currentFrostHours)}
                sub="ongoing run below 0 °C"
              />
            </TileGrid>
          </Section>

          {/* A typical day */}
          <Section
            title="A typical day"
            hint="Mean temperature for each hour of the day across the whole window"
          >
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourBars} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid stroke="var(--color-border)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: 'var(--color-muted)', fontSize: 11 }}
                    stroke="var(--color-border)"
                    interval={1}
                  />
                  <YAxis
                    tick={{ fill: 'var(--color-muted)', fontSize: 11 }}
                    stroke="var(--color-border)"
                    width={36}
                    unit="°"
                  />
                  <Tooltip content={<HourTooltip />} cursor={{ fill: 'var(--color-border)', opacity: 0.4 }} />
                  <Bar dataKey="temp" fill="var(--accent)" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Section>

          {/* Wind */}
          <Section title="Wind" hint="Direction is where the wind comes from">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,min(46%,420px))]">
              <div className="space-y-2">
                {windSummary.sectors.map((sector) => (
                  <div key={sector.label} className="flex items-center gap-3">
                    <span className="numeric w-7 shrink-0 text-xs text-[var(--color-muted)]">
                      {sector.label}
                    </span>
                    <span
                      aria-hidden="true"
                      className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--color-border)]"
                    >
                      <span
                        className="block h-full rounded-full bg-[var(--accent)]"
                        style={{ width: `${Math.max(sector.percent, 0.5)}%` }}
                      />
                    </span>
                    <span className="numeric w-14 shrink-0 text-right text-xs text-[var(--color-text)]">
                      {sector.percent.toFixed(1)} %
                    </span>
                  </div>
                ))}
              </div>
              {/* 2x2, not TileGrid's four-across: inside this column four
                  columns left each tile about 90px wide, which clipped the
                  labels and split values from their units. */}
              <dl className="grid grid-cols-2 gap-3">
                <StatTile
                  label="Prevailing"
                  value={windDirectionLabel(windSummary.prevailingDeg)}
                  sub={`${windSummary.prevailingLabel} · ${Math.round(windSummary.prevailingDeg)}°`}
                />
                <StatTile
                  label="Mean speed"
                  value={windParts(windSummary.avgSpeed).value}
                  unit={windParts(windSummary.avgSpeed).unit}
                />
                <StatTile
                  label="Strongest gust"
                  value={windParts(windSummary.maxGust).value}
                  unit={windParts(windSummary.maxGust).unit}
                  sub={windSummary.maxGustTime ? formatStatTime(windSummary.maxGustTime) : undefined}
                />
                <StatTile
                  label="Calm readings"
                  value={pctParts(windSummary.calmPercent, 1).value}
                  unit={pctParts(windSummary.calmPercent, 1).unit}
                  sub="below 1 km/h"
                />
              </dl>
            </div>
          </Section>

          {/* This station */}
          <Section title="This station" hint="How the numbers above were collected">
            <TileGrid>
              <StatTile label="Data source" value={sourceLabel} />
              <StatTile
                label="Last measurement"
                value={
                  weather.measuredAt ? (
                    <RelativeTime seconds={weather.secondsSinceMeasured} />
                  ) : (
                    '—'
                  )
                }
                sub={weather.isOffline ? 'station may be reconnecting' : undefined}
              />
              <StatTile
                label="Sampling"
                value={`every ${stepMinutes} min`}
                sub="measured from the timestamps"
              />
              <StatTile
                label="Dashboard refresh"
                value="60 s"
                sub="archive reloads every 5 min"
              />
            </TileGrid>
          </Section>
        </>
      ) : null}

      {/* This build */}
      <Section
        title="This build"
        hint={`Counted by "pnpm stats" on ${projectStats.generatedAt.slice(0, 10)}`}
      >
        <TileGrid>
          <StatTile
            label="Application code"
            value={projectStats.code.lines.toLocaleString('en-GB')}
            sub={`${projectStats.code.files} files`}
          />
          <StatTile
            label="Tests"
            value={projectStats.tests.cases.toLocaleString('en-GB')}
            sub={`${projectStats.tests.files} test files`}
          />
          <StatTile
            label="Components"
            value={projectStats.code.components.toLocaleString('en-GB')}
            sub={`${projectStats.code.pages} pages · ${projectStats.code.apiRoutes} API routes`}
          />
          <StatTile
            label="Library modules"
            value={projectStats.code.libModules.toLocaleString('en-GB')}
            sub={`${projectStats.code.hooks} hooks`}
          />
          <StatTile
            label="Documentation"
            value={projectStats.docs.files.toLocaleString('en-GB')}
            sub={`${projectStats.docs.lines.toLocaleString('en-GB')} lines · ${projectStats.docs.migrations} migrations`}
          />
          <StatTile
            label="Dependencies"
            value={(projectStats.dependencies.runtime + projectStats.dependencies.dev).toLocaleString('en-GB')}
            sub={`${projectStats.dependencies.runtime} runtime · ${projectStats.dependencies.dev} dev`}
          />
          {projectStats.git.commits != null ? (
            <StatTile
              label="Commits"
              value={projectStats.git.commits.toLocaleString('en-GB')}
              sub={`since ${projectStats.git.firstCommit}`}
            />
          ) : null}
          <StatTile
            label="Tracked files"
            value={projectStats.repository.trackedFiles.toLocaleString('en-GB')}
            sub={`${projectStats.repository.totalLines.toLocaleString('en-GB')} lines in the repository`}
          />
        </TileGrid>
      </Section>

      <div className="space-y-1 text-[11px] leading-relaxed text-[var(--color-muted)]">
        <p className="flex items-start gap-2">
          <Droplets aria-hidden="true" className="mt-0.5 h-3 w-3 shrink-0 stroke-[1.5]" />
          Rain totals are integrated from the rain rate, so they are estimates
          to the resolution of the tipping bucket.
        </p>
        <p>
          Everything above is computed in the browser from the same archive the
          CSV download uses — no number on this page is stored anywhere.
        </p>
      </div>
    </div>
  );
}
