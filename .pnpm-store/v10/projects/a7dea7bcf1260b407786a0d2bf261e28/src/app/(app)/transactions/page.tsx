'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, ArrowLeftRight, Search } from 'lucide-react';
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
import { cn } from '@/lib/cn';
import type { Transaction } from '@/lib/types';

const TABS = [
  { id: '', label: 'All' },
  { id: 'sale', label: 'Sales' },
  { id: 'expense', label: 'Expenses' },
  { id: 'purchase', label: 'Purchases' },
  { id: 'debt', label: 'Debts' },
];

const typeTone: Record<string, 'ok' | 'warn' | 'danger' | 'neutral' | 'info'> = {
  sale: 'ok',
  expense: 'warn',
  purchase: 'info',
  return: 'neutral',
  adjustment: 'neutral',
  debt: 'danger',
};

export default function TransactionsPage() {
  const { transactionsPath, ready } = useScope();
  const [tab, setTab] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!ready || !transactionsPath) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<Transaction[]>(transactionsPath, { take: 200 });
      setTransactions(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(errorMessage(err, 'Unable to load transactions'));
    } finally {
      setLoading(false);
    }
  }, [ready, transactionsPath]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = transactions
    .filter((tx) => (tab ? tx.type === tab : true))
    .filter((tx) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        (tx.customerName || '').toLowerCase().includes(q) ||
        (tx.category || '').toLowerCase().includes(q) ||
        (tx.item?.name || '').toLowerCase().includes(q) ||
        (tx.referenceNumber || '').toLowerCase().includes(q)
      );
    });

  if (loading && transactions.length === 0) return <PageLoading label="Loading transactions…" />;

  return (
    <div>
      <PageHeader
        title="Transactions"
        subtitle="Every sale, expense, purchase and debt in one place."
        actions={
          <Button asChild>
            <Link href="/transactions/new">
              <Plus className="h-4 w-4" /> Record expense
            </Link>
          </Button>
        }
      />

      {error ? (
        <Alert tone="danger" className="mb-4">
          {error}
        </Alert>
      ) : null}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
                tab === t.id
                  ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300'
                  : 'border-line text-muted hover:bg-surface-2 dark:text-text-secondary',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="w-full max-w-xs">
          <SearchInput value={search} onChange={setSearch} placeholder="Search transactions…" />
        </div>
      </div>

      {transactions.length === 0 ? (
        <EmptyState
          icon={ArrowLeftRight}
          title="No transactions yet"
          subtitle="Record a sale, expense or debt to see it here."
          action={
            <Button asChild>
              <Link href="/transactions/new">
                <Plus className="h-4 w-4" /> Record first transaction
              </Link>
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState icon={ArrowLeftRight} title="Nothing matches your filters" subtitle="Try a different filter or search." />
      ) : (
        <Table>
          <THead>
            <tr>
              <Th>Type</Th>
              <Th>Description</Th>
              <Th>Date</Th>
              <Th>Status</Th>
              <Th className="text-right">Amount</Th>
            </tr>
          </THead>
          <tbody>
            {filtered.map((tx) => (
              <Tr key={tx.id}>
                <Td>
                  <Badge tone={typeTone[tx.type] || 'neutral'}>{tx.type}</Badge>
                </Td>
                <Td>
                  <span className="font-semibold">
                    {tx.customerName || tx.category || tx.item?.name || tx.notes || '—'}
                  </span>
                  {tx.referenceNumber ? (
                    <div className="text-xs text-muted dark:text-text-secondary">{tx.referenceNumber}</div>
                  ) : null}
                </Td>
                <Td className="text-muted dark:text-text-secondary">{formatDateTime(tx.createdAt)}</Td>
                <Td>
                  <Badge tone={tx.status === 'completed' ? 'ok' : tx.status === 'pending' ? 'warn' : 'neutral'}>
                    {tx.status}
                  </Badge>
                </Td>
                <Td className="text-right font-semibold">
                  {tx.type === 'expense' ? '−' : ''}
                  {naira(tx.totalAmount)}
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
