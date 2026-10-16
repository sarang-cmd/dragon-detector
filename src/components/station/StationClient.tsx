'use client';

import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { useUnitSystem, type UnitSystem } from '@/context/unit-context';

interface SensorRow {
  name: string;
  model: string;
  metric: { range: string; accuracy: string; resolution: string };
  imperial: { range: string; accuracy: string; resolution: string };
}

export const sensors: SensorRow[] = [
  {
    name: 'Ambient Temperature',
    model: 'Integrated Thermistor',
    metric: { range: '-40 °C to +60 °C', accuracy: '±1.0 °C', resolution: '0.1 °C' },
    imperial: { range: '-40 °F to +140 °F', accuracy: '±1.8 °F', resolution: '0.2 °F' },
  },
  {
    name: 'Relative Humidity',
    model: 'Capacitive Polymer',
    metric: { range: '10 % to 99 %', accuracy: '±5 % RH', resolution: '1 %' },
    imperial: { range: '10 % to 99 %', accuracy: '±5 % RH', resolution: '1 %' },
  },
  {
    name: 'Rainfall Accumulation',
    model: 'Tipping Bucket',
    metric: { range: '0 to 9,999 mm', accuracy: '±10 %', resolution: '0.1 mm' },
    imperial: { range: '0 to 393.66 in', accuracy: '±10 %', resolution: '0.004 in' },
  },
  {
    name: 'Wind Speed',
    model: '3-Cup Anemometer',
    metric: { range: '0 to 180 km/h', accuracy: '±1 m/s (<5 m/s) or ±10 %', resolution: '0.1 km/h' },
    imperial: { range: '0 to 112 mph', accuracy: '±2.2 mph (<11 mph) or ±10 %', resolution: '0.1 mph' },
  },
  {
    name: 'Wind Bearing',
    model: 'Counterweighted Vane',
    metric: { range: '0° to 359°', accuracy: '±10° (16 points)', resolution: '1°' },
    imperial: { range: '0° to 359°', accuracy: '±10° (16 points)', resolution: '1°' },
  },
  {
    name: 'Barometric Pressure',
    model: 'Solid-state Piezoresistive',
    metric: { range: '300 to 1,100 hPa', accuracy: '±3.0 hPa', resolution: '0.1 hPa' },
    imperial: { range: '8.86 to 32.48 inHg', accuracy: '±0.09 inHg', resolution: '0.003 inHg' },
  },
  {
    name: 'Solar & UV',
    model: 'Photodiode + UV filter',
    metric: { range: '0 to 200 klux / 0–15 UVI', accuracy: '±15 %', resolution: '1 lux / 1 UVI' },
    imperial: { range: '0 to 200 klux / 0–15 UVI', accuracy: '±15 %', resolution: '1 lux / 1 UVI' },
  },
];

export function sensorRowFor(
  row: SensorRow,
  unitSystem: UnitSystem
): { range: string; accuracy: string; resolution: string } {
  return unitSystem === 'metric' ? row.metric : row.imperial;
}

export function StationClient() {
  const { unitSystem } = useUnitSystem();
  const unitWord = unitSystem === 'metric' ? 'metric' : 'imperial';

  return (
    <>
      {/* Title */}
      <div className="flex flex-col gap-4 mb-10">
        <span className="label">Station Hardware &amp; Siting</span>
        <h1 className="display text-[var(--color-text)]">The Station</h1>
        <p className="max-w-2xl text-base sm:text-lg leading-relaxed text-[var(--color-muted)]">
          Technical specifications, mounting geometry, sensor tolerances, and
          maintenance records for our Dresden campus weather observatory.
        </p>
      </div>

      {/* Station Metadata Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Card className="p-6">
          <span className="label">Hardware Platform</span>
          <div className="mt-3 text-lg font-medium text-[var(--color-text)]">
            Sainlogic WS3500
          </div>
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            All-in-one wireless sensor array uploading via 868 MHz RF to
            Ecowitt Cloud gateway.
          </p>
        </Card>

        <Card className="p-6">
          <span className="label">Mounting Siting</span>
          <div className="mt-3 text-lg font-medium text-[var(--color-text)]">
            Rooftop Mast (14 m AGL)
          </div>
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            Elevated above campus building roof to minimize turbulence and
            radiant thermal absorption.
          </p>
        </Card>

        <Card className="p-6">
          <span className="label">Coordinates &amp; Datum</span>
          <div className="mt-3 text-lg font-medium text-[var(--color-text)] numeric">
            51.0504&deg; N, 13.7373&deg; E
          </div>
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            Elevation: 112 m above sea level. Timezone: Europe/Berlin.
          </p>
        </Card>
      </div>

      {/* Sensor Tolerances Table */}
      <div className="mb-12">
        <div className="mb-4">
          <h2 className="text-xl font-medium text-[var(--color-text)]">
            Sensor Inventory &amp; Tolerances
          </h2>
          <p className="text-xs text-[var(--color-muted)] mt-1">
            Manufacturer specifications from Sainlogic documentation for
            student calibration reference. Values shown in {unitWord} units.
          </p>
        </div>

        <div data-tour="station-table" className="overflow-x-auto rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)]">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[var(--color-border)] bg-[var(--color-background)]/50 text-[var(--color-muted)]">
              <tr>
                <th className="p-4 font-medium label">Parameter</th>
                <th className="p-4 font-medium label">Sensor Type</th>
                <th className="p-4 font-medium label">Operating Range</th>
                <th className="p-4 font-medium label">Accuracy</th>
                <th className="p-4 font-medium label">Resolution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)] text-[var(--color-text)]">
              {sensors.map((s) => {
                const shown = sensorRowFor(s, unitSystem);
                return (
                  <tr
                    key={s.name}
                    className="hover:bg-[var(--color-background)]/40 transition-colors"
                  >
                    <td className="p-4 font-medium">{s.name}</td>
                    <td className="p-4 text-[var(--color-muted)]">{s.model}</td>
                    <td className="p-4 numeric">{shown.range}</td>
                    <td className="p-4 numeric text-[var(--accent)] font-medium">
                      {shown.accuracy}
                    </td>
                    <td className="p-4 numeric text-[var(--color-muted)]">
                      {shown.resolution}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* About the Club & Dragon Badge */}
      <Card className="p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <span className="label text-[var(--accent)] font-semibold">
              Student Science Initiative
            </span>
            <h3 className="text-2xl font-light text-[var(--color-text)]">
              DIS Weather Club &amp; The Dragons
            </h3>
            <p className="text-sm leading-relaxed text-[var(--color-muted)]">
              The station was installed and is maintained by students of the
              Dresden International School Weather Club. Observations are used
              in secondary science coursework to investigate urban heat
              islands, Elbe river microclimates, and regional frontal
              passages.
            </p>
            <div className="pt-2 text-xs text-[var(--color-muted)] flex items-center gap-4">
              <span>Faculty Advisor: Science Department</span>
              <span>&middot;</span>
              <span>Established 2026</span>
            </div>
          </div>

          {/* Dragon badge: restricted to /station per docs/03a */}
          <div className="shrink-0 flex flex-col items-center gap-2">
            <div className="rounded-full bg-white p-2 border border-neutral-200">
              <Image
                src="/brand/dis-dragons-badge.png"
                alt="DIS Dragons Athletic and Science Emblem"
                width={160}
                height={160}
                className="h-36 w-36 object-contain rounded-full"
              />
            </div>
            <span className="label text-[10px]">Dresden Dragons</span>
          </div>
        </div>
      </Card>
    </>
  );
}
