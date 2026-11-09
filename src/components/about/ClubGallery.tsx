'use client';

import * as React from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ClubPhoto } from '@/lib/content/club';

const dotButton =
  'h-2.5 w-2.5 rounded-full border border-[var(--color-border)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent)]';

const arrowButton =
  'inline-flex h-9 w-9 items-center justify-center rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline-2 focus-visible:outline-[var(--accent)]';

/**
 * Small photo carousel for the club gallery. One photo at a time, arrows and
 * dots, keyboard reachable. Honours reduced motion by simply not animating.
 */
export function ClubGallery({ photos }: { photos: ClubPhoto[] }) {
  const [index, setIndex] = React.useState(0);

  if (photos.length === 0) return null;

  const total = photos.length;
  // Keep the index valid if the content file loses a photo between renders.
  const safeIndex = Math.min(index, total - 1);
  const photo = photos[safeIndex];
  const go = (delta: number) =>
    setIndex((current) => (current + delta + total) % total);

  return (
    <div className="space-y-3">
      <figure className="overflow-hidden rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="relative aspect-[16/10] w-full">
          <Image
            key={photo.src}
            src={photo.src}
            alt={photo.alt}
            fill
            sizes="(max-width: 900px) 100vw, 900px"
            className="object-contain"
          />
        </div>
        <figcaption className="border-t border-[var(--color-border)] px-4 py-3 text-xs leading-relaxed text-[var(--color-muted)]">
          <span className="numeric text-[var(--color-text)]">
            {safeIndex + 1}/{total}
          </span>{' '}
          &middot; {photo.caption}
        </figcaption>
      </figure>

      {total > 1 && (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5" role="group" aria-label="Choose a photo">
            {photos.map((p, i) => (
              <button
                key={p.src}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Photo ${i + 1}: ${p.caption}`}
                aria-current={i === safeIndex}
                className={`${dotButton} ${
                  i === safeIndex ? 'bg-[var(--accent)]' : 'bg-[var(--color-surface)]'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => go(-1)}
              className={arrowButton}
              aria-label="Previous photo"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              className={arrowButton}
              aria-label="Next photo"
            >
              <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
