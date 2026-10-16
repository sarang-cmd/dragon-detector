import { describe, it, expect } from 'vitest';
import { unitLabelFor, CONCEPT_UNITS } from './ExplainerCard';
import { CONCEPT_IDS } from '@/lib/content/concepts';

describe('unitLabelFor', () => {
  it('covers every concept in both systems with non-empty labels', () => {
    for (const id of CONCEPT_IDS) {
      expect(CONCEPT_UNITS[id].metric.length).toBeGreaterThan(0);
      expect(CONCEPT_UNITS[id].imperial.length).toBeGreaterThan(0);
      expect(unitLabelFor(id, 'metric')).toBe(CONCEPT_UNITS[id].metric);
      expect(unitLabelFor(id, 'imperial')).toBe(CONCEPT_UNITS[id].imperial);
    }
  });

  it('converts temperature, wind, rain and pressure labels', () => {
    expect(unitLabelFor('temperature', 'imperial')).toBe('°F');
    expect(unitLabelFor('wind-speed', 'imperial')).toContain('mph');
    expect(unitLabelFor('wind-speed', 'metric')).toContain('km/h');
    expect(unitLabelFor('rain', 'imperial')).toContain('in');
    expect(unitLabelFor('pressure', 'imperial')).toContain('inHg');
    expect(unitLabelFor('pressure', 'metric')).toContain('hPa');
  });

  it('keeps unitless concepts identical', () => {
    expect(unitLabelFor('humidity', 'metric')).toBe(
      unitLabelFor('humidity', 'imperial')
    );
    expect(unitLabelFor('solar', 'metric')).toBe(
      unitLabelFor('solar', 'imperial')
    );
  });
});
