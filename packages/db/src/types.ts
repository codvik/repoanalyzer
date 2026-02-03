export type IngestionEntityType = string;

export type IngestionCursor = {
  repoId: string;
  entityType: IngestionEntityType;
  cursor: string | null;
  lastSyncedAt: Date | null;
};

export type UpsertIngestionCursorInput = {
  repoId: string;
  entityType: IngestionEntityType;
  cursor: string | null;
  lastSyncedAt?: Date | null;
};

export type IssueUpsertInput = {
  repoId: string;
  issueId: string;
  issueNumber: number;
  title: string;
  state: string;
  url: string;
  authorLogin: string | null;
  createdAt: Date;
  updatedAt: Date;
  rawPayload: unknown;
};
