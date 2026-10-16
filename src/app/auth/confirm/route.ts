import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function siteUrl(req: Request): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/$/, '');
  return new URL(req.url).origin;
}

const NEXT_BY_TYPE: Record<string, string> = {
  signup: '/learn',
  invite: '/learn',
  magiclink: '/learn',
  recovery: '/login/update-password',
  email_change: '/learn',
};

/**
 * Handles Supabase email links (`?token_hash=&type=`): signup confirmations,
 * invites, magic links, recovery and email changes. OAuth uses /auth/callback
 * instead (PKCE code exchange).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') ?? 'signup';
  const next = searchParams.get('next') ?? NEXT_BY_TYPE[type] ?? '/learn';

  if (!token_hash) {
    return NextResponse.redirect(new URL('/login?error=link', siteUrl(request)));
  }

  const supabase = createClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash,
    type: type as 'signup' | 'invite' | 'magiclink' | 'recovery' | 'email_change',
  });

  if (error) {
    return NextResponse.redirect(new URL('/login?error=link', siteUrl(request)));
  }
  return NextResponse.redirect(new URL(next, siteUrl(request)));
}
