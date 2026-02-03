import { afterEach, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { MockGitHubServer } from "./helpers/mock-github-server";
import { InMemoryCursorService, InMemoryIssueRepository } from "./helpers/in-memory-repos";
import { IssueFetcher } from "../src/issue-fetcher";

const ORIGINAL_FETCH = global.fetch;

function buildIssue(id: string, updatedAt: string) {
  return {
    id,
    number: Number(id.replace(/\D/g, "")) || 1,
    title: `Issue ${id}`,
    state: "OPEN",
    url: `https://github.com/org/repo/issues/${id}`,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt,
    author: { login: "octocat" },
  };
}

let server: MockGitHubServer;
let endpointUrl = "";

beforeEach(async () => {
  process.env.GITHUB_TOKEN = "test-token";
  server = new MockGitHubServer();
  const { url } = await server.start();
  endpointUrl = url;
  global.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const target = typeof input === "string" ? input : input.toString();
    if (target.includes("api.github.com/graphql")) {
      return ORIGINAL_FETCH(endpointUrl, init);
    }
    return ORIGINAL_FETCH(input, init);
  };
});

afterEach(async () => {
  global.fetch = ORIGINAL_FETCH;
  await server.stop();
});

test("IssueFetcher paginates and persists issues", async () => {
  server.enqueueResponse({
    body: {
      data: {
        rateLimit: { remaining: 500, resetAt: "2026-02-01T00:00:00Z" },
        repository: {
          issues: {
            nodes: [buildIssue("1", "2026-02-01T01:00:00Z")],
            pageInfo: { endCursor: "cursor-1", hasNextPage: true },
          },
        },
      },
    },
  });

  server.enqueueResponse({
    body: {
      data: {
        rateLimit: { remaining: 500, resetAt: "2026-02-01T00:00:00Z" },
        repository: {
          issues: {
            nodes: [buildIssue("2", "2026-02-01T02:00:00Z")],
            pageInfo: { endCursor: "cursor-2", hasNextPage: false },
          },
        },
      },
    },
  });

  const cursorService = new InMemoryCursorService();
  const issueRepo = new InMemoryIssueRepository();
  const fetcher = new IssueFetcher(cursorService, issueRepo, { pageSize: 1 });

  await fetcher.fetchAndPersist({
    repoId: "repo-1",
    owner: "org",
    name: "repo",
  });

  const allIssues = issueRepo.all();
  assert.equal(allIssues.length, 2);
  const cursor = await cursorService.loadCursor("repo-1", "issue");
  assert.equal(cursor?.cursor, "cursor-2");
  assert.equal(cursor?.lastSyncedAt?.toISOString(), "2026-02-01T02:00:00.000Z");
});
