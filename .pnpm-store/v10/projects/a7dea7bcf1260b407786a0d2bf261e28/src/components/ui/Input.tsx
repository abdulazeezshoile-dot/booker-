'use client';

import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

const fieldBase =
  'w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-text-primary placeholder:text-text-faint focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none disabled:opacity-60 dark:border-border dark:bg-surface-2';

export interface FieldProps {
  label?: string;
  error?: string | null;
  hint?: string;
  id?: string;
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement>, FieldProps {}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, id, className, ...props },
  ref,
) {
  const fieldId = id || props.name;
  return (
    <div className="space-y-1">
      {label ? (
        <label htmlFor={fieldId} className="block text-xs font-medium text-text-secondary dark:text-text-secondary">
          {label}
        </label>
      ) : null}
      <input
        ref={ref}
        id={fieldId}
        aria-invalid={error ? true : undefined}
        className={cn(fieldBase, error && 'border-danger focus:border-danger focus:ring-danger/20', className)}
        {...props}
      />
      {error ? <p className="text-xs text-danger">{error}</p> : null}
      {hint && !error ? <p className="text-xs text-text-faint">{hint}</p> : null}
    </div>
  );
});

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement>, FieldProps {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, id, className, ...props },
  ref,
) {
  const fieldId = id || props.name;
  return (
    <div className="space-y-1">
      {label ? (
        <label htmlFor={fieldId} className="block text-xs font-medium text-text-secondary dark:text-text-secondary">
          {label}
        </label>
      ) : null}
      <textarea
        ref={ref}
        id={fieldId}
        aria-invalid={error ? true : undefined}
        className={cn(fieldBase, 'min-h-20 resize-y', error && 'border-danger focus:border-danger focus:ring-danger/20', className)}
        {...props}
      />
      {error ? <p className="text-xs text-danger">{error}</p> : null}
      {hint && !error ? <p className="text-xs text-text-faint">{hint}</p> : null}
    </div>
  );
});
