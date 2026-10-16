import { describe, it, expect } from 'vitest';
import {
  ROLES,
  ROLE_LABELS,
  readingLevelFor,
  canSeeTeachingContent,
} from './role-context';

describe('role model', () => {
  it('offers exactly the six agreed roles', () => {
    expect([...ROLES]).toEqual([
      'kindergarten',
      'pyp',
      'myp',
      'dp',
      'teacher',
      'family',
    ]);
    for (const role of ROLES) {
      expect(ROLE_LABELS[role].length).toBeGreaterThan(0);
    }
  });

  it('maps kindergarten/pyp/family to kids, myp/dp/teacher to students', () => {
    expect(readingLevelFor('kindergarten')).toBe('kids');
    expect(readingLevelFor('pyp')).toBe('kids');
    expect(readingLevelFor('family')).toBe('kids');
    expect(readingLevelFor('myp')).toBe('students');
    expect(readingLevelFor('dp')).toBe('students');
    expect(readingLevelFor('teacher')).toBe('students');
  });

  it('gates teaching content to teachers only', () => {
    expect(canSeeTeachingContent('teacher')).toBe(true);
    for (const role of ROLES) {
      if (role === 'teacher') continue;
      expect(canSeeTeachingContent(role)).toBe(false);
    }
  });
});
