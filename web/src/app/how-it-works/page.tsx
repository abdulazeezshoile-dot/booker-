import type { Metadata } from 'next';
import Link from 'next/link';
import { BarChart3, Package, Users } from 'lucide-react';
import { MarketingShell } from '@/components/marketing/MarketingShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'How it works',
  description: 'See how BizRecord helps you track stock, sales, debts and team activity.',
};

const STEPS = [
  {
    icon: Package,
    title: 'Set up your workspace',
    text: 'Create your business workspace, invite your team, and add your products in minutes.',
  },
  {
    icon: BarChart3,
    title: 'Record daily activity',
    text: 'Track sales, expenses, debts and inventory movements from the mobile app or web dashboard.',
  },
  {
    icon: Users,
    title: 'Collaborate and grow',
    text: 'Assign team roles, manage branches, and use reports to make better decisions.',
  },
];

export default function HowItWorksPage() {
  return (
    <MarketingShell>
      <section className="animate-fade-up">
        <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl">
          How BizRecord works
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted dark:text-text-secondary">
          A simple workflow that keeps your business records organised from day one.
        </p>
      </section>

      <div className="mt-10 space-y-5">
        {STEPS.map((step, index) => (
          <Card key={step.title} className="p-6">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-500 dark:bg-brand-500/15">
                <step.icon className="h-6 w-6" />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[.18em] text-brand-500">
                  Step {index + 1}
                </p>
                <h2 className="mt-1 text-xl font-bold">{step.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted dark:text-text-secondary">
                  {step.text}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="mt-8 p-6">
        <h2 className="text-xl font-bold">Ready to start?</h2>
        <p className="mt-2 text-sm text-muted dark:text-text-secondary">
          Create your account and set up your first workspace in a few minutes.
        </p>
        <Button asChild className="mt-5">
          <Link href="/register">Create account</Link>
        </Button>
      </Card>
    </MarketingShell>
  );
}
