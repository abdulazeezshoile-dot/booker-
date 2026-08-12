'use client';

import { Suspense, useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Alert } from '@/components/ui/Feedback';
import { FieldLabel, Input } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromRegistration = searchParams.get('fromRegistration') === '1';

  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(
    fromRegistration
      ? 'Your account was created. Enter the verification code we sent to your email to finish setup.'
      : null,
  );
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code: code.trim() }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError((data as { message?: string })?.message || 'Unable to verify email');
        return;
      }
      router.push('/login?flash=' + encodeURIComponent('Email verified successfully. Please sign in.'));
    } catch {
      setError('Unable to reach the server');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setNotice(null);
    setResending(true);
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError((data as { message?: string })?.message || 'Unable to resend code');
      } else {
        setNotice((data as { message?: string })?.message || 'Verification code sent. Check your inbox and try again.');
      }
    } catch {
      setError('Unable to reach the server');
    } finally {
      setResending(false);
    }
  };

  return (
    <Card className="w-full max-w-[460px] p-6">
      <h2 className="text-xl font-bold text-ink dark:text-text-primary">Verify Email</h2>
      <p className="mt-1 text-sm text-muted dark:text-text-secondary">
        Enter the 6-digit code sent to your email. If you did not receive one, request a fresh code below.
      </p>

      {notice ? (
        <Alert tone="info" className="mt-4">
          {notice}
        </Alert>
      ) : null}
      {error ? (
        <Alert tone="danger" className="mt-4">
          {error}
        </Alert>
      ) : null}

      <form onSubmit={handleVerify} className="mt-5 space-y-4">
        <div>
          <FieldLabel label="Email" htmlFor="email" />
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <FieldLabel label="Verification code" htmlFor="code" />
          <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" maxLength={6} inputMode="numeric" required />
        </div>
        <Button type="submit" loading={loading} className="w-full" disabled={!email.trim() || !code.trim()}>
          {loading ? 'Verifying…' : 'Verify email'}
        </Button>
      </form>

      <div className="mt-4 flex flex-col gap-2 text-sm">
        <button onClick={handleResend} disabled={resending} className="text-left text-brand-600 hover:underline disabled:opacity-50 dark:text-brand-400">
          {resending ? 'Resending…' : 'Resend code'}
        </button>
        <Link href="/login" className="text-muted hover:underline dark:text-text-secondary">
          Back to sign in
        </Link>
      </div>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailForm />
    </Suspense>
  );
}
