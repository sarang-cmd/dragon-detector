import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Card, CardContent } from '@/components/ui/card';

export const metadata = {
  title: 'Privacy Policy',
  description: 'Privacy statement for the DIS Weather Station — zero tracking, no cookies, and strict GDPR compliance.',
};

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-background)]">
      <Header />
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <div className="flex flex-col gap-4 mb-10">
          <span className="label">Data Protection &middot; DSGVO / GDPR</span>
          <h1 className="display text-[var(--color-text)]">
            Privacy Policy
          </h1>
          <p className="max-w-2xl text-base sm:text-lg leading-relaxed text-[var(--color-muted)]">
            This weather observatory operates with zero tracking, no cookies, and no personal data collection.
          </p>
        </div>

        <div className="space-y-6 max-w-3xl">
          <Card>
            <CardContent className="p-6 space-y-3">
              <h2 className="text-base font-medium text-[var(--color-text)]">1. Core Privacy Commitment</h2>
              <p className="text-sm leading-relaxed text-[var(--color-muted)]">
                The DIS Weather Station website is built by the student Weather Club at Dresden International School.
                We believe public school tools must respect student and visitor privacy by default.
                We do not track visitors, do not run marketing analytics, and do not use advertising networks.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-3">
              <h2 className="text-base font-medium text-[var(--color-text)]">2. Cookies and Local Storage</h2>
              <p className="text-sm leading-relaxed text-[var(--color-muted)]">
                This website does not set any tracking cookies.
                We utilize browser <code className="numeric bg-[var(--color-background)] px-1.5 py-0.5 rounded border border-[var(--color-border)] text-xs text-[var(--color-text)]">localStorage</code> strictly to remember your preferences:
              </p>
              <ul className="list-disc list-inside text-sm space-y-1 text-[var(--color-muted)] ml-2">
                <li><strong className="text-[var(--color-text)]">Theme:</strong> whether you prefer Light or Dark appearance mode.</li>
                <li><strong className="text-[var(--color-text)]">Units:</strong> whether you prefer Metric (&deg;C, km/h, mm) or Imperial (&deg;F, mph, in).</li>
              </ul>
              <p className="text-xs text-[var(--color-muted)]">
                These preferences never leave your browser device and are never transmitted to our servers.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-3">
              <h2 className="text-base font-medium text-[var(--color-text)]">3. Meteorological Data Scope</h2>
              <p className="text-sm leading-relaxed text-[var(--color-muted)]">
                All measurements published on this website originate from outdoor rooftop instrumentation.
                In accordance with school security standards, indoor weather console sensors (such as classroom temperature, humidity, or audio) are filtered out at the server layer and are never accessible through this application.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-3">
              <h2 className="text-base font-medium text-[var(--color-text)]">4. Responsible Controller</h2>
              <div className="text-sm text-[var(--color-muted)] space-y-1">
                <p className="font-medium text-[var(--color-text)]">Dresden International School e.V.</p>
                <p>Annenstraße 9, 01067 Dresden-Altstadt, Germany</p>
                <p>Email: <span className="numeric">info@dresden-is.de</span> &middot; Phone: <span className="numeric">+49 (0)351 44007-0</span></p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
