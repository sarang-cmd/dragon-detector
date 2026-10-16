'use client';

import * as React from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffects } from '@/context/effects-context';

export function TopProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { mode } = useEffects();
  const routeKey = `${pathname}?${searchParams.toString()}`;
  const previousRoute = React.useRef(routeKey);
  const [visible, setVisible] = React.useState(false);
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    if (previousRoute.current === routeKey) return;
    previousRoute.current = routeKey;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setVisible(true);
    setProgress(reducedMotion ? 100 : 10);

    let frame = 0;
    let current = reducedMotion ? 100 : 10;
    const finishTimer = window.setTimeout(() => {
      setProgress(100);
      window.setTimeout(() => setVisible(false), reducedMotion ? 0 : 150);
    }, 180);

    if (!reducedMotion) {
      const tick = () => {
        current = Math.min(90, current + Math.max(0.2, (90 - current) * 0.025));
        setProgress(current);
        if (current < 89.5) frame = window.requestAnimationFrame(tick);
      };
      frame = window.requestAnimationFrame(tick);
    }

    return () => {
      window.clearTimeout(finishTimer);
      window.cancelAnimationFrame(frame);
    };
  }, [mode, routeKey]);

  return (
    <div
      className="top-progress-track print:hidden"
      aria-hidden="true"
      data-visible={visible}
    >
      <div
        className={`top-progress-bar ${visible ? 'is-visible' : ''}`}
        style={{ transform: `scaleX(${progress / 100})` }}
      />
    </div>
  );
}
