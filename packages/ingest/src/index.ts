import {
  getDbPool,
  closeDbPool,
  IngestionCursorRepository,
  IngestionCursorService,
  IssueRepository,
  PullRequestRepository,
  DiscussionRepository,
  DocumentRepository,
  withAdvisoryLock,
} from "@app/db";
import { IncrementalSyncEngine } from "./incremental-sync/engine";
import type { EntitySyncConfig } from "./incremental-sync/types";
import { fetchIssuePage, type IssueNode } from "./github-issues-page-fetcher";
import { fetchPullRequestPage, type PullRequestNode } from "./github-prs-page-fetcher";
import { fetchDiscussionPage, type DiscussionNode } from "./github-discussions-page-fetcher";
import { buildWorkItemDocument } from "./ai-ready/document-builder";

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
  const pullRequestRepo = new PullRequestRepository(db);
  const discussionRepo = new DiscussionRepository(db);
  const documentRepo = new DocumentRepository(db);

  const engine = new IncrementalSyncEngine({
    cursorService,
    logger: console,
  });

  const issueConfig: EntitySyncConfig<IssueNode> = {
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

      await documentRepo.upsertDocuments(
        nodes.map((issue) => {
          const doc = buildWorkItemDocument("ISSUE", {
            repo: { repoId, owner, name, url: `https://github.com/${owner}/${name}` },
            item: {
              id: issue.id,
              number: issue.number,
              title: issue.title,
              state: issue.state,
              url: issue.url,
              body: issue.body ?? "",
            },
            labels: issue.labels?.nodes?.map((label) => label.name) ?? [],
            actors: issue.author ? [{ login: issue.author.login }] : [],
            timestamps: {
              createdAt: issue.createdAt,
              updatedAt: issue.updatedAt,
            },
          });
          return {
            docId: doc.doc_id,
            source: doc.source,
            type: doc.type,
            repoId,
            itemId: issue.id,
            payload: doc,
            updatedAt: new Date(issue.updatedAt),
          };
        }),
      );
    },
    extractUpdatedAt: (issue) => new Date(issue.updatedAt),
  };

  const pullRequestConfig: EntitySyncConfig<PullRequestNode> = {
    entityType: "PR",
    fetchPage: fetchPullRequestPage,
    persist: async (nodes) => {
      await pullRequestRepo.upsertPullRequests(
        nodes.map((pr) => ({
          repoId,
          pullRequestId: pr.id,
          pullRequestNumber: pr.number,
          title: pr.title,
          state: pr.state,
          url: pr.url,
          authorLogin: pr.author?.login ?? null,
          createdAt: new Date(pr.createdAt),
          updatedAt: new Date(pr.updatedAt),
          rawPayload: pr,
        })),
      );

      await documentRepo.upsertDocuments(
        nodes.map((pr) => {
          const doc = buildWorkItemDocument("PR", {
            repo: { repoId, owner, name, url: `https://github.com/${owner}/${name}` },
            item: {
              id: pr.id,
              number: pr.number,
              title: pr.title,
              state: pr.state,
              url: pr.url,
              body: pr.body ?? "",
            },
            labels: pr.labels?.nodes?.map((label) => label.name) ?? [],
            actors: pr.author ? [{ login: pr.author.login }] : [],
            timestamps: {
              createdAt: pr.createdAt,
              updatedAt: pr.updatedAt,
            },
          });
          return {
            docId: doc.doc_id,
            source: doc.source,
            type: doc.type,
            repoId,
            itemId: pr.id,
            payload: doc,
            updatedAt: new Date(pr.updatedAt),
          };
        }),
      );
    },
    extractUpdatedAt: (pr) => new Date(pr.updatedAt),
  };

  const discussionConfig: EntitySyncConfig<DiscussionNode> = {
    entityType: "DISCUSSION",
    fetchPage: fetchDiscussionPage,
    persist: async (nodes) => {
      await discussionRepo.upsertDiscussions(
        nodes.map((discussion) => ({
          repoId,
          discussionId: discussion.id,
          number: discussion.number,
          title: discussion.title,
          state: "UNKNOWN",
          url: discussion.url,
          authorLogin: discussion.author?.login ?? null,
          createdAt: new Date(discussion.createdAt),
          updatedAt: new Date(discussion.updatedAt),
          rawPayload: discussion,
        })),
      );
    },
    extractUpdatedAt: (discussion) => new Date(discussion.updatedAt),
  };

  await withAdvisoryLock(db, `ingest:${repoId}:issues`, async () => {
    await engine.run({ repoId, owner, name }, issueConfig);
  });

  await withAdvisoryLock(db, `ingest:${repoId}:prs`, async () => {
    await engine.run({ repoId, owner, name }, pullRequestConfig);
  });

  await withAdvisoryLock(db, `ingest:${repoId}:discussions`, async () => {
    await engine.run({ repoId, owner, name }, discussionConfig);
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => closeDbPool());
