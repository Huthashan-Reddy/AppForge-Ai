import { NextRequest, NextResponse } from 'next/server';
import { extractToken, getUserFromToken } from '@/lib/auth';
import getDb from '@/lib/db';
import { parseConfig } from '@/lib/config-engine';
import { v4 as uuidv4 } from 'uuid';

function requireAuth(req: NextRequest) {
  const token = extractToken(req.headers.get('authorization'));
  if (!token) return null;
  return getUserFromToken(token);
}

type Params = { params: Promise<{ appId: string }> };

// GET /api/apps/[appId]
export async function GET(req: NextRequest, { params }: Params) {
  const user = requireAuth(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { appId } = await params;
  const db = getDb();
  const app = db.prepare('SELECT * FROM apps WHERE id = ? AND user_id = ?').get(appId, user.id) as Record<string, unknown> | undefined;
  if (!app) return NextResponse.json({ error: 'App not found' }, { status: 404 });

  return NextResponse.json({ success: true, app: { ...app, config: JSON.parse(app.config as string) } });
}

// PUT /api/apps/[appId] — update config
export async function PUT(req: NextRequest, { params }: Params) {
  const user = requireAuth(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { appId } = await params;
  const db = getDb();
  const existing = db.prepare('SELECT id FROM apps WHERE id = ? AND user_id = ?').get(appId, user.id);
  if (!existing) return NextResponse.json({ error: 'App not found' }, { status: 404 });

  try {
    const body = await req.json();
    const { config: rawConfig, name, description, status } = body;

    if (rawConfig) {
      const { config, warnings } = parseConfig(rawConfig);
      db.prepare('UPDATE apps SET config = ?, name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(JSON.stringify(config), name || config.name, description || config.description, appId);

      // Sync schemas
      for (const entity of config.entities) {
        db.prepare('INSERT OR REPLACE INTO dynamic_schemas (id, app_id, entity_name, schema) VALUES (?, ?, ?, ?)')
          .run(uuidv4(), appId, entity.name, JSON.stringify(entity));
      }

      return NextResponse.json({ success: true, config, warnings });
    }

    if (status) {
      db.prepare('UPDATE apps SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, appId);
    }
    if (name) {
      db.prepare('UPDATE apps SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(name, appId);
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Update failed';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

// DELETE /api/apps/[appId]
export async function DELETE(req: NextRequest, { params }: Params) {
  const user = requireAuth(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { appId } = await params;
  const db = getDb();
  db.prepare('DELETE FROM app_data WHERE app_id = ?').run(appId);
  db.prepare('DELETE FROM dynamic_schemas WHERE app_id = ?').run(appId);
  db.prepare('DELETE FROM apps WHERE id = ? AND user_id = ?').run(appId, user.id);

  return NextResponse.json({ success: true });
}
