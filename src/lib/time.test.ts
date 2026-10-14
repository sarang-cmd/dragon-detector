import { describe, it, expect } from 'vitest';
import { DEFAULT_TIME_ZONE } from './time';

describe('time constants', () => {
  it('defaults to Europe/Berlin', () => {
    expect(DEFAULT_TIME_ZONE).toBe('Europe/Berlin');
  });

  it('a string is a string', () => {
    expect('DIS Weather Station'.length).toBeGreaterThan(0);
  });
});
