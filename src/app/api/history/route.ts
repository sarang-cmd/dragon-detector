import { NextRequest, NextResponse } from 'next/server';
import { getSource } from '@/sources';
import { HistoryPoint } from '@/lib/types';

export async function GET(req: NextRequest) {
  const range = (req.nextUrl.searchParams.get('range') || '24h') as '24h' | '7d';
  const source = getSource();

  let points: HistoryPoint[];
  try {
    points = await source.getHistory(range);
  } catch {
    return NextResponse.json({ points: [], error: 'History unavailable' }, { status: 503 });
  }

  return NextResponse.json({ points, range, fetchedAt: new Date().toISOString() });
}
