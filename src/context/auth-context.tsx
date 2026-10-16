'use client';

import * as React from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  configured: boolean;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signInWithEmail: (
    email: string,
    password: string
  ) => Promise<{ error: string | null }>;
  signUpWithEmail: (
    email: string,
    password: string
  ) => Promise<{ error: string | null; confirmEmail: boolean }>;
  signOut: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

function siteUrl(): string {
  if (typeof window !== 'undefined') return window.location.origin;
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const configured = isSupabaseConfigured();
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(configured);
  const supabaseRef = React.useRef<ReturnType<typeof createClient> | null>(null);

  if (configured && !supabaseRef.current) {
    supabaseRef.current = createClient();
  }

  React.useEffect(() => {
    if (!configured || !supabaseRef.current) return;
    const supabase = supabaseRef.current;
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );
    return () => listener.subscription.unsubscribe();
  }, [configured]);

  const value = React.useMemo<AuthContextValue>(() => {
    const err = (e: unknown) =>
      e instanceof Error ? e.message : 'Something went wrong. Try again.';
    return {
      user,
      loading,
      configured,
      signInWithGoogle: async () => {
        if (!supabaseRef.current) return { error: 'Auth is not configured.' };
        const { error } = await supabaseRef.current.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${siteUrl()}/auth/callback?next=/learn`,
          },
        });
        return { error: error ? err(error) : null };
      },
      signInWithEmail: async (email, password) => {
        if (!supabaseRef.current) return { error: 'Auth is not configured.' };
        const { error } = await supabaseRef.current.auth.signInWithPassword({
          email,
          password,
        });
        return { error: error ? err(error) : null };
      },
      signUpWithEmail: async (email, password) => {
        if (!supabaseRef.current)
          return { error: 'Auth is not configured.', confirmEmail: false };
        const { data, error } =
          await supabaseRef.current.auth.signUp({ email, password });
        if (error) return { error: err(error), confirmEmail: false };
        // With "confirm email" on, there is no session yet: user must click
        // the Supabase email link first.
        return { error: null, confirmEmail: !data.session };
      },
      signOut: async () => {
        await supabaseRef.current?.auth.signOut();
        setUser(null);
      },
    };
  }, [user, loading, configured]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
