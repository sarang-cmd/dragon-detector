'use client';

import * as React from 'react';
import { useWeather } from '@/hooks/useWeather';
import { LiveDot } from '@/components/live-dot';
import { Sparkline } from '@/components/weather/Sparkline';
import { SkeletonTile } from '@/components/weather/SkeletonTile';
import { formatTemp, type UnitSystem } from '@/lib/units';
import { SITE_CONFIG } from '@/lib/site';

/**
 * Compact live card for embedding in another page (school site, Moodle,
 * digital signage). Sized to fill its iframe, follows the host page's theme
 * unless `theme` is forced, and refreshes on the same cadence as the
 * dashboard (60 s on live data).
 */
export function EmbedCard({ theme }: { theme?: 'dark' | 'light' }) {
  const { reading, history, isLoading, isStale, isOffline, secondsSinceMeasured, isMock } =
    useWeather();
  const [unitSystem] = React.useState<UnitSystem>('metric');

  const wrapper = theme ? theme : undefined;
  const h24 = history?.h24 ?? [];
  const series = h24.map((p) => p.temperatureC).filter((t): t is number => t != null);

  const status: 'live' | 'delayed' | 'offline' = isOffline
    ? 'offline'
    : isStale
      ? 'delayed'
      : 'live';

  return (
    <div
      className={wrapper}
      style={{
        minHeight: '100vh',
        background: 'var(--color-background)',
        color: 'var(--color-text)',
        padding: 16,
        boxSizing: 'border-box',
      }}
    >
      <div
        className="instrument-tile"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          padding: 20,
          minHeight: 0,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Masthead */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <span
              aria-hidden="true"
              style={{
                display: 'inline-block',
                width: 26,
                height: 4,
                borderRadius: 2,
                background: 'var(--accent)',
                flexShrink: 0,
              }}
            />
            <span
              className="label"
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {SITE_CONFIG.stationName}
            </span>
          </div>
          <LiveDot status={status} seconds={secondsSinceMeasured} />
        </div>

        {isLoading && !reading ? (
          <SkeletonTile />
        ) : reading ? (
          <>
            {/* Headline reading */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span
                className="numeric"
                style={{
                  fontSize: 'clamp(2.75rem, 9vw, 4.5rem)',
                  fontWeight: 300,
                  lineHeight: 1,
                  letterSpacing: '-0.03em',
                }}
              >
                {formatTemp(reading.temperatureC, unitSystem).value}
              </span>
              <span style={{ fontSize: '1.25rem', color: 'var(--color-muted)' }}>
                {formatTemp(reading.temperatureC, unitSystem).unit}
              </span>
            </div>

            {/* Secondary readings */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: 12,
                fontSize: '0.8125rem',
              }}
            >
              <Stat
                label="Feels like"
                value={
                  reading.feelsLikeC != null
                    ? `${formatTemp(reading.feelsLikeC, unitSystem).value}°`
                    : '—'
                }
              />
              <Stat label="Humidity" value={`${Math.round(reading.humidityPct)}%`} />
              <Stat label="Wind" value={`${Math.round(reading.windSpeedKmh)} km/h`} />
            </div>

            {series.length > 1 ? (
              <div style={{ marginTop: 2 }}>
                <Sparkline data={series} height={34} label="24-hour temperature trend" unit="°C" />
              </div>
            ) : null}

            {/* Honest footer: names the real backend and links back */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                paddingTop: 10,
                borderTop: '1px solid var(--color-border)',
                fontSize: '0.6875rem',
                color: 'var(--color-muted)',
              }}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {isMock
                  ? 'Demo · simulated readings'
                  : reading.source === 'ecowitt'
                    ? `${SITE_CONFIG.stationModel} · measured on site`
                    : 'Open-Meteo area model'}
              </span>
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--accent)', whiteSpace: 'nowrap' }}
              >
                Full dashboard →
              </a>
            </div>
          </>
        ) : (
          <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)' }}>
            Live data unavailable right now.
          </p>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span className="label" style={{ fontSize: '0.625rem' }}>
        {label}
      </span>
      <span className="numeric" style={{ fontSize: '1rem', color: 'var(--color-text)' }}>
        {value}
      </span>
    </div>
  );
}
