import type {
  IngestionCursor,
  IngestionEntityType,
  UpsertIngestionCursorInput,
} from "./types";
import { IngestionCursorRepository } from "./ingestion-cursor-repository";

export class IngestionCursorService {
  private readonly repo: IngestionCursorRepository;

  constructor(repo: IngestionCursorRepository) {
    this.repo = repo;
  }

  async loadCursor(
    repoId: string,
    entityType: IngestionEntityType,
  ): Promise<IngestionCursor | null> {
    return this.repo.getByRepoAndEntity(repoId, entityType);
  }

  async persistCursorAfterPage(
    input: UpsertIngestionCursorInput,
  ): Promise<IngestionCursor> {
    return this.repo.upsertAfterPage(input);
  }
}
