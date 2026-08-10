'use client';

import { Suspense, useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Alert } from '@/components/ui/Feedback';
import { FieldLabel, Input } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get('email') || '';

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleReset = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      const res = await fetch('/api/proxy/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code: code.trim(), newPassword }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError((data as { message?: string })?.message || 'Unable to reset password');
        return;
      }
      router.push('/login?flash=' + encodeURIComponent('Password reset successful. Please sign in.'));
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
      const res = await fetch('/api/proxy/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError((data as { message?: string })?.message || 'Unable to resend code');
      } else {
        setNotice((data as { message?: string })?.message || 'A fresh reset code has been sent.');
      }
    } catch {
      setError('Unable to reach the server');
    } finally {
      setResending(false);
    }
  };

  return (
    <Card className="w-full max-w-[460px] p-6">
      <h2 className="text-xl font-bold text-ink dark:text-text-primary">Reset Password</h2>
      <p className="mt-1 text-sm text-muted dark:text-text-secondary">
        Enter the 6-digit reset code from your email and choose a new password.
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

      <form onSubmit={handleReset} className="mt-5 space-y-4">
        <div>
          <FieldLabel label="Email" htmlFor="email" />
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <FieldLabel label="Reset code" htmlFor="code" />
          <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" maxLength={6} inputMode="numeric" required />
        </div>
        <div>
          <FieldLabel label="New password" htmlFor="newPassword" />
          <Input id="newPassword" type="password" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" required />
        </div>
        <Button type="submit" loading={loading} className="w-full" disabled={!email.trim() || !code.trim() || !newPassword}>
          {loading ? 'Resetting…' : 'Reset password'}
        </Button>
      </form>

      <div className="mt-4 flex flex-col gap-2 text-sm">
        <button onClick={handleResend} disabled={resending} className="text-left text-brand-600 hover:underline disabled:opacity-50 dark:text-brand-400">
          {resending ? 'Resending…' : 'Resend code'}
        </button>
        <Link href="/login" className="text-muted hover:underline dark:text-text-secondary">
          Back to login
        </Link>
      </div>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
