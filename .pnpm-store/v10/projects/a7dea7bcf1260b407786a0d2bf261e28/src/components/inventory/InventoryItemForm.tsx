'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useScope } from '@/lib/useScope';
import { api, errorMessage } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FieldLabel, Input, Select, Textarea } from '@/components/ui/Field';
import { Alert } from '@/components/ui/Feedback';
import { cn } from '@/lib/cn';
import { toNumber } from '@/lib/format';

export const CATEGORIES = [
  'General',
  'Food & Drinks',
  'Clothing',
  'Electronics',
  'Stationery',
  'Cosmetics',
  'Hardware',
  'Other',
];

export function InventoryItemForm({
  mode,
  initial,
  onSubmitComplete,
}: {
  mode: 'create' | 'edit';
  initial?: {
    id?: string;
    name?: string;
    sku?: string;
    description?: string;
    quantity?: number;
    costPrice?: number;
    sellingPrice?: number;
    reorderLevel?: number;
    category?: string;
    location?: string;
    supplier?: string;
  };
  onSubmitComplete?: () => void;
}) {
  const router = useRouter();
  const { inventoryPath, ready } = useScope();
  const [form, setForm] = useState({
    name: initial?.name || '',
    sku: initial?.sku || '',
    description: initial?.description || '',
    quantity: initial?.quantity ?? '',
    costPrice: initial?.costPrice ?? '',
    sellingPrice: initial?.sellingPrice ?? '',
    reorderLevel: initial?.reorderLevel ?? 0,
    category: initial?.category || 'General',
    location: initial?.location || '',
    supplier: initial?.supplier || '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async () => {
    setError(null);
    if (!form.name.trim()) {
      setError('Item name is required');
      return;
    }
    if (!ready || !inventoryPath) {
      setError('Select a workspace first');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        sku: form.sku.trim() || undefined,
        description: form.description.trim() || undefined,
        quantity: toNumber(form.quantity),
        costPrice: toNumber(form.costPrice),
        sellingPrice: form.sellingPrice === '' ? undefined : toNumber(form.sellingPrice),
        reorderLevel: toNumber(form.reorderLevel),
        category: form.category || undefined,
        location: form.location.trim() || undefined,
        supplier: form.supplier.trim() || undefined,
      };
      if (mode === 'create') {
        await api.post(inventoryPath, payload);
      } else {
        await api.put(`${inventoryPath}/${initial?.id}`, payload);
      }
      if (onSubmitComplete) {
        onSubmitComplete();
      } else {
        router.push('/inventory');
        router.refresh();
      }
    } catch (err) {
      setError(errorMessage(err, 'Unable to save item'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      {error ? (
        <Alert tone="danger" className="mb-4">
          {error}
        </Alert>
      ) : null}
      <Card className="p-6">
        <div className="space-y-5">
          <div>
            <FieldLabel label="Item name" htmlFor="name" error={!form.name ? 'Required' : undefined} />
            <Input id="name" value={form.name} onChange={(e) => set('name')(e.target.value)} placeholder="e.g. Bottled water 50cl" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel label="SKU" htmlFor="sku" />
              <Input id="sku" value={form.sku} onChange={(e) => set('sku')(e.target.value)} placeholder="Optional" />
            </div>
            <div>
              <FieldLabel label="Category" htmlFor="category" />
              <Select id="category" value={form.category} onChange={(e) => set('category')(e.target.value)}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <FieldLabel label="Quantity" htmlFor="quantity" />
              <Input id="quantity" type="number" min={0} value={form.quantity} onChange={(e) => set('quantity')(e.target.value)} />
            </div>
            <div>
              <FieldLabel label="Cost price (₦)" htmlFor="costPrice" />
              <Input id="costPrice" type="number" min={0} step="0.01" value={form.costPrice} onChange={(e) => set('costPrice')(e.target.value)} />
            </div>
            <div>
              <FieldLabel label="Selling price (₦)" htmlFor="sellingPrice" />
              <Input id="sellingPrice" type="number" min={0} step="0.01" value={form.sellingPrice} onChange={(e) => set('sellingPrice')(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel label="Reorder level" htmlFor="reorderLevel" hint="Alert when stock drops to this level." />
              <Input id="reorderLevel" type="number" min={0} value={form.reorderLevel} onChange={(e) => set('reorderLevel')(e.target.value)} />
            </div>
            <div>
              <FieldLabel label="Location" htmlFor="location" />
              <Input id="location" value={form.location} onChange={(e) => set('location')(e.target.value)} placeholder="e.g. Shelf A2" />
            </div>
          </div>

          <div>
            <FieldLabel label="Supplier" htmlFor="supplier" />
            <Input id="supplier" value={form.supplier} onChange={(e) => set('supplier')(e.target.value)} placeholder="Optional" />
          </div>

          <div>
            <FieldLabel label="Description" htmlFor="description" />
            <Textarea id="description" value={form.description} onChange={(e) => set('description')(e.target.value)} />
          </div>

          <div className="flex justify-end gap-2 border-t border-border-soft pt-5">
            <Button
              variant="outline"
              onClick={() => (onSubmitComplete ? onSubmitComplete() : router.push('/inventory'))}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} loading={loading} disabled={loading || !ready}>
              {loading ? 'Saving…' : mode === 'create' ? 'Add item' : 'Save changes'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
