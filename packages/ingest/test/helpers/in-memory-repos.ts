import type { IngestionCursorService } from "../../../db/src/ingestion-cursor-service";
import type {
  IngestionCursor,
  IngestionEntityType,
  UpsertIngestionCursorInput,
  IssueUpsertInput,
} from "../../../db/src/types";

export class InMemoryCursorService implements IngestionCursorService {
  private readonly cursors = new Map<string, IngestionCursor>();

  async loadCursor(
    repoId: string,
    entityType: IngestionEntityType,
  ): Promise<IngestionCursor | null> {
    return this.cursors.get(`${repoId}:${entityType}`) ?? null;
  }

  async persistCursorAfterPage(
    input: UpsertIngestionCursorInput,
  ): Promise<IngestionCursor> {
    const key = `${input.repoId}:${input.entityType}`;
    const existing = this.cursors.get(key);
    const lastSyncedAt = this.mergeLastSyncedAt(
      existing?.lastSyncedAt ?? null,
      input.lastSyncedAt ?? null,
    );

    const cursor: IngestionCursor = {
      repoId: input.repoId,
      entityType: input.entityType,
      cursor: input.cursor,
      lastSyncedAt,
    };

    this.cursors.set(key, cursor);
    return cursor;
  }

  private mergeLastSyncedAt(
    current: Date | null,
    incoming: Date | null,
  ): Date | null {
    if (!current) {
      return incoming;
    }
    if (!incoming) {
      return current;
    }
    return incoming > current ? incoming : current;
  }
}

export class InMemoryIssueRepository {
  private readonly rows: IssueUpsertInput[] = [];

  async upsertIssues(issues: IssueUpsertInput[]): Promise<void> {
    for (const issue of issues) {
      const index = this.rows.findIndex(
        (row) => row.repoId === issue.repoId && row.issueId === issue.issueId,
      );

      if (index === -1) {
        this.rows.push(issue);
        continue;
      }

      const existing = this.rows[index];
      const newer = issue.updatedAt > existing.updatedAt ? issue : existing;
      this.rows[index] = { ...existing, ...issue, updatedAt: newer.updatedAt };
    }
  }

  all(): IssueUpsertInput[] {
    return [...this.rows];
  }
}
