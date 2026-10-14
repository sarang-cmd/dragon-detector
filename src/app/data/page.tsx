import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, SlidersHorizontal } from 'lucide-react';

export const metadata = {
  title: 'Historical Data',
  description: 'Historical meteorological measurements and sensor time-series recorded at Dresden International School.',
};

const seriesList = [
  { name: 'Temperature', unit: '°C / °F', range: '-15°C to +38°C', sensor: 'Thermo-hygrometer' },
  { name: 'Wind & Gusts', unit: 'km/h / mph', range: '0 to 160 km/h', sensor: 'Cup Anemometer' },
  { name: 'Precipitation', unit: 'mm / in', range: '0 to 999.9 mm', sensor: 'Tipping-bucket 0.1mm' },
  { name: 'Barometric Pressure', unit: 'hPa / inHg', range: '300 to 1100 hPa', sensor: 'Solid-state piezoresistive' },
  { name: 'Relative Humidity', unit: '%', range: '1% to 99%', sensor: 'Capacitive polymer' },
  { name: 'Solar Radiation', unit: 'W/m²', range: '0 to 2000 W/m²', sensor: 'Silicon photodiode' },
];

export default function DataPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-background)]">
      <Header />
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <div className="flex flex-col gap-4 mb-10">
          <span className="label">Archive &amp; Analytics</span>
          <h1 className="display text-[var(--color-text)]">
            Historical Data
          </h1>
          <p className="max-w-2xl text-base sm:text-lg leading-relaxed text-[var(--color-muted)]">
            Historical weather logs and sensor time-series captured from our Dresden campus station for classroom research and student analysis.
          </p>
        </div>

        {/* Toolbar & Filter preview */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--color-border)] pb-4 mb-8">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-[var(--color-muted)]">Time Range:</span>
            <div className="inline-flex rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] p-1 text-xs">
              <span className="px-3 py-1 font-medium bg-[var(--color-border)] text-[var(--color-text)] rounded-[6px]">24 Hours</span>
              <span className="px-3 py-1 text-[var(--color-muted)]">7 Days</span>
              <span className="px-3 py-1 text-[var(--color-muted)]">30 Days</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={1.5} />
              <span>Sensors</span>
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-3.5 w-3.5" strokeWidth={1.5} />
              <span>Export CSV</span>
            </Button>
          </div>
        </div>

        {/* Sensor Series Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
          {seriesList.map((item) => (
            <Card key={item.name} className="p-6 flex flex-col justify-between min-h-[180px]">
              <div>
                <div className="flex items-center justify-between">
                  <span className="label">{item.name}</span>
                  <span className="numeric text-xs text-[var(--color-muted)]">{item.unit}</span>
                </div>
                <div className="mt-4 text-xs text-[var(--color-muted)] space-y-1">
                  <div>Hardware: <span className="text-[var(--color-text)]">{item.sensor}</span></div>
                  <div>Operating range: <span className="numeric text-[var(--color-text)]">{item.range}</span></div>
                </div>
              </div>
              <div className="border-t border-[var(--color-border)] pt-3 text-[11px] text-[var(--color-muted)] flex justify-between">
                <span>Sampling: every 16 seconds</span>
                <span className="text-[var(--accent)] font-medium">Ready for Stage 3</span>
              </div>
            </Card>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
