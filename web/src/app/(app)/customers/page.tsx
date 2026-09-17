'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Users, Pencil, Trash2 } from 'lucide-react';
import { useScope } from '@/lib/useScope';
import { api, errorMessage } from '@/lib/api';
import { initials, formatDate } from '@/lib/format';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/Button';
import { Table, THead, Th, Td, Tr } from '@/components/ui/Table';
import { EmptyState } from '@/components/ui/EmptyState';
import { SearchInput } from '@/components/SearchInput';
import { Alert, PageLoading } from '@/components/ui/Feedback';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import type { Customer } from '@/lib/types';

export default function CustomersPage() {
  const { customersPath, ready } = useScope();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Customer | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = useCallback(async () => {
    if (!ready || !customersPath) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<Customer[]>(customersPath);
      setCustomers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(errorMessage(err, 'Unable to load customers'));
    } finally {
      setLoading(false);
    }
  }, [ready, customersPath]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = customers.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q)
    );
  });

  const handleDelete = async () => {
    if (!deleting || !customersPath) return;
    setDeleteBusy(true);
    try {
      await api.delete(`${customersPath}/${deleting.id}`);
      setCustomers((prev) => prev.filter((c) => c.id !== deleting.id));
      setDeleting(null);
    } catch (err) {
      setError(errorMessage(err, 'Unable to delete customer'));
    } finally {
      setDeleteBusy(false);
    }
  };

  if (loading && customers.length === 0) return <PageLoading label="Loading customers…" />;

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle={`${customers.length} customer(s)`}
        actions={
          <Button asChild>
            <Link href="/customers/new">
              <Plus className="h-4 w-4" /> Add customer
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
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name, email or phone…" />
      </div>

      {customers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No customers yet"
          subtitle="Add your first customer to keep track of who you sell to."
          action={
            <Button asChild>
              <Link href="/customers/new">
                <Plus className="h-4 w-4" /> Add customer
              </Link>
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} title="No customers match your search" subtitle="Try a different search term." />
      ) : (
        <Table>
          <THead>
            <tr>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Phone</Th>
              <Th>Added</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </THead>
          <tbody>
            {filtered.map((c) => (
              <Tr key={c.id}>
                <Td>
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                      {initials(c.name)}
                    </span>
                    <span className="font-semibold">{c.name}</span>
                  </div>
                </Td>
                <Td>{c.email || '—'}</Td>
                <Td>{c.phone || '—'}</Td>
                <Td className="text-muted dark:text-text-secondary">{formatDate(c.createdAt)}</Td>
                <Td>
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      href={`/customers/${c.id}/edit`}
                      className="focus-ring rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-ink dark:hover:text-text-primary"
                      aria-label={`Edit ${c.name}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => setDeleting(c)}
                      className="focus-ring rounded-lg p-2 text-muted hover:bg-danger/10 hover:text-danger"
                      aria-label={`Delete ${c.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete customer"
        description={`Delete "${deleting?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        loading={deleteBusy}
        onCancel={() => setDeleting(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
