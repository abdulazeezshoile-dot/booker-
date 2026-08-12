'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { api, errorMessage } from '@/lib/api';
import { Alert } from '@/components/ui/Feedback';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FieldLabel, Input } from '@/components/ui/Field';

export default function CreateFirstWorkspacePage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await api.post('/workspaces', { name: name.trim(), description: description.trim() || undefined });
      router.replace('/');
      router.refresh();
    } catch (err) {
      setError(errorMessage(err, 'Unable to create your workspace'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg py-8">
      <Card className="p-6">
        <h1 className="text-xl font-bold text-ink dark:text-text-primary">Create your first workspace</h1>
        <p className="mt-1 text-sm text-muted dark:text-text-secondary">
          Your subscription is active. Set up the business workspace your team will use.
        </p>
        {error ? <Alert tone="danger" className="mt-4">{error}</Alert> : null}
        <form onSubmit={submit} className="mt-5 space-y-4">
          <div>
            <FieldLabel label="Workspace name" htmlFor="workspace-name" />
            <Input id="workspace-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Main Store" required />
          </div>
          <div>
            <FieldLabel label="Description (optional)" htmlFor="workspace-description" />
            <Input id="workspace-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="A short description" />
          </div>
          <Button type="submit" className="w-full" loading={saving} disabled={saving || !name.trim()}>
            Create workspace
          </Button>
        </form>
      </Card>
    </div>
  );
}
