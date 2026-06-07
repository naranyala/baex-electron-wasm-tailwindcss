import initSqlJs, { type SqlJsStatic, type Database } from 'sql.js';
import { SEED_SQL } from './seed.js';

let SQL: SqlJsStatic | null = null;
let db: Database | null = null;

export async function initDatabase(): Promise<string> {
  if (!SQL) {
    SQL = await initSqlJs({
      locateFile: () => `/sql-wasm.wasm`,
    });
  }
  db = new SQL.Database();
  db.run('PRAGMA journal_mode=WAL');
  return 'In-memory database initialized successfully';
}

export function seedDatabase(): string {
  if (!db) throw new Error('Database not initialized. Call initDatabase first.');
  db.run('BEGIN');
  try {
    for (const statement of SEED_SQL.split(';')) {
      const trimmed = statement.trim();
      if (trimmed) {
        db.run(trimmed);
      }
    }
    db.run('COMMIT');
  } catch (e) {
    db.run('ROLLBACK');
    throw e;
  }
  return 'Relational demo database seeded successfully';
}

export function executeSql(sql: string, _params: any[]): string {
  if (!db) throw new Error('Database not initialized. Call initDatabase first.');
  db.run(sql, _params);
  const changes = db.getRowsModified();
  return `Query executed successfully (${changes} rows affected)`;
}

export function querySql(sql: string, _params: any[]): any[] {
  if (!db) throw new Error('Database not initialized. Call initDatabase first.');
  const stmt = db.prepare(sql);
  if (_params.length > 0) {
    stmt.bind(_params);
  }
  const results: any[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    results.push(row);
  }
  stmt.free();
  return results;
}
