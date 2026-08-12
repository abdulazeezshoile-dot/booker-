'use client';

import { use, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';
import { CustomerForm } from '@/components/customers/CustomerForm';
import { PageLoading } from '@/components/ui/Feedback';
import { useScope } from '@/lib/useScope';
import { api, errorMessage } from '@/lib/api';
import { Alert } from '@/components/ui/Feedback';
import type { Customer } from '@/lib/types';

export default function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolved = use(params);
  const { customersPath, ready } = useScope();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!ready || !customersPath) return;
    setLoading(true);
    try {
      const data = await api.get<Customer>(`${customersPath}/${resolved.id}`);
      setCustomer(data);
    } catch (err) {
      setError(errorMessage(err, 'Unable to load customer'));
    } finally {
      setLoading(false);
    }
  }, [ready, customersPath, resolved.id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <PageLoading label="Loading customer…" />;

  if (error || !customer) {
    return (
      <div>
        <PageHeader title="Edit customer" />
        <Alert tone="danger">{error || 'Customer not found'}</Alert>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Edit customer" subtitle={customer.name} />
      <CustomerForm
        mode="edit"
        initial={{
          id: customer.id,
          name: customer.name,
          email: customer.email || '',
          phone: customer.phone || '',
          address: customer.address || '',
        }}
        onSubmitComplete={() => router.push('/customers')}
      />
    </div>
  );
}
