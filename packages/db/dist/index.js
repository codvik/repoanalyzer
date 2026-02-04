import {
  closeDbPool,
  getDbPool
} from "./chunk-RRLSGUQ3.js";

// src/ingestion-cursor-repository.ts
var BASE_SELECT = `
  SELECT
    repo_id,
    entity_type,
    cursor,
    last_synced_at
  FROM ingestion_cursors
`;
var IngestionCursorRepository = class {
  db;
  constructor(db) {
    this.db = db;
  }
  async getByRepoAndEntity(repoId, entityType) {
    const result = await this.db.query(
      `${BASE_SELECT}
       WHERE repo_id = $1 AND entity_type = $2
       LIMIT 1`,
      [repoId, entityType]
    );
    if (result.rowCount === 0) {
      return null;
    }
    return this.mapRow(result.rows[0]);
  }
  async upsertAfterPage(input) {
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
      [repoId, entityType, cursor, lastSyncedAt]
    );
    return this.mapRow(result.rows[0]);
  }
  mapRow(row) {
    return {
      repoId: row.repo_id,
      entityType: row.entity_type,
      cursor: row.cursor,
      lastSyncedAt: row.last_synced_at
    };
  }
};

// src/ingestion-cursor-service.ts
var IngestionCursorService = class {
  repo;
  constructor(repo) {
    this.repo = repo;
  }
  async loadCursor(repoId, entityType) {
    return this.repo.getByRepoAndEntity(repoId, entityType);
  }
  async persistCursorAfterPage(input) {
    return this.repo.upsertAfterPage(input);
  }
};

