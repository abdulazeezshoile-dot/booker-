'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Slot } from './Slot';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 shadow-cta disabled:bg-brand-300',
  secondary:
    'bg-brand-50 text-brand-700 hover:bg-brand-100 active:bg-brand-200 border border-brand-200 dark:bg-brand-500/15 dark:text-brand-300 dark:border-brand-500/30',
  outline:
    'bg-transparent text-ink dark:text-text-primary border border-line hover:bg-surface-2 dark:hover:bg-surface-2',
  ghost:
    'bg-transparent text-ink dark:text-text-primary hover:bg-surface-2 dark:hover:bg-surface-2',
  danger:
    'bg-danger text-white hover:opacity-90 active:opacity-80 disabled:opacity-60',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
  icon?: ReactNode;
  /** Render onto a Link instead of a <button> when wrapping navigation. */
  asChild?: boolean;
}

const baseClass = cn(
  'focus-ring inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed',
);

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', loading, icon, asChild, disabled, children, ...props },
  ref,
) {
  const cls = cn(baseClass, variantStyles[variant], className);

  if (asChild) {
    return (
      <Slot
        className={cls}
        data-loading={loading ? 'true' : undefined}
        {...props}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
        {children}
      </Slot>
    );
  }

  return (
    <button
      ref={ref}
      className={cn(baseClass, variantStyles[variant], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {children}
    </button>
  );
});
