'use client';

import * as React from 'react';
import { useAuth } from '@/context/auth-context';
import {
  loadProgress,
  saveProgress,
  type TrackProgress,
} from '@/lib/track/progress';

interface TrackState extends TrackProgress {
  loading: boolean;
}

/**
 * Track progress bound to the signed-in user (Supabase) or the guest
 * (localStorage). `completeLesson` is idempotent — replaying a finished
 * lesson banks no extra XP.
 */
export function useTrackProgress() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [state, setState] = React.useState<TrackState>({
    xp: 0,
    completedLessons: [],
    cloud: false,
    loading: true,
  });

  React.useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true }));
    loadProgress(userId).then((p) => {
      if (!cancelled) setState({ ...p, loading: false });
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const completeLesson = React.useCallback(
    async (lessonId: string, xpEarned: number) => {
      const next: TrackProgress = {
        xp: state.xp + (state.completedLessons.includes(lessonId) ? 0 : xpEarned),
        completedLessons: state.completedLessons.includes(lessonId)
          ? state.completedLessons
          : [...state.completedLessons, lessonId],
        cloud: state.cloud,
      };
      setState({ ...next, loading: false });
      await saveProgress(userId, next);
      return next;
    },
    [state, userId]
  );

  return { ...state, completeLesson };
}
