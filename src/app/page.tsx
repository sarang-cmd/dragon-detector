import Link from 'next/link';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Card, CardContent } from '@/components/ui/card';
import { StatusStrip } from '@/components/weather/StatusStrip';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-background)]">
      <Header />
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-8 sm:px-6 sm:py-12">
        {/* Hero Section */}
        <div className="flex flex-col gap-4 mb-10">
          <StatusStrip />

          <h1 className="display text-[var(--color-text)]">
            Live Weather
          </h1>

          <p className="max-w-2xl text-base sm:text-lg leading-relaxed text-[var(--color-muted)]">
            Continuous meteorological observations transmitted live from our rooftop station on the Dresden International School grounds.
          </p>
        </div>

        {/* Bento Instrument Grid Preview */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
          {/* Main Hero Metric (spans 2 cols on tablet/desktop) */}
          <Card className="sm:col-span-2 p-6 flex flex-col justify-between min-h-[220px]">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="label">Air Temperature</span>
                <span className="label text-[var(--accent)] font-semibold">Primary Sensor</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="numeric text-6xl sm:text-7xl font-light tracking-tight text-[var(--color-text)]">
                  --.-
                </span>
                <span className="text-2xl text-[var(--color-muted)]">&deg;C</span>
              </div>
            </div>
            <div className="border-t border-[var(--color-border)] pt-4 mt-6 flex items-center justify-between text-xs text-[var(--color-muted)]">
              <span>Full instrument reading pipeline in next stage</span>
              <span className="numeric">0.1&deg;C resolution</span>
            </div>
          </Card>

          {/* Wind Tile */}
          <Card className="p-6 flex flex-col justify-between min-h-[220px]">
            <div>
              <span className="label">Wind &amp; Gusts</span>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="numeric text-4xl font-light text-[var(--color-text)]">--</span>
                <span className="text-sm text-[var(--color-muted)]">km/h</span>
              </div>
              <p className="mt-2 text-xs text-[var(--color-muted)]">
                Calibrated cup anemometer and wind vane
              </p>
            </div>
            <div className="border-t border-[var(--color-border)] pt-3 text-[11px] text-[var(--color-muted)]">
              Bearing &amp; Beaufort scale
            </div>
          </Card>

          {/* Precipitation Tile */}
          <Card className="p-6 flex flex-col justify-between min-h-[220px]">
            <div>
              <span className="label">Precipitation</span>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="numeric text-4xl font-light text-[var(--color-text)]">0.0</span>
                <span className="text-sm text-[var(--color-muted)]">mm</span>
              </div>
              <p className="mt-2 text-xs text-[var(--color-muted)]">
                Tipping-bucket self-emptying rain gauge
              </p>
            </div>
            <div className="border-t border-[var(--color-border)] pt-3 text-[11px] text-[var(--color-muted)]">
              Resets 00:00 Europe/Berlin
            </div>
          </Card>

          {/* Barometric Pressure */}
          <Card className="p-6 flex flex-col justify-between min-h-[180px]">
            <div>
              <span className="label">Relative Pressure</span>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="numeric text-3xl font-light text-[var(--color-text)]">1013.2</span>
                <span className="text-xs text-[var(--color-muted)]">hPa</span>
              </div>
            </div>
            <div className="text-[11px] text-[var(--color-muted)]">
              Trend: Steady (&plusmn;0.2 hPa / 3h)
            </div>
          </Card>

          {/* Relative Humidity */}
          <Card className="p-6 flex flex-col justify-between min-h-[180px]">
            <div>
              <span className="label">Relative Humidity</span>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="numeric text-3xl font-light text-[var(--color-text)]">--</span>
                <span className="text-xs text-[var(--color-muted)]">%</span>
              </div>
            </div>
            <div className="text-[11px] text-[var(--color-muted)]">
              Capacitive sensor &middot; Dew point derived
            </div>
          </Card>

          {/* UV & Solar */}
          <Card className="p-6 flex flex-col justify-between min-h-[180px]">
            <div>
              <span className="label">Solar Radiation</span>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="numeric text-3xl font-light text-[var(--color-text)]">--</span>
                <span className="text-xs text-[var(--color-muted)]">W/m&sup2;</span>
              </div>
            </div>
            <div className="text-[11px] text-[var(--color-muted)]">
              UV Index: 0 (Night/Low)
            </div>
          </Card>

          {/* Educational Note */}
          <Card className="p-6 flex flex-col justify-between min-h-[180px] border-dashed">
            <div>
              <span className="label text-[var(--accent)]">Curriculum Link</span>
              <p className="mt-2 text-sm text-[var(--color-text)]">
                Explore science activities and understand how each sensor works.
              </p>
            </div>
            <Link
              href="/learn"
              className="text-xs font-medium text-[var(--accent)] hover:underline inline-flex items-center gap-1"
            >
              Learn about our instruments &rarr;
            </Link>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
