'use client';

export type LiveStatus = 'live' | 'delayed' | 'offline';

interface LiveDotProps {
  status: LiveStatus;
  seconds?: number;
  className?: string;
}

const statusConfig: Record<LiveStatus, { label: string; color: string }> = {
  live: { label: 'Live', color: 'var(--dis-green)' },
  delayed: { label: 'Delayed', color: 'var(--accent)' },
  offline: { label: 'Offline', color: 'var(--color-muted)' },
};

export function LiveDot({ status, seconds, className = '' }: LiveDotProps) {
  const cfg = statusConfig[status];
  return (
    <div className={`inline-flex items-center gap-2 ${className}`} role="status">
      <span
        className="inline-block h-2.5 w-2.5 rounded-full"
        style={{
          backgroundColor: cfg.color,
          boxShadow: `0 0 8px ${cfg.color}`,
        }}
        aria-hidden="true"
      />
      <span className="text-xs uppercase tracking-widest" style={{ color: cfg.color }}>
        {cfg.label}
      </span>
      {seconds != null && status !== 'offline' && (
        <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
          {seconds < 60
            ? `updated ${seconds} s ago`
            : `updated ${Math.floor(seconds / 60)} min ago`}
        </span>
      )}
    </div>
  );
}
