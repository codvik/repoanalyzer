CREATE TABLE IF NOT EXISTS github_pull_requests (
  repo_id TEXT NOT NULL,
  pull_request_id TEXT NOT NULL,
  pull_request_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  state TEXT NOT NULL,
  url TEXT NOT NULL,
  author_login TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  raw_payload JSONB NOT NULL,
  created_at_ingested TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at_ingested TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT github_pull_requests_pkey PRIMARY KEY (repo_id, pull_request_id)
);

CREATE INDEX IF NOT EXISTS github_pull_requests_repo_idx
  ON github_pull_requests (repo_id, updated_at DESC);
