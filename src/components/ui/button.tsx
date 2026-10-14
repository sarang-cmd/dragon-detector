import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50 select-none focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-2',
  {
    variants: {
      variant: {
        default:
          'bg-[var(--accent)] text-[var(--accent-foreground)] hover:opacity-90 active:opacity-95',
        secondary:
          'bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] hover:border-[var(--color-text)] active:bg-[var(--color-border)]',
        outline:
          'border border-[var(--color-border)] bg-transparent text-[var(--color-text)] hover:border-[var(--color-text)] hover:bg-[var(--color-surface)]',
        ghost:
          'text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)]',
        link: 'text-[var(--accent)] underline-offset-4 hover:underline',
      },
      size: {
        default: 'min-h-[44px] px-4 py-2 rounded-[12px]',
        sm: 'min-h-[36px] px-3 rounded-[8px] text-xs',
        lg: 'min-h-[48px] px-6 rounded-[12px] text-base',
        icon: 'h-11 w-11 min-h-[44px] min-w-[44px] rounded-[12px] p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
