'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  CloudRain,
  Compass,
  Droplet,
  Droplets,
  Gauge,
  Ruler,
  Sun,
  Sunrise,
  Thermometer,
  ThermometerSun,
  Wind,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { WeatherReading } from '@/lib/types';
import type { Concept, ConceptIcon } from '@/lib/content/concepts';
import type { UnitSystem } from '@/lib/units';
import {
  formatPressure,
  formatRain,
  formatSpeed,
  formatTemp,
} from '@/lib/units';
import { compassWord } from '@/lib/beaufort';
import { UncertaintyDemo } from './UncertaintyDemo';

export const CONCEPT_ICONS_MAP: Record<ConceptIcon, LucideIcon> = {
  thermometer: Thermometer,
  'thermometer-sun': ThermometerSun,
  droplets: Droplets,
  droplet: Droplet,
  wind: Wind,
  zap: Zap,
  compass: Compass,
  'cloud-rain': CloudRain,
  gauge: Gauge,
  sun: Sun,
  sunrise: Sunrise,
  ruler: Ruler,
};

/**
 * Unit labels honouring the unit toggle. Concepts whose units are identical
 * in both systems repeat the same string; temperature/wind/rain/pressure
 * and the uncertainty band convert.
 */
export const CONCEPT_UNITS: Record<
  Concept['id'],
  { metric: string; imperial: string }
> = {
  temperature: { metric: '°C', imperial: '°F' },
  'feels-like': { metric: '°C', imperial: '°F' },
  humidity: { metric: '% relative humidity', imperial: '% relative humidity' },
  'dew-point': { metric: '°C', imperial: '°F' },
  'wind-speed': {
    metric: 'km/h, Beaufort 0–12',
    imperial: 'mph, Beaufort 0–12',
  },
  'wind-gust': { metric: 'km/h', imperial: 'mph' },
  'wind-direction': {
    metric: 'degrees from north, compass label',
    imperial: 'degrees from north, compass label',
  },
  rain: { metric: 'mm, mm/h', imperial: 'in, in/h' },
  pressure: {
    metric: 'hPa (relative, sea-level corrected)',
    imperial: 'inHg (relative, sea-level corrected)',
  },
  'uv-index': { metric: 'UV index (0–11+)', imperial: 'UV index (0–11+)' },
  solar: { metric: 'W/m²', imperial: 'W/m²' },
  'measurement-uncertainty': {
    metric: '± °C, ± %, ± mm',
    imperial: '± °F, ± %, ± in',
  },
};

export function unitLabelFor(
  id: Concept['id'],
  unitSystem: UnitSystem
): string {
  const entry = CONCEPT_UNITS[id];
  return unitSystem === 'metric' ? entry.metric : entry.imperial;
}

/** Current station value for a concept, honouring the unit toggle. Null = hide. */
export function liveValueFor(
  id: Concept['id'],
  reading: WeatherReading | null,
  unitSystem: UnitSystem
): string | null {
  if (!reading) return null;
  switch (id) {
    case 'temperature': {
      const f = formatTemp(reading.temperatureC, unitSystem);
      return `${f.value} ${f.unit}`;
    }
    case 'feels-like': {
      if (reading.feelsLikeC == null) return null;
      const f = formatTemp(reading.feelsLikeC, unitSystem);
      return `${f.value} ${f.unit}`;
    }
    case 'humidity':
      return `${reading.humidityPct} %`;
    case 'dew-point': {
      if (reading.dewPointC == null) return null;
      const f = formatTemp(reading.dewPointC, unitSystem);
      return `${f.value} ${f.unit}`;
    }
    case 'wind-speed': {
      const f = formatSpeed(reading.windSpeedKmh, unitSystem);
      return `${f.value} ${f.unit}`;
    }
    case 'wind-gust': {
      const f = formatSpeed(reading.windGustKmh, unitSystem);
      return `${f.value} ${f.unit}`;
    }
    case 'wind-direction':
      return `${Math.round(reading.windDirectionDeg)}° ${compassWord(reading.windDirectionDeg)}`;
    case 'rain': {
      const rate = formatRain(reading.rainRateMmH, unitSystem);
      const today = formatRain(reading.rainTodayMm, unitSystem);
      return `${rate.value} ${rate.unit} now · ${today.value} ${today.unit} today`;
    }
    case 'pressure': {
      if (reading.pressureHpa == null) return null;
      const f = formatPressure(reading.pressureHpa, unitSystem);
      return `${f.value} ${f.unit}`;
    }
    case 'uv-index':
      return reading.uvIndex == null ? null : `UV ${reading.uvIndex}`;
    case 'solar':
      return reading.solarWm2 == null ? null : `${reading.solarWm2} W/m²`;
    case 'measurement-uncertainty':
      return null;
  }
}

