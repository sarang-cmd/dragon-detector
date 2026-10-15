import { describe, it, expect } from 'vitest';
import {
  concepts,
  ConceptSchema,
  CONCEPT_IDS,
  CONCEPT_ICONS,
} from './concepts';
import { activities, ActivitySchema } from './activities';

function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function wordCount(sentence: string): number {
  return sentence.split(/\s+/).filter(Boolean).length;
}

describe('concept content schema', () => {
  it('covers exactly the twelve required concepts', () => {
    expect(concepts.map((c) => c.id).sort()).toEqual([...CONCEPT_IDS].sort());
  });

  it('every concept validates against the zod schema', () => {
    for (const c of concepts) {
      expect(() => ConceptSchema.parse(c)).not.toThrow();
    }
  });

  it('concept ids are unique', () => {
    const ids = concepts.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every concept has both audiences with non-empty text', () => {
    for (const c of concepts) {
      expect(c.kids.summary.length).toBeGreaterThan(0);
      expect(c.kids.example.length).toBeGreaterThan(0);
      expect(c.students.summary.length).toBeGreaterThan(0);
      expect(c.students.howMeasured.length).toBeGreaterThan(0);
      expect(c.students.unit.length).toBeGreaterThan(0);
      expect(c.students.typicalDresden.winter.length).toBeGreaterThan(0);
      expect(c.students.typicalDresden.summer.length).toBeGreaterThan(0);
      expect(c.tryThis.length).toBeGreaterThan(0);
    }
  });

  it('kids sentences stay under 15 words (reading age 8)', () => {
    for (const c of concepts) {
      for (const text of [c.kids.summary, c.kids.example]) {
        for (const s of sentences(text)) {
          expect(
            wordCount(s),
            `"${s}" in concept "${c.id}"`
          ).toBeLessThanOrEqual(14);
        }
      }
    }
  });

  it('every icon is a known lucide name', () => {
    for (const c of concepts) {
      expect(
        (CONCEPT_ICONS as readonly string[]).includes(c.icon),
        `unknown icon "${c.icon}" in concept "${c.id}"`
      ).toBe(true);
    }
  });

  it('dashboard deep-link anchors exist for tiled measurements', () => {
    const ids = new Set(concepts.map((c) => c.id));
    for (const anchor of [
      'temperature',
      'humidity',
      'wind-speed',
      'rain',
      'pressure',
      'uv-index',
      'solar',
    ]) {
      expect(ids.has(anchor as never)).toBe(true);
    }
  });
});

describe('activity content schema', () => {
  it('provides exactly eight activities', () => {
    expect(activities).toHaveLength(8);
  });

  it('every activity validates against the zod schema', () => {
    for (const a of activities) {
      expect(() => ActivitySchema.parse(a)).not.toThrow();
    }
  });

  it('activity ids are unique', () => {
    const ids = activities.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every activity has steps, materials, result, extension and curriculum', () => {
    for (const a of activities) {
      expect(a.steps.length).toBeGreaterThanOrEqual(3);
      expect(a.materials.length).toBeGreaterThanOrEqual(1);
      expect(a.expectedResult.length).toBeGreaterThan(0);
      expect(a.extension.length).toBeGreaterThan(0);
      expect(a.curriculum.subjects.length).toBeGreaterThanOrEqual(1);
      expect(a.curriculum.programme.length).toBeGreaterThan(0);
      expect(a.ageMin).toBeLessThanOrEqual(a.ageMax);
      expect(a.minutes).toBeGreaterThan(0);
    }
  });
});
