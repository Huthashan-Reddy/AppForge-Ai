import { NextRequest, NextResponse } from 'next/server';
import { extractToken, getUserFromToken } from '@/lib/auth';
import getDb from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { parseConfig, validateEntityData, type EntityConfig } from '@/lib/config-engine';

function requireAuth(req: NextRequest) {
  const token = extractToken(req.headers.get('authorization'));
  if (!token) return null;
  return getUserFromToken(token);
}

type Params = { params: Promise<{ appId: string; entity: string }> };

function getAppConfig(db: ReturnType<typeof getDb>, appId: string, userId: string) {
  const app = db.prepare('SELECT config FROM apps WHERE id = ? AND user_id = ?').get(appId, userId) as { config: string } | undefined;
  if (!app) return null;
  return parseConfig(JSON.parse(app.config)).config;
}

// GET /api/apps/[appId]/data/[entity] — list records
export async function GET(req: NextRequest, { params }: Params) {
  const user = requireAuth(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { appId, entity } = await params;
  const db = getDb();
  const config = getAppConfig(db, appId, user.id);
  if (!config) return NextResponse.json({ error: 'App not found' }, { status: 404 });

  const entityConfig = config.entities.find(e => e.name === entity);
  if (!entityConfig) return NextResponse.json({ error: `Entity "${entity}" not found` }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
  const search = searchParams.get('search') || '';
  const sortBy = searchParams.get('sortBy') || 'created_at';
  const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'ASC' : 'DESC';

  let whereClause = 'app_id = ? AND entity_name = ?';
  const queryParams: unknown[] = [appId, entity];

  if (search) {
    whereClause += ' AND data LIKE ?';
    queryParams.push(`%${search}%`);
  }

  const countResult = db.prepare(`SELECT COUNT(*) as total FROM app_data WHERE ${whereClause}`).get(...queryParams) as { total: number };
  const rows = db.prepare(
    `SELECT id, data, created_at, updated_at FROM app_data WHERE ${whereClause} ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`
  ).all(...queryParams, limit, (page - 1) * limit) as { id: string; data: string; created_at: string; updated_at: string }[];

  const records = rows.map(r => ({ id: r.id, ...JSON.parse(r.data), _created_at: r.created_at, _updated_at: r.updated_at }));

  return NextResponse.json({
    success: true,
    records,
    pagination: { page, limit, total: countResult.total, totalPages: Math.ceil(countResult.total / limit) },
    entity: entityConfig,
  });
}

// POST /api/apps/[appId]/data/[entity] — create record
export async function POST(req: NextRequest, { params }: Params) {
  const user = requireAuth(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { appId, entity } = await params;
  const db = getDb();
  const config = getAppConfig(db, appId, user.id);
  if (!config) return NextResponse.json({ error: 'App not found' }, { status: 404 });

  const entityConfig = config.entities.find(e => e.name === entity);
  if (!entityConfig) return NextResponse.json({ error: `Entity "${entity}" not found` }, { status: 404 });

  try {
    const body = await req.json();
    const data = body.data || body;

    // Fill defaults for missing fields
    const filled: Record<string, unknown> = {};
    for (const field of entityConfig.fields) {
      filled[field.name] = data[field.name] !== undefined ? data[field.name] : field.default ?? '';
    }
    // Keep any extra fields
    for (const key of Object.keys(data)) {
      if (filled[key] === undefined) filled[key] = data[key];
    }

    const validation = validateEntityData(entityConfig, filled);
    if (!validation.valid) {
      return NextResponse.json({ success: false, errors: validation.errors }, { status: 400 });
    }

    const id = uuidv4();
    db.prepare('INSERT INTO app_data (id, app_id, entity_name, data, created_by) VALUES (?, ?, ?, ?, ?)')
      .run(id, appId, entity, JSON.stringify(filled), user.id);

    // Create notification
    if (config.notifications?.enabled) {
      const displayValue = filled[entityConfig.displayField || entityConfig.fields[0]?.name] || id;
      db.prepare('INSERT INTO notifications (id, user_id, app_id, type, title, message) VALUES (?, ?, ?, ?, ?, ?)')
        .run(uuidv4(), user.id, appId, 'info', `${entityConfig.name} Created`, `"${displayValue}" was created.`);
    }

    return NextResponse.json({ success: true, record: { id, ...filled } }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Create failed';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

// PUT /api/apps/[appId]/data/[entity] — update record (expects ?id=...)
export async function PUT(req: NextRequest, { params }: Params) {
  const user = requireAuth(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { appId, entity } = await params;
  const { searchParams } = new URL(req.url);
  const recordId = searchParams.get('id');
  if (!recordId) return NextResponse.json({ error: 'Record ID required' }, { status: 400 });

  const db = getDb();
  const config = getAppConfig(db, appId, user.id);
  if (!config) return NextResponse.json({ error: 'App not found' }, { status: 404 });

  const entityConfig = config.entities.find(e => e.name === entity);
  if (!entityConfig) return NextResponse.json({ error: `Entity "${entity}" not found` }, { status: 404 });

  try {
    const body = await req.json();
    const data = body.data || body;

    const existing = db.prepare('SELECT data FROM app_data WHERE id = ? AND app_id = ? AND entity_name = ?').get(recordId, appId, entity) as { data: string } | undefined;
    if (!existing) return NextResponse.json({ error: 'Record not found' }, { status: 404 });

    const merged = { ...JSON.parse(existing.data), ...data };
    const validation = validateEntityData(entityConfig, merged);
    if (!validation.valid) {
      return NextResponse.json({ success: false, errors: validation.errors }, { status: 400 });
    }

    db.prepare('UPDATE app_data SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(JSON.stringify(merged), recordId);

    return NextResponse.json({ success: true, record: { id: recordId, ...merged } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Update failed';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

// DELETE /api/apps/[appId]/data/[entity] — delete record (expects ?id=...)
export async function DELETE(req: NextRequest, { params }: Params) {
  const user = requireAuth(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { appId, entity } = await params;
  const { searchParams } = new URL(req.url);
  const recordId = searchParams.get('id');
  if (!recordId) return NextResponse.json({ error: 'Record ID required' }, { status: 400 });

  const db = getDb();
  const config = getAppConfig(db, appId, user.id);
  if (!config) return NextResponse.json({ error: 'App not found' }, { status: 404 });

  db.prepare('DELETE FROM app_data WHERE id = ? AND app_id = ? AND entity_name = ?').run(recordId, appId, entity);

  return NextResponse.json({ success: true });
}
