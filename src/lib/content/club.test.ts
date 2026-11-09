import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { CLUB, CLUB_MEMBERS, CLUB_PHOTOS } from './club';

/**
 * The club edits `club.ts` directly, so these tests guard the shape rather
 * than the wording: no nameless member, no duplicated name, no photo that
 * points at a missing file.
 */

describe('club content', () => {
  it('lists six members, each with a name and a role', () => {
    expect(CLUB_MEMBERS).toHaveLength(6);
    for (const member of CLUB_MEMBERS) {
      expect(member.name.trim().length).toBeGreaterThan(0);
      expect(member.role.trim().length).toBeGreaterThan(10);
    }
  });

  it('does not repeat a name', () => {
    const names = CLUB_MEMBERS.map((m) => m.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('states when the club started and when it meets', () => {
    expect(CLUB.started).toBe('September 2026');
    expect(CLUB.meeting.toLowerCase()).toContain('monday');
    expect(CLUB.supervisors.length).toBeGreaterThan(0);
    for (const supervisor of CLUB.supervisors) {
      expect(supervisor.trim().length).toBeGreaterThan(0);
    }
  });

  it('keeps every milestone and next step filled in', () => {
    expect(CLUB.milestones.length).toBeGreaterThan(0);
    for (const milestone of CLUB.milestones) {
      expect(milestone.when.trim().length).toBeGreaterThan(0);
      expect(milestone.title.trim().length).toBeGreaterThan(0);
      expect(milestone.text.trim().length).toBeGreaterThan(10);
    }
    expect(CLUB.next.length).toBeGreaterThan(0);
    for (const task of CLUB.next) {
      expect(task.task.trim().length).toBeGreaterThan(0);
      expect(task.who.trim().length).toBeGreaterThan(0);
    }
  });

  it('points every gallery photo at a file that exists', () => {
    for (const photo of CLUB_PHOTOS) {
      expect(photo.src.startsWith('/club/')).toBe(true);
      expect(photo.alt.trim().length).toBeGreaterThan(3);
      expect(photo.caption.trim().length).toBeGreaterThan(0);
      expect(
        fs.existsSync(path.join(process.cwd(), 'public', photo.src)),
        `missing photo: public${photo.src}`
      ).toBe(true);
    }
  });
});
