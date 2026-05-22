import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import getDb from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'appforge-secret-key-change-in-production-2024';
const TOKEN_EXPIRY = '7d';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url: string;
  locale: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}

export async function registerUser(email: string, password: string, name: string): Promise<AuthResult> {
  try {
    const db = getDb();
    
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return { success: false, error: 'Email already registered' };
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const userId = uuidv4();
    
    db.prepare(
      'INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)'
    ).run(userId, email.toLowerCase().trim(), passwordHash, name);

    const user: User = {
      id: userId,
      email: email.toLowerCase().trim(),
      name,
      avatar_url: '',
      locale: 'en',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });

    // Store session
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    db.prepare(
      'INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)'
    ).run(sessionId, userId, token, expiresAt);

    return { success: true, user, token };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Registration failed';
    return { success: false, error: message };
  }
}

export async function loginUser(email: string, password: string): Promise<AuthResult> {
  try {
    const db = getDb();
    
    const row = db.prepare(
      'SELECT id, email, password_hash, name, avatar_url, locale, created_at, updated_at FROM users WHERE email = ?'
    ).get(email.toLowerCase().trim()) as (User & { password_hash: string }) | undefined;

    if (!row) {
      return { success: false, error: 'Invalid email or password' };
    }

    const valid = await bcrypt.compare(password, row.password_hash);
    if (!valid) {
      return { success: false, error: 'Invalid email or password' };
    }

    const user: User = {
      id: row.id,
      email: row.email,
      name: row.name,
      avatar_url: row.avatar_url,
      locale: row.locale,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });

    // Store session
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    db.prepare(
      'INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)'
    ).run(sessionId, user.id, token, expiresAt);

    return { success: true, user, token };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Login failed';
    return { success: false, error: message };
  }
}

export function verifyToken(token: string): { userId: string; email: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
    return decoded;
  } catch {
    return null;
  }
}

export function getUserFromToken(token: string): User | null {
  const decoded = verifyToken(token);
  if (!decoded) return null;

  const db = getDb();
  const row = db.prepare(
    'SELECT id, email, name, avatar_url, locale, created_at, updated_at FROM users WHERE id = ?'
  ).get(decoded.userId) as User | undefined;

  return row || null;
}

export function extractToken(authHeader: string | null): string | null {
  if (!authHeader) return null;
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return authHeader;
}

export function updateUserLocale(userId: string, locale: string): boolean {
  const db = getDb();
  const result = db.prepare('UPDATE users SET locale = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(locale, userId);
  return result.changes > 0;
}
