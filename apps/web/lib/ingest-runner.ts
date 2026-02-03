import { IngestionCursorRepository, IngestionCursorService, IssueRepository, PullRequestRepository, DiscussionRepository, withAdvisoryLock } from "@app/db";
import { IncrementalSyncEngine } from "../../../packages/ingest/src/incremental-sync/engine";
import type { EntitySyncConfig } from "../../../packages/ingest/src/incremental-sync/types";
import { requestGraphQLWithToken } from "./github-client";

export type IssueNode = {
  id: string;
  number: number;
  title: string;
  state: string;
  url: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  author: { login: string } | null;
  labels: { nodes: Array<{ name: string }> } | null;
  comments: { totalCount: number } | null;
};

export type PullRequestNode = {
  id: string;
  number: number;
  title: string;
  state: string;
  url: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  author: { login: string } | null;
  labels: { nodes: Array<{ name: string }> } | null;
  comments: { totalCount: number } | null;
};

export type DiscussionNode = {
  id: string;
  number: number;
  title: string;
  url: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  author: { login: string } | null;
  labels: { nodes: Array<{ name: string }> } | null;
  comments: { totalCount: number } | null;
};

const ISSUE_QUERY = `
  query RepoIssues($owner: String!, $name: String!, $pageSize: Int!, $cursor: String) {
    rateLimit { remaining resetAt }
    repository(owner: $owner, name: $name) {
      issues(first: $pageSize, after: $cursor, orderBy: { field: UPDATED_AT, direction: ASC }) {
        nodes {
          id number title state url body createdAt updatedAt
          author { login }
          labels(first: 20) { nodes { name } }
          comments { totalCount }
        }
        pageInfo { endCursor hasNextPage }
      }
    }
  }
`;

const PR_QUERY = `
  query RepoPullRequests($owner: String!, $name: String!, $pageSize: Int!, $cursor: String) {
    rateLimit { remaining resetAt }
    repository(owner: $owner, name: $name) {
      pullRequests(first: $pageSize, after: $cursor, orderBy: { field: UPDATED_AT, direction: ASC }) {
        nodes {
          id number title state url body createdAt updatedAt
          author { login }
          labels(first: 20) { nodes { name } }
          comments { totalCount }
        }
        pageInfo { endCursor hasNextPage }
      }
    }
  }
`;

const DISCUSSION_QUERY = `
  query RepoDiscussions($owner: String!, $name: String!, $pageSize: Int!, $cursor: String) {
    rateLimit { remaining resetAt }
    repository(owner: $owner, name: $name) {
      discussions(first: $pageSize, after: $cursor, orderBy: { field: UPDATED_AT, direction: ASC }) {
        nodes {
          id number title url body createdAt updatedAt
          author { login }
          labels(first: 20) { nodes { name } }
          comments { totalCount }
        }
        pageInfo { endCursor hasNextPage }
      }
    }
  }
`;

export async function runIngestion(db: any, repoId: string, owner: string, name: string, token: string): Promise<void> {
  const cursorRepo = new IngestionCursorRepository(db);
  const cursorService = new IngestionCursorService(cursorRepo);
  const issueRepo = new IssueRepository(db);
  const pullRequestRepo = new PullRequestRepository(db);
  const discussionRepo = new DiscussionRepository(db);

  const engine = new IncrementalSyncEngine({ cursorService, logger: console });

  const issueConfig: EntitySyncConfig<IssueNode> = {
    entityType: "ISSUE",
    fetchPage: async ({ owner, name, pageSize, cursor }) => {
      const response = await requestGraphQLWithToken<any>(token, ISSUE_QUERY, { owner, name, pageSize, cursor });
      const issues = response.data?.repository?.issues;
      if (!issues) throw new Error("Repository issues not found");
      return { nodes: issues.nodes ?? [], pageInfo: issues.pageInfo, rateLimit: response.data?.rateLimit };
    },
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

  const prConfig: EntitySyncConfig<PullRequestNode> = {
    entityType: "PR",
    fetchPage: async ({ owner, name, pageSize, cursor }) => {
      const response = await requestGraphQLWithToken<any>(token, PR_QUERY, { owner, name, pageSize, cursor });
      const prs = response.data?.repository?.pullRequests;
      if (!prs) throw new Error("Repository pull requests not found");
      return { nodes: prs.nodes ?? [], pageInfo: prs.pageInfo, rateLimit: response.data?.rateLimit };
    },
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
    },
    extractUpdatedAt: (pr) => new Date(pr.updatedAt),
  };

  const discussionConfig: EntitySyncConfig<DiscussionNode> = {
    entityType: "DISCUSSION",
    fetchPage: async ({ owner, name, pageSize, cursor }) => {
      const response = await requestGraphQLWithToken<any>(token, DISCUSSION_QUERY, { owner, name, pageSize, cursor });
      const discussions = response.data?.repository?.discussions;
      if (!discussions) throw new Error("Repository discussions not found");
      return { nodes: discussions.nodes ?? [], pageInfo: discussions.pageInfo, rateLimit: response.data?.rateLimit };
    },
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
    await engine.run({ repoId, owner, name }, prConfig);
  });
  await withAdvisoryLock(db, `ingest:${repoId}:discussions`, async () => {
    await engine.run({ repoId, owner, name }, discussionConfig);
  });
}
