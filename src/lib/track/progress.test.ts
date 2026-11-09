import { describe, it, expect } from 'vitest';
import { resolveProgress } from './progress';

describe('resolveProgress (no cross-user bleed)', () => {
  it('uses the cloud row when one exists and never merges guest data', () => {
    const guest = { xp: 120, completedLessons: ['temperature', 'rain'] };
    const cloud = { xp: 30, completedLessons: ['temperature'] };
    const { progress, clearGuest } = resolveProgress(guest, cloud);
    expect(progress).toEqual({ xp: 30, completedLessons: ['temperature'] });
    expect(clearGuest).toBe(false);
  });

  it('adopts guest progress once for a brand-new account and clears it', () => {
    const guest = { xp: 40, completedLessons: ['temperature'] };
    const { progress, clearGuest } = resolveProgress(guest, null);
    expect(progress).toEqual(guest);
    expect(clearGuest).toBe(true);
  });

  it('starts empty for a brand-new account with no guest progress', () => {
    const { progress, clearGuest } = resolveProgress(
      { xp: 0, completedLessons: [] },
      null
    );
    expect(progress).toEqual({ xp: 0, completedLessons: [] });
    expect(clearGuest).toBe(true);
  });
});
