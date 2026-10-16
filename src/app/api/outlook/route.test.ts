import { describe, it, expect } from 'vitest';
import { isFresh } from '@/lib/outlook';

describe('outlook shared-cache freshness', () => {
  const NOW = Date.parse('2026-10-16T12:00:00.000Z');

  it('fresh within TTL', () => {
    expect(isFresh('2026-10-16T11:50:00.000Z', NOW)).toBe(true);
  });

  it('stale past TTL', () => {
    expect(isFresh('2026-10-16T11:44:00.000Z', NOW)).toBe(false);
  });

  it('rejects missing or unparseable timestamps', () => {
    expect(isFresh(null, NOW)).toBe(false);
    expect(isFresh(undefined, NOW)).toBe(false);
    expect(isFresh('not-a-date', NOW)).toBe(false);
  });

  it('respects a custom TTL', () => {
    expect(isFresh('2026-10-16T11:50:00.000Z', NOW, 60_000)).toBe(false);
    expect(isFresh('2026-10-16T11:59:30.000Z', NOW, 60_000)).toBe(true);
  });
});
