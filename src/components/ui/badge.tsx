import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 select-none',
  {
    variants: {
      variant: {
        default:
          'border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]',
        accent:
          'bg-[var(--accent)] text-[var(--accent-foreground)] font-semibold',
        outline:
          'border border-[var(--color-border)] text-[var(--color-muted)]',
        live:
          'border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] gap-1.5',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
