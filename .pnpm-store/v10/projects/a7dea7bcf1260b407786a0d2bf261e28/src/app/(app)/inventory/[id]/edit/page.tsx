'use client';

import { use, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';
import { InventoryItemForm } from '@/components/inventory/InventoryItemForm';
import { PageLoading } from '@/components/ui/Feedback';
import { useScope } from '@/lib/useScope';
import { api, errorMessage } from '@/lib/api';
import { Alert } from '@/components/ui/Feedback';
import type { InventoryItem } from '@/lib/types';

export default function EditInventoryItemPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolved = use(params);
  const { inventoryPath, ready } = useScope();
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!ready || !inventoryPath) return;
    setLoading(true);
    try {
      const data = await api.get<InventoryItem>(`${inventoryPath}/${resolved.id}`);
      setItem(data);
    } catch (err) {
      setError(errorMessage(err, 'Unable to load item'));
    } finally {
      setLoading(false);
    }
  }, [ready, inventoryPath, resolved.id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <PageLoading label="Loading item…" />;

  if (error || !item) {
    return (
      <div>
        <PageHeader title="Edit inventory item" />
        <Alert tone="danger">{error || 'Item not found'}</Alert>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Edit inventory item" subtitle={item.name} />
      <InventoryItemForm
        mode="edit"
        initial={{
          id: item.id,
          name: item.name,
          sku: item.sku || '',
          description: item.description || '',
          quantity: Number(item.quantity),
          costPrice: Number(item.costPrice),
          sellingPrice: item.sellingPrice != null ? Number(item.sellingPrice) : undefined,
          reorderLevel: Number(item.reorderLevel),
          category: item.category || 'General',
          location: item.location || '',
          supplier: item.supplier || '',
        }}
        onSubmitComplete={() => router.push('/inventory')}
      />
    </div>
  );
}
