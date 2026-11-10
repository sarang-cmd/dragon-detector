export type EffectTier = 'off' | 'lite' | 'full';

export interface EffectDeviceSignals {
  hardwareConcurrency?: number;
  deviceMemory?: number;
  saveData?: boolean;
  prefersReducedMotion: boolean;
  hasCanvas: boolean;
  hasWebGL: boolean;
}

/**
 * Keep the decision pure so hardware and accessibility combinations stay
 * covered by tests. Missing hardware data deliberately defaults to full;
 * the runtime frame-rate guard is the safety net for unknown devices.
 */
export function detectEffectTier(signals: EffectDeviceSignals): EffectTier {
  if (signals.prefersReducedMotion || !signals.hasCanvas || !signals.hasWebGL) {
    return 'off';
  }

  if (
    (signals.hardwareConcurrency != null && signals.hardwareConcurrency <= 4) ||
    (signals.deviceMemory != null && signals.deviceMemory <= 4) ||
    signals.saveData === true
  ) {
    return 'lite';
  }

  return 'full';
}

/**
 * Browser-only probe, called once after mount.
 *
 * The effects are part of what the site looks like, so they are on for every
 * visitor on every machine: `detectEffectTier` is no longer consulted here.
 * The one thing that still switches them off is the run-time frame-rate guard
 * (`FpsGuard`), which reacts to the page struggling rather than to a guess
 * about the hardware.
 *
 * `detectEffectTier` is kept as a pure function — it is what the developer
 * console reports, and it is what to reach for if this decision is ever
 * revisited.
 */
export function readEffectTier(): EffectTier {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return 'off';
  }

  return 'full';
}

/**
 * What the hardware would have been graded as, for diagnostics only. Nothing
 * in the render path calls this.
 */
export function readDeviceTier(): EffectTier {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return 'off';
  }

  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean };
  };
  const canvas = document.createElement('canvas');
  let hasWebGL = false;

  try {
    hasWebGL = Boolean(
      canvas.getContext('webgl2') ||
        canvas.getContext('webgl') ||
        canvas.getContext('experimental-webgl')
    );
  } catch {
    hasWebGL = false;
  }

  return detectEffectTier({
    hardwareConcurrency: nav.hardwareConcurrency,
    deviceMemory: nav.deviceMemory,
    saveData: nav.connection?.saveData,
    prefersReducedMotion: window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches,
    hasCanvas: typeof canvas.getContext === 'function',
    hasWebGL,
  });
}
