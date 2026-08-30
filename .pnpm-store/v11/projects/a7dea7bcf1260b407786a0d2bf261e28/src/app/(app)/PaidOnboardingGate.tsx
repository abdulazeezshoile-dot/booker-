'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { User } from '@/lib/types';

const ALLOWED_PATHS = ['/subscription', '/billing/verify', '/onboarding/workspace'];

export function PaidOnboardingGate({ user, children }: { user: User; children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const needsPayment = user.onboardingStatus === 'pending_payment';
  const allowed = ALLOWED_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  useEffect(() => {
    if (needsPayment && !allowed) router.replace('/subscription');
  }, [allowed, needsPayment, router]);

  if (needsPayment && !allowed) return null;
  return <>{children}</>;
}
