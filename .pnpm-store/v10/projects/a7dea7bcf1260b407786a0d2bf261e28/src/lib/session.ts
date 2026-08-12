/**
 * Session handling.
 *
 * The backend JWT never reaches client-side JavaScript. It lives in an
 * httpOnly, sameSite=lax cookie written by the route handlers under
 * src/app/api/auth/*. Server Components read it via `getToken()`, and browser
 * code reaches the API through /api/proxy, which re-attaches it server-side.
 */
import 'server-only';
import { cookies } from 'next/headers';

export const SESSION_COOKIE =
  process.env.SESSION_COOKIE_NAME || 'bizrecord_session';

/** Non-sensitive mirror of the session, readable by the client for UI hints. */
export const USER_COOKIE = 'bizrecord_user';

export function apiBaseUrl(): string {
  const raw = process.env.API_BASE_URL || 'http://localhost:3000';
  return raw.replace(/\/$/, '');
}

export async function getToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? null;
}

export function cookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: maxAgeSeconds,
  };
}

/**
 * JWT_EXPIRES_IN on the backend drives real expiry; the cookie is given a
 * matching-ish 7 day lifetime and the API's 401 is treated as the source of
 * truth (see clearSession usage in the proxy route).
 */
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

/** Decode a JWT payload without verifying — used only to read `exp` for UX. */
export function readJwtExpiry(token: string): number | null {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;
    const json = JSON.parse(
      Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'),
    ) as { exp?: number };
    return typeof json.exp === 'number' ? json.exp : null;
  } catch {
    return null;
  }
}
