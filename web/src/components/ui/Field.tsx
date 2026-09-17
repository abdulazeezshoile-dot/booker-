'use client';

import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

const fieldBase =
  'focus-ring w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-text-faint dark:bg-surface-2 dark:text-text-primary dark:placeholder:text-text-faint';

export interface FieldLabelProps {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: string | null;
  htmlFor?: string;
}

export function FieldLabel({ label, hint, error, htmlFor }: FieldLabelProps) {
  if (!label) return null;
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-muted dark:text-text-secondary">
      {label}
      {error ? <span className="ml-1 text-xs font-normal text-danger">· {error}</span> : null}
      {!error && hint ? <span className="ml-1 text-xs font-normal">{hint}</span> : null}
    </label>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(fieldBase, className)} {...props} />;
  },
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return <textarea ref={ref} className={cn(fieldBase, 'min-h-[96px] resize-y', className)} {...props} />;
  },
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...props }, ref) {
    return (
      <select ref={ref} className={cn(fieldBase, 'cursor-pointer', className)} {...props}>
        {children}
      </select>
    );
  },
);
