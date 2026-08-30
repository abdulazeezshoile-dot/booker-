/**
 * Authenticated API proxy.
 *
 * The browser never holds the JWT: it calls /api/proxy/<backend-path>, and this
 * handler re-attaches the httpOnly session cookie as a Bearer token before
 * forwarding to NestJS. 401 responses are treated as a dead session, so the
 * cookie is cleared and the client's api.ts bounces the user to /login.
 */
import { NextRequest, NextResponse } from 'next/server';
import { apiBaseUrl, cookieOptions, getToken, SESSION_COOKIE, SESSION_MAX_AGE } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function clearSession(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, '', {
    ...cookieOptions(0),
    maxAge: 0,
  });
  return response;
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxy(req, ctx);
}
export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxy(req, ctx);
}
export async function PUT(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxy(req, ctx);
}
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxy(req, ctx);
}
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxy(req, ctx);
}
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204 });
}

async function proxy(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const backendPath = '/' + path.join('/');
  const search = req.nextUrl.search || '';
  const url = `${apiBaseUrl()}${backendPath}${search}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
  };
  const contentType = req.headers.get('content-type');
  if (contentType) headers['Content-Type'] = contentType;

  let body: ArrayBuffer | undefined;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    body = await req.arrayBuffer();
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: req.method,
      headers,
      body: body && body.byteLength > 0 ? body : undefined,
      cache: 'no-store',
    });
  } catch (err) {
    return NextResponse.json(
      { message: err instanceof Error ? err.message : 'Could not reach the API' },
      { status: 502 },
    );
  }

  const resBody = await response.arrayBuffer();
  const next = new NextResponse(resBody, {
    status: response.status,
    headers: {
      'Content-Type': response.headers.get('content-type') || 'application/json',
    },
  });

  if (response.status === 401) {
    return clearSession(next);
  }

  return next;
}
