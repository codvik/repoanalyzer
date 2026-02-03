CREATE TABLE IF NOT EXISTS ingestion_cursors (
  repo_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  cursor TEXT,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ingestion_cursors_pkey PRIMARY KEY (repo_id, entity_type)
);

CREATE INDEX IF NOT EXISTS ingestion_cursors_repo_entity_idx
  ON ingestion_cursors (repo_id, entity_type);
