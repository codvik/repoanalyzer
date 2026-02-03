CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ingestion_cursors_set_updated_at ON ingestion_cursors;

CREATE TRIGGER ingestion_cursors_set_updated_at
BEFORE UPDATE ON ingestion_cursors
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_timestamp();
