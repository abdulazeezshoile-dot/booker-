'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Package, Pencil, Trash2 } from 'lucide-react';
import { useScope } from '@/lib/useScope';
import { api, errorMessage } from '@/lib/api';
import { naira, toNumber } from '@/lib/format';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Table, THead, Th, Td, Tr } from '@/components/ui/Table';
import { EmptyState } from '@/components/ui/EmptyState';
import { SearchInput } from '@/components/SearchInput';
import { Alert } from '@/components/ui/Feedback';
import { PageLoading } from '@/components/ui/Feedback';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import type { InventoryItem } from '@/lib/types';

export default function InventoryPage() {
  const { inventoryPath, ready } = useScope();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<InventoryItem | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = useCallback(async () => {
    if (!ready || !inventoryPath) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<InventoryItem[]>(inventoryPath, { take: 200 });
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(errorMessage(err, 'Unable to load inventory'));
    } finally {
      setLoading(false);
    }
  }, [ready, inventoryPath]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = items.filter((item) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      item.name.toLowerCase().includes(q) ||
      (item.category || '').toLowerCase().includes(q) ||
      (item.sku || '').toLowerCase().includes(q)
    );
  });

  const handleDelete = async () => {
    if (!deleting || !inventoryPath) return;
    setDeleteBusy(true);
    try {
      await api.delete(`${inventoryPath}/${deleting.id}`);
      setItems((prev) => prev.filter((i) => i.id !== deleting.id));
      setDeleting(null);
    } catch (err) {
      setError(errorMessage(err, 'Unable to delete item'));
    } finally {
      setDeleteBusy(false);
    }
  };

  if (loading && items.length === 0) {
    return <PageLoading label="Loading inventory…" />;
  }

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle="Track stock levels and item values across your workspace."
        actions={
          <Button asChild>
            <Link href="/inventory/new">
              <Plus className="h-4 w-4" /> Add item
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
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name, category or SKU…" />
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No inventory items yet"
          subtitle="Add your first product to start tracking stock and sales."
          action={
            <Button asChild>
              <Link href="/inventory/new">
                <Plus className="h-4 w-4" /> Add your first item
              </Link>
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Package} title="No items match your search" subtitle="Try a different search term." />
      ) : (
        <Table>
          <THead>
            <tr>
              <Th>Item</Th>
              <Th>Category</Th>
              <Th className="text-right">Quantity</Th>
              <Th className="text-right">Cost</Th>
              <Th className="text-right">Selling</Th>
              <Th>Status</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </THead>
          <tbody>
            {filtered.map((item) => {
              const lowStock =
                toNumber(item.reorderLevel) > 0 && toNumber(item.quantity) <= toNumber(item.reorderLevel);
              return (
                <Tr key={item.id}>
                  <Td>
                    <div className="font-semibold">{item.name}</div>
                    {item.sku ? <div className="text-xs text-muted dark:text-text-secondary">{item.sku}</div> : null}
                  </Td>
                  <Td>{item.category || '—'}</Td>
                  <Td className="text-right">
                    <span className="font-semibold">{toNumber(item.quantity)}</span>
                    {lowStock ? <Badge tone="warn" className="ml-2">Low</Badge> : null}
                  </Td>
                  <Td className="text-right">{naira(item.costPrice)}</Td>
                  <Td className="text-right">{item.sellingPrice ? naira(item.sellingPrice) : '—'}</Td>
                  <Td>
                    <StatusBadge status={item.status} />
                  </Td>
                  <Td>
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/inventory/${item.id}/edit`}
                        className="focus-ring rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-ink dark:hover:text-text-primary"
                        aria-label={`Edit ${item.name}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => setDeleting(item)}
                        className="focus-ring rounded-lg p-2 text-muted hover:bg-danger/10 hover:text-danger"
                        aria-label={`Delete ${item.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete inventory item"
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
