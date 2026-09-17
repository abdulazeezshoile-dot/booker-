import { NextRequest } from 'next/server';
import { authPublic } from '@/lib/auth-route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.email !== 'string') {
    return new Response(JSON.stringify({ message: 'Email is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return authPublic('/auth/forgot-password', { email: body.email });
}
