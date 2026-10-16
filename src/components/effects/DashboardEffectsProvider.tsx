'use client';

import * as React from 'react';
import { Suspense } from 'react';
import { EffectsProvider } from '@/context/effects-context';
import { usePathname } from 'next/navigation';
import { EffectBoundary } from './EffectBoundary';
import { EffectsCycleButton } from './EffectsControls';
import { EffectsStatusNotice } from './EffectsStatusNotice';
import { TopProgressBar } from './TopProgressBar';
import { ScenarioDebugPanel } from '@/components/weather/ScenarioDebugPanel';

export function DashboardEffectsProvider({
  children,
}: React.PropsWithChildren) {
  const pathname = usePathname();
  return (
    <EffectsProvider forceOff={pathname === '/display'}>
      <EffectBoundary fallback={children}>
        <Suspense fallback={null}>
          <TopProgressBar />
        </Suspense>
        {children}
        <ScenarioDebugPanel />
      </EffectBoundary>
    </EffectsProvider>
  );
}
