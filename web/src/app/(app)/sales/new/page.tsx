'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Plus, Trash2, UserPlus } from 'lucide-react';
import { useScope } from '@/lib/useScope';
import { api, errorMessage } from '@/lib/api';
import { naira, toNumber } from '@/lib/format';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FieldLabel, Input, Select, Textarea } from '@/components/ui/Field';
import { Alert, PageLoading } from '@/components/ui/Feedback';
import { cn } from '@/lib/cn';
import type { Customer, InventoryItem } from '@/lib/types';
import { useToast } from '@/components/ui/Toast';

const PAYMENT_OPTIONS = [
  { id: 'sale', label: 'Cash sale', paymentMethod: 'cash' },
  { id: 'debt', label: 'Mark as debt', paymentMethod: 'credit' },
];

export default function RecordSalePage() {
  const router = useRouter();
  const { show } = useToast();
  const { inventoryPath, customersPath, transactionsPath, currentWorkspaceId, activeBranchId, ready } = useScope();

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [itemQuery, setItemQuery] = useState('');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [discountAmount, setDiscountAmount] = useState('0');
  const [cart, setCart] = useState<
    Array<InventoryItem & { quantity: number; discountAmount: number }>
  >([]);
  const [saleMode, setSaleMode] = useState('sale');
  const [dueInDays, setDueInDays] = useState('7');
  const [customerId, setCustomerId] = useState('');
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '' });
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

  const selectedItem = inventory.find((i) => i.id === selectedItemId) || null;
  const unitPrice = toNumber(selectedItem?.sellingPrice);
  const qtyNum = toNumber(quantity);
  const discountNum = toNumber(discountAmount);
  const grossTotal = unitPrice * qtyNum;
  const netTotal = Math.max(0, grossTotal - discountNum);
  const cartTotal = cart.reduce((s, it) => s + it.quantity * toNumber(it.sellingPrice) - toNumber(it.discountAmount), 0);

  const dueDate = saleMode === 'debt' && dueInDays
    ? new Date(Date.now() + Number(dueInDays) * 86400000).toISOString()
    : undefined;

  const filteredInventory = useMemo(() => {
    const q = itemQuery.trim().toLowerCase();
    if (!q) return inventory;
    return inventory.filter((item) =>
      [item.name, item.sku, item.category, item.location].filter(Boolean).join(' ').toLowerCase().includes(q),
    );
  }, [inventory, itemQuery]);

  const selectedCustomer = customers.find((c) => c.id === customerId) || null;

  const addToCart = () => {
    setError(null);
    if (!selectedItem || !qtyNum || qtyNum <= 0) {
      setError('Please select an item and quantity');
      return;
    }
    if (discountNum < 0 || discountNum > grossTotal) {
      setError(`Discount cannot exceed gross amount (${naira(grossTotal)})`);
      return;
    }
    const existingQty = cart
      .filter((it) => it.id === selectedItem.id)
      .reduce((s, it) => s + it.quantity, 0);
    if (existingQty + qtyNum > toNumber(selectedItem.quantity)) {
      setError(`Only ${toNumber(selectedItem.quantity)} unit(s) are currently available.`);
      return;
    }
    setCart((prev) => {
      const found = prev.find((it) => it.id === selectedItem.id);
      if (found) {
        return prev.map((it) =>
          it.id === selectedItem.id
            ? { ...it, quantity: it.quantity + qtyNum, discountAmount: it.discountAmount + discountNum }
            : it,
        );
      }
      return [...prev, { ...selectedItem, quantity: qtyNum, discountAmount: discountNum }];
    });
    setSelectedItemId('');
    setQuantity('');
    setDiscountAmount('0');
    setItemQuery('');
  };

  const createCustomerAndUse = async () => {
    if (!newCustomer.name.trim()) return;
    try {
      const created = await api.post<Customer>(customersPath!, {
        name: newCustomer.name.trim(),
        phone: newCustomer.phone.trim() || undefined,
        email: newCustomer.email.trim() || undefined,
      });
      setCustomers((prev) => [...prev, created]);
      setCustomerId(created.id);
      setNewCustomer({ name: '', phone: '', email: '' });
      show('Customer created and selected.');
    } catch (err) {
      setError(errorMessage(err, 'Unable to create customer'));
    }
  };

  const handleSubmit = async () => {
    setError(null);
    if (!ready || !transactionsPath) {
      setError('Select a workspace first');
      return;
    }
    if (cart.length === 0) {
      setError('Add at least one item to the cart');
      return;
    }
    setLoading(true);
    try {
      const lineItems = cart.map((it) => ({
        itemId: it.id,
        quantity: it.quantity,
        unitPrice: toNumber(it.sellingPrice),
        discountAmount: toNumber(it.discountAmount),
      }));
      const total = lineItems.reduce(
        (s, li) => s + li.quantity * li.unitPrice - li.discountAmount,
        0,
      );
      await api.post(transactionsPath, {
        type: saleMode === 'debt' ? 'debt' : 'sale',
        lineItems,
        // The API DTO also requires transaction-level quantity. The backend
        // recalculates this from lineItems, but this keeps request validation
        // satisfied before it reaches that multi-item branch.
        quantity: lineItems.reduce((sum, item) => sum + item.quantity, 0),
        totalAmount: total,
        paymentMethod: saleMode === 'debt' ? 'credit' : 'cash',
        customerName: selectedCustomer?.name || undefined,
        customerEmail: selectedCustomer?.email || undefined,
        phone: selectedCustomer?.phone || undefined,
        dueDate,
        status: saleMode === 'debt' ? 'pending' : 'completed',
        notes: notes.trim() || undefined,
      });
      show(saleMode === 'debt' ? 'Debt sale saved successfully.' : 'Sale completed successfully.');
      router.push(saleMode === 'debt' ? '/debts' : '/sales');
      router.refresh();
    } catch (err) {
      setError(errorMessage(err, 'Unable to record sale'));
    } finally {
      setLoading(false);
    }
  };

  if (!ready) return <PageLoading label="Preparing sale form…" />;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Record Sale" subtitle="Choose goods, add them to the cart, then complete the sale." />

      {error ? (
        <Alert tone="danger" className="mb-4">
          {error}
        </Alert>
      ) : null}

      {/* Sale type */}
      <Card className="mb-5 p-5">
        <p className="mb-3 text-sm text-muted dark:text-text-secondary">Sale Type</p>
        <div className="flex gap-3">
          {PAYMENT_OPTIONS.map((option) => {
            const selected = saleMode === option.id;
            return (
              <button
                key={option.id}
                onClick={() => setSaleMode(option.id)}
                className={cn(
                  'flex-1 rounded-xl border px-4 py-3 text-sm font-semibold transition-colors',
                  selected
                    ? 'border-brand-500 bg-brand-500 text-white'
                    : 'border-line bg-surface text-ink hover:bg-surface-2 dark:bg-surface-2 dark:text-text-primary',
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        {saleMode === 'debt' ? (
          <div className="mt-4">
            <FieldLabel label="Due in (days)" htmlFor="dueInDays" />
            <Input id="dueInDays" type="number" min={1} value={dueInDays} onChange={(e) => setDueInDays(e.target.value)} className="max-w-[160px]" />
          </div>
        ) : null}
      </Card>

      {/* Item selection */}
      <Card className="mb-5 p-5">
        <FieldLabel label="Find goods" />
        <Input value={itemQuery} onChange={(e) => setItemQuery(e.target.value)} placeholder="Search by name, SKU, category or location" />

        <div className="mt-3 max-h-56 space-y-2 overflow-y-auto rounded-xl border border-line p-2">
          {filteredInventory.length === 0 ? (
            <p className="p-4 text-center text-sm text-muted dark:text-text-secondary">
              No matching goods. Add inventory items first.
            </p>
          ) : (
            filteredInventory.map((item) => {
              const selected = selectedItemId === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedItemId(item.id)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left transition-colors',
                    selected
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/15'
                      : 'border-line hover:bg-surface-2',
                  )}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink dark:text-text-primary">{item.name}</p>
                    <p className="text-xs text-muted dark:text-text-secondary">
                      Stock: {toNumber(item.quantity)} | Price: {naira(item.sellingPrice)}
                    </p>
                  </div>
                  {selected ? <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-500" /> : null}
                </button>
              );
            })
          )}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <FieldLabel label="Quantity *" htmlFor="quantity" />
            <Input id="quantity" type="number" min={0} value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="0" />
          </div>
          <div>
            <FieldLabel label="Price per unit" />
            <div className="rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-sm font-semibold text-ink dark:text-text-primary">
              {naira(unitPrice)}
            </div>
          </div>
          <div>
            <FieldLabel label="Discount (₦)" htmlFor="discount" />
            <Input id="discount" type="number" min={0} value={discountAmount} onChange={(e) => setDiscountAmount(e.target.value)} placeholder="0" />
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted dark:text-text-secondary">
            {selectedItem ? (
              <>
                Gross: <span className="font-semibold text-ink dark:text-text-primary">{naira(grossTotal)}</span>
                {' · '}Final: <span className="font-semibold text-brand-500">{naira(netTotal)}</span>
              </>
            ) : (
              'Select an item to see totals'
            )}
          </div>
          <Button onClick={addToCart} icon={<Plus className="h-4 w-4" />} variant="secondary">
            Add to cart
          </Button>
        </div>
      </Card>

      {/* Cart */}
      {cart.length > 0 ? (
        <Card className="mb-5 p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-ink dark:text-text-primary">Items in this transaction</p>
            <button
              onClick={() => setCart([])}
              className="text-xs font-medium text-danger hover:underline"
            >
              Clear cart
            </button>
          </div>
          <div className="divide-y divide-border-soft">
            {cart.map((it) => (
              <div key={it.id} className="flex items-start justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink dark:text-text-primary">{it.name}</p>
                  <p className="text-xs text-muted dark:text-text-secondary">
                    {it.quantity} x {naira(it.sellingPrice)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-sm font-bold text-brand-500">{naira(it.quantity * toNumber(it.sellingPrice) - toNumber(it.discountAmount))}</span>
                  <button
                    onClick={() => setCart((prev) => prev.filter((c) => c.id !== it.id))}
                    className="rounded-lg p-1.5 text-muted hover:bg-danger/10 hover:text-danger"
                    aria-label={`Remove ${it.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-border-soft pt-4">
            <span className="text-sm font-semibold text-muted dark:text-text-secondary">Total</span>
            <span className="text-lg font-bold text-brand-500">{naira(cartTotal)}</span>
          </div>
        </Card>
      ) : null}

      {/* Customer */}
      <Card className="mb-5 p-5">
        <FieldLabel label="Customer" htmlFor="customerId" />
        <div className="flex items-center gap-2">
          <Select
            id="customerId"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="flex-1"
          >
            <option value="">Walk-in customer</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          {customerId ? (
            <button
              onClick={() => setCustomerId('')}
              className="rounded-xl border border-line px-3 py-2.5 text-sm text-muted hover:bg-surface-2 dark:text-text-secondary"
            >
              Clear
            </button>
          ) : null}
        </div>

        <div className="mt-4 rounded-xl border border-dashed border-line p-4">
          <p className="mb-3 text-sm font-semibold text-ink dark:text-text-primary">
            <UserPlus className="mr-1 inline h-4 w-4 text-brand-500" />
            New customer
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Input value={newCustomer.name} onChange={(e) => setNewCustomer((n) => ({ ...n, name: e.target.value }))} placeholder="Name" />
            <Input value={newCustomer.phone} onChange={(e) => setNewCustomer((n) => ({ ...n, phone: e.target.value }))} placeholder="Phone" />
            <Input value={newCustomer.email} onChange={(e) => setNewCustomer((n) => ({ ...n, email: e.target.value }))} placeholder="Email" type="email" />
          </div>
          <Button onClick={createCustomerAndUse} variant="outline" className="mt-3" disabled={!newCustomer.name.trim()}>
            Create & select
          </Button>
        </div>

        <div className="mt-4">
          <FieldLabel label="Notes" htmlFor="notes" />
          <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add notes…" />
        </div>
      </Card>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
        <Button variant="outline" onClick={() => router.back()} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} loading={loading} disabled={loading || cart.length === 0} className="flex-1">
          {loading
            ? 'Recording…'
            : saleMode === 'debt'
              ? `Save Debt Sale (${cart.length})`
              : `Complete Sale (${cart.length})`}
        </Button>
      </div>
    </div>
  );
}
