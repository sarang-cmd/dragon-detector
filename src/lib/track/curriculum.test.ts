import { describe, it, expect } from 'vitest';
import {
  TRACK_NODES,
  TRACK_UNITS,
  XP_PER_CORRECT,
  nodeById,
  nodeIndex,
} from './curriculum';
import { CONCEPT_IDS } from '@/lib/content/concepts';

describe('track curriculum', () => {
  it('covers every concept exactly once', () => {
    const ids = TRACK_NODES.map((n) => n.id).sort();
    expect(ids).toEqual([...CONCEPT_IDS].sort());
  });

  it('every node has a unit and exactly three valid questions', () => {
    for (const node of TRACK_NODES) {
      expect(node.unit.length).toBeGreaterThan(0);
      expect(node.quiz).toHaveLength(3);
      for (const q of node.quiz) {
        expect(q.question.length).toBeGreaterThan(0);
        expect(q.choices).toHaveLength(3);
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.answer).toBeLessThanOrEqual(2);
        expect(q.choices[q.answer].length).toBeGreaterThan(0);
      }
    }
  });

  it('questions offer distinct choices', () => {
    for (const node of TRACK_NODES) {
      for (const q of node.quiz) {
        expect(new Set(q.choices).size).toBe(3);
      }
    }
  });

  it('units preserve concept order', () => {
    const seen: string[] = [];
    for (const node of TRACK_NODES) {
      if (!seen.includes(node.unit)) seen.push(node.unit);
    }
    expect(seen).toEqual(TRACK_UNITS);
  });

  it('helpers resolve nodes', () => {
    expect(nodeById('rain')?.unit).toBe('Air and water');
    expect(nodeById('nope')).toBeUndefined();
    expect(nodeIndex('temperature')).toBe(0);
    expect(XP_PER_CORRECT).toBe(10);
  });
});
