/**
 * Shared helpers for the /api/auth route handlers.
 *
 * Login and register both talk to NestJS, capture the returned access_token,
 * and store it in the httpOnly session cookie. The user payload is mirrored to
 * a non-sensitive cookie so client components can render role/plan UI hints.
 */
import { NextResponse } from 'next/server';
import { apiBaseUrl, cookieOptions, SESSION_COOKIE, SESSION_MAX_AGE, USER_COOKIE } from '@/lib/session';
import type { User } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function authLogin(
  path: string,
  body: unknown,
): Promise<NextResponse> {
  try {
    const response = await fetch(`${apiBaseUrl()}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const message =
        (data && typeof data === 'object' && 'message' in data
          ? Array.isArray((data as { message: unknown }).message)
            ? ((data as { message: string[] }).message).join(', ')
            : String((data as { message: unknown }).message)
          : null) ||
        response.statusText ||
        'Request failed';
      return NextResponse.json({ message }, { status: response.status });
    }

    const token = (data as { access_token?: string } | null)?.access_token;
    if (!token) {
      return NextResponse.json(
        { message: 'Login succeeded but no session token was issued' },
        { status: 500 },
      );
    }

    const user = (data as { user?: User })?.user;
    const next = NextResponse.json(data, { status: 200 });

    next.cookies.set(SESSION_COOKIE, token, cookieOptions(SESSION_MAX_AGE));
    if (user) {
      next.cookies.set(USER_COOKIE, JSON.stringify(user), {
        ...cookieOptions(SESSION_MAX_AGE),
        httpOnly: false,
      });
    }
    return next;
  } catch (err) {
    return NextResponse.json(
      { message: err instanceof Error ? err.message : 'Could not reach the API' },
      { status: 502 },
    );
  }
}

export function buildAuthResponse(body: unknown, status: number) {
  return NextResponse.json(body, { status });
}
