'use client';

import * as React from 'react';
import { useWeather } from '@/hooks/useWeather';
import { LiveDot, type LiveStatus } from '@/components/live-dot';
import { RelativeTime } from './RelativeTime';
import { StaleBanner } from './StaleBanner';

export function StatusStrip() {
  const { reading, measuredAt, secondsSinceMeasured, isStale, isOffline } =
    useWeather();

  const status: LiveStatus = isOffline ? 'offline' : isStale ? 'delayed' : 'live';

  // Reserve the banner's height so the page never jumps when it appears.
  const hasData = reading != null;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <LiveDot status={status} />
        {hasData && (
          <span className="text-xs text-[var(--color-muted)]">
            <RelativeTime seconds={secondsSinceMeasured} />
            {' · '}Station WS3500
          </span>
        )}
      </div>
      {/* Banner slot: stable height, grows/shrinks with a soft transition. */}
      <StaleBanner
        isStale={isStale}
        isOffline={isOffline}
        seconds={secondsSinceMeasured}
      />
    </div>
  );
}
