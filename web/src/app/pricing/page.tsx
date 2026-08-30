import type { Metadata } from 'next';
import Link from 'next/link';
import { Check, Sparkles } from 'lucide-react';
import { MarketingShell } from '@/components/marketing/MarketingShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Simple pricing for inventory, sales, debts, and team workspaces.',
};

const PLANS = [
  {
    key: 'basic',
    name: 'Basic',
    monthly: 7000,
    yearly: 67200,
    tagline: 'Perfect for one shop getting organised.',
    features: [
      '1 main workspace',
      '1 team member',
      'Inventory management',
      'Sales & expenses tracking',
      'Customer & debt records',
      'Reports & receipts',
    ],
  },
  {
    key: 'pro',
    name: 'Pro',
    monthly: 15000,
    yearly: 144000,
    tagline: 'Best for growing teams and multiple branches.',
    features: [
      'Up to 3 workspaces',
      'Up to 5 team members',
      'Everything in Basic',
      'Branch management',
      'WhatsApp messaging quota',
      'Priority support',
    ],
  },
];

export default function PricingPage() {
  return (
    <MarketingShell wide>
      <section className="animate-fade-up text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3.5 py-1.5 text-sm font-semibold text-brand-700 shadow-card dark:border-brand-500/25 dark:bg-brand-500/10 dark:text-brand-300">
          <Sparkles className="h-4 w-4" />
          Simple pricing
        </span>
        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-black leading-tight tracking-tight sm:text-5xl">
          Pick the plan that fits your business today.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted dark:text-text-secondary">
          Start with Basic or unlock more workspaces, branches, team members and messaging with Pro.
        </p>
      </section>

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        {PLANS.map((plan) => (
          <Card key={plan.key} className={`relative p-7 ${plan.key === 'pro' ? 'border-brand-500/40 shadow-panel' : ''}`}>
            {plan.key === 'pro' ? (
              <span className="absolute right-6 top-6 rounded-full bg-brand-500 px-3 py-1 text-xs font-bold text-white">
                Best value
              </span>
            ) : null}

            <h2 className="text-2xl font-bold">{plan.name}</h2>
            <p className="mt-2 text-sm text-muted dark:text-text-secondary">{plan.tagline}</p>

            <p className="mt-6 text-4xl font-black tracking-tight">
              ₦{plan.monthly.toLocaleString()}
              <span className="text-base font-medium text-muted dark:text-text-secondary">/month</span>
            </p>
            <p className="mt-1 text-sm text-muted dark:text-text-secondary">
              ₦{plan.yearly.toLocaleString()} billed yearly
            </p>

            <div className="mt-6 space-y-3">
              {plan.features.map((feature) => (
                <div key={feature} className="flex items-start gap-3">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-brand-500" />
                  <span className="text-sm font-medium">{feature}</span>
                </div>
              ))}
            </div>

            <Button asChild variant={plan.key === 'pro' ? 'primary' : 'outline'} className="mt-8 w-full">
              <Link href={plan.key === 'pro' ? '/register' : '/register'}>
                {plan.key === 'pro' ? 'Choose Pro' : 'Choose Basic'}
              </Link>
            </Button>
          </Card>
        ))}
      </div>

      <section className="mt-14 grid gap-5 md:grid-cols-3">
        {[
          {
            title: 'No hidden fees',
            text: 'You see your plan price before checkout. Yearly billing includes a discount.',
          },
          {
            title: 'Plan limits made clear',
            text: 'Workspace, seat and messaging limits are shown in the app and subscription page.',
          },
          {
            title: 'Upgrade anytime',
            text: 'Move to Pro when your team or number of branches grows.',
          },
        ].map((item) => (
          <Card key={item.title} className="p-6">
            <h3 className="text-lg font-bold">{item.title}</h3>
            <p className="mt-2 text-sm text-muted dark:text-text-secondary">{item.text}</p>
          </Card>
        ))}
      </section>
    </MarketingShell>
  );
}
