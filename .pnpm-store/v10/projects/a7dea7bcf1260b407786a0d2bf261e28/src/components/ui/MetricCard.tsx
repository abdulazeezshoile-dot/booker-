import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

export function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'brand',
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  tone?: 'brand' | 'ok' | 'warn' | 'danger' | 'neutral';
  className?: string;
}) {
  const toneStyles = {
    brand: 'bg-brand-50 text-brand-500 dark:bg-brand-500/15',
    ok: 'bg-ok/10 text-ok',
    warn: 'bg-warn/10 text-warn',
    danger: 'bg-danger/10 text-danger',
    neutral: 'bg-surface-2 text-muted dark:text-text-secondary',
  }[tone];

  return (
    <div className={cn('rounded-card border border-line bg-surface p-5 shadow-card dark:bg-surface-raised', className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted dark:text-text-secondary">{label}</span>
        <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl', toneStyles)}>
          <Icon className="h-4.5 w-4.5" />
        </span>
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight text-ink dark:text-text-primary">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted dark:text-text-faint">{hint}</p> : null}
    </div>
  );
}
