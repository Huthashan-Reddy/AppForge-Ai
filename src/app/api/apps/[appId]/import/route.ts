import { NextRequest, NextResponse } from 'next/server';
import { extractToken, getUserFromToken } from '@/lib/auth';
import getDb from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { parseConfig } from '@/lib/config-engine';
import Papa from 'papaparse';

function requireAuth(req: NextRequest) {
  const token = extractToken(req.headers.get('authorization'));
  if (!token) return null;
  return getUserFromToken(token);
}

type Params = { params: Promise<{ appId: string }> };

// POST /api/apps/[appId]/import — import CSV data
export async function POST(req: NextRequest, { params }: Params) {
  const user = requireAuth(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { appId } = await params;
  const db = getDb();

  const app = db.prepare('SELECT config FROM apps WHERE id = ? AND user_id = ?').get(appId, user.id) as { config: string } | undefined;
  if (!app) return NextResponse.json({ error: 'App not found' }, { status: 404 });

  try {
    const body = await req.json();
    const { csvData, entityName, columnMapping } = body;

    if (!csvData || !entityName) {
      return NextResponse.json({ error: 'csvData and entityName are required' }, { status: 400 });
    }

    const { config } = parseConfig(JSON.parse(app.config));
    const entity = config.entities.find(e => e.name === entityName);
    if (!entity) return NextResponse.json({ error: `Entity "${entityName}" not found` }, { status: 404 });

    // Parse CSV
    const parsed = Papa.parse(csvData, { header: true, skipEmptyLines: true, transformHeader: (h: string) => h.trim() });

    if (parsed.errors.length > 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'CSV parse errors', 
        details: parsed.errors.slice(0, 5) 
      }, { status: 400 });
    }

    const rows = parsed.data as Record<string, string>[];
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    const insertStmt = db.prepare(
      'INSERT INTO app_data (id, app_id, entity_name, data, created_by) VALUES (?, ?, ?, ?, ?)'
    );

    const transaction = db.transaction(() => {
      for (let i = 0; i < rows.length; i++) {
        try {
          const row = rows[i];
          const record: Record<string, unknown> = {};

          // Apply column mapping if provided, otherwise use direct mapping
          for (const field of entity.fields) {
            const csvColumn = columnMapping?.[field.name] || field.name;
            const value = row[csvColumn];

            if (value !== undefined && value !== '') {
              if (field.type === 'number') {
                record[field.name] = parseFloat(value) || 0;
              } else if (field.type === 'checkbox') {
                record[field.name] = ['true', '1', 'yes', 'on'].includes(value.toLowerCase());
              } else {
                record[field.name] = value;
              }
            } else {
              record[field.name] = field.default ?? '';
            }
          }

          insertStmt.run(uuidv4(), appId, entityName, JSON.stringify(record), user.id);
          imported++;
        } catch (err) {
          skipped++;
          errors.push(`Row ${i + 1}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }
    });

    transaction();

    // Notification
    db.prepare('INSERT INTO notifications (id, user_id, app_id, type, title, message) VALUES (?, ?, ?, ?, ?, ?)')
      .run(uuidv4(), user.id, appId, 'success', 'CSV Import Complete', `Imported ${imported} records into ${entityName}. ${skipped} skipped.`);

    return NextResponse.json({
      success: true,
      imported,
      skipped,
      total: rows.length,
      errors: errors.slice(0, 10),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Import failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
