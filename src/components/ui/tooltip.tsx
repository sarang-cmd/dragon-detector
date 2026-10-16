'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  className?: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
}

type Side = 'top' | 'bottom' | 'left' | 'right';

const GAP = 8;
const MARGIN = 8;
const MAX_WIDTH = 240;

/**
 * Lightweight, accessible tooltip adhering to WCAG 2.2 and anti-AI design rules.
 * No external runtime dependencies; responds to hover and keyboard focus.
 *
 * Rendered in a portal with position:fixed computed from the trigger rect, so
 * it is never clipped by tile overflow:hidden. Placement prefers `side` but
 * flips when it would leave the viewport, and clamps horizontally.
 */
export function Tooltip({
  content,
  children,
  className = '',
  side = 'top',
}: TooltipProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [style, setStyle] = React.useState<React.CSSProperties>({
    visibility: 'hidden',
  });
  const id = React.useId();
  const triggerRef = React.useRef<HTMLElement | null>(null);
  const tipRef = React.useRef<HTMLDivElement | null>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // Position after mount so the real size is measurable; re-run while open.
  React.useLayoutEffect(() => {
    if (!isOpen) return;
    const trigger = triggerRef.current;
    const tip = tipRef.current;
    if (!trigger || !tip) return;

    const place = () => {
      const r = trigger.getBoundingClientRect();
      const t = tip.getBoundingClientRect();
      const vw = window.innerWidth;

      const order: Side[] =
        side === 'top'
          ? ['top', 'bottom']
          : side === 'bottom'
            ? ['bottom', 'top']
            : side === 'left'
              ? ['left', 'right']
              : ['right', 'left'];

      let chosen = order[0];
      if (chosen === 'top' && r.top - GAP - t.height < MARGIN) chosen = 'bottom';
      if (chosen === 'bottom' && r.bottom + GAP + t.height > window.innerHeight - MARGIN)
        chosen = 'top';
      if (chosen === 'left' && r.left - GAP - t.width < MARGIN) chosen = 'right';
      if (chosen === 'right' && r.right + GAP + t.width > vw - MARGIN) chosen = 'left';

      let top = 0;
      let left = 0;
      let transform = '';
      if (chosen === 'top') {
        top = r.top - GAP;
        left = r.left + r.width / 2;
        transform = 'translate(-50%, -100%)';
      } else if (chosen === 'bottom') {
        top = r.bottom + GAP;
        left = r.left + r.width / 2;
        transform = 'translate(-50%, 0)';
      } else if (chosen === 'left') {
        top = r.top + r.height / 2;
        left = r.left - GAP;
        transform = 'translate(-100%, -50%)';
      } else {
        top = r.top + r.height / 2;
        left = r.right + GAP;
        transform = 'translate(0, -50%)';
      }

      // Clamp horizontally so the box never leaves the viewport.
      const half = t.width / 2;
      if (chosen === 'top' || chosen === 'bottom') {
        const minLeft = MARGIN + half;
        const maxLeft = vw - MARGIN - half;
        left = Math.min(Math.max(left, minLeft), Math.max(maxLeft, minLeft));
      }

      setStyle({
        position: 'fixed',
        top,
        left,
        transform,
        maxWidth: `min(${MAX_WIDTH}px, calc(100vw - ${MARGIN * 2}px))`,
        visibility: 'visible',
      });
    };

    place();
  }, [isOpen, side, content]);

  // Position goes stale on scroll/resize — just close.
  React.useEffect(() => {
    if (!isOpen) return;
    const close = () => setIsOpen(false);
    window.addEventListener('scroll', close, { passive: true });
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('scroll', close);
      window.removeEventListener('resize', close);
    };
  }, [isOpen]);

  const trigger = React.cloneElement(children, {
    ref: (node: HTMLElement | null) => {
      triggerRef.current = node;
      const childRef = (children as React.ReactElement & { ref?: React.Ref<HTMLElement> }).ref;
      if (typeof childRef === 'function') childRef(node);
    },
    'aria-describedby': isOpen ? id : undefined,
    onMouseEnter: () => setIsOpen(true),
    onMouseLeave: () => setIsOpen(false),
    onFocus: () => setIsOpen(true),
    onBlur: () => setIsOpen(false),
    onKeyDown: handleKeyDown,
  });

  return (
    <>
      {trigger}
      {isOpen &&
        createPortal(
          <div
            id={id}
            ref={tipRef}
            role="tooltip"
            style={style}
            className={`z-[80] whitespace-normal rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-xs font-normal leading-relaxed text-[var(--color-text)] shadow-none pointer-events-none transition-opacity duration-150 print:hidden ${className}`}
          >
            {content}
          </div>,
          document.body
        )}
    </>
  );
}