// src/issue-repository.ts
var IssueRepository = class {
  db;
  constructor(db) {
    this.db = db;
  }
  async upsertIssues(issues) {
    if (issues.length === 0) {
      return;
    }
    const client = "connect" in this.db ? await this.db.connect() : this.db;
    const shouldRelease = "connect" in this.db;
    const values = [];
    const placeholders = [];
    for (const issue of issues) {
      const offset = values.length;
      placeholders.push(
        `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10})`
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
        issue.rawPayload
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
};

// src/pull-request-repository.ts
var PullRequestRepository = class {
  db;
  constructor(db) {
    this.db = db;
  }
  async upsertPullRequests(items) {
    if (items.length === 0) {
      return;
    }
    const client = "connect" in this.db ? await this.db.connect() : this.db;
    const shouldRelease = "connect" in this.db;
    const values = [];
    const placeholders = [];
    for (const pr of items) {
      const offset = values.length;
      placeholders.push(
        `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10})`
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
        pr.rawPayload
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
};

// src/discussion-repository.ts
var DiscussionRepository = class {
  db;
  constructor(db) {
    this.db = db;
  }
  async upsertDiscussions(items) {
    if (items.length === 0) {
      return;
    }
    const client = "connect" in this.db ? await this.db.connect() : this.db;
    const shouldRelease = "connect" in this.db;
    const values = [];
    const placeholders = [];
    for (const discussion of items) {
      const offset = values.length;
      placeholders.push(
        `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10})`
      );
      values.push(
        discussion.repoId,
        discussion.discussionId,
        discussion.number,
        discussion.title,
        discussion.state,
        discussion.url,
        discussion.authorLogin,
        discussion.createdAt,
        discussion.updatedAt,
        discussion.rawPayload
      );
    }
    const sql = `
      INSERT INTO github_discussions (
        repo_id,
        discussion_id,
        discussion_number,
        title,
        state,
        url,
        author_login,
        created_at,
        updated_at,
        raw_payload
      )
      VALUES ${placeholders.join(", ")}
      ON CONFLICT (repo_id, discussion_id)
      DO UPDATE SET
        discussion_number = EXCLUDED.discussion_number,
        title = EXCLUDED.title,
        state = EXCLUDED.state,
        url = EXCLUDED.url,
        author_login = EXCLUDED.author_login,
        created_at = EXCLUDED.created_at,
        updated_at = GREATEST(github_discussions.updated_at, EXCLUDED.updated_at),
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
};

// src/document-repository.ts
var DocumentRepository = class {
  db;
  constructor(db) {
    this.db = db;
  }
  async upsertDocuments(items) {
    if (items.length === 0) {
      return;
    }
    const client = "connect" in this.db ? await this.db.connect() : this.db;
    const shouldRelease = "connect" in this.db;
    const values = [];
    const placeholders = [];
    for (const doc of items) {
      const offset = values.length;
      placeholders.push(
        `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7})`
      );
      values.push(
        doc.docId,
        doc.source,
        doc.type,
        doc.repoId,
        doc.itemId,
        doc.payload,
        doc.updatedAt
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
};

// src/issue-comment-repository.ts
var IssueCommentRepository = class {
  db;
  constructor(db) {
    this.db = db;
  }
  async upsertComments(items) {
    if (items.length === 0) return;
    const client = "connect" in this.db ? await this.db.connect() : this.db;
    const shouldRelease = "connect" in this.db;
    const values = [];
    const placeholders = [];
    for (const item of items) {
      const offset = values.length;
      placeholders.push(
        `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8})`
      );
      values.push(
        item.repoId,
        item.issueId,
        item.commentId,
        item.authorLogin,
        item.body,
        item.createdAt,
        item.updatedAt,
        item.rawPayload
      );
    }
    const sql = `
      INSERT INTO github_issue_comments (
        repo_id,
        issue_id,
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
        issue_id = EXCLUDED.issue_id,
        author_login = EXCLUDED.author_login,
        body = EXCLUDED.body,
        created_at = EXCLUDED.created_at,
        updated_at = GREATEST(github_issue_comments.updated_at, EXCLUDED.updated_at),
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
};

// src/pull-request-comment-repository.ts
var PullRequestCommentRepository = class {
  db;
  constructor(db) {
    this.db = db;
  }
  async upsertComments(items) {
    if (items.length === 0) return;
    const client = "connect" in this.db ? await this.db.connect() : this.db;
    const shouldRelease = "connect" in this.db;
    const values = [];
    const placeholders = [];
    for (const item of items) {
      const offset = values.length;
      placeholders.push(
        `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8})`
      );
      values.push(
        item.repoId,
        item.pullRequestId,
        item.commentId,
        item.authorLogin,
        item.body,
        item.createdAt,
        item.updatedAt,
        item.rawPayload
      );
    }
    const sql = `
      INSERT INTO github_pull_request_comments (
        repo_id,
        pull_request_id,
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
        pull_request_id = EXCLUDED.pull_request_id,
        author_login = EXCLUDED.author_login,
        body = EXCLUDED.body,
        created_at = EXCLUDED.created_at,
        updated_at = GREATEST(github_pull_request_comments.updated_at, EXCLUDED.updated_at),
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
};

// src/discussion-comment-repository.ts
var DiscussionCommentRepository = class {
  db;
  constructor(db) {
    this.db = db;
  }
  async upsertComments(items) {
    if (items.length === 0) return;
    const client = "connect" in this.db ? await this.db.connect() : this.db;
    const shouldRelease = "connect" in this.db;
    const values = [];
    const placeholders = [];
    for (const item of items) {
      const offset = values.length;
      placeholders.push(
        `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8})`
      );
      values.push(
        item.repoId,
        item.discussionId,
        item.commentId,
        item.authorLogin,
        item.body,
        item.createdAt,
        item.updatedAt,
        item.rawPayload
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
};

// src/locks.ts
function hashToBigInt(value) {
  let hash = 0n;
  for (let i = 0; i < value.length; i += 1) {
    hash = hash * 31n + BigInt(value.charCodeAt(i)) & 0x7fffffffffffffffn;
  }
  return hash;
}
async function withAdvisoryLock(db, key, fn) {
  const lockKey = hashToBigInt(key);
  await db.query("SELECT pg_advisory_lock($1)", [lockKey.toString()]);
  try {
    return await fn();
  } finally {
    await db.query("SELECT pg_advisory_unlock($1)", [lockKey.toString()]);
  }
}
export {
  DiscussionCommentRepository,
  DiscussionRepository,
  DocumentRepository,
  IngestionCursorRepository,
  IngestionCursorService,
  IssueCommentRepository,
  IssueRepository,
  PullRequestCommentRepository,
  PullRequestRepository,
  closeDbPool,
  getDbPool,
  withAdvisoryLock
};
