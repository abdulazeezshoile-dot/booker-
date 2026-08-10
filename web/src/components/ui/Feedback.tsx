'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn('h-5 w-5 animate-spin text-brand-500', className)}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

export function PageLoading({ label }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
      <Spinner className="h-7 w-7" />
      {label ? <p className="text-sm text-muted dark:text-text-secondary">{label}</p> : null}
    </div>
  );
}

export function FullPageCenter({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-app px-4">{children}</div>
  );
}

export function Alert({
  tone = 'danger',
  children,
  className,
}: {
  tone?: 'danger' | 'ok' | 'warn' | 'info';
  children: ReactNode;
  className?: string;
}) {
  const tones = {
    danger: 'border-danger/30 bg-danger/10 text-danger',
    ok: 'border-ok/30 bg-ok/10 text-ok',
    warn: 'border-warn/30 bg-warn/10 text-warn',
    info: 'border-brand-teal/30 bg-brand-teal/10 text-brand-700 dark:text-brand-teal',
  };
  return (
    <div className={cn('rounded-xl border px-4 py-3 text-sm font-medium', tones[tone], className)}>
      {children}
    </div>
  );
}
