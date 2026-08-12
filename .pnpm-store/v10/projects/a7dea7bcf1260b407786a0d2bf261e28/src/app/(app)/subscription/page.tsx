'use client';

import { useCallback, useEffect, useState } from 'react';
import { Check, CreditCard, ArrowLeft, ExternalLink, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/cn';
import { api, errorMessage } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert, PageLoading } from '@/components/ui/Feedback';
import { Badge } from '@/components/ui/Badge';
import { formatDate, naira, toNumber } from '@/lib/format';

type PlanMeta = {
  key: string;
  name: string;
  monthly: number;
  yearly: number;
};

type Subscription = {
  plan?: string;
  status?: string;
  billingCycle?: string;
  trialEndsAt?: string | null;
  currentPeriodEndsAt?: string | null;
  whatsappMessagesUsedThisMonth?: number;
  addonWorkspaceSlots?: number;
  addonStaffSeats?: number;
  addonWhatsappBundles?: number;
};

type Usage = {
  whatsappMessagesUsedThisMonth?: number;
  limits?: Record<string, number>;
};

type CheckoutResult = {
  reference: string;
  checkoutUrl: string;
  amount: number;
  currency: string;
  plan: string;
  billingCycle: string;
};

const FEATURES: Record<string, { plan: string; features: string[] }> = {
  basic: {
    plan: 'Basic',
    features: [
      '1 workspace',
      'Up to 1 staff seat',
      'Inventory management',
      'Sales & expenses tracking',
      'Customer & debt records',
      'Reports & receipts',
    ],
  },
  pro: {
    plan: 'Pro',
    features: [
      'Up to 3 workspaces',
      'Up to 5 staff seats',
      'Everything in Basic',
      'Branch management',
      'WhatsApp messaging quota',
      'Priority support',
    ],
  },
};

