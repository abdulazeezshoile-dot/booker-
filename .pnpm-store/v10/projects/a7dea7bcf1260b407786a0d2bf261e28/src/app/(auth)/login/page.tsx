'use client';

import { Suspense, useEffect, useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Alert } from '@/components/ui/Feedback';
import { FieldLabel, Input } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason');
  const flash = searchParams.get('flash');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(flash || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (reason === 'expired') setNotice('Your session expired. Please sign in again.');
  }, [reason]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError((data as { message?: string })?.message || 'Unable to sign in');
        return;
      }
      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Unable to reach the server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-[460px] p-6">
      <h2 className="text-xl font-bold text-ink dark:text-text-primary">Welcome back</h2>
      <p className="mt-1 text-sm text-muted dark:text-text-secondary">
        Sign in to manage your business.
      </p>

      {notice ? (
        <Alert tone="ok" className="mt-4">
          {notice}
        </Alert>
      ) : null}
      {error ? (
        <Alert tone="danger" className="mt-4">
          {error}
        </Alert>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <FieldLabel label="Email" htmlFor="email" />
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@store.com"
            required
          />
        </div>
        <div>
          <FieldLabel label="Password" htmlFor="password" />
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••"
            required
          />
        </div>
        <Button type="submit" loading={loading} className="w-full" disabled={!email.trim() || !password}>
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <div className="mt-4 flex flex-col gap-2 text-sm">
        <Link href="/forgot-password" className="text-brand-600 hover:underline dark:text-brand-400">
          Forgot password?
        </Link>
        <Link href="/register" className="text-muted hover:underline dark:text-text-secondary">
          Don&apos;t have an account? Create one
        </Link>
      </div>
    </Card>
  );
}
