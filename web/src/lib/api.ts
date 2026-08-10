/**
 * Browser-side API client.
 *
 * Requests go to /api/proxy/<backend path>, a Next route handler that attaches
 * the httpOnly JWT cookie as a Bearer token before forwarding to NestJS. That
 * keeps the token out of reach of any script on the page, and it mirrors the
 * shape of the Expo app's `src/api/client.js` so call sites read the same.
 */

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }

  /** The session is gone or the backend rejected the token. */
  get isAuth() {
    return this.status === 401;
  }

  /** The user is authenticated but not allowed to do this. */
  get isForbidden() {
    return this.status === 403;
  }
}

export type Query = Record<string, string | number | boolean | undefined | null>;

function buildPath(path: string, query?: Query) {
  const clean = path.startsWith('/') ? path : `/${path}`;
  let url = `/api/proxy${clean}`;

  if (query) {
    const params = Object.entries(query)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&');
    if (params) url += `?${params}`;
  }

  return url;
}

async function parse(response: Response) {
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const data = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    const message =
      (data && typeof data === 'object' && 'message' in data
        ? Array.isArray((data as { message: unknown }).message)
          ? ((data as { message: string[] }).message).join(', ')
          : String((data as { message: unknown }).message)
        : null) ||
      response.statusText ||
      'Request failed';

    // A dead session should land the user on the login screen rather than
    // leaving a half-rendered dashboard behind.
    if (response.status === 401 && typeof window !== 'undefined') {
      const next = encodeURIComponent(window.location.pathname);
      window.location.href = `/login?reason=expired&next=${next}`;
    }

    throw new ApiError(message, response.status, data);
  }

  return data;
}

export const api = {
  get: async <T = unknown>(path: string, query?: Query): Promise<T> => {
    const res = await fetch(buildPath(path, query), {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    return (await parse(res)) as T;
  },

  post: async <T = unknown>(path: string, body?: unknown): Promise<T> => {
    const res = await fetch(buildPath(path), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body ?? {}),
    });
    return (await parse(res)) as T;
  },

  put: async <T = unknown>(path: string, body?: unknown): Promise<T> => {
    const res = await fetch(buildPath(path), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body ?? {}),
    });
    return (await parse(res)) as T;
  },

  delete: async <T = unknown>(path: string): Promise<T> => {
    const res = await fetch(buildPath(path), {
      method: 'DELETE',
      headers: { Accept: 'application/json' },
    });
    return (await parse(res)) as T;
  },
};

/** Turn any thrown value into something safe to show in the UI. */
export function errorMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return fallback;
}
