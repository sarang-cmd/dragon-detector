'use client';

import * as React from 'react';

export type MascotChoice = 'sid' | 'classic';

const STORAGE_KEY = 'dis_mascot';
const EVENT_NAME = 'dis:mascot-change';

function readChoice(): MascotChoice {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'classic' ? 'classic' : 'sid';
  } catch {
    return 'sid';
  }
}

export function setMascotChoice(next: MascotChoice): void {
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // ignore write errors
  }
  window.dispatchEvent(new CustomEvent<MascotChoice>(EVENT_NAME, { detail: next }));
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener(EVENT_NAME, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(EVENT_NAME, onChange);
    window.removeEventListener('storage', onChange);
  };
}

export function useMascotChoice(): MascotChoice {
  return React.useSyncExternalStore(subscribe, readChoice, () => 'sid' as const);
}

/**
 * Sid, the official DIS Dragons mascot (default), with the procedural dragon
 * as the "classic" alternative. The admin panel (triple-press D) toggles
 * between them; the choice persists per browser. Falls back to procedural
 * art if the image file is ever missing.
 */
export function Mascot({ size = 56, mood = 'happy' }: { size?: number; mood?: 'happy' | 'thinking' | 'celebrate' }) {
  const choice = useMascotChoice();
  const [broken, setBroken] = React.useState(false);

  if (choice === 'sid' && !broken) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src="/brand/dis-dragons-mascot-512.png"
        alt="Sid, the DIS Dragons mascot"
        width={size}
        height={size}
        style={{ width: size, height: size, objectFit: 'contain' }}
        onError={() => setBroken(true)}
      />
    );
  }

  const mouth =
    mood === 'thinking' ? (
      <line x1="38" y1="66" x2="62" y2="62" stroke="var(--color-text)" strokeWidth="3" strokeLinecap="round" />
    ) : (
      <path d="M36 62 Q50 74 64 62" fill="none" stroke="var(--color-text)" strokeWidth="3" strokeLinecap="round" />
    );
  const brows =
    mood === 'thinking' ? (
      <>
        <line x1="32" y1="40" x2="44" y2="44" stroke="var(--color-text)" strokeWidth="3" strokeLinecap="round" />
        <line x1="68" y1="40" x2="56" y2="44" stroke="var(--color-text)" strokeWidth="3" strokeLinecap="round" />
      </>
    ) : null;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label="Weather dragon mascot"
    >
      <path d="M28 26 L22 8 L40 20 Z" fill="var(--color-muted)" />
      <path d="M72 26 L78 8 L60 20 Z" fill="var(--color-muted)" />
      <rect x="18" y="18" width="64" height="64" rx="22" fill="var(--accent)" />
      <ellipse cx="50" cy="66" rx="16" ry="12" fill="var(--color-surface)" opacity="0.85" />
      <circle cx="38" cy="50" r="6" fill="var(--color-background)" />
      <circle cx="62" cy="50" r="6" fill="var(--color-background)" />
      <circle cx="39.5" cy="48.5" r="2" fill="var(--color-text)" />
      <circle cx="63.5" cy="48.5" r="2" fill="var(--color-text)" />
      {brows}
      {mouth}
      {mood === 'celebrate' && (
        <>
          <circle cx="16" cy="30" r="3" fill="var(--color-text)" />
          <circle cx="86" cy="24" r="2.5" fill="var(--color-text)" />
          <circle cx="90" cy="48" r="2" fill="var(--color-text)" />
        </>
      )}
    </svg>
  );
}

/** Lightweight CSS confetti burst (static under prefers-reduced-motion). */
export function Confetti({ pieces = 24 }: { pieces?: number }) {
  const [reduced, setReduced] = React.useState(false);
  const drops = React.useMemo(
    () =>
      Array.from({ length: pieces }, (_, i) => ({
        left: (i * 97) % 100,
        delay: (i % 7) * 0.12,
        size: 5 + ((i * 13) % 5),
        color: i % 3 === 0 ? 'var(--accent)' : i % 3 === 1 ? 'var(--color-text)' : 'var(--color-muted)',
        round: i % 2 === 0,
      })),
    [pieces]
  );

  React.useEffect(() => {
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  if (reduced) return null;

  return (
    <div aria-hidden="true" className="confetti-host pointer-events-none absolute inset-0 overflow-hidden">
      {drops.map((d, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={{
            left: `${d.left}%`,
            width: d.size,
            height: d.size,
            background: d.color,
            borderRadius: d.round ? '50%' : '2px',
            animationDelay: `${d.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
