import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getDbPool, closeDbPool } from "./client";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_MIGRATIONS_DIR = path.join(__dirname, "migrations");
const SRC_MIGRATIONS_DIR = path.join(__dirname, "..", "src", "migrations");

async function ensureMigrationsTable(): Promise<void> {
  const db = getDbPool();
  await db.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function loadApplied(): Promise<Set<string>> {
  const db = getDbPool();
  const result = await db.query("SELECT id FROM schema_migrations");
  return new Set(result.rows.map((row) => row.id as string));
}

async function applyMigration(id: string, sql: string): Promise<void> {
  const db = getDbPool();
  await db.query("BEGIN");
  try {
    await db.query(sql);
    await db.query("INSERT INTO schema_migrations (id) VALUES ($1)", [id]);
    await db.query("COMMIT");
  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  }
}

async function run(): Promise<void> {
  await ensureMigrationsTable();
  const applied = await loadApplied();
  let migrationsDir = DIST_MIGRATIONS_DIR;
  try {
    await fs.access(migrationsDir);
  } catch {
    migrationsDir = SRC_MIGRATIONS_DIR;
  }

  const files = await fs.readdir(migrationsDir);
  const sorted = files.filter((file) => file.endsWith(".sql")).sort();

  for (const file of sorted) {
    if (applied.has(file)) {
      continue;
    }
    const sql = await fs.readFile(path.join(migrationsDir, file), "utf8");
    await applyMigration(file, sql);
  }
}

run()
  .then(() => closeDbPool())
  .catch((error) => {
    console.error(error);
    return closeDbPool().finally(() => process.exit(1));
  });
