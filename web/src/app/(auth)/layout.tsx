import type { ReactNode } from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-bg-app px-4 py-10 dark:bg-bg">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-ink dark:text-text-primary">BizRecord</h1>
      </div>
      {children}
    </div>
  );
}
