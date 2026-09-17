import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export type BadgeTone = 'ok' | 'warn' | 'danger' | 'info' | 'neutral' | 'brand';

const toneStyles: Record<BadgeTone, string> = {
  ok: 'bg-ok/10 text-ok',
  warn: 'bg-warn/10 text-warn',
  danger: 'bg-danger/10 text-danger',
  info: 'bg-brand-teal/10 text-brand-700 dark:text-brand-teal',
  neutral: 'bg-surface-2 text-muted border border-line dark:text-text-secondary',
  brand: 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300',
};

export function Badge({
  tone = 'neutral',
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
        toneStyles[tone],
        className,
      )}
      {...props}
    />
  );
}

const statusTone: Record<string, BadgeTone> = {
  active: 'ok',
  completed: 'ok',
  paid: 'ok',
  available: 'ok',
  pending: 'warn',
  trialing: 'warn',
  expired: 'danger',
  cancelled: 'danger',
  inactive: 'neutral',
  out_of_stock: 'danger',
  discontinued: 'neutral',
  conflict: 'danger',
  failed: 'danger',
};

export function StatusBadge({ status }: { status?: string | null }) {
  const tone = statusTone[String(status || '').toLowerCase()] ?? 'neutral';
  return (
    <Badge tone={tone}>
      {String(status || '').replace(/_/g, ' ')}
    </Badge>
  );
}
