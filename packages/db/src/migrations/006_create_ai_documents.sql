CREATE TABLE IF NOT EXISTS ai_documents (
  doc_id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  type TEXT NOT NULL,
  repo_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  payload JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS ai_documents_repo_idx
  ON ai_documents (repo_id, type, updated_at DESC);
