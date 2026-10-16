import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function siteUrl(req: Request): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/$/, '');
  return new URL(req.url).origin;
}

/** OAuth callback: exchanges the code for a session, then lands on /learn. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/learn';

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const url = new URL(next, siteUrl(request));
      return NextResponse.redirect(url);
    }
  }
  const url = new URL('/login?error=oauth', siteUrl(request));
  return NextResponse.redirect(url);
}
