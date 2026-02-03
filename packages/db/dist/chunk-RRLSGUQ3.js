// src/client.ts
import { Pool } from "pg";
var pool = null;
function getDbPool() {
  if (pool) {
    return pool;
  }
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required");
  }
  pool = new Pool({ connectionString });
  return pool;
}
async function closeDbPool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

export {
  getDbPool,
  closeDbPool
};
