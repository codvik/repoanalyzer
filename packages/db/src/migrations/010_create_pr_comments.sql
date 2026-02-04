CREATE TABLE IF NOT EXISTS github_pull_request_comments (
  repo_id TEXT NOT NULL,
  pull_request_id TEXT NOT NULL,
  comment_id TEXT NOT NULL,
  author_login TEXT,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  raw_payload JSONB NOT NULL,
  created_at_ingested TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at_ingested TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT github_pull_request_comments_pkey PRIMARY KEY (repo_id, comment_id)
);

CREATE INDEX IF NOT EXISTS github_pr_comments_pr_idx
  ON github_pull_request_comments (repo_id, pull_request_id, updated_at DESC);
