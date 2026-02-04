import { IngestionCursorRepository, IngestionCursorService, IssueRepository, PullRequestRepository, DiscussionRepository, IssueCommentRepository, PullRequestCommentRepository, DiscussionCommentRepository, withAdvisoryLock } from "@app/db";
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

type CommentNode = {
  id: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  author: { login: string } | null;
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

const COMMENT_QUERY = `
  query NodeComments($id: ID!, $cursor: String) {
    node(id: $id) {
      ... on Issue {
        comments(first: 100, after: $cursor) {
          nodes { id body createdAt updatedAt author { login } }
          pageInfo { endCursor hasNextPage }
        }
      }
      ... on PullRequest {
        comments(first: 100, after: $cursor) {
          nodes { id body createdAt updatedAt author { login } }
          pageInfo { endCursor hasNextPage }
        }
      }
      ... on Discussion {
        comments(first: 100, after: $cursor) {
          nodes { id body createdAt updatedAt author { login } }
          pageInfo { endCursor hasNextPage }
        }
      }
    }
  }
`;

async function fetchAllComments(token: string, nodeId: string): Promise<CommentNode[]> {
  let cursor: string | null = null;
  let hasNextPage = true;
  const all: CommentNode[] = [];

  while (hasNextPage) {
    const response: {
      data?: {
        node?: {
          comments?: {
            nodes?: CommentNode[];
            pageInfo?: { endCursor?: string | null; hasNextPage?: boolean };
          };
        };
      };
    } = await requestGraphQLWithToken(token, COMMENT_QUERY, {
      id: nodeId,
      cursor,
    });
    const node = response.data?.node;
    const comments = node?.comments;
    if (!comments) {
      break;
    }
    const nodes = comments.nodes ?? [];
    all.push(...nodes);
    cursor = comments.pageInfo?.endCursor ?? null;
    hasNextPage = Boolean(comments.pageInfo?.hasNextPage);
  }

  return all;
}

export async function runIngestion(db: any, repoId: string, owner: string, name: string, token: string): Promise<void> {
  const cursorRepo = new IngestionCursorRepository(db);
  const cursorService = new IngestionCursorService(cursorRepo);
  const issueRepo = new IssueRepository(db);
  const pullRequestRepo = new PullRequestRepository(db);
  const discussionRepo = new DiscussionRepository(db);
  const issueCommentRepo = new IssueCommentRepository(db);
  const pullRequestCommentRepo = new PullRequestCommentRepository(db);
  const discussionCommentRepo = new DiscussionCommentRepository(db);

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

      for (const issue of nodes) {
        const comments = await fetchAllComments(token, issue.id);
        await issueCommentRepo.upsertComments(
          comments.map((comment) => ({
            repoId,
            issueId: issue.id,
            commentId: comment.id,
            authorLogin: comment.author?.login ?? null,
            body: comment.body,
            createdAt: new Date(comment.createdAt),
            updatedAt: new Date(comment.updatedAt),
            rawPayload: comment,
          })),
        );
      }
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

      for (const pr of nodes) {
        const comments = await fetchAllComments(token, pr.id);
        await pullRequestCommentRepo.upsertComments(
          comments.map((comment) => ({
            repoId,
            pullRequestId: pr.id,
            commentId: comment.id,
            authorLogin: comment.author?.login ?? null,
            body: comment.body,
            createdAt: new Date(comment.createdAt),
            updatedAt: new Date(comment.updatedAt),
            rawPayload: comment,
          })),
        );
      }
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

      for (const discussion of nodes) {
        const comments = await fetchAllComments(token, discussion.id);
        await discussionCommentRepo.upsertComments(
          comments.map((comment) => ({
            repoId,
            discussionId: discussion.id,
            commentId: comment.id,
            authorLogin: comment.author?.login ?? null,
            body: comment.body,
            createdAt: new Date(comment.createdAt),
            updatedAt: new Date(comment.updatedAt),
            rawPayload: comment,
          })),
        );
      }
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
