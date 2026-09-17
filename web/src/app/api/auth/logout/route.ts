import { NextResponse } from 'next/server';
import { cookieOptions, SESSION_COOKIE, USER_COOKIE } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  const next = NextResponse.json({ ok: true });
  next.cookies.set(SESSION_COOKIE, '', { ...cookieOptions(0), maxAge: 0 });
  next.cookies.set(USER_COOKIE, '', { ...cookieOptions(0), httpOnly: false, maxAge: 0 });
  return next;
}
