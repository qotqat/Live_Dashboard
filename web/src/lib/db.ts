import { mkdirSync } from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";

const DB_PATH =
  process.env.AUTH_DB_PATH || path.join(process.cwd(), "data", "auth.db");

mkdirSync(path.dirname(DB_PATH), { recursive: true });

const globalForDb = globalThis as unknown as {
  trendireDb?: Database.Database;
};

function createDatabase() {
  const database = new Database(DB_PATH);
  database.pragma("journal_mode = WAL");
  database.pragma("synchronous = NORMAL");
  database.pragma("foreign_keys = ON");
  database.pragma("busy_timeout = 5000");
  database.pragma("cache_size = -2000");

  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      username TEXT NOT NULL UNIQUE COLLATE NOCASE,
      tracking_id TEXT NOT NULL UNIQUE COLLATE NOCASE,
      name TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS sessions_expiry_idx ON sessions(expires_at);
  `);

  return database;
}

export const db = globalForDb.trendireDb ?? createDatabase();
globalForDb.trendireDb = db;
