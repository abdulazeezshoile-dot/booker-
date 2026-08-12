import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/server-api';
import { AppShell } from './AppShell';
import { WorkspaceProvider } from '@/context/WorkspaceContext';
import { PaidOnboardingGate } from './PaidOnboardingGate';

export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <PaidOnboardingGate user={user}>
      <WorkspaceProvider>
        <AppShell user={user}>{children}</AppShell>
      </WorkspaceProvider>
    </PaidOnboardingGate>
  );
}
