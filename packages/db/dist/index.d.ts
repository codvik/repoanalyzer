import { Pool, PoolClient } from 'pg';

type IngestionEntityType = string;
type IngestionCursor = {
    repoId: string;
    entityType: IngestionEntityType;
    cursor: string | null;
    lastSyncedAt: Date | null;
};
type UpsertIngestionCursorInput = {
    repoId: string;
    entityType: IngestionEntityType;
    cursor: string | null;
    lastSyncedAt?: Date | null;
};
type IssueUpsertInput = {
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
type PullRequestUpsertInput = {
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
type DiscussionUpsertInput = {
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
type DocumentUpsertInput = {
    docId: string;
    source: string;
    type: string;
    repoId: string;
    itemId: string;
    payload: unknown;
    updatedAt: Date;
};

declare class IngestionCursorRepository {
    private readonly db;
    constructor(db: Pool | PoolClient);
    getByRepoAndEntity(repoId: string, entityType: IngestionEntityType): Promise<IngestionCursor | null>;
    upsertAfterPage(input: UpsertIngestionCursorInput): Promise<IngestionCursor>;
    private mapRow;
}

declare class IngestionCursorService {
    private readonly repo;
    constructor(repo: IngestionCursorRepository);
    loadCursor(repoId: string, entityType: IngestionEntityType): Promise<IngestionCursor | null>;
    persistCursorAfterPage(input: UpsertIngestionCursorInput): Promise<IngestionCursor>;
}

declare class IssueRepository {
    private readonly db;
    constructor(db: Pool | PoolClient);
    upsertIssues(issues: IssueUpsertInput[]): Promise<void>;
}

declare class PullRequestRepository {
    private readonly db;
    constructor(db: Pool | PoolClient);
    upsertPullRequests(items: PullRequestUpsertInput[]): Promise<void>;
}

declare class DiscussionRepository {
    private readonly db;
    constructor(db: Pool | PoolClient);
    upsertDiscussions(items: DiscussionUpsertInput[]): Promise<void>;
}

declare class DocumentRepository {
    private readonly db;
    constructor(db: Pool | PoolClient);
    upsertDocuments(items: DocumentUpsertInput[]): Promise<void>;
}

declare function getDbPool(): Pool;
declare function closeDbPool(): Promise<void>;

declare function withAdvisoryLock<T>(db: Pool | PoolClient, key: string, fn: () => Promise<T>): Promise<T>;

export { DiscussionRepository, type DiscussionUpsertInput, DocumentRepository, type DocumentUpsertInput, type IngestionCursor, IngestionCursorRepository, IngestionCursorService, type IngestionEntityType, IssueRepository, type IssueUpsertInput, PullRequestRepository, type PullRequestUpsertInput, type UpsertIngestionCursorInput, closeDbPool, getDbPool, withAdvisoryLock };
