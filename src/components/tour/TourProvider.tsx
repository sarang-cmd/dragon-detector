'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import { Mascot, Confetti } from '@/components/learn/Mascot';

export interface TourStep {
  id: string;
  route: string;
  /** CSS selector scrolled into view and ringed. Omit for card-only steps. */
  selector?: string;
  title: string;
  text: string;
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'hero',
    route: '/',
    selector: '[data-tour="hero"]',
    title: 'Live from our roof',
    text: 'This is the school station, right now. Temperature, wind, rain, everything the sensors feel.',
  },
  {
    id: 'outlook',
    route: '/',
    selector: '[data-tour="outlook"]',
    title: 'Coming up next',
    text: 'This graph predicts the next 12 hours, and the sentence under it is written by AI from live data.',
  },
  {
    id: 'track',
    route: '/learn',
    selector: '[data-tour="track"]',
    title: 'Your learning path',
    text: 'Twelve lessons with quizzes. Finish each quiz to unlock the next one and earn XP.',
  },
  {
    id: 'data',
    route: '/data',
    title: 'Every measurement, ever',
    text: 'The Data page keeps the full history with charts, and you can download it as CSV in metric or imperial.',
  },
  {
    id: 'station',
    route: '/station',
    selector: '[data-tour="station-table"]',
    title: 'Meet the station',
    text: 'A Sainlogic WS3500 on the school roof. This page lists every sensor and how exact it is.',
  },
];

const DONE_KEY = 'dis_tour_done';

function readDone(): boolean {
  try {
    return localStorage.getItem(DONE_KEY) === '1';
  } catch {
    return true;
  }
}

interface TourContextValue {
  active: boolean;
  startTour: () => void;
  skipTour: () => void;
}

const TourContext = React.createContext<TourContextValue | undefined>(undefined);

export function useTour(): TourContextValue {
  const ctx = React.useContext(TourContext);
  if (!ctx) throw new Error('useTour must be used within a TourProvider');
  return ctx;
}

export function hasTakenTour(): boolean {
  if (typeof window === 'undefined') return true;
  return readDone();
}

export function TourProvider({ children }: { children: React.ReactNode }) {
  const [active, setActive] = React.useState(false);
  const [index, setIndex] = React.useState(0);
  const [showFinale, setShowFinale] = React.useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const step = TOUR_STEPS[index];

  const startTour = React.useCallback(() => {
    setIndex(0);
    setShowFinale(false);
    setActive(true);
  }, []);

  const finishTour = React.useCallback(() => {
    setActive(false);
    setShowFinale(false);
    try {
      localStorage.setItem(DONE_KEY, '1');
    } catch {
      // ignore
    }
  }, []);

  // Drive to the step's route first.
  React.useEffect(() => {
    if (!active || showFinale || !step) return;
    if (pathname !== step.route) router.push(step.route);
  }, [active, showFinale, step, pathname, router]);

  // Then ring + scroll the target once the route matches.
  React.useEffect(() => {
    if (!active || showFinale || !step || pathname !== step.route) return;
    const el = step.selector
      ? (document.querySelector(step.selector) as HTMLElement | null)
      : null;
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('tour-ring');
    }
    return () => {
      el?.classList.remove('tour-ring');
    };
  }, [active, showFinale, step, pathname, index]);

  const next = () => {
    if (index + 1 >= TOUR_STEPS.length) {
      setShowFinale(true);
    } else {
      setIndex((i) => i + 1);
    }
  };
  const back = () => setIndex((i) => Math.max(0, i - 1));

  const value = React.useMemo(
    () => ({ active, startTour, skipTour: finishTour }),
    [active, startTour, finishTour]
  );

  return (
    <TourContext.Provider value={value}>
      {children}
      {active && !showFinale && step && (
        <div
          role="dialog"
          aria-modal="false"
          aria-label={`Tour: ${step.title}`}
          className="fixed inset-x-4 bottom-4 z-[55] mx-auto max-w-[520px] rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-none sm:p-5"
        >
          <div className="flex items-start gap-3">
            <Mascot size={44} mood="happy" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[var(--color-text)]">
                {step.title}
                <span className="numeric ml-2 text-xs font-normal text-[var(--color-muted)]">
                  {index + 1} of {TOUR_STEPS.length}
                </span>
              </p>
              <p className="mt-1 text-sm leading-relaxed text-[var(--color-muted)]">
                {step.text}
              </p>
            </div>
            <button
              type="button"
              onClick={finishTour}
              aria-label="End tour"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] text-[var(--color-muted)] hover:text-[var(--color-text)] focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3 flex items-center justify-between gap-2" aria-hidden="true">
            <div className="flex gap-1.5">
              {TOUR_STEPS.map((s, i) => (
                <span
                  key={s.id}
                  className={`h-1.5 w-6 rounded-full ${i <= index ? 'bg-[var(--accent)]' : 'bg-[var(--color-border)]'}`}
                />
              ))}
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={back}
              disabled={index === 0}
              className="inline-flex min-h-[44px] items-center gap-1 rounded-[8px] px-3 text-sm text-[var(--color-muted)] hover:text-[var(--color-text)] disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
            >
              <ArrowLeft aria-hidden="true" className="h-4 w-4" /> Back
            </button>
            <button
              type="button"
              onClick={next}
              className="inline-flex min-h-[44px] items-center gap-1 rounded-[12px] bg-[var(--accent)] px-4 text-sm font-medium text-[var(--accent-foreground)] focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
            >
              {index + 1 >= TOUR_STEPS.length ? 'Meet Sid' : 'Next'}
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      {active && showFinale && (
        <div
          role="dialog"
          aria-modal="false"
          aria-label="Meet Sid"
          className="fixed inset-0 z-[55] flex items-center justify-center bg-black/60 p-4"
        >
          <div className="relative w-full max-w-[420px] overflow-hidden rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center">
            <Confetti pieces={28} />
            <div className="sid-wave mx-auto w-fit">
              <Mascot size={120} mood="celebrate" />
            </div>
            <p className="mt-4 text-2xl font-medium text-[var(--color-text)]">
              Hi, I&apos;m Sid!
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">
              I am the DIS Dragons mascot and your guide to the weather
              station. Tap any lesson to start earning XP.
            </p>
            <button
              type="button"
              onClick={finishTour}
              className="mt-6 inline-flex min-h-[44px] items-center rounded-[12px] bg-[var(--accent)] px-6 py-2 text-sm font-medium text-[var(--accent-foreground)] focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
            >
              Let&apos;s go
            </button>
          </div>
        </div>
      )}
    </TourContext.Provider>
  );
}
