import { describe, it, expect, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useElapsedSeconds,
  classifyWeatherAge,
  measuredAgeMs,
  WEATHER_STALE_MS,
  WEATHER_OFFLINE_MS,
} from './useWeather';

describe('useElapsedSeconds (secondsSinceMeasured)', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('reports the measured age right after mount', () => {
    vi.useFakeTimers();
    const measuredAt = new Date(Date.now() - 20_000).toISOString();
    const { result } = renderHook(() => useElapsedSeconds(measuredAt));
    // Effects run synchronously inside renderHook's act(), so the ticker
    // has already fired once: the age is visible.
    expect(result.current).toBeGreaterThanOrEqual(20);
  });

  it('ticks every second after mount without refetching', async () => {
    vi.useFakeTimers();
    const measuredAt = new Date(Date.now() - 7_000).toISOString();
    const { result } = renderHook(() => useElapsedSeconds(measuredAt));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000);
    });
    expect(result.current).toBeGreaterThanOrEqual(8);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000);
    });
    expect(result.current).toBeGreaterThanOrEqual(9);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000);
    });
    expect(result.current).toBeGreaterThanOrEqual(10);
  });

  it('never goes negative for a future timestamp', () => {
    vi.useFakeTimers();
    const measuredAt = new Date(Date.now() + 5_000).toISOString(); // clock skew
    const { result } = renderHook(() => useElapsedSeconds(measuredAt));
    // First paint is 0; even after ticks it must never be negative.
    expect(result.current).toBeGreaterThanOrEqual(0);
  });

  it('returns 0 for a null measurement', () => {
    const { result } = renderHook(() => useElapsedSeconds(null));
    expect(result.current).toBe(0);
  });
});

describe('stale/offline thresholds (classifyWeatherAge)', () => {
  it('fresh data: not stale, not offline', () => {
    expect(classifyWeatherAge(60_000)).toEqual({
      isStale: false,
      isOffline: false,
    });
  });

  it('exactly 10 minutes is still fresh (strictly greater than threshold)', () => {
    expect(classifyWeatherAge(WEATHER_STALE_MS).isStale).toBe(false);
  });

  it('just over 10 minutes is stale but not offline', () => {
    expect(classifyWeatherAge(WEATHER_STALE_MS + 1)).toEqual({
      isStale: true,
      isOffline: false,
    });
  });

  it('exactly 30 minutes is stale but not offline', () => {
    expect(classifyWeatherAge(WEATHER_OFFLINE_MS)).toEqual({
      isStale: true,
      isOffline: false,
    });
  });

  it('just over 30 minutes is offline', () => {
    expect(classifyWeatherAge(WEATHER_OFFLINE_MS + 1)).toEqual({
      isStale: true,
      isOffline: true,
    });
  });
});

describe('measuredAgeMs', () => {
  it('computes non-negative age from timestamps', () => {
    const now = Date.now();
    expect(measuredAgeMs(new Date(now - 120_000).toISOString(), now)).toBe(
      120_000
    );
  });

  it('clamps future timestamps (clock skew) to 0', () => {
    const now = Date.now();
    expect(measuredAgeMs(new Date(now + 120_000).toISOString(), now)).toBe(0);
  });

  it('returns 0 without a measurement or a clock', () => {
    expect(measuredAgeMs(null, Date.now())).toBe(0);
    expect(measuredAgeMs('2026-01-01T00:00:00Z', null)).toBe(0);
  });
});
