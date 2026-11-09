'use client';

import { useSyncExternalStore } from 'react';

/**
 * A tiny store the developer console (`ScenarioDebugPanel`) writes to and the
 * effect layers read from, so a background effect can be forced on for testing
 * without waiting for the weather to cooperate.
 *
 * It is deliberately *not* React context: the console and the tiles sit in
 * different subtrees, and the values must not survive a reload (a developer
 * who forgets they forced a downpour would otherwise chase a phantom bug).
 * Writes are no-ops in production, and the console that sets them is not
 * rendered there either.
 */

export interface DevEffectOverride {
  /** Rain rate in mm/h. `null` means "follow the real reading". */
  rain: number | null;
}

const SERVER_SNAPSHOT: DevEffectOverride = Object.freeze({ rain: null });

let snapshot: DevEffectOverride = SERVER_SNAPSHOT;
const listeners = new Set<() => void>();

/** Exported so tests can assert that writers actually notify readers. */
export function subscribeDevEffectOverrides(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getDevEffectOverride(): DevEffectOverride {
  return snapshot;
}

function getServerSnapshot(): DevEffectOverride {
  return SERVER_SNAPSHOT;
}

function update(next: DevEffectOverride): void {
  if (snapshot.rain === next.rain) return;
  snapshot = next;
  listeners.forEach((listener) => listener());
}

/** Force the rain rate the Droplets layer sees. `null` hands it back to data. */
export function setDevRain(rainMmH: number | null): void {
  if (process.env.NODE_ENV === 'production') return;
  update({ rain: rainMmH });
}

export function useDevEffectOverride(): DevEffectOverride {
  return useSyncExternalStore(subscribeDevEffectOverrides, getDevEffectOverride, getServerSnapshot);
}
