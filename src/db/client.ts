import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import * as schema from "./schema";

export const DB_PATH =
  process.env.DRISHTI_DB_PATH ?? path.join(process.cwd(), "data", "drishti.db");

type Db = BetterSQLite3Database<typeof schema>;

let cached: { db: Db; sqlite: Database.Database } | null = null;

/**
 * Single synchronous SQLite handle per process.
 * better-sqlite3 is fast enough that we do not need a pool.
 */
export function getDb() {
  if (cached) return cached;

  if (!fs.existsSync(DB_PATH)) {
    throw new Error(
      `Database not found at ${DB_PATH}. Run "npm run seed" to generate the demo dataset.`,
    );
  }

  const sqlite = new Database(DB_PATH, { readonly: false, fileMustExist: true });
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("synchronous = NORMAL");

  const db = drizzle(sqlite, { schema });
  cached = { db, sqlite };
  return cached;
}

export function getSqlite() {
  return getDb().sqlite;
}

export function dbExists(): boolean {
  return fs.existsSync(DB_PATH);
}

export function readMeta(key: string): string | null {
  const { sqlite } = getDb();
  const row = sqlite.prepare("SELECT value FROM seed_meta WHERE key = ?").get(key) as
    | { value: string }
    | undefined;
  return row?.value ?? null;
}
