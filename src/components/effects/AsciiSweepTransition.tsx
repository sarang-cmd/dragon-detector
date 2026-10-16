'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { useEffects } from '@/context/effects-context';
import { EffectBoundary } from './EffectBoundary';
import type { UnitSystem } from '@/context/unit-context';

const AsciiSweep = dynamic(
  () => import('@/components/canvasui/AsciiSweep').then((module) => module.AsciiSweep),
  { ssr: false }
);

interface SweepContent {
  id: number;
  from: React.ReactNode;
  to: React.ReactNode;
}

function SweepOverlay({
  content,
  onFinished,
}: {
  content: SweepContent;
  onFinished: () => void;
}) {
  const [index, setIndex] = React.useState<0 | 1>(0);
  const finishTimer = React.useRef<number | null>(null);

  React.useEffect(() => {
    // The first panel is the previous unit system; reveal the new units as the
    // sweep crosses the grid. On browsers without html-in-canvas this degrades
    // to the new plain-HTML panel without hiding the real dashboard beneath.
    setIndex(1);
    return () => {
      if (finishTimer.current !== null) window.clearTimeout(finishTimer.current);
    };
  }, [content.id]);

  return (
    <EffectBoundary fallback={null}>
      <AsciiSweep
        className="h-full w-full"
        index={index}
        alternate={content.to}
        directional
        angle={0}
        duration={0.75}
        band={0.16}
        softness={0.45}
        turbulence={0.25}
        trail={0.25}
        scale={2}
        spacing={1}
        charset="ascii"
        color="var(--accent)"
        tint={0.16}
        glow={0.05}
        aberration={0}
        flicker={0}
        density={0.18}
        displace={0}
        contrast={1.05}
        threshold={0.16}
        fade={0.12}
        blend="auto"
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        onSweepEnd={() => {
          finishTimer.current = window.setTimeout(onFinished, 500);
        }}
      >
        {content.from}
      </AsciiSweep>
    </EffectBoundary>
  );
}

export function AsciiSweepTransition({
  unitSystem,
  children,
}: React.PropsWithChildren<{ unitSystem: UnitSystem }>) {
  const { tier, isEnabled } = useEffects();
  const [sweep, setSweep] = React.useState<SweepContent | null>(null);
  const previousUnit = React.useRef(unitSystem);
  const previousChildren = React.useRef<React.ReactNode>(children);
  const nextId = React.useRef(0);

  React.useEffect(() => {
    const changed = previousUnit.current !== unitSystem;
    previousUnit.current = unitSystem;

    if (changed && isEnabled && tier === 'full') {
      setSweep({
        id: ++nextId.current,
        from: previousChildren.current,
        to: children,
      });
    }
    previousChildren.current = children;
  }, [children, isEnabled, tier, unitSystem]);

  return (
    <div className="relative">
      {children}
      {sweep && isEnabled && tier === 'full' && (
        <div
          className="dashboard-data-sweep pointer-events-none absolute inset-0 z-20"
          aria-hidden="true"
          inert
        >
          <SweepOverlay
            key={sweep.id}
            content={sweep}
            onFinished={() => setSweep((active) => active?.id === sweep.id ? null : active)}
          />
        </div>
      )}
    </div>
  );
}
