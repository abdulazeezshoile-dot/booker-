'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Alert } from '@/components/ui/Feedback';
import { FieldLabel, Input } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError((data as { message?: string })?.message || 'Unable to send reset code');
        return;
      }
      router.push(`/reset-password?email=${encodeURIComponent(email.trim())}`);
    } catch {
      setError('Unable to reach the server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-[460px] p-6">
      <h2 className="text-xl font-bold text-ink dark:text-text-primary">Reset Password</h2>
      <p className="mt-1 text-sm text-muted dark:text-text-secondary">
        Enter your account email. We will send a 6-digit reset code.
      </p>

      {error ? (
        <Alert tone="danger" className="mt-4">
          {error}
        </Alert>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <FieldLabel label="Email" htmlFor="email" />
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@store.com" required />
        </div>
        <Button type="submit" loading={loading} className="w-full" disabled={!email.trim()}>
          {loading ? 'Sending…' : 'Send reset code'}
        </Button>
      </form>

      <div className="mt-4 flex flex-col gap-2 text-sm">
        <Link href="/reset-password" className="text-brand-600 hover:underline dark:text-brand-400">
          I already have a code
        </Link>
        <Link href="/login" className="text-muted hover:underline dark:text-text-secondary">
          Back to login
        </Link>
      </div>
    </Card>
  );
}
