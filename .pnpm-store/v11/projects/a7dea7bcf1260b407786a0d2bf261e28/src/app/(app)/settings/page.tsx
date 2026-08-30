'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { User, Store, Users, Bell, CreditCard, Building2, UserPlus, LogOut, Trash2, Mail, Phone, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useWorkspace } from '@/context/WorkspaceContext';
import { api, errorMessage } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FieldLabel, Input, Select, Textarea } from '@/components/ui/Field';
import { Alert, PageLoading } from '@/components/ui/Feedback';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { formatDate, initials, toNumber } from '@/lib/format';
import type { User as UserType } from '@/lib/types';
import type { AuditLog } from '@/lib/types';
import { useToast } from '@/components/ui/Toast';

const TABS = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'workspace', label: 'Workspace', icon: Store },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'subscription', label: 'Subscription', icon: CreditCard },
  { id: 'audit', label: 'Audit log', icon: ClipboardList },
];

function AccountTab() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const user = await api.get<UserType>('/auth/profile');
      setProfile(user);
    } catch (err) {
      setError(errorMessage(err, 'Unable to load profile'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  if (loading) return <PageLoading label="Loading profile…" />;

  return (
    <Card className="max-w-xl p-6">
      <div className="flex items-center gap-4">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-lg font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
          {initials(profile?.name)}
        </span>
        <div>
          <h2 className="text-lg font-semibold text-ink dark:text-text-primary">{profile?.name}</h2>
          <p className="text-sm text-muted dark:text-text-secondary">Member since {formatDate(profile?.createdAt)}</p>
        </div>
      </div>

      {error ? (
        <Alert tone="danger" className="mt-4">
          {error}
        </Alert>
      ) : null}

      <div className="mt-6 space-y-3">
        <div className="flex items-center gap-3 rounded-xl border border-line px-4 py-3">
          <Mail className="h-4 w-4 text-muted dark:text-text-secondary" />
          <span className="text-sm text-ink dark:text-text-primary">{profile?.email}</span>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-line px-4 py-3">
          <Phone className="h-4 w-4 text-muted dark:text-text-secondary" />
          <span className="text-sm text-ink dark:text-text-primary">{profile?.phone || 'No phone on file'}</span>
        </div>
      </div>

      <div className="mt-8 border-t border-border-soft pt-6">
        <h3 className="text-sm font-semibold text-danger">Sign out</h3>
        <p className="mb-3 mt-1 text-sm text-muted dark:text-text-secondary">
          End this session on this device.
        </p>
        <Button variant="danger" onClick={handleLogout} icon={<LogOut className="h-4 w-4" />}>
          Sign out
        </Button>
      </div>
    </Card>
  );
}

function WorkspaceTab() {
  const { workspaces, currentWorkspace, branches, activeBranch, setCurrentWorkspaceId, setActiveBranchId, reload } =
    useWorkspace();
  const [showCreate, setShowCreate] = useState(false);
  const [showCreateBranch, setShowCreateBranch] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [branchName, setBranchName] = useState('');
  const [branchLocation, setBranchLocation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { show } = useToast();

  const canManage = currentWorkspace?.role === 'owner' || currentWorkspace?.role === 'manager';

  const handleCreateWorkspace = async () => {
    setError(null);
    if (!name.trim()) {
      setError('Workspace name is required');
      return;
    }
    setSaving(true);
    try {
      const created = await api.post<{ id: string }>('/workspaces', {
        name: name.trim(),
        description: description.trim() || undefined,
      });
      setShowCreate(false);
      setName('');
      setDescription('');
      setCurrentWorkspaceId(created.id);
      await reload();
      show('Workspace created successfully.');
    } catch (err) {
      setError(errorMessage(err, 'Unable to create workspace'));
    } finally {
      setSaving(false);
    }
  };

  const handleCreateBranch = async () => {
    if (!currentWorkspace) return;
    setError(null);
    if (!branchName.trim()) {
      setError('Branch name is required');
      return;
    }
    setSaving(true);
    try {
      await api.post(`/workspaces/${currentWorkspace.id}/branches`, {
        name: branchName.trim(),
        location: branchLocation.trim() || undefined,
      });
      setShowCreateBranch(false);
      setBranchName('');
      setBranchLocation('');
      await reload();
      show('Branch created successfully.');
    } catch (err) {
      setError(errorMessage(err, 'Unable to create branch'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {error ? <Alert tone="danger">{error}</Alert> : null}

      <Card>
        <CardHeader
          title="Workspaces"
          subtitle={`${workspaces.length} workspace(s) you belong to.`}
          action={
            <Button variant="secondary" onClick={() => setShowCreate(true)} icon={<Building2 className="h-4 w-4" />}>
              New workspace
            </Button>
          }
        />
        <div className="divide-y divide-border-soft">
          {workspaces.map((ws) => (
            <button
              key={ws.id}
              onClick={() => setCurrentWorkspaceId(ws.id)}
              className={cn(
                'flex w-full items-center justify-between px-5 py-3.5 text-left transition-colors hover:bg-surface-2',
                ws.id === currentWorkspace?.id ? 'bg-brand-50/50 dark:bg-brand-500/10' : '',
              )}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-sm font-bold text-white">
                  {initials(ws.name)}
                </span>
                <div>
                  <p className="font-semibold text-ink dark:text-text-primary">{ws.name}</p>
                  <p className="text-xs text-muted dark:text-text-secondary">
                    Role: {ws.role} · Created {formatDate(ws.createdAt)}
                  </p>
                </div>
              </div>
              <Badge tone={ws.id === currentWorkspace?.id ? 'brand' : 'neutral'}>
                {ws.id === currentWorkspace?.id ? 'Active' : 'Switch'}
              </Badge>
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Branches"
          subtitle={currentWorkspace ? `Branches in "${currentWorkspace.name}".` : 'Select a workspace first.'}
          action={
            canManage ? (
              <Button variant="secondary" onClick={() => setShowCreateBranch(true)} icon={<Building2 className="h-4 w-4" />}>
                New branch
              </Button>
            ) : undefined
          }
        />
        <div className="divide-y divide-border-soft">
          {branches.length === 0 ? (
            <p className="px-5 py-4 text-sm text-muted dark:text-text-secondary">
              No branches in this workspace yet.
            </p>
          ) : (
            branches.map((b) => (
              <div key={b.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="font-semibold text-ink dark:text-text-primary">{b.name}</p>
                  {b.location ? <p className="text-xs text-muted dark:text-text-secondary">{b.location}</p> : null}
                </div>
                <button onClick={() => setActiveBranchId(activeBranch?.id === b.id ? null : b.id)}>
                  <Badge tone={activeBranch?.id === b.id ? 'brand' : 'neutral'}>
                    {activeBranch?.id === b.id ? 'Scoping' : 'Select'}
                  </Badge>
                </button>
              </div>
            ))
          )}
        </div>
      </Card>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create workspace" size="sm">
        <div className="space-y-4">
          <div>
            <FieldLabel label="Workspace name" htmlFor="wsName" />
            <Input id="wsName" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. My Store" />
          </div>
          <div>
            <FieldLabel label="Description" htmlFor="wsDesc" />
            <Textarea id="wsDesc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCreate(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleCreateWorkspace} loading={saving} disabled={!name.trim()}>
              Create
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={showCreateBranch} onClose={() => setShowCreateBranch(false)} title="Create branch" size="sm">
        <div className="space-y-4">
          <div>
            <FieldLabel label="Branch name" htmlFor="brName" />
            <Input id="brName" value={branchName} onChange={(e) => setBranchName(e.target.value)} placeholder="e.g. Lagos Main" />
          </div>
          <div>
            <FieldLabel label="Location" htmlFor="brLocation" />
            <Input id="brLocation" value={branchLocation} onChange={(e) => setBranchLocation(e.target.value)} placeholder="e.g. Ikeja" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCreateBranch(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleCreateBranch} loading={saving} disabled={!branchName.trim()}>
              Create
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function TeamTab() {
  const { currentWorkspace, currentWorkspaceId } = useWorkspace();
  const [members, setMembers] = useState<
    Array<{ id: string; name: string; email: string; phone?: string | null; role: string }>
  >([]);
  const [invites, setInvites] = useState<
    Array<{
      id: string;
      workspaceName: string;
      role: string;
      status: string;
      createdAt?: string;
      expiresAt?: string | null;
    }>
  >([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('staff');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { show } = useToast();

  const canManage = currentWorkspace?.role === 'owner' || currentWorkspace?.role === 'manager';

  const load = useCallback(async () => {
    if (!currentWorkspaceId) return;
    setLoading(true);
    setError(null);
    try {
      const overview = await api
        .get<{
          members?: Array<{ id: string; name: string; email: string; phone?: string | null; role: string }>;
        }>(`/workspaces/${currentWorkspaceId}/management/overview`)
        .catch(() => null);
      setMembers(overview?.members || []);
      const pending = await api
        .get<
          Array<{
            id: string;
            workspaceName: string;
            role: string;
            status: string;
            createdAt?: string;
            expiresAt?: string | null;
          }>
        >('/workspaces/invites/pending')
        .catch(() => []);
      setInvites(Array.isArray(pending) ? pending : []);
    } catch (err) {
      setError(errorMessage(err, 'Unable to load team'));
    } finally {
      setLoading(false);
    }
  }, [currentWorkspaceId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleInvite = async () => {
    if (!currentWorkspaceId) return;
    setError(null);
    setSuccess(null);
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    setSaving(true);
    try {
      await api.post(`/workspaces/${currentWorkspaceId}/team/invite`, { email: email.trim(), role });
      setEmail('');
      setSuccess(`Invitation sent to ${email.trim()}.`);
      show(`Invitation sent to ${email.trim()}.`);
      load();
    } catch (err) {
      setError(errorMessage(err, 'Unable to send invite'));
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (memberId: string) => {
    if (!currentWorkspaceId) return;
    setError(null);
    setSuccess(null);
    try {
      await api.delete(`/workspaces/${currentWorkspaceId}/users/${memberId}`);
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      show('Team member removed.');
    } catch (err) {
      setError(errorMessage(err, 'Unable to remove member'));
    }
  };

  if (loading) return <PageLoading label="Loading team…" />;

  return (
    <div className="space-y-6">
      {error ? <Alert tone="danger">{error}</Alert> : null}
      {success ? <Alert tone="ok">{success}</Alert> : null}

      {canManage ? (
        <Card>
          <CardHeader title="Invite a member" subtitle="Send an invitation email to join this workspace." />
          <div className="flex flex-col gap-3 p-4 sm:flex-row sm:flex-wrap sm:items-end sm:p-5">
            <div className="w-full flex-1">
              <FieldLabel label="Email" htmlFor="inviteEmail" />
              <Input id="inviteEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="teammate@store.com" />
            </div>
            <div className="w-full sm:w-40">
              <FieldLabel label="Role" htmlFor="inviteRole" />
              <Select id="inviteRole" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="owner">Owner</option>
                <option value="manager">Manager</option>
                <option value="staff">Staff</option>
              </Select>
            </div>
            <Button onClick={handleInvite} loading={saving} icon={<UserPlus className="h-4 w-4" />}>
              Send invite
            </Button>
          </div>
        </Card>
      ) : null}

      <Card>
        <CardHeader title="Members" subtitle={`${members.length} member(s) in this workspace.`} />
        <div className="divide-y divide-border-soft">
          {members.length === 0 ? (
            <p className="px-5 py-4 text-sm text-muted dark:text-text-secondary">No members found.</p>
          ) : (
            members.map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                    {initials(m.name)}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-ink dark:text-text-primary">{m.name}</p>
                    <p className="truncate text-xs text-muted dark:text-text-secondary">{m.email}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge tone={m.role === 'owner' ? 'brand' : m.role === 'manager' ? 'info' : 'neutral'}>{m.role}</Badge>
                  {canManage && m.role !== 'owner' ? (
                    <button
                      onClick={() => handleRemove(m.id)}
                      className="rounded-lg p-1.5 text-muted hover:bg-danger/10 hover:text-danger"
                      aria-label={`Remove ${m.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {invites.length > 0 ? (
        <Card>
          <CardHeader title="Pending invites" subtitle="Invites sent to you that are waiting for acceptance." />
          <div className="divide-y divide-border-soft">
            {invites.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="font-semibold text-ink dark:text-text-primary">{inv.workspaceName}</p>
                  <p className="text-xs text-muted dark:text-text-secondary">
                    {inv.role} invite · {inv.expiresAt ? `Expires ${formatDate(inv.expiresAt)}` : 'No expiry'}
                  </p>
                </div>
                <Badge tone="warn">{inv.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}

function AuditTab() {
  const { currentWorkspaceId } = useWorkspace();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentWorkspaceId) { setLoading(false); return; }
    api.get<AuditLog[]>(`/workspaces/${currentWorkspaceId}/audit-logs`)
      .then((data) => setLogs(Array.isArray(data) ? data : []))
      .catch((err) => setError(errorMessage(err, 'Unable to load audit log')))
      .finally(() => setLoading(false));
  }, [currentWorkspaceId]);

  if (loading) return <PageLoading label="Loading audit log…" />;
  return (
    <Card>
      <CardHeader title="Audit log" subtitle="Recent changes made in the selected workspace." />
      {error ? <Alert tone="danger" className="m-5">{error}</Alert> : null}
      {!error && logs.length === 0 ? <p className="px-5 py-8 text-sm text-muted dark:text-text-secondary">No recorded activity yet.</p> : null}
      <div className="divide-y divide-border-soft">
        {logs.map((log) => (
          <div key={log.id} className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="font-medium text-ink dark:text-text-primary">{log.action.replace(/\./g, ' ')}</p><p className="text-xs text-muted dark:text-text-secondary">{log.actor?.name || 'Team member'} · {log.entityType}</p></div>
            <time className="text-xs text-muted dark:text-text-secondary">{formatDate(log.createdAt)}</time>
          </div>
        ))}
      </div>
    </Card>
  );
}

function NotificationsTab() {
  const [prefs, setPrefs] = useState({ emailSales: true, emailExpenses: true, emailDebts: true });
  const [saved, setSaved] = useState(false);

  const items = [
    { key: 'emailSales' as const, label: 'Sales alerts', description: 'Email me when a sale is recorded.' },
    { key: 'emailExpenses' as const, label: 'Expense alerts', description: 'Email me when an expense is recorded.' },
    { key: 'emailDebts' as const, label: 'Debt reminders', description: 'Email me when a debt is coming due.' },
  ];

  return (
    <Card className="max-w-xl p-6">
      <h2 className="text-base font-semibold text-ink dark:text-text-primary">Notifications</h2>
      <p className="mb-5 mt-1 text-sm text-muted dark:text-text-secondary">
        Choose what email updates you receive.
      </p>
      {saved ? (
        <Alert tone="ok" className="mb-4">
          Preferences saved.
        </Alert>
      ) : null}
      <div className="space-y-4">
        {items.map((item) => (
          <label key={item.key} className="flex cursor-pointer items-start justify-between gap-4">
            <div>
              <p className="font-medium text-ink dark:text-text-primary">{item.label}</p>
              <p className="text-sm text-muted dark:text-text-secondary">{item.description}</p>
            </div>
            <input
              type="checkbox"
              checked={prefs[item.key]}
              onChange={(e) => setPrefs((p) => ({ ...p, [item.key]: e.target.checked }))}
              className="mt-1 h-5 w-5 rounded accent-brand-500"
            />
          </label>
        ))}
        <Button onClick={() => setSaved(true)}>Save preferences</Button>
      </div>
    </Card>
  );
}

function SubscriptionTab() {
  const [subscription, setSubscription] = useState<{
    plan?: string;
    status?: string;
    billingCycle?: string;
    currentPeriodEndsAt?: string | null;
    trialEndsAt?: string | null;
    addonWorkspaceSlots?: number;
    addonStaffSeats?: number;
    addonWhatsappBundles?: number;
    whatsappMessagesUsedThisMonth?: number;
  } | null>(null);
  const [usage, setUsage] = useState<{
    whatsappMessagesUsedThisMonth?: number;
    limits?: Record<string, number>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sub, limits] = await Promise.all([
        api
          .get<{ plan?: string; status?: string; billingCycle?: string; currentPeriodEndsAt?: string | null; trialEndsAt?: string | null }>(
            '/billing/subscription',
          )
          .catch(() => null),
        api
          .get<{ whatsappMessagesUsedThisMonth?: number; limits?: Record<string, number> }>('/billing/usage')
          .catch(() => null),
      ]);
      setSubscription(sub);
      setUsage(limits);
    } catch (err) {
      setError(errorMessage(err, 'Unable to load subscription'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <PageLoading label="Loading subscription…" />;

  const plan = subscription?.plan || 'basic';
  const status = subscription?.status || 'expired';

  return (
    <Card className="max-w-xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-ink dark:text-text-primary">Subscription</h2>
          <p className="mt-1 text-sm text-muted dark:text-text-secondary">
            Current plan:{' '}
            <span className="font-semibold capitalize text-ink dark:text-text-primary">{plan}</span>
            {subscription?.billingCycle ? ` · ${subscription.billingCycle}` : ''}
          </p>
          {subscription?.currentPeriodEndsAt ? (
            <p className="mt-0.5 text-xs text-muted dark:text-text-secondary">
              Renews {formatDate(subscription.currentPeriodEndsAt)}
            </p>
          ) : null}
        </div>
        <Badge tone={status === 'active' || status === 'trialing' ? 'ok' : status === 'cancelled' ? 'warn' : 'neutral'}>
          {status}
        </Badge>
      </div>

      {error ? (
        <Alert tone="danger" className="mt-4">
          {error}
        </Alert>
      ) : null}

      {usage?.limits ? (
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {Object.entries(usage.limits).map(([key, value]) => (
            <div key={key} className="rounded-xl border border-line p-3">
              <p className="text-xs text-muted dark:text-text-secondary">{key.replace(/([A-Z])/g, ' $1')}</p>
              <p className="mt-1 text-lg font-bold text-ink dark:text-text-primary">{toNumber(value)}</p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-6">
        <Button asChild>
          <a href="/subscription">Manage subscription</a>
        </Button>
      </div>
    </Card>
  );
}

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'account';
  const [tab, setTab] = useState(initialTab);

  const activeTab = TABS.find((t) => t.id === tab) || TABS[0];

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your account, workspace and team." />

      <div className="mb-6 -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-2 sm:flex-wrap sm:overflow-visible">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
               'shrink-0 flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors',
              activeTab.id === t.id
                ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300'
                : 'border-line text-muted hover:bg-surface-2 dark:text-text-secondary',
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {activeTab.id === 'account' ? <AccountTab /> : null}
      {activeTab.id === 'workspace' ? <WorkspaceTab /> : null}
      {activeTab.id === 'team' ? <TeamTab /> : null}
      {activeTab.id === 'notifications' ? <NotificationsTab /> : null}
      {activeTab.id === 'subscription' ? <SubscriptionTab /> : null}
      {activeTab.id === 'audit' ? <AuditTab /> : null}
    </div>
  );
}
