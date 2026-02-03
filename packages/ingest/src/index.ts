import { getDbPool, closeDbPool, IngestionCursorRepository, IngestionCursorService, IssueRepository, withAdvisoryLock } from "@app/db";
import { IncrementalSyncEngine } from "./incremental-sync/engine";
import type { EntitySyncConfig } from "./incremental-sync/types";
import { fetchIssuePage, type IssueNode } from "./github-issues-page-fetcher";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

async function main(): Promise<void> {
  const repoId = requireEnv("REPO_ID");
  const owner = requireEnv("GITHUB_OWNER");
  const name = requireEnv("GITHUB_REPO");

  const db = getDbPool();
  const cursorRepo = new IngestionCursorRepository(db);
  const cursorService = new IngestionCursorService(cursorRepo);
  const issueRepo = new IssueRepository(db);

  const engine = new IncrementalSyncEngine({
    cursorService,
    logger: console,
  });

  const entityConfig: EntitySyncConfig<IssueNode> = {
    entityType: "ISSUE",
    fetchPage: fetchIssuePage,
    persist: async (nodes) => {
      await issueRepo.upsertIssues(
        nodes.map((issue) => ({
          repoId,
          issueId: issue.id,
          issueNumber: issue.number,
          title: issue.title,
          state: issue.state,
          url: issue.url,
          authorLogin: issue.author?.login ?? null,
          createdAt: new Date(issue.createdAt),
          updatedAt: new Date(issue.updatedAt),
          rawPayload: issue,
        })),
      );
    },
    extractUpdatedAt: (issue) => new Date(issue.updatedAt),
  };

  await withAdvisoryLock(db, `ingest:${repoId}:issues`, async () => {
    await engine.run({ repoId, owner, name }, entityConfig);
  });

}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => closeDbPool());
