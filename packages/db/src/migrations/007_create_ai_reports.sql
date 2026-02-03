CREATE TABLE IF NOT EXISTS ai_reports (
  id SERIAL PRIMARY KEY,
  repo_id TEXT NOT NULL,
  report_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ai_reports_repo_idx
  ON ai_reports (repo_id, created_at DESC);
