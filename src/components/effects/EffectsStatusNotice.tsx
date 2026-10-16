'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { useEffects } from '@/context/effects-context';

export function EffectsStatusNotice() {
  const { isTripped, reenable } = useEffects();

  return (
    <div
      className="effects-status-slot grid transition-[grid-template-rows] duration-200 motion-reduce:transition-none print:hidden"
      style={{ gridTemplateRows: isTripped ? '1fr' : '0fr' }}
      aria-hidden={!isTripped}
    >
      <div className="min-h-0 overflow-hidden">
        {isTripped && (
          <div
            role="status"
            aria-live="polite"
            className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--color-border)] pt-3"
          >
            <p className="m-0 max-w-3xl text-xs leading-relaxed text-[var(--color-muted)]">
              The moving rain and clouds turned themselves off to keep this page fast on this laptop. The numbers still update live.
            </p>
            <Button type="button" size="sm" variant="outline" onClick={reenable}>
              Re-enable effects
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
