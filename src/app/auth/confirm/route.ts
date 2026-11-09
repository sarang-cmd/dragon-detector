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

/** Email-link landing: verifies token_hash links (signup, invite, magic link,
 * recovery, email change). Redirects with a specific reason code on failure
 * so /login can explain instead of stranding the user. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') ?? 'signup';
  const next = searchParams.get('next') ?? NEXT_BY_TYPE[type] ?? '/learn';
  const fail = (reason: string) =>
    NextResponse.redirect(
      new URL(`/login?error=link&reason=${reason}`, siteUrl(request))
    );

  if (!token_hash) return fail('missing');

  const supabase = createClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash,
    type: type as 'signup' | 'invite' | 'magiclink' | 'recovery' | 'email_change',
  });

  if (error) {
    // Supabase reuses a few messages: expired/consumed tokens surface as
    // "expired" or "invalid". Rate-limited sends surface upstream instead.
    const msg = error.message.toLowerCase();
    if (msg.includes('expired')) return fail('expired');
    if (msg.includes('already') || msg.includes('used')) return fail('used');
    return fail('invalid');
  }
  return NextResponse.redirect(new URL(next, siteUrl(request)));
}
