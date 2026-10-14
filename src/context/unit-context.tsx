'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';

export type UnitSystem = 'metric' | 'imperial';

interface UnitContextValue {
  unitSystem: UnitSystem;
  setUnitSystem: (system: UnitSystem) => void;
  toggleUnitSystem: () => void;
}

const STORAGE_KEY = 'dis_weather_unit_system';

const UnitContext = createContext<UnitContextValue | undefined>(undefined);

export function UnitProvider({ children }: { children: React.ReactNode }) {
  const [unitSystem, setUnitSystemState] = useState<UnitSystem>('metric');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'metric' || stored === 'imperial') {
        setUnitSystemState(stored);
      }
    } catch {
      // localStorage may fail in restricted/private modes
    }
  }, []);

  const setUnitSystem = useCallback((system: UnitSystem) => {
    setUnitSystemState(system);
    try {
      localStorage.setItem(STORAGE_KEY, system);
    } catch {
      // ignore write errors
    }
  }, []);

  const toggleUnitSystem = useCallback(() => {
    setUnitSystemState((prev) => {
      const next = prev === 'metric' ? 'imperial' : 'metric';
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // ignore write errors
      }
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      unitSystem: isMounted ? unitSystem : 'metric',
      setUnitSystem,
      toggleUnitSystem,
    }),
    [unitSystem, isMounted, setUnitSystem, toggleUnitSystem]
  );

  return <UnitContext.Provider value={value}>{children}</UnitContext.Provider>;
}

export function useUnitSystem(): UnitContextValue {
  const context = useContext(UnitContext);
  if (!context) {
    throw new Error('useUnitSystem must be used within a UnitProvider');
  }
  return context;
}
