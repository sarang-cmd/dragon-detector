import { act, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { EffectTier } from '@/lib/effects/tier';
import { setDevRain } from '@/lib/effects/dev-overrides';
import { RainWeatherEffect } from './WeatherEffects';

const state: { isEnabled: boolean; tier: EffectTier } = { isEnabled: true, tier: 'full' };

vi.mock('@/context/effects-context', () => ({
  useEffects: () => ({ isEnabled: state.isEnabled, tier: state.tier }),
  useAmbientEffect: (enabled: boolean) => enabled && state.isEnabled,
}));

vi.mock('next/dynamic', () => ({
  default: () =>
    function Droplets({ children }: { children?: React.ReactNode }) {
      return <div data-testid="droplets">{children}</div>;
    },
}));

afterEach(() => {
  state.isEnabled = true;
  state.tier = 'full';
  act(() => setDevRain(null));
});

describe('RainWeatherEffect', () => {
  it('stays out of the way when it is dry', () => {
    const { container } = render(<RainWeatherEffect rateMmH={0} isStale={false} />);
    expect(container.innerHTML).toBe('');
  });

  it('runs the Canvas UI droplets while it rains', () => {
    const { container } = render(<RainWeatherEffect rateMmH={6} isStale={false} />);
    expect(container.querySelector('[data-testid="droplets"]')).not.toBeNull();
    // Droplets refracts whatever is painted inside it, so it needs a surface.
    expect(container.querySelector('.rain-refraction-surface')).not.toBeNull();
  });

  it('is decorative only — never in the accessibility tree', () => {
    const { container } = render(<RainWeatherEffect rateMmH={6} isStale={false} />);
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });

  it('stays off on the lite tier and when effects are switched off', () => {
    state.tier = 'lite';
    expect(render(<RainWeatherEffect rateMmH={6} isStale={false} />).container.innerHTML).toBe('');
    state.tier = 'full';
    state.isEnabled = false;
    expect(render(<RainWeatherEffect rateMmH={6} isStale={false} />).container.innerHTML).toBe('');
  });

  it('stays off while the readings are stale', () => {
    const { container } = render(<RainWeatherEffect rateMmH={6} isStale />);
    expect(container.innerHTML).toBe('');
  });

  it('answers the developer console override even when dry and stale', () => {
    act(() => setDevRain(24));
    const { container } = render(<RainWeatherEffect rateMmH={0} isStale />);
    expect(container.querySelector('[data-testid="droplets"]')).not.toBeNull();
  });
});
