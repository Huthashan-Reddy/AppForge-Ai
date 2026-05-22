import { NextRequest, NextResponse } from 'next/server';
import { registerUser, loginUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, email, password, name } = body;

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email and password are required' }, { status: 400 });
    }

    if (action === 'register') {
      const result = await registerUser(email, password, name || email.split('@')[0]);
      return NextResponse.json(result, { status: result.success ? 201 : 400 });
    }

    // Default to login
    const result = await loginUser(email, password);
    return NextResponse.json(result, { status: result.success ? 200 : 401 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Auth error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
