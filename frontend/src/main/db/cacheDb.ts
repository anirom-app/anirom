import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';

let db: ReturnType<typeof Database> | null = null;

export function initCacheDb() {
  if (db) return;
  const dbPath = path.join(app.getPath('userData'), 'tmdb_cache.db');
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS tmdb_cache (
      id TEXT PRIMARY KEY,
      data TEXT,
      updated_at INTEGER
    )
  `);
}

export function getCachedData(id: string, maxAgeMs = 7 * 24 * 60 * 60 * 1000): any | null {
  if (!db) initCacheDb();
  try {
    const row = db!.prepare('SELECT data, updated_at FROM tmdb_cache WHERE id = ?').get(id) as { data: string, updated_at: number } | undefined;
    if (row) {
      if (Date.now() - row.updated_at < maxAgeMs) {
        return JSON.parse(row.data);
      }
    }
    return null;
  } catch (error) {
    console.error('Cache DB get error:', error);
    return null;
  }
}

export function setCachedData(id: string, data: any): void {
  if (!db) initCacheDb();
  try {
    const stmt = db!.prepare('INSERT OR REPLACE INTO tmdb_cache (id, data, updated_at) VALUES (?, ?, ?)');
    stmt.run(id, JSON.stringify(data), Date.now());
  } catch (error) {
    console.error('Cache DB set error:', error);
  }
}
