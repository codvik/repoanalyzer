CREATE TABLE IF NOT EXISTS github_oauth_tokens (
  github_user_id BIGINT PRIMARY KEY,
  login TEXT,
  access_token TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS github_sessions (
  session_id TEXT PRIMARY KEY,
  github_user_id BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS github_sessions_user_idx
  ON github_sessions (github_user_id, expires_at DESC);
