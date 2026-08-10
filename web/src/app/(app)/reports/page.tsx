'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Download, BarChart3 } from 'lucide-react';
import { useScope } from '@/lib/useScope';
import { api } from '@/lib/api';
import { naira, toNumber } from '@/lib/format';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { MetricCard } from '@/components/ui/MetricCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Transaction } from '@/lib/types';

const normalizeDate = (tx: Transaction) => {
  for (const value of [tx?.createdAt, tx?.updatedAt]) {
    const date = new Date(value || 0);
    if (!Number.isNaN(date.getTime())) return date;
  }
  return null;
};

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2 text-sm shadow-panel dark:bg-surface-raised">
      <p className="mb-1 font-semibold text-ink dark:text-text-primary">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.dataKey} className="text-xs" style={{ color: entry.color }}>
          {entry.name}: {naira(entry.value)}
        </p>
      ))}
    </div>
  );
}

export default function ReportsPage() {
  const { transactionsPath, ready } = useScope();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!ready || !transactionsPath) return;
    setLoading(true);
    try {
      const data = await api.get<Transaction[]>(transactionsPath, { take: 500 });
      setTransactions(Array.isArray(data) ? data : []);
    } catch {
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [ready, transactionsPath]);

  useEffect(() => {
    load();
  }, [load]);

  const analytics = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const monthlyMap = new Map<string, { key: string; label: string; year: number; income: number; expense: number; debt: number }>();

    let thisMonthIncome = 0;
    let thisYearIncome = 0;
    let thisMonthExpenses = 0;
    let thisYearExpenses = 0;
    let debtExposure = 0;
    let saleCount = 0;

    transactions.forEach((tx) => {
      const amount = toNumber(tx.totalAmount);
      const txType = String(tx.type || '').toLowerCase();
      const createdAt = normalizeDate(tx);
      if (!createdAt) return;

      const year = createdAt.getFullYear();
      const month = createdAt.getMonth();
      const key = `${year}-${String(month + 1).padStart(2, '0')}`;

      if (!monthlyMap.has(key)) {
        monthlyMap.set(key, {
          key,
          label: createdAt.toLocaleString('default', { month: 'short' }),
          year,
          income: 0,
          expense: 0,
          debt: 0,
        });
      }
      const bucket = monthlyMap.get(key)!;

      if (txType === 'sale') {
        bucket.income += amount;
        saleCount += 1;
        if (year === currentYear) thisYearIncome += amount;
        if (year === currentYear && month === currentMonth) thisMonthIncome += amount;
      }
      if (txType === 'expense') {
        bucket.expense += amount;
        if (year === currentYear) thisYearExpenses += amount;
        if (year === currentYear && month === currentMonth) thisMonthExpenses += amount;
      }
      if (txType === 'debt' && tx.status !== 'completed') {
        bucket.debt += amount;
        debtExposure += amount;
      }
    });

    const monthlyRows = Array.from(monthlyMap.values()).sort((a, b) => a.key.localeCompare(b.key));
    const recentMonths = monthlyRows.slice(-6);

    return {
      thisMonthIncome,
      thisYearIncome,
      thisMonthExpenses,
      thisYearExpenses,
      debtExposure,
      avgSaleValue: saleCount > 0 ? thisYearIncome / saleCount : 0,
      netThisYear: thisYearIncome - thisYearExpenses,
      expenseToIncomeRatio: thisYearIncome > 0 ? thisYearExpenses / thisYearIncome : 0,
      topIncomeMonth: monthlyRows.reduce(
        (best, item) => (item.income > (best?.income || 0) ? item : best),
        null as (typeof monthlyRows)[number] | null,
      ),
      recentMonths,
      monthlyRows,
      totalTransactions: transactions.length,
    };
  }, [transactions]);

  const exportCsv = () => {
    const lines = [
      'Month,Year,Income,Expenses,Debt,Net',
      ...analytics.monthlyRows.map((row) => {
        const net = row.income - row.expense;
        return `${row.label},${row.year},${row.income},${row.expense},${row.debt},${net}`;
      }),
    ];
    const csv = `\uFEFF${lines.join('\n')}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `bizrecord-analytics-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const ratio = analytics.expenseToIncomeRatio;
  const topMonth = analytics.topIncomeMonth?.label ? `${analytics.topIncomeMonth.label} ${analytics.topIncomeMonth.year}` : '—';

  return (
    <div>
      <PageHeader
        title="Analytics"
        subtitle="Your income, expenses and debt at a glance."
        actions={
          <Button variant="outline" onClick={exportCsv} disabled={analytics.totalTransactions === 0} icon={<Download className="h-4 w-4" />}>
            Export CSV
          </Button>
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="This month income" value={naira(analytics.thisMonthIncome)} hint="All sales this month" icon={BarChart3} tone="ok" />
          <MetricCard label="This year income" value={naira(analytics.thisYearIncome)} hint={`Net: ${naira(analytics.netThisYear)}`} icon={BarChart3} tone="brand" />
          <MetricCard label="This month expenses" value={naira(analytics.thisMonthExpenses)} hint={`This year: ${naira(analytics.thisYearExpenses)}`} icon={BarChart3} tone="warn" />
          <MetricCard label="Debt exposure" value={naira(analytics.debtExposure)} hint="Outstanding debts" icon={BarChart3} tone="danger" />
          <MetricCard label="Avg sale value" value={naira(analytics.avgSaleValue)} hint="This year" icon={BarChart3} tone="neutral" />
          <MetricCard label="Expense ratio" value={`${Math.round(ratio * 100)}%`} hint="of income goes to expenses" icon={BarChart3} tone={ratio > 0.8 ? 'danger' : 'ok'} />
          <MetricCard label="Top income month" value={topMonth} hint="Best month on record" icon={BarChart3} tone="neutral" />
          <MetricCard label="Transactions" value={String(analytics.totalTransactions)} hint="All time" icon={BarChart3} tone="neutral" />
        </div>
      )}

      <Card className="mt-6 p-5">
        <h2 className="mb-4 text-base font-semibold text-ink dark:text-text-primary">
          Income vs Expenses (last {analytics.recentMonths.length || 6} months)
        </h2>
        {analytics.recentMonths.length === 0 ? (
          <EmptyState icon={BarChart3} title="No data to chart yet" subtitle="Record sales and expenses to see trends." />
        ) : (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.recentMonths} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--text-faint)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--surface-2)', opacity: 0.6 }} />
                <Legend />
                <Bar dataKey="income" name="Income" fill="#00a676" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expense" name="Expenses" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </div>
  );
}
