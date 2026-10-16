'use client';

import * as React from 'react';
import Link from 'next/link';
import { Camera, LogOut, UserRound } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { createClient } from '@/lib/supabase/client';

const MAX_BYTES = 2 * 1024 * 1024;

/**
 * Header account control: sign-in link, or avatar (photo or initial) with
 * upload + sign out. Photos live in the public `avatars` Supabase bucket
 * under `<userId>/avatar.*`; the public URL is stored on the user's metadata.
 */
export function AuthButton() {
  const { user, loading, configured, signOut, refresh } = useAuth();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  if (!configured) return null;

  if (loading) {
    return (
      <span
        aria-hidden="true"
        className="inline-block h-9 w-9 rounded-full bg-[var(--color-border)]"
      />
    );
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="inline-flex min-h-[44px] items-center gap-2 rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] transition-colors hover:border-[var(--color-text)] focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
      >
        <UserRound aria-hidden="true" className="h-4 w-4 stroke-[1.5]" />
        <span className="hidden sm:inline">Sign in</span>
      </Link>
    );
  }

  const avatarUrl =
    typeof user.user_metadata?.avatar_url === 'string'
      ? (user.user_metadata.avatar_url as string)
      : null;
  const initial = (user.email?.[0] ?? 'U').toUpperCase();

  const onFile = async (file: File | undefined) => {
    setError(null);
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError('Please choose an image under 2 MB.');
      return;
    }
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      const publicUrl = `${data.publicUrl}?t=${Date.now()}`;
      const { error: metaError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl },
      });
      if (metaError) throw metaError;
      await refresh();
      setMenuOpen(false);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Upload failed. Try again later.'
      );
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div ref={menuRef} className="relative inline-block">
      <button
        type="button"
        aria-label={user.email ? `Account: ${user.email}` : 'Account'}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        onClick={() => {
          setError(null);
          setMenuOpen((o) => !o);
        }}
        className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-sm font-medium text-[var(--color-text)] transition-colors hover:border-[var(--color-text)] focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          initial
        )}
      </button>

      {menuOpen && (
        <div
          role="menu"
          aria-label="Account"
          className="absolute right-0 z-50 mt-2 w-64 rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-none"
        >
          <p className="truncate px-3 py-2 text-xs text-[var(--color-muted)]">
            {user.email ?? 'Signed in'}
          </p>
          <button
            type="button"
            role="menuitem"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
            className="flex min-h-[44px] w-full items-center gap-2 rounded-[8px] px-3 text-left text-sm text-[var(--color-text)] transition-colors hover:bg-[var(--color-border)] focus-visible:outline-2 focus-visible:outline-[var(--accent)] disabled:opacity-60"
          >
            <Camera aria-hidden="true" className="h-4 w-4 stroke-[1.5]" />
            {uploading ? 'Uploading…' : 'Upload profile photo'}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            aria-label="Choose a profile photo"
            onChange={(e) => void onFile(e.target.files?.[0])}
          />
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setMenuOpen(false);
              void signOut();
            }}
            className="flex min-h-[44px] w-full items-center gap-2 rounded-[8px] px-3 text-left text-sm text-[var(--color-text)] transition-colors hover:bg-[var(--color-border)] focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
          >
            <LogOut aria-hidden="true" className="h-4 w-4 stroke-[1.5]" />
            Sign out
          </button>
          {error && (
            <p role="alert" className="px-3 py-2 text-xs leading-relaxed text-red-500">
              {error}
              {/bucket|not found|policy|row-level/i.test(error) &&
                ' (An admin needs to run supabase/migrations/0003_avatars.sql.)'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
