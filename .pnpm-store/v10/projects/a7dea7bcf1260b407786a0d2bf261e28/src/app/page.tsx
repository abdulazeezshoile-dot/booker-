import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Package,
  ShieldCheck,
  Smartphone,
  Users,
} from 'lucide-react';
import { getCurrentUser } from '@/lib/server-api';

const features = [
  {
    icon: Package,
    title: 'Inventory control',
    text: 'Track quantities, costs and reorder levels before stockouts interrupt sales.',
  },
  {
    icon: BarChart3,
    title: 'Sales insights',
    text: 'Follow revenue, expenses and debts with reports you can actually use.',
  },
  {
    icon: Users,
    title: 'Branches & teams',
    text: 'Invite staff, control permissions and keep every branch connected.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure records',
    text: 'Workspace-scoped access protects your business data and team activity.',
  },
];

const checklist = [
  'Record sales and expenses in seconds',
  'Monitor inventory across branches',
  'Keep customer debts visible',
  'Review performance from one dashboard',
];

const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.bizrecord.inventory';

export default async function MarketingHome() {
  const user = await getCurrentUser();
  const primaryHref = user ? '/dashboard' : '/register';
  const primaryLabel = user ? 'Open dashboard' : 'Create free account';

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
          <nav className="hidden items-center gap-7 text-sm font-semibold md:flex">
            <a className="focus-ring text-muted transition-colors hover:text-ink dark:text-text-secondary dark:hover:text-text-primary" href="#features">Features</a>
            <a className="focus-ring text-muted transition-colors hover:text-ink dark:text-text-secondary dark:hover:text-text-primary" href="#workflow">How it works</a>
            <a className="focus-ring text-muted transition-colors hover:text-ink dark:text-text-secondary dark:hover:text-text-primary" href="#download">Download</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href={user ? '/dashboard' : '/login'} className="focus-ring hidden rounded-xl px-3 py-2 text-sm font-semibold text-muted transition-colors hover:text-ink sm:block dark:text-text-secondary dark:hover:text-text-primary">
              {user ? 'Dashboard' : 'Sign in'}
            </Link>
            <Link href={primaryHref} className="focus-ring rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-cta transition hover:bg-brand-600">
              {user ? 'Open app' : 'Get started'}
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-7xl items-center gap-12 px-4 pb-16 pt-10 sm:px-6 sm:pb-24 sm:pt-16 lg:grid-cols-[1.1fr_.9fr] lg:px-8">
        <div className="animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3.5 py-1.5 text-sm font-semibold text-brand-700 shadow-card dark:border-brand-500/25 dark:bg-brand-500/10 dark:text-brand-300">
            <span className="h-2 w-2 rounded-full bg-brand-500" />
            Built for growing businesses
          </span>
          <h1 className="mt-6 text-[2.65rem] font-black leading-[1.05] tracking-[-.035em] sm:text-6xl">
            Your business records,
            <span className="relative ml-3 inline-block text-brand-500">
              organized
              <span aria-hidden className="absolute -bottom-2 left-0 h-2.5 w-full rounded-full bg-brand-500/15" />
            </span>
            .
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted dark:text-text-secondary">
            Stop juggling notebooks and spreadsheets. BizRecord brings inventory, sales, debts and team activity into one clean workspace you can trust.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href={primaryHref} className="focus-ring group inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-500 px-6 py-4 text-base font-bold text-white shadow-cta transition hover:-translate-y-0.5 hover:bg-brand-600">
              {primaryLabel}
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <a id="download" href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" className="focus-ring inline-flex items-center justify-center gap-3 rounded-2xl border border-line bg-surface px-5 py-3.5 text-left shadow-card transition hover:-translate-y-0.5 hover:bg-surface-2 dark:bg-surface-raised dark:hover:bg-surface-2">
              <Smartphone className="h-7 w-7 text-brand-500" />
              <span className="leading-tight">
                <span className="block text-[11px] font-medium uppercase tracking-wide text-muted dark:text-text-secondary">Download on</span>
                <span className="block text-base font-bold">Google Play</span>
              </span>
            </a>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm font-medium text-muted dark:text-text-secondary">
            <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-brand-500" /> Mobile app included</span>
            <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-brand-500" /> Multi-branch support</span>
            <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-brand-500" /> Secure by design</span>
          </div>
        </div>

        <div className="relative animate-fade-up">
          <div className="absolute -right-5 -top-5 h-24 w-24 rounded-3xl bg-brand-500/15 blur-2xl" />
          <div className="relative rounded-panel border border-line bg-surface/95 p-5 shadow-panel backdrop-blur dark:border-line dark:bg-surface-2/95 sm:p-7">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-muted dark:text-text-secondary">Today's overview</p>
                <p className="text-3xl font-black tracking-tight">₦184,200</p>
              </div>
              <span className="rounded-full bg-brand-50 px-3 py-1 text-sm font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">+18%</span>
            </div>
            <div className="mt-6 flex h-36 items-end gap-2.5">
              {[45, 68, 52, 78, 58, 90, 74].map((height, index) => (
                <div key={index} className={`w-full rounded-t-xl ${index === 5 ? 'bg-brand-500' : 'bg-brand-500/20'}`} style={{ height: `${height}%` }} />
              ))}
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-card border border-line bg-bg-app p-4 dark:border-line dark:bg-bg">
                <p className="text-xs font-semibold text-muted dark:text-text-secondary">Stock value</p>
                <p className="text-xl font-bold">₦1.2M</p>
              </div>
              <div className="rounded-card border border-line bg-bg-app p-4 dark:border-line dark:bg-bg">
                <p className="text-xs font-semibold text-muted dark:text-text-secondary">Outstanding</p>
                <p className="text-xl font-bold">₦96k</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <p className="text-sm font-bold uppercase tracking-[.18em] text-brand-500">Features</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Everything your business needs to stay sharp</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {features.map(({ icon: Icon, title, text }) => (
            <article key={title} className="group rounded-card border border-line bg-surface p-6 shadow-card transition hover:-translate-y-1 hover:border-brand-500/40 hover:shadow-panel dark:bg-surface-raised">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-500 transition group-hover:bg-brand-500 group-hover:text-white dark:bg-brand-500/15">
                <Icon className="h-6 w-6" />
              </span>
              <h3 className="mt-5 text-xl font-bold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted dark:text-text-secondary">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="workflow" className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="grid overflow-hidden rounded-panel border border-line bg-surface shadow-panel lg:grid-cols-2 dark:bg-surface-2">
          <div className="p-7 sm:p-12">
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">From first record to confident decisions</h2>
            <div className="mt-8 space-y-5">
              {checklist.map((item) => (
                <div key={item} className="flex items-center gap-3 text-base font-semibold">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-brand-500" />
                  {item}
                </div>
              ))}
            </div>
            <Link href={primaryHref} className="focus-ring mt-9 inline-flex items-center gap-2 rounded-2xl bg-ink px-6 py-3.5 font-bold text-white transition hover:opacity-90 dark:bg-text-primary dark:text-ink">
              Start using BizRecord
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
          <div className="relative bg-gradient-to-br from-brand-500 to-brand-600 p-7 text-white sm:p-12">
            <p className="text-xl font-bold">Use it in the shop, warehouse or on the go.</p>
            <p className="mt-4 max-w-md text-white/85">
              The Android app and web dashboard stay focused on the same business data, so your team always has the current picture.
            </p>
            <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" className="focus-ring mt-8 inline-flex min-w-[230px] items-center justify-center gap-3 rounded-2xl bg-white px-5 py-3 text-left text-ink shadow-card transition hover:-translate-y-0.5">
              <Smartphone className="h-7 w-7 text-brand-500" />
              <span className="leading-tight">
                <span className="block text-[11px] font-medium uppercase tracking-wide">Download on</span>
                <span className="block text-base font-bold">Google Play</span>
              </span>
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-line px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 text-sm text-muted sm:flex-row dark:text-text-secondary">
          <p>© {new Date().getFullYear()} BizRecord</p>
          <div className="flex flex-wrap items-center justify-center gap-5">
            <Link href="/login" className="focus-ring hover:text-ink dark:hover:text-text-primary">Sign in</Link>
            <Link href="/register" className="focus-ring hover:text-ink dark:hover:text-text-primary">Register</Link>
            <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" className="focus-ring hover:text-ink dark:hover:text-text-primary">Google Play</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
