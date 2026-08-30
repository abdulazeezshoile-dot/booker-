import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

export function EmptyState({
  icon: Icon,
  title,
  subtitle,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-card border border-dashed border-line bg-surface px-6 py-12 text-center dark:bg-surface-raised',
        className,
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-500 dark:bg-brand-500/15">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-ink dark:text-text-primary">{title}</h3>
      {subtitle ? (
        <p className="mt-1 max-w-sm text-sm text-muted dark:text-text-secondary">{subtitle}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
