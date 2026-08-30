'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Check,
  CreditCard,
  ArrowLeft,
  RefreshCw,
  Lock,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
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
  limits?: {
    workspaceLimit?: number;
    staffSeatLimit?: number;
    whatsappMonthlyQuota?: number;
  };
};

type CheckoutResult = {
  reference: string;
  checkoutUrl: string;
  amount: number;
  currency: string;
  plan: string;
  billingCycle: string;
};

const FEATURES: Record<string, string[]> = {
  basic: [
    '1 main workspace',
    '1 team member',
    'Inventory management',
    'Sales & expenses tracking',
    'Customer & debt records',
    'Reports & receipts',
  ],
  pro: [
    'Up to 3 workspaces',
    'Up to 5 team members',
    'Everything in Basic',
    'Branch management',
    'WhatsApp messaging quota',
    'Priority support',
  ],
};

const STATUS_TONE: Record<string, 'ok' | 'warn' | 'danger'> = {
  active: 'ok',
  trialing: 'warn',
  cancelled: 'warn',
  expired: 'danger',
};

export default function SubscriptionPage() {
  const [plans, setPlans] = useState<PlanMeta[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [cycle, setCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

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

  if (loading) return <PageLoading label="Loading subscription..." />;

  const plan = subscription?.plan || 'basic';
  const status = subscription?.status || 'expired';
  const isActive = status === 'active' || status === 'trialing';
  const isPro = plan === 'pro';
  const currentPrice = isPro
    ? cycle === 'yearly'
      ? plans.find((p) => p.key === 'pro')?.yearly
      : plans.find((p) => p.key === 'pro')?.monthly
    : cycle === 'yearly'
      ? plans.find((p) => p.key === 'basic')?.yearly
      : plans.find((p) => p.key === 'basic')?.monthly;

  const workspaceLimit = usage?.limits?.workspaceLimit ?? (isPro ? 3 : 1);
  const staffSeatLimit = usage?.limits?.staffSeatLimit ?? (isPro ? 5 : 1);
  const whatsappQuota = usage?.limits?.whatsappMonthlyQuota ?? 0;
  const whatsappUsed = usage?.whatsappMessagesUsedThisMonth ?? 0;
  const whatsappPercent = whatsappQuota
    ? Math.min(100, Math.round((whatsappUsed / whatsappQuota) * 100))
    : 0;

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
        title="Subscription & Billing"
        subtitle="Upgrade for more workspaces, branches, team seats and messaging."
      />

      {error ? <Alert tone="danger" className="mb-6">{error}</Alert> : null}

      <Card className="mb-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-sm text-muted dark:text-text-secondary">Current plan</p>
            <div className="mt-1 flex items-center gap-3">
              <h2 className="text-3xl font-black tracking-tight text-ink dark:text-text-primary">
                {isPro ? 'Pro' : 'Basic'}
              </h2>
              <Badge tone={STATUS_TONE[status] || 'danger'}>{status}</Badge>
            </div>
            {subscription?.currentPeriodEndsAt ? (
              <p className="mt-2 text-sm text-muted dark:text-text-secondary">
                {isActive ? 'Renews on' : 'Ended on'} {formatDate(subscription.currentPeriodEndsAt)}
              </p>
            ) : null}
          </div>

          <div className="text-right">
            <p className="text-sm text-muted dark:text-text-secondary">Amount</p>
            <p className="text-2xl font-bold text-ink dark:text-text-primary">
              {naira(toNumber(currentPrice || 0))}
              <span className="text-sm font-medium text-muted dark:text-text-secondary">
                /{cycle === 'yearly' ? 'yr' : 'mo'}
              </span>
            </p>
            <Button variant="outline" onClick={load} className="mt-3">
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
          </div>
        </div>
      </Card>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm font-medium text-muted dark:text-text-secondary">Workspaces</p>
          <p className="mt-1 text-xl font-bold text-ink dark:text-text-primary">{workspaceLimit}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm font-medium text-muted dark:text-text-secondary">Team seats</p>
          <p className="mt-1 text-xl font-bold text-ink dark:text-text-primary">{staffSeatLimit}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm font-medium text-muted dark:text-text-secondary">WhatsApp quota</p>
          <p className="mt-1 text-xl font-bold text-ink dark:text-text-primary">
            {whatsappQuota ? `${whatsappUsed} / ${whatsappQuota}` : 'Not included'}
          </p>
          {whatsappQuota ? (
            <div className="mt-3 h-2 rounded-full bg-brand-500/15">
              <div className="h-2 rounded-full bg-brand-500" style={{ width: `${whatsappPercent}%` }} />
            </div>
          ) : null}
        </Card>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <CreditCard className="h-5 w-5 text-brand-500" />
        <h2 className="text-lg font-bold">Choose your plan</h2>
      </div>

      <div className="mb-4 inline-flex rounded-xl border border-line bg-surface p-1 dark:bg-surface-2">
        <button
          onClick={() => setCycle('monthly')}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${cycle === 'monthly' ? 'bg-brand-500 text-white' : 'text-muted hover:text-ink dark:text-text-secondary'}`}
        >
          Monthly
        </button>
        <button
          onClick={() => setCycle('yearly')}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${cycle === 'yearly' ? 'bg-brand-500 text-white' : 'text-muted hover:text-ink dark:text-text-secondary'}`}
        >
          Yearly
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {['basic', 'pro'].map((key) => {
          const meta = plans.find((p) => p.key === key);
          const isCurrent = key === plan;
          const amount = cycle === 'yearly' ? meta?.yearly : meta?.monthly;

          return (
            <Card key={key} className={`relative p-6 ${key === 'pro' ? 'border-brand-500/40 shadow-panel' : ''}`}>
              {key === 'pro' ? (
                <span className="absolute right-5 top-5 rounded-full bg-brand-500 px-3 py-1 text-xs font-bold text-white">
                  Best value
                </span>
              ) : null}
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold">{meta?.name || (key === 'pro' ? 'Pro' : 'Basic')}</h3>
                {isCurrent ? <Badge tone="ok">Current</Badge> : null}
              </div>
              <p className="mt-3 text-3xl font-black tracking-tight">
                {naira(toNumber(amount || 0))}
                <span className="text-sm font-medium text-muted dark:text-text-secondary">/{cycle === 'yearly' ? 'year' : 'month'}</span>
              </p>

              <div className="mt-5 space-y-2.5">
                {FEATURES[key].map((feature) => (
                  <div key={feature} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 shrink-0 text-brand-500" />
                    {feature}
                  </div>
                ))}
              </div>

              <Button
                onClick={() => handleCheckout(key)}
                loading={checkoutLoading === key}
                disabled={isCurrent && isActive}
                variant={key === 'pro' ? 'primary' : 'outline'}
                className="mt-6 w-full"
              >
                {isCurrent && isActive
                  ? 'Current plan'
                  : key === 'pro'
                    ? 'Upgrade to Pro'
                    : 'Switch to Basic'}
              </Button>
            </Card>
          );
        })}
      </div>

      <Card className="mt-6 p-6">
        <div className="flex items-start gap-3">
          <Lock className="mt-0.5 h-5 w-5 text-brand-500" />
          <div>
            <p className="font-semibold text-ink dark:text-text-primary">How downgrades work</p>
            <p className="mt-1 text-sm text-muted dark:text-text-secondary">
              If you move from Pro to Basic, your main workspace stays fully editable. Extra workspaces remain available in read-only mode, and Pro-only features such as branches and extra seats are disabled until you upgrade.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
