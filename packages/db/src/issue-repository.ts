import type { Pool, PoolClient } from "pg";
import type { IssueUpsertInput } from "./types";

export class IssueRepository {
  private readonly db: Pool | PoolClient;

  constructor(db: Pool | PoolClient) {
    this.db = db;
  }

  async upsertIssues(issues: IssueUpsertInput[]): Promise<void> {
    if (issues.length === 0) {
      return;
    }

    const client = "connect" in this.db ? await this.db.connect() : this.db;
    const shouldRelease = "connect" in this.db;

    const values: unknown[] = [];
    const placeholders: string[] = [];

    for (const issue of issues) {
      const offset = values.length;
      placeholders.push(
        `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10})`,
      );
      values.push(
        issue.repoId,
        issue.issueId,
        issue.issueNumber,
        issue.title,
        issue.state,
        issue.url,
        issue.authorLogin,
        issue.createdAt,
        issue.updatedAt,
        issue.rawPayload,
      );
    }

    const sql = `
      INSERT INTO github_issues (
        repo_id,
        issue_id,
        issue_number,
        title,
        state,
        url,
        author_login,
        created_at,
        updated_at,
        raw_payload
      )
      VALUES ${placeholders.join(", ")}
      ON CONFLICT (repo_id, issue_id)
      DO UPDATE SET
        issue_number = EXCLUDED.issue_number,
        title = EXCLUDED.title,
        state = EXCLUDED.state,
        url = EXCLUDED.url,
        author_login = EXCLUDED.author_login,
        created_at = EXCLUDED.created_at,
        updated_at = GREATEST(github_issues.updated_at, EXCLUDED.updated_at),
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
