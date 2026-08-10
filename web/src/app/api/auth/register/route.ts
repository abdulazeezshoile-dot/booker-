import { NextRequest } from 'next/server';
import { authLogin } from '@/lib/auth-route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (
    !body ||
    typeof body.name !== 'string' ||
    typeof body.email !== 'string' ||
    typeof body.password !== 'string'
  ) {
    return new Response(
      JSON.stringify({ message: 'Name, email and password are required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const result = await authLogin('/auth/register', {
    name: body.name,
    email: body.email,
    phone: body.phone || undefined,
    password: body.password,
  });

  // Registration does not log the user in; the returned body is just the user.
  // Mirror the mobile flow: keep the session cookie but let the client route to
  // /verify-email using the response's requiresEmailVerification signal.
  const data = await result.json().catch(() => null);
  if (result.ok && data && !data.access_token) {
    return new Response(
      JSON.stringify({ ...data, requiresEmailVerification: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  }
  return result;
}
