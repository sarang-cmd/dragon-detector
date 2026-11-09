'use client';

import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Download, TableProperties } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useHistory } from '@/hooks/useHistory';
import { useUnitSystem } from '@/context/unit-context';
import type { HistoryPoint } from '@/lib/types';
import { cToF, hPaToInHg, kmhToMph, mmToIn } from '@/lib/units';
import {
  METRICS,
  HistoryRange,
  MetricKey,
  berlinToday,
  buildHistoryCsv,
  computeStats,
  csvFileName,
  cumulativeRain,
  downloadCsv,
  formatStatTime,
  formatTick,
  formatTooltipTime,
  paddedDomain,
  parseMetric,
  parseRange,
  SeriesStats,
} from '@/lib/history';

const ACCENT = 'var(--accent)';
const NEUTRAL = 'var(--color-muted)';

const AXIS_TICK = { fill: 'var(--color-muted)', fontSize: 11 };

// ---------- shared chart tooltip (design system) ----------

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number | string | null;
    color?: string;
    stroke?: string;
  }>;
  label?: string;
}) {
  if (!active || !payload || payload.length === 0 || !label) return null;
  return (
    <div className="rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 shadow-none">
      <div className="mb-1 text-[11px] uppercase tracking-wider text-[var(--color-muted)]">
        {formatTooltipTime(label)}
      </div>
      <div className="space-y-0.5">
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span
              aria-hidden="true"
              className="h-2 w-2 rounded-full"
              style={{ background: entry.color ?? entry.stroke ?? ACCENT }}
            />
            <span className="text-[var(--color-muted)]">{entry.name}</span>
            <span className="numeric ml-auto pl-4 font-medium text-[var(--color-text)]">
              {typeof entry.value === 'number'
                ? entry.value
                : (entry.value ?? '-')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChartShell({
  range,
  children,
  heightClass = 'h-[320px]',
  label,
}: {
  range: HistoryRange;
  children: React.ReactNode;
  heightClass?: string;
  label: string;
}) {
  return (
    <div
      className={`${heightClass} w-full`}
      role="img"
      aria-label={label}
    >
      <ResponsiveContainer width="100%" height="100%">
        {children as React.ReactElement}
      </ResponsiveContainer>
    </div>
  );
}

function baseAxes(range: HistoryRange) {
  return (
    <>
      <CartesianGrid
        vertical={false}
        stroke="var(--color-text)"
        strokeOpacity={0.06}
      />
      <XAxis
        dataKey="timestamp"
        tickFormatter={(iso: string) => formatTick(iso, range)}
        tick={AXIS_TICK}
        tickLine={false}
        axisLine={false}
        minTickGap={48}
      />
    </>
  );
}

// ---------- stat chips ----------

function fmt1(v: number): string {
  return v.toFixed(1);
}

function fmtInt(v: number): string {
  return Math.round(v).toString();
}

function fmtRain(v: number, isMetric: boolean): string {
  return isMetric ? v.toFixed(1) : v.toFixed(2);
}

function fmtPressure(v: number, isMetric: boolean): string {
  return isMetric ? v.toFixed(1) : v.toFixed(2);
}

function StatChips({
  stats,
  formatValue,
  unit,
}: {
  stats: SeriesStats | null;
  formatValue: (v: number) => string;
  unit: string;
}) {
  if (!stats) return null;
  const changeSign = stats.change > 0 ? '+' : '';
  const chips = [
    {
      label: 'Minimum',
      value: `${formatValue(stats.min)} ${unit}`,
      sub: formatStatTime(stats.minTime),
    },
    {
      label: 'Maximum',
      value: `${formatValue(stats.max)} ${unit}`,
      sub: formatStatTime(stats.maxTime),
    },
    {
      label: 'Average',
      value: `${formatValue(stats.avg)} ${unit}`,
      sub: `${stats.count} readings`,
    },
    {
      label: 'Change',
      value: `${changeSign}${formatValue(stats.change)} ${unit}`,
      sub: 'over range',
    },
  ];
  return (
    <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {chips.map((chip) => (
        <div
          key={chip.label}
          className="rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
        >
          <dt className="label">{chip.label}</dt>
          <dd className="numeric mt-1 text-lg font-medium text-[var(--color-text)]">
            {chip.value}
          </dd>
          <dd className="mt-0.5 text-[11px] text-[var(--color-muted)]">
            {chip.sub}
          </dd>
        </div>
      ))}
    </dl>
  );
}

// ---------- main client ----------

export function DataClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { unitSystem } = useUnitSystem();

  const range: HistoryRange = parseRange(searchParams.get('range'));
  const metric: MetricKey = parseMetric(searchParams.get('metric'));
  // Table view is also URL-shareable (?view=table); charts are the default.
  const showTable = searchParams.get('view') === 'table';

  const { points, isLoading, error, retry } = useHistory(range);

  const setParams = React.useCallback(
    (next: { range?: HistoryRange; metric?: MetricKey; view?: 'chart' | 'table' }) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next.range) params.set('range', next.range);
      if (next.metric) params.set('metric', next.metric);
      if (next.view) {
        if (next.view === 'table') params.set('view', 'table');
        else params.delete('view');
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const sorted = React.useMemo(
    () =>
      [...(points ?? [])].sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      ),
    [points]
  );

  const metricLabel = METRICS.find((m) => m.key === metric)?.label ?? metric;

  const handleDownload = React.useCallback(() => {
    const csv = buildHistoryCsv(sorted);
    downloadCsv(csv, csvFileName(range, berlinToday()));
  }, [sorted, range]);

  // ----- display-unit conversions (charts, stats, table) -----
  const conv = React.useMemo(() => {
    const isMetric = unitSystem === 'metric';
    const tempUnit = isMetric ? '°C' : '°F';
    const speedUnit = isMetric ? 'km/h' : 'mph';
    const rainUnit = isMetric ? 'mm' : 'in';
    const rainRateUnit = isMetric ? 'mm/h' : 'in/h';
    const pressureUnit = isMetric ? 'hPa' : 'inHg';
    const toTemp = (c: number | null | undefined) =>
      c == null ? null : isMetric ? c : Math.round(cToF(c) * 10) / 10;
    const toSpeed = (kmh: number | null | undefined) =>
      kmh == null ? null : Math.round((isMetric ? kmh : kmhToMph(kmh)) * 10) / 10;
    const toRain = (mm: number | null | undefined) =>
      mm == null
        ? null
        : isMetric
          ? Math.round(mm * 10) / 10
          : Math.round(mmToIn(mm) * 100) / 100;
    const toPressure = (hpa: number | null | undefined) =>
      hpa == null
        ? null
        : isMetric
          ? Math.round(hpa * 10) / 10
          : Math.round(hPaToInHg(hpa) * 100) / 100;
    return {
      isMetric,
      tempUnit,
      speedUnit,
      rainUnit,
      rainRateUnit,
      pressureUnit,
      toTemp,
      toSpeed,
      toRain,
      toPressure,
    };
  }, [unitSystem]);

  const rows = React.useMemo(() => {
    const cum = cumulativeRain(
      sorted,
      sorted.map((p) => conv.toRain(p.rainRateMmH))
    );
    return sorted.map((p: HistoryPoint, i: number) => ({
      timestamp: p.timestamp,
      temp: conv.toTemp(p.temperatureC),
      dew: conv.toTemp(p.dewPointC),
      speed: conv.toSpeed(p.windSpeedKmh),
      gust: conv.toSpeed(p.windGustKmh),
      dir: p.windDirectionDeg ?? null,
      rainRate: conv.toRain(p.rainRateMmH),
      rainToday: conv.toRain(p.rainTodayMm),
      cumulative: cum[i],
      pressure: conv.toPressure(p.pressureHpa),
      humidity: p.humidityPct ?? null,
      uv: p.uvIndex ?? null,
      solar: p.solarWm2 ?? null,
    }));
  }, [sorted, conv]);

  const tempStats = React.useMemo(
    () =>
      computeStats(
        rows.map((r) => ({ timestamp: r.timestamp, value: r.temp }))
      ),
    [rows]
  );
  const windStats = React.useMemo(
    () =>
      computeStats(
        rows.map((r) => ({ timestamp: r.timestamp, value: r.speed }))
      ),
    [rows]
  );
  const rainStats = React.useMemo(
    () =>
      computeStats(
        rows.map((r) => ({ timestamp: r.timestamp, value: r.rainRate }))
      ),
    [rows]
  );
  const pressureStats = React.useMemo(
    () =>
      computeStats(
        rows.map((r) => ({ timestamp: r.timestamp, value: r.pressure }))
      ),
    [rows]
  );
  const humidityStats = React.useMemo(
    () =>
      computeStats(
        rows.map((r) => ({ timestamp: r.timestamp, value: r.humidity }))
      ),
    [rows]
  );
  const solarStats = React.useMemo(
    () =>
      computeStats(
        rows.map((r) => ({ timestamp: r.timestamp, value: r.solar }))
      ),
    [rows]
  );
  const uvPeak = React.useMemo(
    () =>
      computeStats(rows.map((r) => ({ timestamp: r.timestamp, value: r.uv }))),
    [rows]
  );

  const isMetric = conv.isMetric;
  const fmtRainBound = React.useCallback(
    (v: number) => fmtRain(v, isMetric),
    [isMetric]
  );
  const fmtPressureBound = React.useCallback(
    (v: number) => fmtPressure(v, isMetric),
    [isMetric]
  );

  // ----- table columns per metric -----
  const table = React.useMemo(() => {
    switch (metric) {
      case 'temperature':
        return {
          head: ['Time (Berlin)', `Temp (${conv.tempUnit})`, `Dew point (${conv.tempUnit})`],
          rows: rows.map((r) => [
            formatTooltipTime(r.timestamp),
            r.temp == null ? '-' : fmt1(r.temp),
            r.dew == null ? '-' : fmt1(r.dew),
          ]),
        };
      case 'wind':
        return {
          head: ['Time (Berlin)', `Speed (${conv.speedUnit})`, `Gust (${conv.speedUnit})`, 'Dir (°)'],
          rows: rows.map((r) => [
            formatTooltipTime(r.timestamp),
            r.speed == null ? '-' : fmtInt(r.speed),
            r.gust == null ? '-' : fmtInt(r.gust),
            r.dir == null ? '-' : fmtInt(r.dir),
          ]),
        };
      case 'rain':
        return {
          head: [
            'Time (Berlin)',
            `Rate (${conv.rainRateUnit})`,
            `Today (${conv.rainUnit})`,
            `Cumulative (${conv.rainUnit})`,
          ],
          rows: rows.map((r) => [
            formatTooltipTime(r.timestamp),
            r.rainRate == null ? '-' : fmtRainBound(r.rainRate),
            r.rainToday == null ? '-' : fmtRainBound(r.rainToday),
            r.cumulative == null ? '-' : fmtRainBound(r.cumulative),
          ]),
        };
      case 'pressure':
        return {
          head: ['Time (Berlin)', `Pressure (${conv.pressureUnit})`],
          rows: rows.map((r) => [
            formatTooltipTime(r.timestamp),
            r.pressure == null ? '-' : fmtPressureBound(r.pressure),
          ]),
        };
      case 'humidity':
        return {
          head: ['Time (Berlin)', 'Humidity (%)'],
          rows: rows.map((r) => [
            formatTooltipTime(r.timestamp),
            r.humidity == null ? '-' : fmtInt(r.humidity),
          ]),
        };
      case 'sun':
        return {
          head: ['Time (Berlin)', 'UV index', 'Solar (W/m²)'],
          rows: rows.map((r) => [
            formatTooltipTime(r.timestamp),
            r.uv == null ? '-' : fmt1(r.uv),
            r.solar == null ? '-' : fmtInt(r.solar),
          ]),
        };
    }
  }, [metric, rows, conv, fmtRainBound, fmtPressureBound]);

  const chartLabel = `${metricLabel} history, last ${range === '24h' ? '24 hours' : '7 days'}`;

  return (
    <div>
      {/* Range switch + actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--color-border)] pb-4">
        <div role="group" aria-label="Time range" className="flex items-center gap-2">
          <span className="label">Range</span>
          <div className="inline-flex rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] p-1 text-xs">
            {(['24h', '7d'] as HistoryRange[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setParams({ range: r })}
                aria-pressed={range === r}
                className={`min-h-[44px] px-4 inline-flex items-center justify-center rounded-[6px] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent)] ${
                  range === r
                    ? 'bg-[var(--color-border)] font-medium text-[var(--color-text)]'
                    : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
                }`}
              >
                {r === '24h' ? '24 hours' : '7 days'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setParams({ view: showTable ? 'chart' : 'table' })}
            aria-pressed={showTable}
            className="gap-2"
          >
            <TableProperties className="h-3.5 w-3.5" strokeWidth={1.5} />
            <span>{showTable ? 'View as chart' : 'View as table'}</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload} className="gap-2">
            <Download className="h-3.5 w-3.5" strokeWidth={1.5} />
            <span>Download CSV</span>
          </Button>
        </div>
      </div>

      {/* Metric tabs */}
      <div
        role="tablist"
        aria-label="Measurement"
        className="mt-6 flex gap-1 overflow-x-auto border-b border-[var(--color-border)]"
      >
        {METRICS.map((m) => {
          const selected = metric === m.key;
          return (
            <button
              key={m.key}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`panel-${m.key}`}
              id={`tab-${m.key}`}
              onClick={() => setParams({ metric: m.key })}
              className={`relative min-h-[44px] whitespace-nowrap px-4 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent)] ${
                selected
                  ? 'font-medium text-[var(--color-text)]'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              {m.label}
              {selected && (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-3 bottom-0 h-[2px] rounded-full bg-[var(--accent)]"
                />
              )}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`panel-${metric}`}
        aria-labelledby={`tab-${metric}`}
        className="pt-6"
      >
        {isLoading && rows.length === 0 ? (
          <div aria-label="Loading history" aria-busy="true">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-[86px] animate-pulse rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)]"
                />
              ))}
            </div>
            <div className="mt-4 h-[320px] animate-pulse rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)]" />
          </div>
        ) : error && rows.length === 0 ? (
          <div
            role="alert"
            className="rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
          >
            <p className="text-sm font-medium text-[var(--color-text)]">
              History is unavailable right now.
            </p>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              Check your connection and try again.
            </p>
            <Button variant="outline" size="sm" onClick={retry} className="mt-4">
              Retry
            </Button>
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
            <p className="text-sm text-[var(--color-muted)]">
              No data for this period yet.
            </p>
          </div>
        ) : showTable ? (
          <div>
            <StatChips
              stats={
                metric === 'temperature'
                  ? tempStats
                  : metric === 'wind'
                    ? windStats
                    : metric === 'rain'
                      ? rainStats
                      : metric === 'pressure'
                        ? pressureStats
                        : metric === 'humidity'
                          ? humidityStats
                          : solarStats
              }
              formatValue={
                metric === 'wind' || metric === 'humidity'
                  ? fmtInt
                  : metric === 'rain'
                    ? fmtRainBound
                    : metric === 'pressure'
                      ? fmtPressureBound
                      : fmt1
              }
              unit={
                metric === 'temperature'
                  ? conv.tempUnit
                  : metric === 'wind'
                    ? conv.speedUnit
                    : metric === 'rain'
                      ? conv.rainRateUnit
                      : metric === 'pressure'
                        ? conv.pressureUnit
                        : metric === 'humidity'
                          ? '%'
                          : 'W/m²'
              }
            />
            <div className="mt-4 max-h-[420px] overflow-auto rounded-[12px] border border-[var(--color-border)]">
              <table className="w-full border-collapse text-sm">
                <caption className="sr-only">
                  {chartLabel} as a data table
                </caption>
                <thead className="sticky top-0 bg-[var(--color-surface)]">
                  <tr className="border-b border-[var(--color-border)]">
                    {table.head.map((h) => (
                      <th
                        key={h}
                        scope="col"
                        className="label whitespace-nowrap px-4 py-3 text-left"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {table.rows.map((cells, i) => (
                    <tr
                      key={rows[i]?.timestamp ?? i}
                      className="border-b border-[var(--color-border)] last:border-0"
                    >
                      {cells.map((cell, j) => (
                        <td
                          key={j}
                          className={
                            j === 0
                              ? 'whitespace-nowrap px-4 py-2 text-[var(--color-muted)]'
                              : 'numeric whitespace-nowrap px-4 py-2 text-[var(--color-text)]'
                          }
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-[11px] text-[var(--color-muted)]">
              {rows.length} readings. Values shown in {unitSystem} units; the
              CSV download is always metric.
            </p>
          </div>
        ) : (
          <div>
            {metric === 'temperature' && (
              <>
                <StatChips stats={tempStats} formatValue={fmt1} unit={conv.tempUnit} />
                <div className="mt-4 rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                  <ChartShell range={range} label={chartLabel}>
                    <LineChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                      {baseAxes(range)}
                      <YAxis
                        width={44}
                        tick={AXIS_TICK}
                        tickLine={false}
                        axisLine={false}
                        domain={['auto', 'auto']}
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <Line isAnimationActive={false}
                        type="monotone"
                        dataKey="temp"
                        name={`Temperature (${conv.tempUnit})`}
                        stroke={ACCENT}
                        strokeWidth={1.5}
                        dot={false}
                        activeDot={{ r: 3 }}
                      />
                      <Line isAnimationActive={false}
                        type="monotone"
                        dataKey="dew"
                        name={`Dew point (${conv.tempUnit})`}
                        stroke={NEUTRAL}
                        strokeWidth={1.5}
                        strokeDasharray="4 4"
                        dot={false}
                        activeDot={{ r: 3 }}
                        connectNulls
                      />
                    </LineChart>
                  </ChartShell>
                </div>
              </>
            )}

            {metric === 'wind' && (
              <>
                <StatChips stats={windStats} formatValue={fmtInt} unit={conv.speedUnit} />
                <div className="mt-4 rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                  <ChartShell range={range} label={chartLabel}>
                    <LineChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                      {baseAxes(range)}
                      <YAxis
                        width={40}
                        tick={AXIS_TICK}
                        tickLine={false}
                        axisLine={false}
                        domain={[0, 'auto']}
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <Line isAnimationActive={false}
                        type="monotone"
                        dataKey="speed"
                        name={`Speed (${conv.speedUnit})`}
                        stroke={ACCENT}
                        strokeWidth={1.5}
                        dot={false}
                        activeDot={{ r: 3 }}
                      />
                      <Line isAnimationActive={false}
                        type="monotone"
                        dataKey="gust"
                        name={`Gust (${conv.speedUnit})`}
                        stroke={NEUTRAL}
                        strokeWidth={1}
                        strokeDasharray="2 3"
                        dot={{ r: 1.5, strokeWidth: 0 }}
                        activeDot={{ r: 3 }}
                        connectNulls
                      />
                    </LineChart>
                  </ChartShell>
                </div>
              </>
            )}

            {metric === 'rain' && (
              <>
                <StatChips stats={rainStats} formatValue={fmtRainBound} unit={conv.rainRateUnit} />
                <div className="mt-4 rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                  <ChartShell range={range} label={chartLabel}>
                    <ComposedChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                      {baseAxes(range)}
                      <YAxis
                        yAxisId="left"
                        width={44}
                        tick={AXIS_TICK}
                        tickLine={false}
                        axisLine={false}
                        domain={[0, 'auto']}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        width={44}
                        tick={AXIS_TICK}
                        tickLine={false}
                        axisLine={false}
                        domain={[0, 'auto']}
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar
                        isAnimationActive={false}
                        yAxisId="left"
                        dataKey="rainRate"
                        name={`Per interval (${conv.rainRateUnit})`}
                        fill={ACCENT}
                        radius={[2, 2, 0, 0]}
                      />
                      <Line isAnimationActive={false}
                        yAxisId="right"
                        type="monotone"
                        dataKey="cumulative"
                        name={`Cumulative (${conv.rainUnit})`}
                        stroke={NEUTRAL}
                        strokeWidth={1.5}
                        dot={false}
                        activeDot={{ r: 3 }}
                        connectNulls
                      />
                    </ComposedChart>
                  </ChartShell>
                </div>
              </>
            )}

            {metric === 'pressure' && (
              <>
                <StatChips stats={pressureStats} formatValue={fmtPressureBound} unit={conv.pressureUnit} />
                <div className="mt-4 rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                  <ChartShell range={range} label={chartLabel}>
                    <LineChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                      {baseAxes(range)}
                      <YAxis
                        width={52}
                        tick={AXIS_TICK}
                        tickLine={false}
                        axisLine={false}
                        domain={paddedDomain(rows.map((r) => r.pressure))}
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <Line isAnimationActive={false}
                        type="monotone"
                        dataKey="pressure"
                        name={`Pressure (${conv.pressureUnit})`}
                        stroke={ACCENT}
                        strokeWidth={1.5}
                        dot={false}
                        activeDot={{ r: 3 }}
                        connectNulls
                      />
                    </LineChart>
                  </ChartShell>
                </div>
              </>
            )}

            {metric === 'humidity' && (
              <>
                <StatChips stats={humidityStats} formatValue={fmtInt} unit="%" />
                <div className="mt-4 rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                  <ChartShell range={range} label={chartLabel}>
                    <LineChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                      {baseAxes(range)}
                      <YAxis
                        width={40}
                        tick={AXIS_TICK}
                        tickLine={false}
                        axisLine={false}
                        domain={[0, 100]}
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <Line isAnimationActive={false}
                        type="monotone"
                        dataKey="humidity"
                        name="Humidity (%)"
                        stroke={ACCENT}
                        strokeWidth={1.5}
                        dot={false}
                        activeDot={{ r: 3 }}
                        connectNulls
                      />
                    </LineChart>
                  </ChartShell>
                </div>
              </>
            )}

            {metric === 'sun' && (
              <>
                <StatChips stats={solarStats} formatValue={fmtInt} unit="W/m²" />
                {uvPeak && (
                  <p className="mt-3 text-xs text-[var(--color-muted)]">
                    Peak UV index{' '}
                    <span className="numeric font-medium text-[var(--color-text)]">
                      {fmt1(uvPeak.max)}
                    </span>{' '}
                    at {formatStatTime(uvPeak.maxTime)} (Berlin).
                  </p>
                )}
                <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div className="rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                    <div className="label mb-2">UV index</div>
                    <ChartShell range={range} heightClass="h-[200px]" label={`UV index, last ${range}`}>
                      <LineChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                        {baseAxes(range)}
                        <YAxis
                          width={32}
                          tick={AXIS_TICK}
                          tickLine={false}
                          axisLine={false}
                          domain={[0, 11]}
                        />
                        <Tooltip content={<ChartTooltip />} />
                        <Line isAnimationActive={false}
                          type="monotone"
                          dataKey="uv"
                          name="UV index"
                          stroke={ACCENT}
                          strokeWidth={1.5}
                          dot={false}
                          activeDot={{ r: 3 }}
                          connectNulls
                        />
                      </LineChart>
                    </ChartShell>
                  </div>
                  <div className="rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                    <div className="label mb-2">Solar radiation</div>
                    <ChartShell range={range} heightClass="h-[200px]" label={`Solar radiation, last ${range}`}>
                      <LineChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                        {baseAxes(range)}
                        <YAxis
                          width={40}
                          tick={AXIS_TICK}
                          tickLine={false}
                          axisLine={false}
                          domain={[0, 'auto']}
                        />
                        <Tooltip content={<ChartTooltip />} />
                        <Line isAnimationActive={false}
                          type="monotone"
                          dataKey="solar"
                          name="Solar (W/m²)"
                          stroke={ACCENT}
                          strokeWidth={1.5}
                          dot={false}
                          activeDot={{ r: 3 }}
                          connectNulls
                        />
                      </LineChart>
                    </ChartShell>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
