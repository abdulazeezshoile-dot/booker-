'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Alert } from '@/components/ui/Feedback';
import { FieldLabel, Input } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setError('Please fill out all fields');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim(), email: email.trim(), password }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError((data as { message?: string })?.message || 'Unable to register');
        return;
      }
      router.push(`/verify-email?email=${encodeURIComponent(email.trim())}&fromRegistration=1`);
    } catch {
      setError('Unable to reach the server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-[500px] p-6">
      <h2 className="text-xl font-bold text-ink dark:text-text-primary">Create your account</h2>
      <p className="mt-1 text-sm text-muted dark:text-text-secondary">
        Start managing your business in minutes.
      </p>

      {error ? (
        <Alert tone="danger" className="mt-4">
          {error}
        </Alert>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <FieldLabel label="Name" htmlFor="name" />
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" required />
        </div>
        <div>
          <FieldLabel label="Phone" htmlFor="phone" />
          <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08012345678" />
        </div>
        <div>
          <FieldLabel label="Email" htmlFor="email" />
          <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@store.com" required />
        </div>
        <div>
          <FieldLabel label="Password" htmlFor="password" />
          <Input id="password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" required />
        </div>
        <div>
          <FieldLabel label="Confirm Password" htmlFor="confirmPassword" />
          <Input id="confirmPassword" type="password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••" required />
        </div>
        <Button type="submit" loading={loading} className="w-full" disabled={loading || !name.trim() || !email.trim() || !password || !confirmPassword}>
          {loading ? 'Creating…' : 'Create account'}
        </Button>
      </form>

      <Link href="/login" className="mt-4 inline-block text-sm text-muted hover:underline dark:text-text-secondary">
        Already have an account? Sign in
      </Link>
    </Card>
  );
}
