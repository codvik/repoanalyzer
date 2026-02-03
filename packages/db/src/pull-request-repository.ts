import type { Pool, PoolClient } from "pg";
import type { PullRequestUpsertInput } from "./types";

export class PullRequestRepository {
  private readonly db: Pool | PoolClient;

  constructor(db: Pool | PoolClient) {
    this.db = db;
  }

  async upsertPullRequests(items: PullRequestUpsertInput[]): Promise<void> {
    if (items.length === 0) {
      return;
    }

    const client = "connect" in this.db ? await this.db.connect() : this.db;
    const shouldRelease = "connect" in this.db;

    const values: unknown[] = [];
    const placeholders: string[] = [];

    for (const pr of items) {
      const offset = values.length;
      placeholders.push(
        `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10})`,
      );
      values.push(
        pr.repoId,
        pr.pullRequestId,
        pr.pullRequestNumber,
        pr.title,
        pr.state,
        pr.url,
        pr.authorLogin,
        pr.createdAt,
        pr.updatedAt,
        pr.rawPayload,
      );
    }

    const sql = `
      INSERT INTO github_pull_requests (
        repo_id,
        pull_request_id,
        pull_request_number,
        title,
        state,
        url,
        author_login,
        created_at,
        updated_at,
        raw_payload
      )
      VALUES ${placeholders.join(", ")}
      ON CONFLICT (repo_id, pull_request_id)
      DO UPDATE SET
        pull_request_number = EXCLUDED.pull_request_number,
        title = EXCLUDED.title,
        state = EXCLUDED.state,
        url = EXCLUDED.url,
        author_login = EXCLUDED.author_login,
        created_at = EXCLUDED.created_at,
        updated_at = GREATEST(github_pull_requests.updated_at, EXCLUDED.updated_at),
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
