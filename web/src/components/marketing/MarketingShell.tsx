import Link from 'next/link';
import type { ReactNode } from 'react';
import { getCurrentUser } from '@/lib/server-api';
import { Button } from '@/components/ui/Button';

const NAV_LINKS = [
  { href: '/pricing', label: 'Pricing' },
  { href: '/how-it-works', label: 'How it works' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

const LEGAL_LINKS = [
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
];

const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.bizrecord.inventory';

export async function MarketingShell({
  children,
  wide = false,
}: {
  children: ReactNode;
  wide?: boolean;
}) {
  const user = await getCurrentUser();
  const primaryHref = user ? '/dashboard' : '/register';

  return (
    <main className="min-h-screen overflow-x-hidden bg-bg-app text-ink dark:bg-bg dark:text-text-primary">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[780px] bg-[radial-gradient(circle_at_15%_15%,rgba(0,166,118,.18),transparent_32%),radial-gradient(circle_at_82%_5%,rgba(251,191,36,.14),transparent_34%)]"
      />

      <header className="sticky top-0 z-40 border-b border-line/70 bg-bg-app/85 backdrop-blur-xl dark:border-line/60 dark:bg-bg/85">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="focus-ring flex items-center gap-2.5 text-lg font-bold">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-cta">
              B
            </span>
            BizRecord
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-semibold md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="focus-ring text-muted transition-colors hover:text-ink dark:text-text-secondary dark:hover:text-text-primary"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href={user ? '/dashboard' : '/login'}
              className="focus-ring hidden rounded-xl px-3 py-2 text-sm font-semibold text-muted transition-colors hover:text-ink sm:block dark:text-text-secondary dark:hover:text-text-primary"
            >
              {user ? 'Dashboard' : 'Sign in'}
            </Link>
            <Button asChild>
              <Link href={primaryHref}>{user ? 'Open app' : 'Get started'}</Link>
            </Button>
          </div>
        </div>
      </header>

      <div className={wide ? 'mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8' : 'mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8'}>
        {children}
      </div>

      <footer className="border-t border-line px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 text-sm text-muted sm:flex-row dark:text-text-secondary">
          <p>© {new Date().getFullYear()} BizRecord</p>
          <div className="flex flex-wrap items-center justify-center gap-5">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="focus-ring hover:text-ink dark:hover:text-text-primary">
                {link.label}
              </Link>
            ))}
            {LEGAL_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="focus-ring hover:text-ink dark:hover:text-text-primary">
                {link.label}
              </Link>
            ))}
            <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" className="focus-ring hover:text-ink dark:hover:text-text-primary">
              Google Play
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
