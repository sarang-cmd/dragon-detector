'use client';

import { Sparkles } from 'lucide-react';
import { useTour } from '@/components/tour/TourProvider';

/** Footer control to replay Sid's guided tour. */
export function TourRestartButton() {
  const { startTour } = useTour();
  return (
    <button
      type="button"
      onClick={startTour}
      className="inline-flex min-h-[44px] items-center gap-1.5 rounded-[6px] px-2 text-xs text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)] focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
    >
      <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
      Take the tour
    </button>
  );
}
