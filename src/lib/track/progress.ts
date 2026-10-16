'use client';

import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

export interface TrackProgress {
  xp: number;
  completedLessons: string[];
  cloud: boolean;
}

const GUEST_KEY = 'dis_track_guest';
const userKey = (userId: string) => `dis_track_progress_${userId}`;

function readKey(key: string): Omit<TrackProgress, 'cloud'> {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return { xp: 0, completedLessons: [] };
    const parsed = JSON.parse(raw) as Partial<TrackProgress>;
    return {
      xp: typeof parsed.xp === 'number' ? parsed.xp : 0,
      completedLessons: Array.isArray(parsed.completedLessons)
        ? parsed.completedLessons.filter((l): l is string => typeof l === 'string')
        : [],
    };
  } catch {
    return { xp: 0, completedLessons: [] };
  }
}

function writeKey(key: string, progress: { xp: number; completedLessons: string[] }): void {
  try {
    localStorage.setItem(
      key,
      JSON.stringify({ xp: progress.xp, completedLessons: progress.completedLessons })
    );
  } catch {
    // ignore write errors
  }
}

function clearKey(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export interface CloudRow {
  xp: number;
  completedLessons: string[];
}

/**
 * Pure merge rule (unit-tested):
 * - cloud row exists → the cloud is truth. Guest progress is left alone
 *   (it belongs to whoever was signed out, never to this user).
 * - no cloud row → first sign-in: adopt the guest progress once, and signal
 *   that the guest key must be cleared so it can never leak into another user.
 */
export function resolveProgress(
  guest: Omit<TrackProgress, 'cloud'>,
  cloudRow: CloudRow | null
): { progress: Omit<TrackProgress, 'cloud'>; clearGuest: boolean } {
  if (!cloudRow) {
    return { progress: { ...guest }, clearGuest: true };
  }
  return {
    progress: { xp: cloudRow.xp, completedLessons: [...cloudRow.completedLessons] },
    clearGuest: false,
  };
}

/**
 * Progress storage, strictly isolated per identity:
 * - signed out → `dis_track_guest` only, never uploaded;
 * - signed in as X → X's cloud row mirrored to `dis_track_progress_X`.
 * Signing out therefore always shows the guest state (other users' progress
 * never appears), and one user's local data can never merge into another
 * user's cloud row.
 */
export async function loadProgress(userId: string | null): Promise<TrackProgress> {
  if (!userId) {
    return { ...readKey(GUEST_KEY), cloud: false };
  }

  const localMirror = readKey(userKey(userId));

  if (!isSupabaseConfigured()) {
    return { ...localMirror, cloud: false };
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('track_progress')
      .select('xp, completed_lessons')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;

    const cloudRow: CloudRow | null = data
      ? {
          xp: typeof data.xp === 'number' ? data.xp : 0,
          completedLessons: Array.isArray(data.completed_lessons)
            ? (data.completed_lessons as string[]).filter((l) => typeof l === 'string')
            : [],
        }
      : null;

    const { progress, clearGuest } = resolveProgress(readKey(GUEST_KEY), cloudRow);
    if (clearGuest) {
      // Adopted guest progress into a brand-new account: persist immediately
      // so a reload cannot lose it, then drop the guest key.
      clearKey(GUEST_KEY);
      await saveProgress(userId, { ...progress, cloud: true });
      return { ...progress, cloud: true };
    }
    writeKey(userKey(userId), progress);
    return { ...progress, cloud: true };
  } catch {
    return { ...localMirror, cloud: false };
  }
}

export async function saveProgress(
  userId: string | null,
  progress: TrackProgress
): Promise<void> {
  const slim = { xp: progress.xp, completedLessons: progress.completedLessons };
  if (!userId) {
    writeKey(GUEST_KEY, slim);
    return;
  }
  writeKey(userKey(userId), slim);
  if (!isSupabaseConfigured()) return;
  try {
    const supabase = createClient();
    await supabase.from('track_progress').upsert(
      {
        user_id: userId,
        xp: slim.xp,
        completed_lessons: slim.completedLessons,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );
  } catch {
    // Offline or RLS failure: per-user mirror already saved; syncs next load.
  }
}

/** Wipe everything for one identity (cloud row + local mirrors). */
export async function resetProgress(userId: string | null): Promise<void> {
  clearKey(GUEST_KEY);
  if (userId) {
    clearKey(userKey(userId));
    if (!isSupabaseConfigured()) return;
    try {
      const supabase = createClient();
      await supabase.from('track_progress').delete().eq('user_id', userId);
    } catch {
      // ignore — local state is already cleared
    }
  }
}
