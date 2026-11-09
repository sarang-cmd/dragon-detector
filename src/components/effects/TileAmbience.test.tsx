import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { EffectTier } from '@/lib/effects/tier';
import {
  CelestialAmbience,
  PressureAmbience,
  SolarAmbience,
  UvAmbience,
} from './TileAmbience';

/**
 * The ambience layers are the switchboard for the tile backgrounds: they must
 * disappear when effects are off, keep their CSS motif on the lite tier, and
 * only then add the Canvas UI field. These tests pin that ladder.
 */
const state: { isEnabled: boolean; tier: EffectTier } = { isEnabled: true, tier: 'full' };

vi.mock('@/context/effects-context', () => ({
  useEffects: () => ({ isEnabled: state.isEnabled, tier: state.tier }),
  useAmbientEffect: (enabled: boolean) => enabled && state.isEnabled,
}));

vi.mock('next/dynamic', () => ({
  default: () => function Clouds() {
    return <div data-testid="clouds" />;
  },
}));

afterEach(() => {
  state.isEnabled = true;
  state.tier = 'full';
});

const cases = [
  ['uv', () => <UvAmbience uvIndex={7} />],
  ['solar', () => <SolarAmbience solarWm2={620} />],
  ['celestial', () => <CelestialAmbience isDay />],
  ['pressure', () => <PressureAmbience trend="falling" />],
] as const;

describe('tile ambience', () => {
  it.each(cases)('%s renders its host and the Canvas UI field on the full tier', (label, make) => {
    const { container } = render(make());
    const host = container.querySelector('[data-ambience]');
    expect(host?.getAttribute('data-ambience')).toBe(label);
    // The CSS motif and the canvas share one host, so the motif survives
    // wherever the canvas cannot go.
    expect(host?.className).toContain(`ambience-`);
    expect(container.querySelector('[data-testid="clouds"]')).not.toBeNull();
  });

  it.each(cases)('%s keeps the CSS motif but drops the canvas on the lite tier', (label, make) => {
    state.tier = 'lite';
    const { container } = render(make());
    expect(container.querySelector('[data-ambience]')?.getAttribute('data-ambience')).toBe(label);
    expect(container.querySelector('[data-testid="clouds"]')).toBeNull();
  });

  it.each(cases)('%s renders nothing at all when effects are off', (_label, make) => {
    state.isEnabled = false;
    const { container } = render(make());
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing when the reading is missing', () => {
    const { container } = render(<UvAmbience />);
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing while the pressure reading is stale', () => {
    const { container } = render(<PressureAmbience trend="rising" isStale />);
    expect(container.innerHTML).toBe('');
  });

  it('gives day and night different motifs', () => {
    const { container, rerender } = render(<CelestialAmbience isDay />);
    const day = container.querySelector('[data-ambience]')?.className;
    rerender(<CelestialAmbience isDay={false} />);
    expect(container.querySelector('[data-ambience]')?.className).not.toBe(day);
  });
});
