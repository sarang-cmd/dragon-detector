import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { StationClient } from '@/components/station/StationClient';

export const metadata = {
  title: 'The Station',
  description:
    'Hardware specifications, mounting siting, sensor tolerances, and maintenance records for the Sainlogic WS3500 station at Dresden International School.',
};

export default function StationPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-background)]">
      <Header />
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <StationClient />
      </main>
      <Footer />
    </div>
  );
}
