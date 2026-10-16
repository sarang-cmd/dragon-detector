import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Card, CardContent } from '@/components/ui/card';

export const metadata = {
  title: 'Imprint',
  description: 'Legal provider identification for the DIS Weather Station in accordance with Section 5 DDG.',
};

export default function ImprintPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-background)]">
      <Header />
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <div className="flex flex-col gap-4 mb-10">
          <span className="label">Impressum &middot; Legal Notice</span>
          <h1 className="display text-[var(--color-text)]">
            Legal Notice
          </h1>
          <p className="max-w-2xl text-base sm:text-lg leading-relaxed text-[var(--color-muted)]">
            Statutory provider identification for the Dresden International School weather observation portal according to Section 5 DDG.
          </p>
        </div>

        <div className="space-y-6 max-w-3xl">
          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="text-base font-medium text-[var(--color-text)]">Service Provider</h2>
              <div className="text-sm leading-relaxed text-[var(--color-muted)] space-y-1">
                <p className="font-semibold text-[var(--color-text)]">Dresden International School e.V.</p>
                <p>Annenstraße 9</p>
                <p>01067 Dresden-Altstadt</p>
                <p>Germany</p>
              </div>

              <div className="border-t border-[var(--color-border)] pt-3 text-sm text-[var(--color-muted)] space-y-1">
                <p><strong className="text-[var(--color-text)]">Telephone:</strong> <span className="numeric">+49 (0)351 44007-0</span></p>
                <p><strong className="text-[var(--color-text)]">Facsimile:</strong> <span className="numeric">+49 (0)351 44007-10</span></p>
                <p><strong className="text-[var(--color-text)]">Email:</strong> <span className="numeric">info@dresden-is.de</span></p>
                <p><strong className="text-[var(--color-text)]">Internet:</strong> <a href="https://www.dresden-is.de" target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">www.dresden-is.de</a></p>
              </div>

              <div className="border-t border-[var(--color-border)] pt-3 text-sm text-[var(--color-muted)] space-y-1">
                <p><strong className="text-[var(--color-text)]">Registration Court:</strong> Amtsgericht Dresden</p>
                <p><strong className="text-[var(--color-text)]">Registration Number:</strong> <span className="numeric">VR 3169</span></p>
                <p><strong className="text-[var(--color-text)]">VAT Identification Number (USt-IdNr.):</strong> <span className="numeric">DE 191 768 471</span></p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-3">
              <h2 className="text-base font-medium text-[var(--color-text)]">Weather Club Project Credits</h2>
              <p className="text-sm leading-relaxed text-[var(--color-muted)]">
                The technical design, sensor siting, and software integration for this station are conducted as an educational initiative by the students and science staff of Dresden International School.
              </p>
              <p className="text-xs text-[var(--color-muted)]">
                Meteorological data provided for educational purposes without guarantee of commercial meteorological warranty.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