export interface ExplainerCardProps {
  concept: Concept;
  audience: 'kids' | 'students';
  reading: WeatherReading | null;
  unitSystem: UnitSystem;
}

export function ExplainerCard({
  concept,
  audience,
  reading,
  unitSystem,
}: ExplainerCardProps) {
  const Icon = CONCEPT_ICONS_MAP[concept.icon];
  const live = liveValueFor(concept.id, reading, unitSystem);
  const isKids = audience === 'kids';

  return (
    <Card id={concept.id} className="overflow-hidden scroll-mt-28">
      <CardContent className="space-y-5 p-6">
        <div className="flex items-center gap-3 border-b border-[var(--color-border)] pb-4">
          <span
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] border border-[var(--color-border)] bg-[var(--color-background)]"
          >
            <Icon className="h-5 w-5 stroke-[1.5] text-[var(--color-text)]" />
          </span>
          <div className="min-w-0">
            <span className="label">Measurement concept</span>
            <h3 className="text-xl font-medium text-[var(--color-text)]">
              {concept.title}
            </h3>
          </div>
        </div>

        {live != null && (
          <p className="text-sm text-[var(--color-muted)]" role="status">
            Right now:{' '}
            <span className="numeric font-medium text-[var(--accent)]">
              {live}
            </span>
          </p>
        )}

        {isKids ? (
          <div className="learn-body space-y-3">
            <p className="leading-relaxed text-[var(--color-text)]">
              {concept.kids.summary}
            </p>
            <p className="leading-relaxed text-[var(--color-muted)]">
              <span className="font-medium text-[var(--color-text)]">
                Example:{' '}
              </span>
              {concept.kids.example}
            </p>
          </div>
        ) : (
          <div className="learn-body space-y-4">
            <p className="leading-relaxed text-[var(--color-text)]">
              {concept.students.summary}
            </p>
            <dl className="grid gap-3 rounded-[8px] border border-[var(--color-border)] bg-[var(--color-background)] p-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="label text-[10px]">How it is measured</dt>
                <dd className="mt-1 leading-relaxed text-[var(--color-text)]">
                  {concept.students.howMeasured}
                </dd>
              </div>
                <div>
                  <dt className="label text-[10px]">Unit</dt>
                  <dd className="numeric mt-1 text-[var(--color-text)]">
                    {unitLabelFor(concept.id, unitSystem)}
                  </dd>
                {concept.students.formula && (
                  <dd className="numeric mt-2 text-[var(--color-muted)]">
                    {concept.students.formula}
                  </dd>
                )}
              </div>
              <div className="border-t border-[var(--color-border)] pt-3 sm:col-span-2">
                <dt className="label text-[10px]">
                  Typical Dresden ranges
                </dt>
                <dd className="mt-1 leading-relaxed text-[var(--color-text)]">
                  Winter: {concept.students.typicalDresden.winter}
                  <br />
                  Summer: {concept.students.typicalDresden.summer}
                </dd>
              </div>
            </dl>
          </div>
        )}

        {concept.accuracyNote && (
          <p className="text-xs leading-relaxed text-[var(--color-muted)]">
            <span className="font-medium text-[var(--color-text)]">
              Accuracy:{' '}
            </span>
            {concept.accuracyNote}
          </p>
        )}

        {concept.id === 'measurement-uncertainty' && (
          <UncertaintyDemo
            liveTempC={reading?.temperatureC ?? null}
            unitSystem={unitSystem}
          />
        )}

        <div className="border-t border-[var(--color-border)] pt-3">
          <span className="label font-semibold text-[var(--accent)]">
            {isKids ? 'Try this:' : 'Classroom question:'}
          </span>
          <p className="mt-1 text-sm leading-relaxed text-[var(--color-text)]">
            {concept.tryThis}
          </p>
        </div>

        {concept.relatedMetricKey && (
          <p className="text-xs text-[var(--color-muted)]">
            <Link
              href={`/data?metric=${concept.relatedMetricKey}&range=24h`}
              className="text-[var(--accent)] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
            >
              See the {concept.title.toLowerCase()} chart
            </Link>{' '}
            from our station.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
