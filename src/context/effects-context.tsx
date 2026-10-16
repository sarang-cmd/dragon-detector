'use client';

import * as React from 'react';
import { FpsGuard, FPS_GUARD_STORAGE_KEY } from '@/lib/effects/fps-guard';
import { readEffectTier, type EffectTier } from '@/lib/effects/tier';

export type EffectsMode = 'auto' | 'on' | 'off';

const MODE_STORAGE_KEY = 'dis_weather_effects_mode';

interface EffectsContextValue {
  mode: EffectsMode;
  setMode: (mode: EffectsMode) => void;
  cycleMode: () => void;
  tier: EffectTier;
  isEnabled: boolean;
  isTripped: boolean;
  reenable: () => void;
  registerAmbient: () => () => void;
}

const EffectsContext = React.createContext<EffectsContextValue | null>(null);

function readMode(): EffectsMode {
  try {
    const value = window.localStorage.getItem(MODE_STORAGE_KEY);
    return value === 'on' || value === 'off' ? value : 'auto';
  } catch {
    return 'auto';
  }
}

function readInitialTrip(): boolean {
  try {
    return window.localStorage.getItem(FPS_GUARD_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function EffectsProvider({
  children,
  forceOff = false,
}: {
  children: React.ReactNode;
  forceOff?: boolean;
}) {
  const [mode, setModeState] = React.useState<EffectsMode>('auto');
  const [hydrated, setHydrated] = React.useState(false);
  const [tier, setTier] = React.useState<EffectTier>('off');
  const [isTripped, setIsTripped] = React.useState(false);
  const guardRef = React.useRef<FpsGuard | null>(null);

  React.useEffect(() => {
    setModeState(readMode());
    setTier(readEffectTier());
    setHydrated(true);
    setIsTripped(readInitialTrip());

    const guard = new FpsGuard({
      onTrip: () => setIsTripped(true),
      onRecover: () => setIsTripped(false),
    });
    guardRef.current = guard;
    guard.start();

    const updateTier = () => setTier(readEffectTier());
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    motion.addEventListener('change', updateTier);

    return () => {
      motion.removeEventListener('change', updateTier);
      guard.dispose();
      guardRef.current = null;
    };
  }, []);

  const setMode = React.useCallback((next: EffectsMode) => {
    setModeState(next);
    try {
      window.localStorage.setItem(MODE_STORAGE_KEY, next);
    } catch {
      // Effects remain usable for this visit without storage.
    }
  }, []);

  const cycleMode = React.useCallback(() => {
    setModeState((current) => {
      const next: EffectsMode =
        current === 'auto' ? 'on' : current === 'on' ? 'off' : 'auto';
      try {
        window.localStorage.setItem(MODE_STORAGE_KEY, next);
      } catch {
        // Effects remain usable for this visit without storage.
      }
      return next;
    });
  }, []);

  const reenable = React.useCallback(() => {
    guardRef.current?.reenable();
    setIsTripped(false);
  }, []);

  const registerAmbient = React.useCallback(
    () => guardRef.current?.register() ?? (() => {}),
    []
  );

  const isEnabled = React.useMemo(() => {
    if (!hydrated || forceOff || isTripped || tier === 'off') {
      return false;
    }
    return mode !== 'off';
  }, [forceOff, hydrated, isTripped, mode, tier]);

  const value = React.useMemo(
    () => ({
      mode,
      setMode,
      cycleMode,
      tier,
      isEnabled,
      isTripped,
      reenable,
      registerAmbient,
    }),
    [mode, setMode, cycleMode, tier, isEnabled, isTripped, reenable, registerAmbient]
  );

  return <EffectsContext.Provider value={value}>{children}</EffectsContext.Provider>;
}

export function useOptionalEffects(): EffectsContextValue | null {
  return React.useContext(EffectsContext);
}

export function useEffects(): EffectsContextValue {
  const context = useOptionalEffects();
  if (!context) throw new Error('useEffects must be used within EffectsProvider');
  return context;
}

export function useAmbientEffect(enabled: boolean): boolean {
  const { isEnabled, registerAmbient } = useEffects();
  const shouldMount = enabled && isEnabled;

  React.useEffect(() => {
    if (!shouldMount) return;
    return registerAmbient();
  }, [registerAmbient, shouldMount]);

  return shouldMount;
}
