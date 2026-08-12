import { NextRequest } from 'next/server';
import { authPublic } from '@/lib/auth-route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (
    !body ||
    typeof body.email !== 'string' ||
    typeof body.code !== 'string' ||
    typeof body.newPassword !== 'string'
  ) {
    return new Response(
      JSON.stringify({ message: 'Email, code and new password are required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }
  return authPublic('/auth/reset-password', {
    email: body.email,
    code: body.code,
    newPassword: body.newPassword,
  });
}
