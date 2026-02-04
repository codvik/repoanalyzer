import type { Pool, PoolClient } from "pg";
import type { DiscussionCommentUpsertInput } from "./types";

export class DiscussionCommentRepository {
  private readonly db: Pool | PoolClient;

  constructor(db: Pool | PoolClient) {
    this.db = db;
  }

  async upsertComments(items: DiscussionCommentUpsertInput[]): Promise<void> {
    if (items.length === 0) return;

    const client = "connect" in this.db ? await this.db.connect() : this.db;
    const shouldRelease = "connect" in this.db;

    const values: unknown[] = [];
    const placeholders: string[] = [];

    for (const item of items) {
      const offset = values.length;
      placeholders.push(
        `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8})`,
      );
      values.push(
        item.repoId,
        item.discussionId,
        item.commentId,
        item.authorLogin,
        item.body,
        item.createdAt,
        item.updatedAt,
        item.rawPayload,
      );
    }

    const sql = `
      INSERT INTO github_discussion_comments (
        repo_id,
        discussion_id,
        comment_id,
        author_login,
        body,
        created_at,
        updated_at,
        raw_payload
      )
      VALUES ${placeholders.join(", ")}
      ON CONFLICT (repo_id, comment_id)
      DO UPDATE SET
        discussion_id = EXCLUDED.discussion_id,
        author_login = EXCLUDED.author_login,
        body = EXCLUDED.body,
        created_at = EXCLUDED.created_at,
        updated_at = GREATEST(github_discussion_comments.updated_at, EXCLUDED.updated_at),
        raw_payload = EXCLUDED.raw_payload,
        updated_at_ingested = NOW()
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
