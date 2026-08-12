'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Wallet } from 'lucide-react';
import { useScope } from '@/lib/useScope';
import { api, errorMessage } from '@/lib/api';
import { naira, toNumber, formatDate } from '@/lib/format';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Table, THead, Th, Td, Tr } from '@/components/ui/Table';
import { EmptyState } from '@/components/ui/EmptyState';
import { SearchInput } from '@/components/SearchInput';
import { Alert, PageLoading } from '@/components/ui/Feedback';
import type { Transaction } from '@/lib/types';

const isDebtLike = (item: Transaction) =>
  String(item.type).toLowerCase() === 'debt' || String(item.paymentMethod).toLowerCase() === 'credit';

function getDueInfo(dueDate?: string | null) {
  if (!dueDate) return { label: 'No due date', overdue: false };
  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) return { label: 'Invalid due date', overdue: false };
  const diffDays = Math.ceil((due.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { label: `${Math.abs(diffDays)} day(s) overdue`, overdue: true };
  return { label: `${diffDays} day(s) remaining`, overdue: false };
}

const getOutstandingQuantity = (item: Transaction) => {
  const lineItems = Array.isArray(item.lineItems) ? item.lineItems : [];
  if (lineItems.length > 0) return lineItems.reduce((sum, line) => sum + Number(line.quantity || 0), 0);
  return Number(item.quantity || 0);
};

export default function DebtsPage() {
  const { transactionsPath, ready } = useScope();
  const [debts, setDebts] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!ready || !transactionsPath) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<Transaction[]>(transactionsPath, { type: 'debt', take: 200 });
      const all = Array.isArray(data) ? data : [];
      const debtLike = all.filter(isDebtLike);
      setDebts(debtLike);
    } catch (err) {
      setError(errorMessage(err, 'Unable to load debts'));
    } finally {
      setLoading(false);
    }
  }, [ready, transactionsPath]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = debts.filter((tx) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (tx.customerName || '').toLowerCase().includes(q) || (tx.item?.name || '').toLowerCase().includes(q);
  });

  const outstanding = debts.reduce(
    (sum, tx) => sum + (tx.status !== 'cancelled' ? toNumber(tx.totalAmount) : 0),
    0,
  );

  if (loading && debts.length === 0) return <PageLoading label="Loading debts…" />;

  return (
    <div>
      <PageHeader
        title="Debts"
        subtitle={`${debts.length} debt(s) · ${naira(outstanding)} outstanding`}
        actions={
          <Button asChild>
            <Link href="/debts/new">
              <Plus className="h-4 w-4" /> Record debt
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
        <SearchInput value={search} onChange={setSearch} placeholder="Search by customer or item…" />
      </div>

      {debts.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No debts yet"
          subtitle="Record a sale on credit or a debt to track it here."
          action={
            <Button asChild>
              <Link href="/debts/new">
                <Plus className="h-4 w-4" /> Record debt
              </Link>
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Wallet} title="No debts match your search" subtitle="Try a different search term." />
      ) : (
        <Table>
          <THead>
            <tr>
              <Th>Customer</Th>
              <Th>Item</Th>
              <Th>Due date</Th>
              <Th>Status</Th>
              <Th className="text-right">Qty</Th>
              <Th className="text-right">Amount</Th>
            </tr>
          </THead>
          <tbody>
            {filtered.map((tx) => {
              const due = getDueInfo(tx.dueDate);
              return (
                <Tr key={tx.id}>
                  <Td>
                    <span className="font-semibold">{tx.customerName || 'Unknown'}</span>
                    {tx.phone ? <div className="text-xs text-muted dark:text-text-secondary">{tx.phone}</div> : null}
                  </Td>
                  <Td>{tx.item?.name || tx.notes || '—'}</Td>
                  <Td>
                    {tx.dueDate ? (
                      <div>
                        {formatDate(tx.dueDate)}
                        <Badge tone={due.overdue ? 'danger' : 'warn'} className="mt-1">
                          {due.label}
                        </Badge>
                      </div>
                    ) : (
                      '—'
                    )}
                  </Td>
                  <Td>
                    <Badge tone={tx.status === 'completed' ? 'ok' : tx.status === 'pending' ? 'warn' : 'neutral'}>
                      {tx.status}
                    </Badge>
                  </Td>
                  <Td className="text-right">{getOutstandingQuantity(tx)}</Td>
                  <Td className="text-right font-semibold">{naira(tx.totalAmount)}</Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>
      )}
    </div>
  );
}
