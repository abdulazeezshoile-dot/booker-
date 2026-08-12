'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useScope } from '@/lib/useScope';
import { api, errorMessage } from '@/lib/api';
import { toNumber } from '@/lib/format';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FieldLabel, Input, Select, Textarea } from '@/components/ui/Field';
import { Alert, PageLoading } from '@/components/ui/Feedback';
import { useToast } from '@/components/ui/Toast';

const EXPENSE_CATEGORIES = ['rent', 'utilities', 'salary', 'supplies', 'maintenance', 'other'];
const PAYMENT_METHODS = ['cash', 'card', 'bank', 'check', 'credit'];

export default function RecordExpensePage() {
  const router = useRouter();
  const { show } = useToast();
  const { transactionsPath, ready } = useScope();
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    const parsed = toNumber(amount);
    if (!category) {
      setError('Please choose a category');
      return;
    }
    if (!parsed || parsed <= 0) {
      setError('Enter a valid expense amount');
      return;
    }
    if (!ready || !transactionsPath) {
      setError('Select a workspace first');
      return;
    }
    setLoading(true);
    try {
      await api.post(transactionsPath, {
        type: 'expense',
        quantity: 1,
        unitPrice: parsed,
        totalAmount: parsed,
        paymentMethod,
        category,
        notes: description.trim() || notes.trim() || undefined,
      });
      show('Expense recorded successfully.');
      router.push('/transactions');
      router.refresh();
    } catch (err) {
      setError(errorMessage(err, 'Unable to record expense'));
    } finally {
      setLoading(false);
    }
  };

  if (!ready) return <PageLoading label="Preparing expense form…" />;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Record Expense" subtitle="Log money spent on running your business." />

      {error ? (
        <Alert tone="danger" className="mb-4">
          {error}
        </Alert>
      ) : null}

      <Card className="p-6">
        <div className="space-y-5">
          <div>
            <FieldLabel label="Category *" htmlFor="category" />
            <div className="flex flex-wrap gap-2">
              {EXPENSE_CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={
                    category === c
                      ? 'rounded-full border border-brand-500 bg-brand-50 px-4 py-2 text-sm font-medium capitalize text-brand-700 dark:bg-brand-500/15 dark:text-brand-300'
                      : 'rounded-full border border-line px-4 py-2 text-sm font-medium capitalize text-muted hover:bg-surface-2 dark:text-text-secondary'
                  }
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel label="Amount (₦) *" htmlFor="amount" />
              <Input id="amount" type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <FieldLabel label="Payment method" htmlFor="paymentMethod" />
              <Select id="paymentMethod" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <FieldLabel label="Description" htmlFor="description" />
            <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Generator diesel for March" />
          </div>

          <div>
            <FieldLabel label="Notes" htmlFor="notes" />
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add notes…" />
          </div>

          <div className="flex justify-end gap-2 border-t border-border-soft pt-5">
            <Button variant="outline" onClick={() => router.back()} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} loading={loading} disabled={loading}>
              {loading ? 'Recording…' : 'Record expense'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
