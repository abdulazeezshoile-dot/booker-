import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-card border border-line bg-surface shadow-card dark:bg-surface-raised',
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-start justify-between gap-3 border-b border-border-soft px-5 py-4',
        className,
      )}
    >
      <div>
        <h3 className="text-base font-semibold text-ink dark:text-text-primary">{title}</h3>
        {subtitle ? (
          <p className="mt-0.5 text-sm text-muted dark:text-text-secondary">{subtitle}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
