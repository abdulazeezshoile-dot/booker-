'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, XCircle, Loader2, ArrowLeft } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

type VerifyResult = {
  status: 'success' | 'failed';
  reference?: string;
  alreadyConfirmed?: boolean;
  subscription?: {
    plan?: string;
    status?: string;
    currentPeriodEndsAt?: string | null;
  } | null;
};

function VerifyContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get('reference') || searchParams.get('tx_ref') || '';

  const [state, setState] = useState<'loading' | 'success' | 'failed' | 'error'>('loading');
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!reference) {
      setState('error');
      setMessage('Missing payment reference. Please return to the subscription page.');
      return;
    }

    let active = true;
    (async () => {
      try {
        const res = await api.post<VerifyResult>('/billing/verify', { reference });
        if (!active) return;
        setResult(res);
        setState(res.status === 'success' ? 'success' : 'failed');
      } catch (err) {
        if (!active) return;
        setState('error');
        setMessage(errorMessage(err, 'Unable to verify payment. Please try again.'));
      }
    })();

    return () => {
      active = false;
    };
  }, [reference]);

  return (
    <div className="mx-auto w-full max-w-[520px]">
      <Link
        href="/subscription"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-ink dark:text-text-secondary dark:hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to subscription
      </Link>

      <Card className="p-8 text-center">
        {state === 'loading' ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <Loader2 className="h-10 w-10 animate-spin text-brand-500" />
            <p className="text-sm text-muted dark:text-text-secondary">
              Verifying your payment…
            </p>
          </div>
        ) : state === 'success' ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <CheckCircle2 className="h-14 w-14 text-emerald-500" />
            <h2 className="text-xl font-bold text-ink dark:text-text-primary">Payment successful</h2>
            <p className="text-sm text-muted dark:text-text-secondary">
              Your {result?.subscription?.plan || ''} subscription is now{' '}
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">active</span>.
              {result?.subscription?.currentPeriodEndsAt
                ? ` It renews on ${new Date(result.subscription.currentPeriodEndsAt).toLocaleDateString()}.`
                : ''}
            </p>
            {result?.reference ? (
              <p className="text-xs text-muted dark:text-text-secondary">Reference: {result.reference}</p>
            ) : null}
            <Button asChild className="mt-2">
              <Link href="/onboarding/workspace">Create your workspace</Link>
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 py-6">
            <XCircle className="h-14 w-14 text-rose-500" />
            <h2 className="text-xl font-bold text-ink dark:text-text-primary">
              {state === 'error' ? 'Verification failed' : 'Payment not completed'}
            </h2>
            <p className="text-sm text-muted dark:text-text-secondary">
              {message ||
                'Your payment was not completed. If you were charged, contact support — otherwise try again.'}
            </p>
            <Button asChild variant="primary" className="mt-2">
              <Link href="/subscription">Try again</Link>
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyContent />
    </Suspense>
  );
}
