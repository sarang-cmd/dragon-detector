import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="min-h-screen">
        <div className="flex items-center justify-center text-muted" style={{ color: 'var(--color-muted)' }}>
          <p className="text-sm uppercase tracking-widest">Dashboard coming next session</p>
        </div>
      </main>
      <Footer />
    </>
  );
}
