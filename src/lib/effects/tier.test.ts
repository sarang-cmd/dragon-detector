import { describe, expect, it } from 'vitest';
import { detectEffectTier, type EffectDeviceSignals } from './tier';

const capable: EffectDeviceSignals = {
  hardwareConcurrency: 8,
  deviceMemory: 8,
  saveData: false,
  prefersReducedMotion: false,
  hasCanvas: true,
  hasWebGL: true,
};

describe('detectEffectTier', () => {
  it.each([
    ['reduced motion', { prefersReducedMotion: true }, 'off'],
    ['no canvas', { hasCanvas: false }, 'off'],
    ['no WebGL', { hasWebGL: false }, 'off'],
    ['four cores', { hardwareConcurrency: 4 }, 'lite'],
    ['four GB memory', { deviceMemory: 4 }, 'lite'],
    ['save data', { saveData: true }, 'lite'],
    ['high resource device', {}, 'full'],
    ['unknown resource values', { hardwareConcurrency: undefined, deviceMemory: undefined }, 'full'],
  ] as const)('%s maps to %s', (_name, overrides, expected) => {
    expect(detectEffectTier({ ...capable, ...overrides })).toBe(expected);
  });

  it('reduced motion always wins over high resources and manual-on intent', () => {
    expect(
      detectEffectTier({ ...capable, prefersReducedMotion: true, saveData: false })
    ).toBe('off');
  });

  it('a graphics failure wins over all low-resource signals', () => {
    expect(
      detectEffectTier({
        ...capable,
        hasWebGL: false,
        hardwareConcurrency: 2,
        deviceMemory: 2,
        saveData: true,
      })
    ).toBe('off');
  });
});
