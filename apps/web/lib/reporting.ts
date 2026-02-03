import { getPool } from "./db";

export type ReportPayload = {
  repository: {
    owner: string;
    name: string;
    repo_id: string;
  };
  issues: Array<Record<string, unknown>>;
  pull_requests: Array<Record<string, unknown>>;
  discussions: Array<Record<string, unknown>>;
  stats: {
    issue_count: number;
    pr_count: number;
    discussion_count: number;
    last_updated_at: string | null;
  };
};

function mapIssuePayload(raw: any): Record<string, unknown> {
  return {
    id: raw?.id ?? null,
    number: raw?.number ?? null,
    title: raw?.title ?? null,
    state: raw?.state ?? null,
    url: raw?.url ?? null,
    author: raw?.author?.login ?? null,
    createdAt: raw?.createdAt ?? null,
    updatedAt: raw?.updatedAt ?? null,
    labels: raw?.labels?.nodes?.map((l: any) => l.name) ?? [],
    commentCount: raw?.comments?.totalCount ?? null,
    body: raw?.body ?? null
  };
}

function mapPrPayload(raw: any): Record<string, unknown> {
  return {
    id: raw?.id ?? null,
    number: raw?.number ?? null,
    title: raw?.title ?? null,
    state: raw?.state ?? null,
    url: raw?.url ?? null,
    author: raw?.author?.login ?? null,
    createdAt: raw?.createdAt ?? null,
    updatedAt: raw?.updatedAt ?? null,
    labels: raw?.labels?.nodes?.map((l: any) => l.name) ?? [],
    commentCount: raw?.comments?.totalCount ?? null,
    body: raw?.body ?? null
  };
}

function mapDiscussionPayload(raw: any): Record<string, unknown> {
  return {
    id: raw?.id ?? null,
    number: raw?.number ?? null,
    title: raw?.title ?? null,
    url: raw?.url ?? null,
    author: raw?.author?.login ?? null,
    createdAt: raw?.createdAt ?? null,
    updatedAt: raw?.updatedAt ?? null,
    labels: raw?.labels?.nodes?.map((l: any) => l.name) ?? [],
    commentCount: raw?.comments?.totalCount ?? null,
    body: raw?.body ?? null
  };
}

export async function buildReportPayload(repoId: string, owner: string, name: string): Promise<ReportPayload> {
  const pool = getPool();
  const issues = await pool.query(
    `SELECT raw_payload, updated_at FROM github_issues WHERE repo_id = $1 ORDER BY updated_at DESC`,
    [repoId],
  );
  const prs = await pool.query(
    `SELECT raw_payload, updated_at FROM github_pull_requests WHERE repo_id = $1 ORDER BY updated_at DESC`,
    [repoId],
  );
  const discussions = await pool.query(
    `SELECT raw_payload, updated_at FROM github_discussions WHERE repo_id = $1 ORDER BY updated_at DESC`,
    [repoId],
  );

  const lastUpdated = [
    issues.rows[0]?.updated_at,
    prs.rows[0]?.updated_at,
    discussions.rows[0]?.updated_at,
  ].filter(Boolean).sort().pop() ?? null;

  return {
    repository: { owner, name, repo_id: repoId },
    issues: issues.rows.map((row: any) => mapIssuePayload(row.raw_payload)),
    pull_requests: prs.rows.map((row: any) => mapPrPayload(row.raw_payload)),
    discussions: discussions.rows.map((row: any) => mapDiscussionPayload(row.raw_payload)),
    stats: {
      issue_count: issues.rowCount ?? issues.rows.length,
      pr_count: prs.rowCount ?? prs.rows.length,
      discussion_count: discussions.rowCount ?? discussions.rows.length,
      last_updated_at: lastUpdated ? new Date(lastUpdated).toISOString() : null,
    },
  };
}
