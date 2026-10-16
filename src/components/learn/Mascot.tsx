'use client';

import * as React from 'react';

/**
 * Track mascot. Uses `/mascot.png` when the club drops one into `public/`
 * (no code change needed); otherwise renders a small procedural dragon face.
 * Flat shapes only, brand amber + neutrals, no gradients.
 */
export function Mascot({ size = 56, mood = 'happy' }: { size?: number; mood?: 'happy' | 'thinking' | 'celebrate' }) {
  // Default to the procedural dragon; upgrade to /mascot.png only after it
  // provably loads. This way a missing file never flashes a broken image.
  const [useFile, setUseFile] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    const probe = new Image();
    probe.onload = () => {
      if (!cancelled) setUseFile(true);
    };
    probe.src = '/mascot.png';
    return () => {
      cancelled = true;
    };
  }, []);

  if (useFile) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src="/mascot.png"
        alt="Weather dragon mascot"
        width={size}
        height={size}
        style={{ width: size, height: size, objectFit: 'contain' }}
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
      {/* horns */}
      <path d="M28 26 L22 8 L40 20 Z" fill="var(--color-muted)" />
      <path d="M72 26 L78 8 L60 20 Z" fill="var(--color-muted)" />
      {/* face */}
      <rect x="18" y="18" width="64" height="64" rx="22" fill="var(--accent)" />
      {/* belly patch */}
      <ellipse cx="50" cy="66" rx="16" ry="12" fill="var(--color-surface)" opacity="0.85" />
      {/* eyes */}
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
