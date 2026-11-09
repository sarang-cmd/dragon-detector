import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const querySchema = z.object({
  units: z.enum(['metric', 'imperial']).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

/**
 * Public outlook history (no login needed): newest first, capped client-side
 * and server-side (50 per unit system). Empty until migration 0004 is run.
 */
export async function GET(req: NextRequest) {
  const parsed = querySchema.safeParse(
    Object.fromEntries(req.nextUrl.searchParams.entries())
  );
  const units = parsed.success ? (parsed.data.units ?? 'metric') : 'metric';
  const limit = parsed.success ? (parsed.data.limit ?? 20) : 20;

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return NextResponse.json({ units, entries: [] });
  }

  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = createClient();
    const { data, error } = await supabase
      .from('outlook_history')
      .select('payload, created_at')
      .eq('units', units)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return NextResponse.json(
      {
        units,
        entries: (data ?? []).map((row) => ({
          createdAt: row.created_at,
          ...(row.payload as Record<string, unknown>),
        })),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
        },
      }
    );
  } catch {
    return NextResponse.json({ units, entries: [] });
  }
}
