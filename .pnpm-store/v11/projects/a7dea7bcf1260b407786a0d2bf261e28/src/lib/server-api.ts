/**
 * Server-side API access for Server Components and route handlers.
 *
 * Reads the JWT straight from the httpOnly cookie and calls NestJS directly —
 * no proxy hop. A 401 means the session is dead, so we bounce to /login instead
 * of rendering an authenticated page against missing data.
 */
import 'server-only';
import { redirect } from 'next/navigation';
import { apiBaseUrl, getToken } from './session';
import { ApiError, type Query } from './api';
import type { User, Workspace } from './types';

type FetchOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  query?: Query;
  /** Return null instead of throwing when the backend 4xx's. */
  soft?: boolean;
  /** Bounce to /login on 401 (default true). */
  redirectOnAuthError?: boolean;
};

export async function serverFetch<T = unknown>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const {
    method = 'GET',
    body,
    query,
    soft = false,
    redirectOnAuthError = true,
  } = options;

  const token = await getToken();
  const clean = path.startsWith('/') ? path : `/${path}`;
  let url = `${apiBaseUrl()}${clean}`;

  if (query) {
    const params = Object.entries(query)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&');
    if (params) url += `?${params}`;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store',
    });
  } catch (err) {
    // Backend unreachable. Soft callers render an empty state instead of a
    // 500 page — the dashboard stays usable when only one panel is down.
    if (soft) return null as T;
    throw new ApiError(
      err instanceof Error ? err.message : 'Could not reach the API',
      0,
    );
  }

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await response.json().catch(() => null)
    : null;

  if (!response.ok) {
    if (response.status === 401 && redirectOnAuthError) {
      redirect('/login?reason=expired');
    }
    if (soft) return null as T;

    const raw = (data as { message?: unknown } | null)?.message;
    const message = Array.isArray(raw)
      ? raw.join(', ')
      : raw
        ? String(raw)
        : response.statusText || 'Request failed';
    throw new ApiError(message, response.status, data);
  }

  return data as T;
}

/** Current user, or null when there is no usable session. */
export async function getCurrentUser(): Promise<User | null> {
  const token = await getToken();
  if (!token) return null;
  return serverFetch<User | null>('/auth/profile', {
    soft: true,
    redirectOnAuthError: false,
  });
}

/** Current user, or a redirect to /login. Use at the top of protected pages. */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return user;
}

export async function getWorkspaces(): Promise<Workspace[]> {
  const list = await serverFetch<Workspace[] | null>('/workspaces', { soft: true });
  return Array.isArray(list) ? list : [];
}
