import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken, extractToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const token = extractToken(req.headers.get('authorization'));
  if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  
  const user = getUserFromToken(token);
  if (!user) return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
  
  return NextResponse.json({ success: true, user });
}
