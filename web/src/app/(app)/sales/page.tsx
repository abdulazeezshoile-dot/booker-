'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, ShoppingCart } from 'lucide-react';
import { useScope } from '@/lib/useScope';
import { api, errorMessage } from '@/lib/api';
import { naira, toNumber, formatDateTime } from '@/lib/format';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Table, THead, Th, Td, Tr } from '@/components/ui/Table';
import { EmptyState } from '@/components/ui/EmptyState';
import { SearchInput } from '@/components/SearchInput';
import { Alert, PageLoading } from '@/components/ui/Feedback';
import type { Transaction } from '@/lib/types';

export default function SalesPage() {
  const { transactionsPath, ready } = useScope();
  const [sales, setSales] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!ready || !transactionsPath) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<Transaction[]>(transactionsPath, { type: 'sale', take: 200 });
      setSales(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(errorMessage(err, 'Unable to load sales'));
    } finally {
      setLoading(false);
    }
  }, [ready, transactionsPath]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = sales.filter((tx) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (tx.customerName || '').toLowerCase().includes(q) ||
      (tx.referenceNumber || '').toLowerCase().includes(q) ||
      (tx.item?.name || '').toLowerCase().includes(q)
    );
  });

  const total = sales.reduce((sum, tx) => sum + toNumber(tx.totalAmount), 0);

  if (loading && sales.length === 0) return <PageLoading label="Loading sales…" />;

  return (
    <div>
      <PageHeader
        title="Sales"
        subtitle={`${sales.length} sale(s) totalling ${naira(total)}`}
        actions={
          <Button asChild>
            <Link href="/sales/new">
              <Plus className="h-4 w-4" /> Record sale
            </Link>
          </Button>
        }
      />

      {error ? (
        <Alert tone="danger" className="mb-4">
          {error}
        </Alert>
      ) : null}

      <div className="mb-4 max-w-sm">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by customer, reference or item…" />
      </div>

      {sales.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="No sales yet"
          subtitle="Record your first sale to see it here."
          action={
            <Button asChild>
              <Link href="/sales/new">
                <Plus className="h-4 w-4" /> Record sale
              </Link>
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState icon={ShoppingCart} title="No sales match your search" subtitle="Try a different search term." />
      ) : (
        <Table>
          <THead>
            <tr>
              <Th>Customer</Th>
              <Th>Item</Th>
              <Th>Date</Th>
              <Th>Status</Th>
              <Th className="text-right">Amount</Th>
            </tr>
          </THead>
          <tbody>
            {filtered.map((tx) => (
              <Tr key={tx.id}>
                <Td>
                  <span className="font-semibold">{tx.customerName || 'Walk-in'}</span>
                  {tx.phone ? <div className="text-xs text-muted dark:text-text-secondary">{tx.phone}</div> : null}
                </Td>
                <Td>{tx.item?.name || tx.notes || '—'}</Td>
                <Td className="text-muted dark:text-text-secondary">{formatDateTime(tx.createdAt)}</Td>
                <Td>
                  <Badge tone={tx.status === 'completed' ? 'ok' : tx.status === 'pending' ? 'warn' : 'neutral'}>
                    {tx.status}
                  </Badge>
                </Td>
                <Td className="text-right font-semibold">{naira(tx.totalAmount)}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
