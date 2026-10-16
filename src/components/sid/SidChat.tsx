'use client';

import * as React from 'react';
import { MessageCircle, SendHorizonal, X } from 'lucide-react';
import { Mascot } from '@/components/learn/Mascot';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Ask Sid: floating chat button (bottom-right) opening a kids-friendly Q&A
 * panel answered by Groq with live station context. History stays in the
 * browser; only the last few turns are sent per request.
 */
export function SidChat() {
  const [open, setOpen] = React.useState(false);
  const [input, setInput] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        "Hi, I'm Sid! Ask me about the weather, the station, or any lesson.",
    },
  ]);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages, open]);

  const send = async (text: string) => {
    const clean = text.trim().slice(0, 500);
    if (!clean || busy) return;
    setError(null);
    setBusy(true);
    const next = [...messages, { role: 'user' as const, content: clean }];
    setMessages(next);
    setInput('');
    try {
      const res = await fetch('/api/sid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next.slice(-6) }),
      });
      const json = (await res.json()) as { reply?: string; error?: string };
      if (!res.ok || !json.reply) throw new Error(json.error || 'failed');
      setMessages([...next, { role: 'assistant', content: json.reply }]);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Sid got tongue-tied. Try again.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? 'Close Ask Sid chat' : 'Ask Sid anything about the weather'}
        className="fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--accent)] text-[var(--accent-foreground)] shadow-none transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
      >
        {open ? (
          <X aria-hidden="true" className="h-5 w-5" />
        ) : (
          <MessageCircle aria-hidden="true" className="h-5 w-5" />
        )}
      </button>

      {open && (
        <section
          aria-label="Ask Sid chat"
          className="fixed bottom-[76px] right-4 z-40 flex max-h-[60vh] w-[calc(100vw-2rem)] max-w-[380px] flex-col overflow-hidden rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)]"
        >
          <div className="flex items-center gap-2 border-b border-[var(--color-border)] p-3">
            <Mascot size={32} mood="happy" />
            <div>
              <p className="text-sm font-medium text-[var(--color-text)]">Ask Sid</p>
              <p className="text-[11px] text-[var(--color-muted)]">
                Weather answers from live station data
              </p>
            </div>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto p-3" aria-live="polite">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-[10px] px-3 py-2 text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'ml-auto bg-[var(--color-border)] text-[var(--color-text)]'
                    : 'bg-[var(--color-background)] text-[var(--color-text)]'
                }`}
              >
                {m.content}
              </div>
            ))}
            {busy && (
              <p className="text-xs text-[var(--color-muted)]" aria-label="Sid is thinking">
                Sid is thinking…
              </p>
            )}
            {error && (
              <p role="alert" className="text-xs text-red-500">
                {error}
              </p>
            )}
            <div ref={bottomRef} />
          </div>

          <form
            className="flex gap-2 border-t border-[var(--color-border)] p-2"
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
          >
            <label htmlFor="sid-input" className="sr-only">
              Ask Sid a question
            </label>
            <input
              id="sid-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Why is it so windy?"
              maxLength={500}
              autoComplete="off"
              className="min-h-[44px] flex-1 rounded-[8px] border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm text-[var(--color-text)] focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              aria-label="Send question to Sid"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[8px] bg-[var(--accent)] text-[var(--accent-foreground)] disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
            >
              <SendHorizonal aria-hidden="true" className="h-4 w-4" />
            </button>
          </form>
        </section>
      )}
    </>
  );
}
