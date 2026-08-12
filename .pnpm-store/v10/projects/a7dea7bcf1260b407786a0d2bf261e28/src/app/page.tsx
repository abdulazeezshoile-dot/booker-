import Link from 'next/link';
import { BarChart3, CheckCircle2, Package, ShieldCheck, Users } from 'lucide-react';
import { getCurrentUser } from '@/lib/server-api';

const features = [
  { icon: Package, title: 'Inventory control', text: 'Know what is in stock and get your business records in one place.' },
  { icon: BarChart3, title: 'Sales insights', text: 'Track sales, expenses, debts and performance as your business grows.' },
  { icon: Users, title: 'Built for teams', text: 'Invite staff, organise branches and give every member the right access.' },
];

export default async function MarketingHome() {
  const user = await getCurrentUser();
  return (
    <main className="min-h-screen bg-bg-app text-ink dark:bg-bg dark:text-text-primary">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 font-bold"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-white">B</span>BizRecord</Link>
        <div className="flex items-center gap-2">
          <Link href={user ? '/dashboard' : '/login'} className="rounded-xl px-3 py-2 text-sm font-semibold text-muted hover:text-ink dark:text-text-secondary">{user ? 'Dashboard' : 'Sign in'}</Link>
          <Link href={user ? '/dashboard' : '/register'} className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-cta">{user ? 'Open app' : 'Get started'}</Link>
        </div>
      </header>
      <section className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.15fr_.85fr] lg:px-8">
        <div className="max-w-2xl">
          <p className="mb-4 inline-flex rounded-full bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">Business records made simple</p>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Run your business with clarity, every day.</h1>
          <p className="mt-5 max-w-xl text-lg text-muted dark:text-text-secondary">BizRecord brings inventory, sales, expenses, debts, branches and teams together in one straightforward workspace.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row"><Link href={user ? '/dashboard' : '/register'} className="rounded-xl bg-brand-500 px-5 py-3 text-center font-semibold text-white shadow-cta">{user ? 'Go to dashboard' : 'Create your account'}</Link><Link href="#features" className="rounded-xl border border-line bg-surface px-5 py-3 text-center font-semibold dark:bg-surface-2">Explore features</Link></div>
        </div>
        <div className="rounded-panel border border-brand-200 bg-surface p-5 shadow-panel dark:border-brand-500/30 dark:bg-surface-2 sm:p-7">
          <p className="text-sm font-semibold text-brand-700 dark:text-brand-300">Everything your team needs</p>
          <div className="mt-5 space-y-4">{['Record sales in seconds', 'Track stock across branches', 'See debts and expenses clearly', 'Keep team activity accountable'].map((text) => <div key={text} className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 shrink-0 text-brand-500" /><span className="font-medium">{text}</span></div>)}</div>
        </div>
      </section>
      <section id="features" className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 lg:px-8"><div className="grid gap-4 sm:grid-cols-3">{features.map(({ icon: Icon, title, text }) => <article key={title} className="rounded-card border border-line bg-surface p-5 dark:bg-surface-2"><Icon className="h-6 w-6 text-brand-500" /><h2 className="mt-4 text-lg font-bold">{title}</h2><p className="mt-2 text-sm text-muted dark:text-text-secondary">{text}</p></article>)}</div></section>
      <footer className="border-t border-border-soft px-4 py-6 text-center text-sm text-muted dark:text-text-secondary">© {new Date().getFullYear()} BizRecord</footer>
    </main>
  );
}
