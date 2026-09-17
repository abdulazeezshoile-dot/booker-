'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  Wallet,
  BarChart3,
  Package,
  Users,
  ArrowLeftRight,
  Settings,
  CreditCard,
  LogOut,
  Store,
  ChevronDown,
  Building2,
  Menu,
  X,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useTheme } from '@/context/ThemeContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { initials } from '@/lib/format';
import { api } from '@/lib/api';
import type { User } from '@/lib/types';
import { Button } from '@/components/ui/Button';

const NAV = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/sales', label: 'Sales', icon: ShoppingCart },
  { href: '/debts', label: 'Debts', icon: Wallet },
  { href: '/reports', label: 'Analytics', icon: BarChart3 },
  { href: '/inventory', label: 'Inventory', icon: Package },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { href: '/subscription', label: 'Subscription', icon: CreditCard },
  { href: '/settings', label: 'Settings', icon: Settings },
];

function WorkspaceSwitcher() {
  const { workspaces, currentWorkspace, setCurrentWorkspaceId, activeBranch, branches, setActiveBranchId, loading } =
    useWorkspace();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="focus-ring flex w-full items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-left hover:bg-surface-2 dark:bg-surface-2 dark:text-text-primary"
      >
        <Store className="h-4 w-4 shrink-0 text-brand-500" />
        <span className="min-w-0 flex-1 truncate text-sm font-semibold">
          {loading ? 'Loadingâ€¦' : currentWorkspace?.name || 'Select workspace'}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted" />
      </button>

      {open ? (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="animate-fade-up absolute left-0 right-0 top-full z-40 mt-2 max-h-72 overflow-y-auto rounded-xl border border-line bg-surface p-1.5 shadow-panel dark:bg-surface-raised">
            {workspaces.map((ws) => (
              <button
                key={ws.id}
                onClick={() => {
                  setCurrentWorkspaceId(ws.id);
                  setOpen(false);
                }}
                className={cn(
                  'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-surface-2',
                  ws.id === currentWorkspace?.id
                    ? 'bg-brand-50 font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300'
                    : 'text-ink dark:text-text-primary',
                )}
              >
                <Building2 className="h-4 w-4" />
                <span className="truncate">{ws.name}</span>
                {ws.readOnly ? <Lock className="h-4 w-4" /> : null}
              </button>
            ))}
          </div>
        </>
      ) : null}

      {branches.length > 1 ? (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveBranchId(null)}
            className={cn(
              'rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
              !activeBranch
                ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300'
                : 'border-line text-muted hover:bg-surface-2 dark:text-text-secondary',
            )}
          >
            All branches
          </button>
          {branches.map((b) => (
            <button
              key={b.id}
              onClick={() => setActiveBranchId(b.id)}
              className={cn(
                'rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
                activeBranch?.id === b.id
                  ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300'
                  : 'border-line text-muted hover:bg-surface-2 dark:text-text-secondary',
              )}
            >
              {b.name}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function UserMenu({ user }: { user: User }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { setTheme } = useTheme();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setTheme('light');
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="focus-ring flex items-center gap-2 rounded-full border border-line bg-surface py-1 pl-1 pr-3 hover:bg-surface-2 dark:bg-surface-2"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">
          {initials(user.name)}
        </span>
        <span className="hidden text-sm font-semibold text-ink sm:block dark:text-text-primary">
          {user.name}
        </span>
        <ChevronDown className="h-4 w-4 text-muted" />
      </button>

      {open ? (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="animate-fade-up absolute right-0 top-full z-40 mt-2 w-56 rounded-xl border border-line bg-surface p-1.5 shadow-panel dark:bg-surface-raised">
            <div className="border-b border-border-soft px-3 py-2">
              <p className="truncate text-sm font-semibold text-ink dark:text-text-primary">{user.name}</p>
              <p className="truncate text-xs text-muted dark:text-text-secondary">{user.email}</p>
            </div>
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink hover:bg-surface-2 dark:text-text-primary"
            >
              <Settings className="h-4 w-4" /> Settings
            </Link>
            <Link
              href="/subscription"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink hover:bg-surface-2 dark:text-text-primary"
            >
              <CreditCard className="h-4 w-4" /> Subscription
            </Link>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-danger hover:bg-danger/10"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}

function MobileNav({ user }: { user: User }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="focus-ring rounded-xl border border-line bg-surface p-2.5 text-muted transition-colors hover:bg-surface-2 dark:text-text-secondary"
        aria-label="Open menu"
      >
        <Menu className="h-4 w-4" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink/60 backdrop-blur-sm" onClick={close} aria-hidden="true" />
          <div className="animate-fade-up absolute right-0 top-0 flex h-full w-72 max-w-[85vw] flex-col overflow-y-auto border-l border-line bg-surface p-4 shadow-panel dark:bg-surface-2">
            <div className="mb-4 flex items-center justify-between">
              <Link href="/dashboard" onClick={close} className="flex items-center gap-2 font-bold text-ink dark:text-text-primary">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-sm text-white">B</span>
                BizRecord
              </Link>
              <button
                onClick={close}
                className="focus-ring rounded-lg p-1.5 text-muted hover:bg-surface-2 dark:text-text-secondary dark:hover:bg-surface-2"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 space-y-1">
              {NAV.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <button
                    key={item.href}
                    onClick={() => go(item.href)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                      active
                        ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300'
                        : 'text-muted hover:bg-surface-2 hover:text-ink dark:text-text-secondary dark:hover:text-text-primary',
                    )}
                  >
                    <item.icon className="h-4.5 w-4.5" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function AppShell({ user, children }: { user: User; children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside className="no-print sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-line bg-surface px-4 py-5 lg:flex dark:bg-surface-2">
        <Link href="/dashboard" className="mb-6 flex items-center gap-2 px-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-lg font-bold text-white">
            B
          </span>
          <span className="text-lg font-bold text-ink dark:text-text-primary">BizRecord</span>
        </Link>

        <WorkspaceSwitcher />

        <nav className="mt-5 flex-1 space-y-1 overflow-y-auto scroll-thin">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300'
                    : 'text-muted hover:bg-surface-2 hover:text-ink dark:text-text-secondary dark:hover:text-text-primary',
                )}
              >
                <item.icon className="h-4.5 w-4.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-4 flex items-center justify-between border-t border-border-soft pt-4">
          <UserMenu user={user} />
          <ThemeToggle />
        </div>
      </aside>

      {/* Mobile app shell: top navigation is easier to scan than a sidebar. */}
      <header className="no-print sticky top-0 z-20 border-b border-line bg-surface shadow-sm lg:hidden dark:bg-surface-2">
        <div className="flex min-w-0 items-center justify-between gap-3 px-3 py-3 sm:px-4">
          <Link href="/dashboard" className="flex shrink-0 items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-sm font-bold text-white">B</span>
            <span className="font-bold text-ink dark:text-text-primary">BizRecord</span>
          </Link>
          <div className="flex shrink-0 items-center gap-1.5">
            <MobileNav user={user} />
            <ThemeToggle />
            <UserMenu user={user} />
          </div>
        </div>
        <div className="border-t border-border-soft px-3 py-2 sm:px-4">
          <WorkspaceSwitcher />
        </div>
      </header>

      <main className="min-w-0 flex-1 overflow-x-hidden bg-bg-app dark:bg-bg">
        <div className="mx-auto w-full max-w-6xl px-3 py-4 sm:px-6 sm:py-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}

