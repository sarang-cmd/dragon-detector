import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSource } from '@/lib/sources';
import { buildStatisticalOutlook } from '@/lib/outlook';
import { concepts } from '@/lib/content/concepts';

const bodySchema = z.object({
  messages: z
    .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().max(500) }))
    .min(1)
    .max(8),
  units: z.enum(['metric', 'imperial']).optional(),
});

/**
 * Ask Sid: kids-friendly Q&A about the station, the weather and the lessons.
 * The model only ever sees live station numbers + concept titles (never user
 * data), answers are capped short, and the key never leaves the server.
 */
export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const key = process.env.GROQ_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: 'Sid is napping (AI is not configured on this deployment).' },
      { status: 503 }
    );
  }

  const { messages } = parsed.data;
  const last = messages[messages.length - 1].content;

  let context = 'Station offline right now.';
  try {
    const source = getSource();
    const [current, history] = await Promise.all([
      source.getCurrent(),
      source.getHistory('24h').catch(() => []),
    ]);
    const outlook = buildStatisticalOutlook(current, history, [], 'metric');
    context =
      `Dresden right now: ${current.temperatureC.toFixed(1)}C, ` +
      `humidity ${Math.round(current.humidityPct)}%, wind ${Math.round(current.windSpeedKmh)} km/h, ` +
      `rain rate ${current.rainRateMmH} mm/h, today ${current.rainTodayMm} mm. ` +
      `Station trend: ${outlook.headline}`;
  } catch {
    // fall through with offline context
  }

  const topics = concepts.map((c) => c.title).join(', ');

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        reasoning_effort: 'low',
        temperature: 0.6,
        max_tokens: 220,
        messages: [
          {
            role: 'system',
            content:
              'You are Sid, the friendly DIS Dragons mascot helping students ' +
              'on the Dresden International School weather station site. Answer ' +
              'in at most three short sentences, plain words a 10-year-old ' +
              'understands, no markdown, no emojis. Use the live numbers given. ' +
              `You can explain these topics: ${topics}. ` +
              'If asked about anything else, say you only know weather and school stuff, and suggest a lesson.',
          },
          ...messages.slice(-6).map((m) => ({
            role: m.role,
            content: m.content,
          })),
          {
            role: 'user',
            content: `Live station context: ${context}\n\nStudent asks: ${last}`,
          },
        ],
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) {
      console.error('[sid-api] Groq rejected the request');
      return NextResponse.json(
        { error: 'Sid got tongue-tied. Try again in a moment.' },
        { status: 502 }
      );
    }
    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = json.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error('empty');
    return NextResponse.json({ reply: text });
  } catch {
    console.error('[sid-api] Groq call failed');
    return NextResponse.json(
      { error: 'Sid got tongue-tied. Try again in a moment.' },
      { status: 502 }
    );
  }
}
