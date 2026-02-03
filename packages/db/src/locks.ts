import type { Pool, PoolClient } from "pg";

function hashToBigInt(value: string): bigint {
  let hash = 0n;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31n + BigInt(value.charCodeAt(i))) & 0x7fffffffffffffffn;
  }
  return hash;
}

export async function withAdvisoryLock<T>(
  db: Pool | PoolClient,
  key: string,
  fn: () => Promise<T>,
): Promise<T> {
  const lockKey = hashToBigInt(key);
  await db.query("SELECT pg_advisory_lock($1)", [lockKey.toString()]);
  try {
    return await fn();
  } finally {
    await db.query("SELECT pg_advisory_unlock($1)", [lockKey.toString()]);
  }
}
