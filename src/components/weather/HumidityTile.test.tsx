import { describe, it, expect } from 'vitest';
import { comfortWord } from './HumidityTile';

describe('comfortWord', () => {
  it('72 % humidity is never called dry', () => {
    expect(comfortWord(72, 7.9)).toBe('humid');
  });

  it('high humidity is humid even with a moderate dew point', () => {
    expect(comfortWord(80, 12)).toBe('humid');
  });

  it('dew point above 16 C is humid', () => {
    expect(comfortWord(60, 17)).toBe('humid');
    expect(comfortWord(90, 18)).toBe('humid');
  });

  it('low humidity and low dew point is dry', () => {
    expect(comfortWord(20, 2)).toBe('dry');
  });

  it('falls back to humidity bands when dew point is missing', () => {
    expect(comfortWord(30)).toBe('dry');
    expect(comfortWord(50)).toBe('comfortable');
    expect(comfortWord(80)).toBe('humid');
  });
});
