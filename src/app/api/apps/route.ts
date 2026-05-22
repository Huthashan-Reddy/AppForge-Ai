import { NextRequest, NextResponse } from 'next/server';
import { extractToken, getUserFromToken } from '@/lib/auth';
import getDb from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { parseConfig } from '@/lib/config-engine';

function requireAuth(req: NextRequest) {
  const token = extractToken(req.headers.get('authorization'));
  if (!token) return null;
  return getUserFromToken(token);
}

// GET /api/apps — list user's apps
export async function GET(req: NextRequest) {
  const user = requireAuth(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const apps = db.prepare('SELECT id, name, description, config, status, icon, created_at, updated_at FROM apps WHERE user_id = ? ORDER BY updated_at DESC').all(user.id);
  
  return NextResponse.json({ 
    success: true, 
    apps: (apps as Record<string, unknown>[]).map(a => ({ ...a, config: JSON.parse(a.config as string) })) 
  });
}

// POST /api/apps — create a new app
export async function POST(req: NextRequest) {
  const user = requireAuth(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { config: rawConfig, name, description } = body;
    
    const { config, warnings } = parseConfig(rawConfig || {});
    const appId = uuidv4();
    const db = getDb();

    db.prepare(
      'INSERT INTO apps (id, user_id, name, description, config, status, icon) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(appId, user.id, name || config.name, description || config.description, JSON.stringify(config), 'active', config.icon || '🚀');

    // Create dynamic schemas for each entity
    for (const entity of config.entities) {
      db.prepare(
        'INSERT OR REPLACE INTO dynamic_schemas (id, app_id, entity_name, schema) VALUES (?, ?, ?, ?)'
      ).run(uuidv4(), appId, entity.name, JSON.stringify(entity));
    }

    // Add notification
    db.prepare(
      'INSERT INTO notifications (id, user_id, app_id, type, title, message) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(uuidv4(), user.id, appId, 'success', 'App Created', `"${config.name}" has been created successfully.`);

    return NextResponse.json({ success: true, app: { id: appId, name: config.name, config, warnings } }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create app';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
