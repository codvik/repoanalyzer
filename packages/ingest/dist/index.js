// src/index.ts
import {
  getDbPool,
  closeDbPool,
  IngestionCursorRepository,
  IngestionCursorService,
  IssueRepository,
  PullRequestRepository,
  DiscussionRepository,
  DocumentRepository,
  withAdvisoryLock
} from "@app/db";

// src/incremental-sync/engine.ts
var DEFAULT_PAGE_SIZE = 50;
var DEFAULT_MIN_REMAINING = 50;
var DEFAULT_RATE_LIMIT_BUFFER_MS = 1e3;
var IncrementalSyncEngine = class {
  cursorService;
  minRemaining;
  rateLimitBufferMs;
  logger;
  constructor(options) {
    this.cursorService = options.cursorService;
    this.minRemaining = options.minRemaining ?? DEFAULT_MIN_REMAINING;
    this.rateLimitBufferMs = options.rateLimitBufferMs ?? DEFAULT_RATE_LIMIT_BUFFER_MS;
    this.logger = options.logger ?? console;
  }
  async run(request, config) {
    const pageSize = config.pageSize ?? DEFAULT_PAGE_SIZE;
    const entityType = config.entityType;
    this.logger.info("Starting incremental sync", {
      repoId: request.repoId,
      owner: request.owner,
      name: request.name,
      entityType,
      pageSize
    });
    const cursorState = await this.cursorService.loadCursor(
      request.repoId,
      entityType
    );
    let cursor = cursorState?.cursor ?? null;
    let lastSyncedAt = cursorState?.lastSyncedAt ?? null;
    let hasNextPage = true;
    while (hasNextPage) {
      const page = await config.fetchPage({
        owner: request.owner,
        name: request.name,
        cursor,
        pageSize
      });
      const { nodes, pageInfo } = page;
      const { itemsToPersist, stopAfterPage, maxUpdatedAt } = this.filterByLastSyncedAt(nodes, lastSyncedAt, config.extractUpdatedAt);
      if (itemsToPersist.length > 0) {
        await config.persist(itemsToPersist);
      }
      if (maxUpdatedAt) {
        lastSyncedAt = maxUpdatedAt;
      }
      await this.cursorService.persistCursorAfterPage({
        repoId: request.repoId,
        entityType,
        cursor: pageInfo.endCursor,
        lastSyncedAt
      });
      this.logger.info("Processed page", {
        repoId: request.repoId,
        entityType,
        fetched: nodes.length,
        persisted: itemsToPersist.length,
        cursor: pageInfo.endCursor,
        lastSyncedAt: lastSyncedAt?.toISOString() ?? null
      });
      if (stopAfterPage) {
        this.logger.info("Stopping incremental sync at lastSyncedAt boundary", {
          repoId: request.repoId,
          entityType,
          lastSyncedAt: lastSyncedAt?.toISOString() ?? null
        });
        break;
      }
      cursor = pageInfo.endCursor;
      hasNextPage = pageInfo.hasNextPage;
      await this.applyRateLimitDelay(page);
    }
    this.logger.info("Incremental sync complete", {
      repoId: request.repoId,
      entityType,
      lastSyncedAt: lastSyncedAt?.toISOString() ?? null
    });
  }
  filterByLastSyncedAt(nodes, lastSyncedAt, extractUpdatedAt) {
    if (!lastSyncedAt) {
      return {
        itemsToPersist: nodes,
        stopAfterPage: false,
        maxUpdatedAt: this.maxUpdatedAt(nodes, extractUpdatedAt)
      };
    }
    let stopAfterPage = false;
    const itemsToPersist = [];
    for (const node of nodes) {
      const updatedAt = extractUpdatedAt(node);
      if (updatedAt <= lastSyncedAt) {
        stopAfterPage = true;
        break;
      }
      itemsToPersist.push(node);
    }
    return {
      itemsToPersist,
      stopAfterPage,
      maxUpdatedAt: this.maxUpdatedAt(itemsToPersist, extractUpdatedAt)
    };
  }
  maxUpdatedAt(nodes, extractUpdatedAt) {
    if (nodes.length === 0) {
      return null;
    }
    let latest = extractUpdatedAt(nodes[0]);
    for (const node of nodes) {
      const updatedAt = extractUpdatedAt(node);
      if (updatedAt > latest) {
        latest = updatedAt;
      }
    }
    return latest;
  }
  async applyRateLimitDelay(page) {
    const rateLimit = page.rateLimit;
    if (!rateLimit) {
      return;
    }
    if (rateLimit.remaining > this.minRemaining) {
      return;
    }
    const resetAtMs = Date.parse(rateLimit.resetAt);
    if (Number.isNaN(resetAtMs)) {
      this.logger.warn("Rate limit reset time invalid", {
        resetAt: rateLimit.resetAt
      });
      return;
    }
    const delayMs = Math.max(0, resetAtMs - Date.now() + this.rateLimitBufferMs);
    if (delayMs === 0) {
      return;
    }
    this.logger.warn("Rate limit reached, delaying", {
      delayMs,
      remaining: rateLimit.remaining,
      resetAt: rateLimit.resetAt
    });
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
};

// src/github-issues-page-fetcher.ts
import { requestGraphQL } from "@app/github";
var ISSUE_QUERY = `
  query RepoIssues($owner: String!, $name: String!, $pageSize: Int!, $cursor: String) {
    rateLimit {
      remaining
      resetAt
    }
    repository(owner: $owner, name: $name) {
      issues(first: $pageSize, after: $cursor, orderBy: { field: UPDATED_AT, direction: ASC }) {
        nodes {
          id
          number
          title
          state
          url
          body
          createdAt
          updatedAt
          author {
            login
          }
          labels(first: 20) {
            nodes {
              name
            }
          }
          comments {
            totalCount
          }
        }
        pageInfo {
          endCursor
          hasNextPage
        }
      }
    }
  }
`;
var fetchIssuePage = async (params) => {
  const response = await requestGraphQL({
    query: ISSUE_QUERY,
    variables: {
      owner: params.owner,
      name: params.name,
      pageSize: params.pageSize,
      cursor: params.cursor
    }
  });
  const issues = response.data?.repository?.issues;
  if (!issues) {
    throw new Error("Repository issues not found in GitHub response");
  }
  return {
    nodes: issues.nodes ?? [],
    pageInfo: issues.pageInfo,
    rateLimit: response.data?.rateLimit
  };
};

// src/github-prs-page-fetcher.ts
import { requestGraphQL as requestGraphQL2 } from "@app/github";
var PR_QUERY = `
  query RepoPullRequests($owner: String!, $name: String!, $pageSize: Int!, $cursor: String) {
    rateLimit {
      remaining
      resetAt
    }
    repository(owner: $owner, name: $name) {
      pullRequests(first: $pageSize, after: $cursor, orderBy: { field: UPDATED_AT, direction: ASC }) {
        nodes {
          id
          number
          title
          state
          url
          body
          createdAt
          updatedAt
          author {
            login
          }
          labels(first: 20) {
            nodes {
              name
            }
          }
          comments {
            totalCount
          }
        }
        pageInfo {
          endCursor
          hasNextPage
        }
      }
    }
  }
`;
var fetchPullRequestPage = async (params) => {
  const response = await requestGraphQL2({
    query: PR_QUERY,
    variables: {
      owner: params.owner,
      name: params.name,
      pageSize: params.pageSize,
      cursor: params.cursor
    }
  });
  const pullRequests = response.data?.repository?.pullRequests;
  if (!pullRequests) {
    throw new Error("Repository pull requests not found in GitHub response");
  }
  return {
    nodes: pullRequests.nodes ?? [],
    pageInfo: pullRequests.pageInfo,
    rateLimit: response.data?.rateLimit
  };
};

// src/github-discussions-page-fetcher.ts
import { requestGraphQL as requestGraphQL3 } from "@app/github";
var DISCUSSION_QUERY = `
  query RepoDiscussions($owner: String!, $name: String!, $pageSize: Int!, $cursor: String) {
    rateLimit {
      remaining
      resetAt
    }
    repository(owner: $owner, name: $name) {
      discussions(first: $pageSize, after: $cursor, orderBy: { field: UPDATED_AT, direction: ASC }) {
        nodes {
          id
          number
          title
          url
          body
          createdAt
          updatedAt
          author {
            login
          }
          labels(first: 20) {
            nodes {
              name
            }
          }
          comments {
            totalCount
          }
        }
        pageInfo {
          endCursor
          hasNextPage
        }
      }
    }
  }
`;
var fetchDiscussionPage = async (params) => {
  const response = await requestGraphQL3({
    query: DISCUSSION_QUERY,
    variables: {
      owner: params.owner,
      name: params.name,
      pageSize: params.pageSize,
      cursor: params.cursor
    }
  });
  const discussions = response.data?.repository?.discussions;
  if (!discussions) {
    throw new Error("Repository discussions not found in GitHub response");
  }
  return {
    nodes: discussions.nodes ?? [],
    pageInfo: discussions.pageInfo,
    rateLimit: response.data?.rateLimit
  };
};

// src/cleaning/cleaning-service.ts
var FENCED_CODE_BLOCK = /```[\s\S]*?```/g;
var INDENTED_CODE_BLOCK = /(^|\n)(?: {4}|\t).*(?:\n(?: {4}|\t).*)*/g;
var INLINE_CODE = /`([^`]*)`/g;
var BOLD_ITALIC = /(\*\*|__)(.*?)\1|(\*|_)(.*?)\3/g;
var LINKS = /\[([^\]]+)\]\([^)]+\)/g;
var HEADINGS = /^#{1,6}\s+/gm;
function cleanAndNormalize(input) {
  const text = normalizeMarkdown(removeCodeBlocks(input.text));
  const labels = normalizeLabels(input.labels ?? []);
  const actors = normalizeActors(input.actors ?? []);
  const narrative = input.timeline ? timelineToNarrative(input.timeline) : void 0;
  return { text, labels, actors, narrative };
}
function removeCodeBlocks(text) {
  return text.replace(FENCED_CODE_BLOCK, "").replace(INDENTED_CODE_BLOCK, "").trim();
}
function normalizeMarkdown(text) {
  return text.replace(HEADINGS, "").replace(LINKS, "$1").replace(INLINE_CODE, "$1").replace(BOLD_ITALIC, (_, __, boldText, ___, italicText) => boldText || italicText || "").replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}
function normalizeLabels(labels) {
  const cleaned = labels.map(
    (label) => label.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, " ").trim()
  ).filter(Boolean);
  return Array.from(new Set(cleaned));
}
function normalizeActors(actors) {
  const cleaned = actors.map((actor) => {
    if (typeof actor === "string") {
      return actor.trim();
    }
    return actor.login?.trim() || actor.name?.trim() || "";
  }).filter(Boolean);
  return Array.from(new Set(cleaned));
}
function timelineToNarrative(events) {
  const sorted = [...events].sort(
    (a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp)
  );
  const sentences = sorted.map((event) => {
    const date = new Date(event.timestamp).toISOString().split("T")[0];
    const actor = normalizeActors([event.actor ?? "Someone"])[0];
    const object = event.object ? ` ${event.object}` : "";
    return `On ${date}, ${actor} ${event.action}${object}.`;
  });
  return sentences.join(" ");
}

// src/ai-ready/document-builder.ts
var DEFAULT_CONSTRAINTS = [];
function buildWorkItemDocument(type, input) {
  const cleaned = cleanAndNormalize({
    text: input.item.body ?? "",
    labels: input.labels ?? [],
    actors: input.actors ?? [],
    timeline: input.timeline
  });
  const normalizedTitle = normalizeWhitespace(input.item.title);
  const summary = deriveSummary(cleaned.text, normalizedTitle);
  const discussionSummary = deriveDiscussionSummary(
    input.discussionSummary,
    cleaned.narrative,
    cleaned.text
  );
  const context = {
    problem: normalizeWhitespace(input.context?.problem ?? normalizedTitle),
    background: normalizeWhitespace(
      input.context?.background ?? firstParagraph(cleaned.text)
    ),
    constraints: input.context?.constraints ?? DEFAULT_CONSTRAINTS
  };
  return {
    doc_id: `${input.repo.repoId}:${input.item.id}`,
    source: "github",
    type,
    repo: {
      repo_id: input.repo.repoId,
      owner: input.repo.owner,
      name: input.repo.name,
      url: input.repo.url
    },
    issue: {
      id: input.item.id,
      number: input.item.number,
      title: normalizedTitle,
      state: input.item.state,
      url: input.item.url
    },
    context,
    decisions: input.decisions ?? [],
    discussion_summary: discussionSummary,
    labels: cleaned.labels,
    actors: cleaned.actors,
    timestamps: {
      created_at: input.timestamps.createdAt,
      updated_at: input.timestamps.updatedAt,
      closed_at: input.timestamps.closedAt ?? null,
      merged_at: input.timestamps.mergedAt ?? null
    },
    text: {
      title: normalizedTitle,
      body: cleaned.text,
      summary
    }
  };
}
function deriveSummary(cleanedBody, title) {
  const paragraphs = splitParagraphs(cleanedBody);
  if (paragraphs.length === 0) {
    return title;
  }
  const first = paragraphs[0];
  return trimToSentence(first, 2) ?? title;
}
function deriveDiscussionSummary(provided, narrative, cleanedBody) {
  if (provided && provided.trim().length > 0) {
    return normalizeWhitespace(provided);
  }
  if (narrative && narrative.trim().length > 0) {
    return normalizeWhitespace(narrative);
  }
  const paragraphs = splitParagraphs(cleanedBody);
  if (paragraphs.length > 1) {
    return trimToSentence(paragraphs[1], 2) ?? paragraphs[1];
  }
  return trimToSentence(cleanedBody, 2) ?? cleanedBody;
}
function splitParagraphs(text) {
  return text.split(/\n\n+/).map((chunk) => chunk.trim()).filter(Boolean);
}
function firstParagraph(text) {
  return splitParagraphs(text)[0] ?? "";
}
function trimToSentence(text, count) {
  const sentences = text.split(/(?<=[.!?])\s+/).map((sentence) => sentence.trim()).filter(Boolean);
  if (sentences.length === 0) {
    return null;
  }
  return sentences.slice(0, count).join(" ");
}
function normalizeWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
}

// src/index.ts
function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}
async function main() {
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
    logger: console
  });
  const issueConfig = {
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
          rawPayload: issue
        }))
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
              body: issue.body ?? ""
            },
            labels: issue.labels?.nodes?.map((label) => label.name) ?? [],
            actors: issue.author ? [{ login: issue.author.login }] : [],
            timestamps: {
              createdAt: issue.createdAt,
              updatedAt: issue.updatedAt
            }
          });
          return {
            docId: doc.doc_id,
            source: doc.source,
            type: doc.type,
            repoId,
            itemId: issue.id,
            payload: doc,
            updatedAt: new Date(issue.updatedAt)
          };
        })
      );
    },
    extractUpdatedAt: (issue) => new Date(issue.updatedAt)
  };
  const pullRequestConfig = {
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
          rawPayload: pr
        }))
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
              body: pr.body ?? ""
            },
            labels: pr.labels?.nodes?.map((label) => label.name) ?? [],
            actors: pr.author ? [{ login: pr.author.login }] : [],
            timestamps: {
              createdAt: pr.createdAt,
              updatedAt: pr.updatedAt
            }
          });
          return {
            docId: doc.doc_id,
            source: doc.source,
            type: doc.type,
            repoId,
            itemId: pr.id,
            payload: doc,
            updatedAt: new Date(pr.updatedAt)
          };
        })
      );
    },
    extractUpdatedAt: (pr) => new Date(pr.updatedAt)
  };
  const discussionConfig = {
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
          rawPayload: discussion
        }))
      );
    },
    extractUpdatedAt: (discussion) => new Date(discussion.updatedAt)
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
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => closeDbPool());
