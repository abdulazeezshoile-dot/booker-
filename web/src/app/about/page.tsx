import type { Metadata } from 'next';
import { ShieldCheck, Smartphone, BarChart3 } from 'lucide-react';
import { MarketingShell } from '@/components/marketing/MarketingShell';
import { Card } from '@/components/ui/Card';

export const metadata: Metadata = {
  title: 'About',
  description: 'BizRecord helps growing businesses stay organised and profitable.',
};

const VALUES = [
  {
    icon: ShieldCheck,
    title: 'Secure by design',
    text: 'Your business records are workspace-scoped and protected with role-based access.',
  },
  {
    icon: Smartphone,
    title: 'Mobile first',
    text: 'Record activity from anywhere and keep your team connected across branches.',
  },
  {
    icon: BarChart3,
    title: 'Decision ready',
    text: 'Clear reports help you understand sales, expenses, debts and stock health.',
  },
];

export default function AboutPage() {
  return (
    <MarketingShell>
      <section className="animate-fade-up">
        <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl">
          We help businesses stay organised.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted dark:text-text-secondary">
          BizRecord brings your inventory, sales, expenses, debts, customers and team activity into one simple workspace.
        </p>
      </section>

      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {VALUES.map((value) => (
          <Card key={value.title} className="p-6">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-500 dark:bg-brand-500/15">
              <value.icon className="h-6 w-6" />
            </span>
            <h2 className="mt-5 text-xl font-bold">{value.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted dark:text-text-secondary">
              {value.text}
            </p>
          </Card>
        ))}
      </div>

      <Card className="mt-8 p-6">
        <h2 className="text-xl font-bold">Why we built it</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted dark:text-text-secondary">
          Many growing businesses juggle notebooks, spreadsheets and messages. BizRecord replaces that guesswork with one reliable system that works on mobile and web.
        </p>
      </Card>
    </MarketingShell>
  );
}
