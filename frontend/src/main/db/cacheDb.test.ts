import { describe, it, expect, vi, beforeEach } from 'vitest';
import Database from 'better-sqlite3';

vi.mock('electron', () => ({
  app: {
    getPath: () => './',
  },
}));

// We test better-sqlite3 using in-memory database
describe('Cache DB (better-sqlite3)', () => {
  let db: ReturnType<typeof Database>;

  beforeEach(() => {
    db = new Database(':memory:');
    db.exec(`
      CREATE TABLE IF NOT EXISTS tmdb_cache (
        id TEXT PRIMARY KEY,
        data TEXT,
        updated_at INTEGER
      )
    `);
  });

  it('deve inserir e recuperar dados do cache em memória com sucesso', () => {
    const id = 'anime_123';
    const mockData = { name: 'Naruto', episodes: 220 };
    const now = Date.now();

    const insertStmt = db.prepare('INSERT OR REPLACE INTO tmdb_cache (id, data, updated_at) VALUES (?, ?, ?)');
    insertStmt.run(id, JSON.stringify(mockData), now);

    const row = db.prepare('SELECT data, updated_at FROM tmdb_cache WHERE id = ?').get(id) as { data: string; updated_at: number };
    
    expect(row).toBeDefined();
    expect(JSON.parse(row.data)).toEqual(mockData);
  });

  it('deve considerar o cache como nulo/expirado se a idade for superior a TTL', () => {
    const id = 'anime_old';
    const mockData = { name: 'Bleach' };
    const oldTimestamp = Date.now() - (10 * 24 * 60 * 60 * 1000); // 10 dias atrás

    const insertStmt = db.prepare('INSERT OR REPLACE INTO tmdb_cache (id, data, updated_at) VALUES (?, ?, ?)');
    insertStmt.run(id, JSON.stringify(mockData), oldTimestamp);

    const row = db.prepare('SELECT data, updated_at FROM tmdb_cache WHERE id = ?').get(id) as { data: string; updated_at: number };
    const maxAgeMs = 7 * 24 * 60 * 60 * 1000; // 7 dias

    const isExpired = Date.now() - row.updated_at > maxAgeMs;
    expect(isExpired).toBe(true);
  });
});
