'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export const ROLES = [
  'kindergarten',
  'pyp',
  'myp',
  'dp',
  'teacher',
  'family',
] as const;

export type Role = (typeof ROLES)[number];

export type ReadingLevel = 'kids' | 'students';

export const ROLE_LABELS: Record<Role, string> = {
  kindergarten: 'Kindergarten',
  pyp: 'PYP',
  myp: 'MYP',
  dp: 'DP',
  teacher: 'Teacher',
  family: 'Family',
};

const STORAGE_KEY = 'dis_role';
const SET_FLAG_KEY = 'dis_role_set';
const LEGACY_AUDIENCE_KEY = 'dis_learn_audience';

/** Roles that read the kids-level copy. Everyone else reads students-level. */
export function readingLevelFor(role: Role): ReadingLevel {
  return role === 'kindergarten' || role === 'pyp' || role === 'family'
    ? 'kids'
    : 'students';
}

/** Only teachers see classroom activities and the teacher handout. */
export function canSeeTeachingContent(role: Role): boolean {
  return role === 'teacher';
}

function readStoredRole(): Role | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && (ROLES as readonly string[]).includes(stored)) {
      return stored as Role;
    }
    // One-time migration from the old Learn-only Kids/Students toggle.
    const legacy = localStorage.getItem(LEGACY_AUDIENCE_KEY);
    if (legacy === 'kids' || legacy === 'students') {
      return legacy === 'kids' ? 'pyp' : 'myp';
    }
  } catch {
    // localStorage may fail in restricted/private modes.
  }
  return null;
}

interface RoleContextValue {
  role: Role | null;
  hasOnboarded: boolean;
  /** True once localStorage has been read (avoids first-paint flashes). */
  ready: boolean;
  setRole: (role: Role) => void;
  readingLevel: ReadingLevel;
  showTeachingContent: boolean;
}

const RoleContext = createContext<RoleContextValue | undefined>(undefined);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<Role | null>(null);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = readStoredRole();
    if (stored) {
      setRoleState(stored);
      try {
        if (localStorage.getItem(SET_FLAG_KEY) === '1') {
          setHasOnboarded(true);
        } else {
          // A role exists (e.g. migrated from the legacy toggle) but was
          // never explicitly confirmed: pre-select it and still onboard.
          setHasOnboarded(false);
        }
      } catch {
        setHasOnboarded(true);
      }
    }
    setReady(true);
  }, []);

  const setRole = useCallback((next: Role) => {
    setRoleState(next);
    setHasOnboarded(true);
    try {
      localStorage.setItem(STORAGE_KEY, next);
      localStorage.setItem(SET_FLAG_KEY, '1');
    } catch {
      // ignore write errors
    }
  }, []);

  const value = useMemo<RoleContextValue>(
    () => ({
      role,
      hasOnboarded,
      ready,
      setRole,
      readingLevel: readingLevelFor(role ?? 'myp'),
      showTeachingContent: role != null && canSeeTeachingContent(role),
    }),
    [role, hasOnboarded, ready, setRole]
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole(): RoleContextValue {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}
