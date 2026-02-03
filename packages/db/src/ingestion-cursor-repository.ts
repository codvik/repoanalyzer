import type { Pool, PoolClient } from "pg";
import type {
  IngestionCursor,
  IngestionEntityType,
  UpsertIngestionCursorInput,
} from "./types";

const BASE_SELECT = `
  SELECT
    repo_id,
    entity_type,
    cursor,
    last_synced_at
  FROM ingestion_cursors
`;

export class IngestionCursorRepository {
  private readonly db: Pool | PoolClient;

  constructor(db: Pool | PoolClient) {
    this.db = db;
  }

  async getByRepoAndEntity(
    repoId: string,
    entityType: IngestionEntityType,
  ): Promise<IngestionCursor | null> {
    const result = await this.db.query(
      `${BASE_SELECT}
       WHERE repo_id = $1 AND entity_type = $2
       LIMIT 1`,
      [repoId, entityType],
    );

    if (result.rowCount === 0) {
      return null;
    }

    return this.mapRow(result.rows[0]);
  }

  async upsertAfterPage(
    input: UpsertIngestionCursorInput,
  ): Promise<IngestionCursor> {
    const { repoId, entityType, cursor, lastSyncedAt = null } = input;

    const result = await this.db.query(
      `
      INSERT INTO ingestion_cursors (
        repo_id,
        entity_type,
        cursor,
        last_synced_at
      )
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (repo_id, entity_type)
      DO UPDATE SET
        cursor = EXCLUDED.cursor,
        last_synced_at = CASE
          WHEN EXCLUDED.last_synced_at IS NULL THEN ingestion_cursors.last_synced_at
          ELSE GREATEST(
            COALESCE(ingestion_cursors.last_synced_at, EXCLUDED.last_synced_at),
            EXCLUDED.last_synced_at
          )
        END,
        updated_at = NOW()
      RETURNING repo_id, entity_type, cursor, last_synced_at
      `,
      [repoId, entityType, cursor, lastSyncedAt],
    );

    return this.mapRow(result.rows[0]);
  }

  private mapRow(row: {
    repo_id: string;
    entity_type: string;
    cursor: string | null;
    last_synced_at: Date | null;
  }): IngestionCursor {
    return {
      repoId: row.repo_id,
      entityType: row.entity_type,
      cursor: row.cursor,
      lastSyncedAt: row.last_synced_at,
    };
  }
}
