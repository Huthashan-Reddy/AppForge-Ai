import { NextRequest, NextResponse } from 'next/server';
import { extractToken, getUserFromToken } from '@/lib/auth';
import getDb from '@/lib/db';

function requireAuth(req: NextRequest) {
  const token = extractToken(req.headers.get('authorization'));
  if (!token) return null;
  return getUserFromToken(token);
}

// GET — list user notifications
export async function GET(req: NextRequest) {
  const user = requireAuth(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const notifications = db.prepare(
    'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50'
  ).all(user.id);

  return NextResponse.json({ success: true, notifications });
}

// PUT — mark as read
export async function PUT(req: NextRequest) {
  const user = requireAuth(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await req.json();
  const db = getDb();

  if (id === 'all') {
    db.prepare('UPDATE notifications SET read = 1 WHERE user_id = ?').run(user.id);
  } else if (id) {
    db.prepare('UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?').run(id, user.id);
  }

  return NextResponse.json({ success: true });
}
