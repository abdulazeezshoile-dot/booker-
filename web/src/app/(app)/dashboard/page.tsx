'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  PlusCircle,
  ShoppingCart,
  Receipt,
  PackageSearch,
  History,
  ArrowLeftRight,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useScope } from '@/lib/useScope';
import { api } from '@/lib/api';
import { naira, toNumber, timeAgo, greeting } from '@/lib/format';
import { Card, CardHeader } from '@/components/ui/Card';
import { MetricCard } from '@/components/ui/MetricCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { InventoryItem, Transaction } from '@/lib/types';

export default function DashboardPage() {
  const { currentWorkspace, activeBranch } = useWorkspace();
  const { transactionsPath, inventoryPath, currentWorkspaceId } = useScope();

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [recentSales, setRecentSales] = useState<Transaction[]>([]);
  const [recentExpenses, setRecentExpenses] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingInviteCount, setPendingInviteCount] = useState(0);

  const load = useCallback(async () => {
    if (!currentWorkspaceId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [inv, sales, expenses, invites] = await Promise.all([
        api.get<InventoryItem[]>(inventoryPath!, { take: 200 }).catch(() => []),
        api.get<Transaction[]>(transactionsPath!, { type: 'sale', take: 5 }).catch(() => []),
        api.get<Transaction[]>(transactionsPath!, { type: 'expense', take: 5 }).catch(() => []),
        api.get<unknown[]>('/workspaces/invites/pending').catch(() => []),
      ]);
      setInventory(Array.isArray(inv) ? inv : []);
      setRecentSales(Array.isArray(sales) ? sales : []);
      setRecentExpenses(Array.isArray(expenses) ? expenses : []);
      setPendingInviteCount(Array.isArray(invites) ? invites.length : 0);
    } finally {
      setLoading(false);
    }
  }, [currentWorkspaceId, inventoryPath, transactionsPath]);

  useEffect(() => {
    load();
  }, [load]);

  const inventoryValue = inventory.reduce((sum, item) => sum + toNumber(item.quantity) * toNumber(item.costPrice), 0);
  const lowStock = inventory.filter((item) => toNumber(item.quantity) <= toNumber(item.reorderLevel) && toNumber(item.reorderLevel) > 0);
  const isOwnerView = currentWorkspace?.role === 'owner';

  const quickActions = [
    { href: '/inventory/new', label: 'Add item', icon: PlusCircle, tone: 'text-brand-500' },
    { href: '/sales/new', label: 'Record sale', icon: ShoppingCart, tone: 'text-ok' },
    { href: '/transactions/new', label: 'Expense', icon: Receipt, tone: 'text-warn' },
  ];

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink dark:text-text-primary">
            {greeting()}
          </h1>
          <p className="text-sm text-muted dark:text-text-secondary">
            {currentWorkspace?.name || 'Select a workspace'}
            {activeBranch ? ` • ${activeBranch.name}` : ''}
          </p>
        </div>
        <Link
          href="/settings"
          className="focus-ring rounded-xl border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink hover:bg-surface-2 dark:bg-surface dark:text-text-primary"
        >
          {currentWorkspace?.name || 'Workspace'}
        </Link>
      </div>

      {pendingInviteCount > 0 ? (
        <Card className="flex flex-wrap items-center gap-3 border-brand-500/20 p-4">
          <ShieldCheck className="h-5 w-5 text-brand-500" />
          <div className="flex-1">
            <p className="font-semibold text-ink dark:text-text-primary">
              You have {pendingInviteCount} pending workspace invite{pendingInviteCount === 1 ? '' : 's'}
            </p>
            <p className="text-sm text-muted dark:text-text-secondary">
              Review and accept them to join another workspace.
            </p>
          </div>
          <Button asChild>
            <Link href="/settings?tab=team">Review</Link>
          </Button>
        </Card>
      ) : null}

      {/* Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Inventory value"
          value={loading ? '—' : naira(inventoryValue)}
          hint={`${inventory.length} item(s) in stock`}
          icon={PackageSearch}
          tone="brand"
        />
        <MetricCard
          label="Low stock items"
          value={loading ? '—' : String(lowStock.length)}
          hint="At or below reorder level"
          icon={AlertTriangle}
          tone={lowStock.length > 0 ? 'warn' : 'ok'}
        />
        <MetricCard
          label="Recent sales"
          value={loading ? '—' : naira(recentSales.reduce((s, t) => s + toNumber(t.totalAmount), 0))}
          hint={`${recentSales.length} recent sale(s)`}
          icon={ShoppingCart}
          tone="ok"
        />
        <MetricCard
          label="Recent expenses"
          value={loading ? '—' : naira(recentExpenses.reduce((s, t) => s + toNumber(t.totalAmount), 0))}
          hint={`${recentExpenses.length} recent expense(s)`}
          icon={Receipt}
          tone="warn"
        />
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="mb-3 text-sm font-medium text-muted dark:text-text-secondary">Quick actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="flex flex-col items-center gap-2 rounded-card border border-line bg-surface p-4 shadow-card transition-colors hover:bg-surface-2 dark:bg-surface-raised dark:hover:bg-surface-2"
            >
              <action.icon className={`h-5 w-5 ${action.tone}`} />
              <span className="text-xs font-medium text-ink dark:text-text-primary">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Owner tools */}
      {isOwnerView ? (
        <Card>
          <CardHeader
            title="Owner Tools"
            subtitle="Workspace-wide controls for branch movement and audit visibility."
          />
          <div className="flex flex-wrap gap-2 p-5">
            <Button asChild variant="secondary">
              <Link href="/transactions">
                <ArrowLeftRight className="h-4 w-4" /> Stock Transfers
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/settings?tab=audit">
                <History className="h-4 w-4" /> Audit Logs
              </Link>
            </Button>
          </div>
        </Card>
      ) : null}

      {/* Recent activity */}
      <div>
        <h2 className="mb-3 text-sm font-medium text-muted dark:text-text-secondary">Recent activity</h2>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : recentSales.length === 0 && recentExpenses.length === 0 ? (
          <EmptyState
            icon={History}
            title="No recent activity"
            subtitle="Record your first sale or expense to see activity here!"
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {recentSales.length > 0 ? (
              <Card>
                <CardHeader title="Recent sales" />
                <div className="divide-y divide-border-soft">
                  {recentSales.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between px-5 py-3">
                      <div>
                        <p className="text-sm font-semibold text-ink dark:text-text-primary">
                          {tx.customerName || 'Walk-in'}
                        </p>
                        <p className="text-xs text-muted dark:text-text-secondary">{timeAgo(tx.createdAt)}</p>
                      </div>
                      <Badge tone="ok">{naira(tx.totalAmount)}</Badge>
                    </div>
                  ))}
                </div>
              </Card>
            ) : null}
            {recentExpenses.length > 0 ? (
              <Card>
                <CardHeader title="Recent expenses" />
                <div className="divide-y divide-border-soft">
                  {recentExpenses.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between px-5 py-3">
                      <div>
                        <p className="text-sm font-semibold text-ink dark:text-text-primary">
                          {tx.category || 'Expense'}
                        </p>
                        <p className="text-xs text-muted dark:text-text-secondary">{timeAgo(tx.createdAt)}</p>
                      </div>
                      <Badge tone="warn">{naira(tx.totalAmount)}</Badge>
                    </div>
                  ))}
                </div>
              </Card>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
