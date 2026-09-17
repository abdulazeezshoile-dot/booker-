'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useScope } from '@/lib/useScope';
import { api, errorMessage } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FieldLabel, Input } from '@/components/ui/Field';
import { Alert } from '@/components/ui/Feedback';

export function CustomerForm({
  mode,
  initial,
  onSubmitComplete,
}: {
  mode: 'create' | 'edit';
  initial?: { id?: string; name?: string; email?: string; phone?: string; address?: string };
  onSubmitComplete?: () => void;
}) {
  const router = useRouter();
  const { customersPath, ready } = useScope();
  const [form, setForm] = useState({
    name: initial?.name || '',
    email: initial?.email || '',
    phone: initial?.phone || '',
    address: initial?.address || '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async () => {
    setError(null);
    if (!form.name.trim()) {
      setError('Customer name is required');
      return;
    }
    if (!ready || !customersPath) {
      setError('Select a workspace first');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        address: form.address.trim() || undefined,
      };
      if (mode === 'create') {
        await api.post(customersPath, payload);
      } else {
        await api.put(`${customersPath}/${initial?.id}`, payload);
      }
      if (onSubmitComplete) onSubmitComplete();
      else {
        router.push('/customers');
        router.refresh();
      }
    } catch (err) {
      setError(errorMessage(err, 'Unable to save customer'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      {error ? (
        <Alert tone="danger" className="mb-4">
          {error}
        </Alert>
      ) : null}
      <Card className="p-6">
        <div className="space-y-5">
          <div>
            <FieldLabel label="Name *" htmlFor="name" error={!form.name ? 'Required' : undefined} />
            <Input id="name" value={form.name} onChange={(e) => set('name')(e.target.value)} placeholder="Customer name" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel label="Email" htmlFor="email" />
              <Input id="email" type="email" value={form.email} onChange={(e) => set('email')(e.target.value)} placeholder="customer@example.com" />
            </div>
            <div>
              <FieldLabel label="Phone" htmlFor="phone" />
              <Input id="phone" type="tel" value={form.phone} onChange={(e) => set('phone')(e.target.value)} placeholder="08012345678" />
            </div>
          </div>
          <div>
            <FieldLabel label="Address" htmlFor="address" />
            <Input id="address" value={form.address} onChange={(e) => set('address')(e.target.value)} placeholder="Optional" />
          </div>
          <div className="flex justify-end gap-2 border-t border-border-soft pt-5">
            <Button variant="outline" onClick={() => (onSubmitComplete ? onSubmitComplete() : router.push('/customers'))} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} loading={loading} disabled={loading || !ready}>
              {loading ? 'Saving…' : mode === 'create' ? 'Add customer' : 'Save changes'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
