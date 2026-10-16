'use client';

import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

export interface TrackProgress {
  xp: number;
  completedLessons: string[];
  cloud: boolean;
}

const LOCAL_KEY = 'dis_track_progress';

function readLocal(): TrackProgress {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return { xp: 0, completedLessons: [], cloud: false };
    const parsed = JSON.parse(raw) as Partial<TrackProgress>;
    return {
      xp: typeof parsed.xp === 'number' ? parsed.xp : 0,
      completedLessons: Array.isArray(parsed.completedLessons)
        ? parsed.completedLessons.filter((l): l is string => typeof l === 'string')
        : [],
      cloud: false,
    };
  } catch {
    return { xp: 0, completedLessons: [], cloud: false };
  }
}

function writeLocal(progress: TrackProgress): void {
  try {
    localStorage.setItem(
      LOCAL_KEY,
      JSON.stringify({
        xp: progress.xp,
        completedLessons: progress.completedLessons,
      })
    );
  } catch {
    // ignore write errors
  }
}

/**
 * Progress storage with two tiers:
 * - signed in: Supabase `track_progress` row (RLS owner-only), mirrored to
 *   localStorage so the track works offline;
 * - signed out: localStorage only.
 */
export async function loadProgress(userId: string | null): Promise<TrackProgress> {
  const local = readLocal();
  if (!userId || !isSupabaseConfigured()) return local;
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('track_progress')
      .select('xp, completed_lessons')
      .eq('user_id', userId)
      .maybeSingle();
    if (error || !data) return { ...local, cloud: true };
    const merged: TrackProgress = {
      xp: Math.max(local.xp, data.xp ?? 0),
      completedLessons: Array.from(
        new Set([
          ...local.completedLessons,
          ...((data.completed_lessons as string[] | null) ?? []),
        ])
      ),
      cloud: true,
    };
    writeLocal(merged);
    return merged;
  } catch {
    return { ...local, cloud: false };
  }
}

export async function saveProgress(
  userId: string | null,
  progress: TrackProgress
): Promise<void> {
  writeLocal(progress);
  if (!userId || !isSupabaseConfigured()) return;
  try {
    const supabase = createClient();
    await supabase.from('track_progress').upsert(
      {
        user_id: userId,
        xp: progress.xp,
        completed_lessons: progress.completedLessons,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );
  } catch {
    // Offline or RLS failure: local copy already saved; syncs next load.
  }
}
