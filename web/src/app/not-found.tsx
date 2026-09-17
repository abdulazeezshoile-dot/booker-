import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg-app px-4 text-ink dark:bg-bg dark:text-text-primary">
      <div className="w-full max-w-md rounded-panel border border-line bg-surface p-8 text-center shadow-panel dark:bg-surface-2">
        <p className="text-sm font-bold uppercase tracking-[.2em] text-brand-500">404</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight">Page not found</h1>
        <p className="mt-3 text-sm text-muted dark:text-text-secondary">
          The page you are looking for may have moved or no longer exists.
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/" className="focus-ring rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-cta transition hover:bg-brand-600">
            Back to home
          </Link>
          <Link href="/dashboard" className="focus-ring rounded-xl border border-line bg-surface px-5 py-3 text-sm font-semibold text-ink transition hover:bg-surface-2 dark:bg-surface-raised dark:text-text-primary">
            Open dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
