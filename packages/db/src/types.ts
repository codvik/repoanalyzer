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

export type PullRequestUpsertInput = {
  repoId: string;
  pullRequestId: string;
  pullRequestNumber: number;
  title: string;
  state: string;
  url: string;
  authorLogin: string | null;
  createdAt: Date;
  updatedAt: Date;
  rawPayload: unknown;
};

export type DiscussionUpsertInput = {
  repoId: string;
  discussionId: string;
  number: number;
  title: string;
  state: string;
  url: string;
  authorLogin: string | null;
  createdAt: Date;
  updatedAt: Date;
  rawPayload: unknown;
};

export type DocumentUpsertInput = {
  docId: string;
  source: string;
  type: string;
  repoId: string;
  itemId: string;
  payload: unknown;
  updatedAt: Date;
};

export type IssueCommentUpsertInput = {
  repoId: string;
  issueId: string;
  commentId: string;
  authorLogin: string | null;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  rawPayload: unknown;
};

export type PullRequestCommentUpsertInput = {
  repoId: string;
  pullRequestId: string;
  commentId: string;
  authorLogin: string | null;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  rawPayload: unknown;
};

export type DiscussionCommentUpsertInput = {
  repoId: string;
  discussionId: string;
  commentId: string;
  authorLogin: string | null;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  rawPayload: unknown;
};
