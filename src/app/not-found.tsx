import Link from 'next/link';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-24 text-center sm:px-6">
        <h1 className="text-2xl font-semibold uppercase tracking-widest text-[var(--color-text)]">
          Page not found
        </h1>
        <p className="mt-4 text-lg text-[var(--color-muted)]">
          The page you are looking for does not exist on this station.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-full border border-[var(--color-border)] px-6 py-2 text-sm uppercase tracking-widest transition-colors hover:border-[var(--color-text)]"
        >
          Back to live weather
        </Link>
      </main>
      <Footer />
    </>
  );
}