export default function SubscriptionPage() {
  const [plans, setPlans] = useState<PlanMeta[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [cycle, setCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [plansResp, subResp, usageResp] = await Promise.all([
        api.get<{ plans?: PlanMeta[] }>('/billing/plans'),
        api.get<Subscription>('/billing/subscription').catch(() => null),
        api.get<Usage>('/billing/usage').catch(() => null),
      ]);
      setPlans(plansResp?.plans || []);
      setSubscription(subResp);
      setUsage(usageResp);
      setCycle((subResp?.billingCycle as 'monthly' | 'yearly') || 'monthly');
    } catch (err) {
      setError(errorMessage(err, 'Unable to load subscription'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCheckout = async (plan: string) => {
    setError(null);
    setNotice(null);
    setCheckoutLoading(plan);
    try {
      const result = await api.post<CheckoutResult>('/billing/checkout', {
        plan,
        billingCycle: cycle,
      });
      if (result?.checkoutUrl) {
        window.location.href = result.checkoutUrl;
        return;
      }
      setError('Payment link could not be generated. Please try again.');
    } catch (err) {
      setError(errorMessage(err, 'Unable to start checkout'));
    } finally {
      setCheckoutLoading(null);
    }
  };

  if (loading) return <PageLoading label="Loading subscription…" />;

  const plan = subscription?.plan || 'basic';
  const status = subscription?.status || 'expired';
  const isActive = status === 'active' || status === 'trialing';
  const activeMeta = plans.find((p) => p.key === plan);

  return (
    <div>
      <Link
        href="/settings?tab=subscription"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-ink dark:text-text-secondary dark:hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to settings
      </Link>

      <PageHeader
        title="Subscription"
        subtitle="Pick a plan and pay securely with Flutterwave (card, transfer or USSD)."
      />

      {error ? <Alert tone="danger" className="mb-6">{error}</Alert> : null}
      {notice ? <Alert tone="ok" className="mb-6">{notice}</Alert> : null}

      <Card className="mb-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted dark:text-text-secondary">Current plan</p>
            <p className="mt-1 text-2xl font-bold capitalize text-ink dark:text-text-primary">{plan}</p>
            {subscription?.currentPeriodEndsAt ? (
              <p className="mt-1 text-sm text-muted dark:text-text-secondary">
                {subscription.billingCycle === 'yearly' ? 'Renews' : 'Next billing'}{' '}
                {formatDate(subscription.currentPeriodEndsAt)}
              </p>
            ) : (
              <p className="mt-1 text-sm text-muted dark:text-text-secondary">
                {activeMeta
                  ? `${naira(cycle === 'yearly' ? activeMeta.yearly : activeMeta.monthly)} / ${cycle}`
                  : ''}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge tone={isActive ? 'ok' : status === 'cancelled' ? 'warn' : 'neutral'}>
              {isActive ? 'Active' : status}
            </Badge>
            {!isActive ? (
              <Button
                onClick={() => handleCheckout(plan === 'pro' ? 'pro' : 'basic')}
                loading={checkoutLoading !== null}
                icon={<CreditCard className="h-4 w-4" />}
              >
                Renew subscription
              </Button>
            ) : (
              <Button
                onClick={load}
                variant="secondary"
                icon={<RefreshCw className="h-4 w-4" />}
              >
                Refresh status
              </Button>
            )}
          </div>
        </div>

        {usage?.limits ? (
          <div className="mt-6 grid grid-cols-1 gap-3 border-t border-border-soft pt-5 sm:grid-cols-3">
            {Object.entries(usage.limits).map(([key, value]) => (
              <div key={key} className="rounded-xl border border-line p-3">
                <p className="text-xs text-muted dark:text-text-secondary">{key.replace(/([A-Z])/g, ' $1')}</p>
                <p className="mt-1 text-lg font-bold text-ink dark:text-text-primary">{toNumber(value)}</p>
              </div>
            ))}
          </div>
        ) : null}
      </Card>

      <div className="mb-6 flex items-center justify-center gap-1 rounded-full border border-line p-1 sm:w-fit">
        {(['monthly', 'yearly'] as const).map((c) => (
          <button
            key={c}
            onClick={() => setCycle(c)}
            className={cn(
              'flex-1 rounded-full px-6 py-2 text-sm font-semibold capitalize transition-colors sm:flex-none',
              cycle === c
                ? 'bg-brand-500 text-white shadow-cta'
                : 'text-muted hover:text-ink dark:text-text-secondary dark:hover:text-text-primary',
            )}
          >
            {c === 'yearly' ? 'Yearly (−20%)' : c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {plans.map((p) => {
          const meta = FEATURES[p.key];
          const price = cycle === 'yearly' ? p.yearly : p.monthly;
          const isCurrent = p.key === plan;
          const busy = checkoutLoading === p.key;
          return (
            <Card
              key={p.key}
              className={cn(
                'relative p-6',
                isCurrent ? 'border-brand-500 ring-1 ring-brand-500' : '',
              )}
            >
              {isCurrent ? (
                <Badge tone="brand" className="absolute right-5 top-5">
                  Current plan
                </Badge>
              ) : null}
              <h3 className="text-lg font-bold text-ink dark:text-text-primary">{meta?.plan || p.name}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-ink dark:text-text-primary">{naira(price)}</span>
                <span className="text-sm text-muted dark:text-text-secondary">/ {cycle}</span>
              </div>
              <ul className="mt-5 space-y-2.5">
                {(meta?.features || []).map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm text-ink dark:text-text-primary">
                    {p.key === 'pro' ? (
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                    ) : (
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-muted dark:bg-text-secondary" />
                    )}
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                {isCurrent && isActive ? (
                  <Button disabled className="w-full" icon={<Check className="h-4 w-4" />}>
                    Current plan
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleCheckout(p.key)}
                    loading={busy}
                    className="w-full"
                    variant={p.key === 'pro' ? 'primary' : 'outline'}
                    icon={busy ? undefined : <CreditCard className="h-4 w-4" />}
                  >
                    {busy ? 'Preparing checkout…' : isCurrent ? 'Renew plan' : `Subscribe to ${meta?.plan || p.name}`}
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <p className="mt-8 flex items-start gap-2 rounded-xl border border-line bg-surface-2 px-5 py-4 text-sm text-muted dark:bg-surface-2 dark:text-text-secondary">
        <ExternalLink className="mt-0.5 h-4 w-4 shrink-0" />
        You will be redirected to Flutterwave to complete payment securely by card, bank transfer or USSD. Once the
        payment succeeds your subscription activates automatically — no free trial, no hidden fees.
      </p>
    </div>
  );
}
