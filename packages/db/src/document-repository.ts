import type { Pool, PoolClient } from "pg";
import type { DocumentUpsertInput } from "./types";

export class DocumentRepository {
  private readonly db: Pool | PoolClient;

  constructor(db: Pool | PoolClient) {
    this.db = db;
  }

  async upsertDocuments(items: DocumentUpsertInput[]): Promise<void> {
    if (items.length === 0) {
      return;
    }

    const client = "connect" in this.db ? await this.db.connect() : this.db;
    const shouldRelease = "connect" in this.db;

    const values: unknown[] = [];
    const placeholders: string[] = [];

    for (const doc of items) {
      const offset = values.length;
      placeholders.push(
        `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7})`,
      );
      values.push(
        doc.docId,
        doc.source,
        doc.type,
        doc.repoId,
        doc.itemId,
        doc.payload,
        doc.updatedAt,
      );
    }

    const sql = `
      INSERT INTO ai_documents (
        doc_id,
        source,
        type,
        repo_id,
        item_id,
        payload,
        updated_at
      )
      VALUES ${placeholders.join(", ")}
      ON CONFLICT (doc_id)
      DO UPDATE SET
        source = EXCLUDED.source,
        type = EXCLUDED.type,
        repo_id = EXCLUDED.repo_id,
        item_id = EXCLUDED.item_id,
        payload = EXCLUDED.payload,
        updated_at = EXCLUDED.updated_at
    `;

    try {
      await client.query("BEGIN");
      await client.query(sql, values);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      if (shouldRelease) {
        client.release();
      }
    }
  }
}
