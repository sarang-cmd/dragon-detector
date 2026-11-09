import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getDevEffectOverride,
  setDevRain,
  subscribeDevEffectOverrides,
} from './dev-overrides';

afterEach(() => {
  setDevRain(null);
});

describe('dev effect overrides', () => {
  it('starts by following the real reading', () => {
    expect(getDevEffectOverride().rain).toBeNull();
  });

  it('forces a rain rate and notifies its subscribers', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeDevEffectOverrides(listener);

    setDevRain(6);
    expect(getDevEffectOverride().rain).toBe(6);
    expect(listener).toHaveBeenCalledTimes(1);

    // Repeating the same value is a no-op, so React does not re-render.
    setDevRain(6);
    expect(listener).toHaveBeenCalledTimes(1);

    setDevRain(null);
    expect(getDevEffectOverride().rain).toBeNull();
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
    setDevRain(24);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('keeps one snapshot per value so React does not re-render forever', () => {
    setDevRain(1);
    expect(getDevEffectOverride()).toBe(getDevEffectOverride());
  });
});
