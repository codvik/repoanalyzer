import { getPool } from "./db";

export type IssueRow = {
  issue_id: string;
  issue_number: number;
  title: string;
  state: string;
  url: string;
  author_login: string | null;
  updated_at: string;
};

export type PullRequestRow = {
  pull_request_id: string;
  pull_request_number: number;
  title: string;
  state: string;
  url: string;
  author_login: string | null;
  updated_at: string;
};

export type DiscussionRow = {
  discussion_id: string;
  discussion_number: number;
  title: string;
  state: string;
  url: string;
  author_login: string | null;
  updated_at: string;
};

export async function listIssues(repoId: string): Promise<IssueRow[]> {
  const pool = getPool();
  const result = await pool.query(
    `
    SELECT issue_id, issue_number, title, state, url, author_login, updated_at
    FROM github_issues
    WHERE repo_id = $1
    ORDER BY updated_at DESC
    LIMIT 200
    `,
    [repoId],
  );
  return result.rows as IssueRow[];
}

export async function listPullRequests(repoId: string): Promise<PullRequestRow[]> {
  const pool = getPool();
  const result = await pool.query(
    `
    SELECT pull_request_id, pull_request_number, title, state, url, author_login, updated_at
    FROM github_pull_requests
    WHERE repo_id = $1
    ORDER BY updated_at DESC
    LIMIT 200
    `,
    [repoId],
  );
  return result.rows as PullRequestRow[];
}

export async function listDiscussions(repoId: string): Promise<DiscussionRow[]> {
  const pool = getPool();
  const result = await pool.query(
    `
    SELECT discussion_id, discussion_number, title, state, url, author_login, updated_at
    FROM github_discussions
    WHERE repo_id = $1
    ORDER BY updated_at DESC
    LIMIT 200
    `,
    [repoId],
  );
  return result.rows as DiscussionRow[];
}
