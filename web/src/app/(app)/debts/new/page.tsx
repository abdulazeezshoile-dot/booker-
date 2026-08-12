'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useScope } from '@/lib/useScope';
import { api, errorMessage } from '@/lib/api';
import { naira, toNumber } from '@/lib/format';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FieldLabel, Input, Select, Textarea } from '@/components/ui/Field';
import { Alert, PageLoading } from '@/components/ui/Feedback';
import type { Customer, InventoryItem } from '@/lib/types';
import { useToast } from '@/components/ui/Toast';

export default function RecordDebtPage() {
  const router = useRouter();
  const { show } = useToast();
  const { inventoryPath, customersPath, transactionsPath, ready } = useScope();

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [itemId, setItemId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [discountAmount, setDiscountAmount] = useState('0');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  });
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    if (!ready) return;
    const [inv, cust] = await Promise.all([
      api.get<InventoryItem[]>(inventoryPath!, { take: 200 }).catch(() => []),
      api.get<Customer[]>(customersPath!).catch(() => []),
    ]);
    setInventory(Array.isArray(inv) ? inv : []);
    setCustomers(Array.isArray(cust) ? cust : []);
  }, [ready, inventoryPath, customersPath]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedItem = inventory.find((i) => i.id === itemId) || null;
  const unitPrice = toNumber(selectedItem?.sellingPrice);
  const qtyNum = toNumber(quantity);
  const discountNum = toNumber(discountAmount);
  const total = Math.max(0, unitPrice * qtyNum - discountNum);
  const selectedCustomer = customers.find((c) => c.id === customerId) || null;

  const handleSubmit = async () => {
    setError(null);
    if (!ready || !transactionsPath) {
      setError('Select a workspace first');
      return;
    }
    if (!itemId || qtyNum <= 0) {
      setError('Select an item and enter a quantity');
      return;
    }
    if (!customerId) {
      setError('Select a customer for this debt');
      return;
    }
    if (discountNum < 0 || discountNum > unitPrice * qtyNum) {
      setError('Discount cannot exceed gross amount');
      return;
    }
    setLoading(true);
    try {
      await api.post(transactionsPath, {
        type: 'debt',
        itemId: selectedItem?.id,
        quantity: qtyNum,
        unitPrice,
        totalAmount: total,
        discountAmount: discountNum,
        paymentMethod: 'credit',
        customerName: selectedCustomer?.name,
        customerEmail: selectedCustomer?.email || undefined,
        phone: selectedCustomer?.phone || undefined,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        status: 'pending',
        notes: notes.trim() || undefined,
      });
      show('Debt recorded successfully.');
      router.push('/debts');
      router.refresh();
    } catch (err) {
      setError(errorMessage(err, 'Unable to record debt'));
    } finally {
      setLoading(false);
    }
  };

  if (!ready) return <PageLoading label="Preparing debt form…" />;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Record Debt" subtitle="Record money or goods owed to you by a customer." />

      {error ? (
        <Alert tone="danger" className="mb-4">
          {error}
        </Alert>
      ) : null}

      <Card className="p-6">
        <div className="space-y-5">
          <div>
            <FieldLabel label="Customer *" htmlFor="customerId" />
            <Select id="customerId" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              <option value="">Select customer…</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <FieldLabel label="Item *" htmlFor="itemId" />
            <Select id="itemId" value={itemId} onChange={(e) => setItemId(e.target.value)}>
              <option value="">Select item…</option>
              {inventory.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} — {naira(item.sellingPrice)}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <FieldLabel label="Quantity" htmlFor="quantity" />
              <Input id="quantity" type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </div>
            <div>
              <FieldLabel label="Unit price" />
              <div className="rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-sm font-semibold text-ink dark:text-text-primary">
                {naira(unitPrice)}
              </div>
            </div>
            <div>
              <FieldLabel label="Discount (₦)" htmlFor="discount" />
              <Input id="discount" type="number" min={0} value={discountAmount} onChange={(e) => setDiscountAmount(e.target.value)} />
            </div>
          </div>

          <div>
            <FieldLabel label="Due date" htmlFor="dueDate" />
            <Input id="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>

          <div>
            <FieldLabel label="Notes" htmlFor="notes" />
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add notes…" />
          </div>

          <div className="flex items-center justify-between border-t border-border-soft pt-4">
            <span className="text-sm font-semibold text-muted dark:text-text-secondary">Total debt</span>
            <span className="text-lg font-bold text-brand-500">{naira(total)}</span>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => router.back()} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} loading={loading} disabled={loading || !itemId || !customerId}>
              {loading ? 'Recording…' : 'Save debt'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
