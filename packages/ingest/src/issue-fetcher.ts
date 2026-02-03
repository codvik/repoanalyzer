import { buildGitHubAuthHeaders } from "@app/github";
import type { IngestionCursorService, IssueRepository, IssueUpsertInput } from "@app/db";

export type IssueFetcherOptions = {
  pageSize?: number;
  minRemaining?: number;
  rateLimitBufferMs?: number;
};

export type IssueFetcherParams = {
  repoId: string;
  owner: string;
  name: string;
  entityType?: string;
};

type RateLimitInfo = {
  remaining: number;
  resetAt: string;
};

type IssueNode = {
  id: string;
  number: number;
  title: string;
  state: string;
  url: string;
  createdAt: string;
  updatedAt: string;
  author: { login: string } | null;
};

type GraphQLResponse = {
  data?: {
    rateLimit?: RateLimitInfo;
    repository?: {
      issues?: {
        nodes?: IssueNode[];
        pageInfo: {
          endCursor: string | null;
          hasNextPage: boolean;
        };
      };
    } | null;
  };
  errors?: Array<{ message: string }>;
};

const ISSUE_QUERY = `
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
          createdAt
          updatedAt
          author {
            login
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

export class IssueFetcher {
  private readonly cursorService: IngestionCursorService;
  private readonly issueRepository: IssueRepository;
  private readonly pageSize: number;
  private readonly minRemaining: number;
  private readonly rateLimitBufferMs: number;

  constructor(
    cursorService: IngestionCursorService,
    issueRepository: IssueRepository,
    options: IssueFetcherOptions = {},
  ) {
    this.cursorService = cursorService;
    this.issueRepository = issueRepository;
    this.pageSize = options.pageSize ?? 50;
    this.minRemaining = options.minRemaining ?? 50;
    this.rateLimitBufferMs = options.rateLimitBufferMs ?? 1000;
  }

  async fetchAndPersist(params: IssueFetcherParams): Promise<void> {
    const entityType = params.entityType ?? "issue";
    const existingCursor = await this.cursorService.loadCursor(
      params.repoId,
      entityType,
    );

    let cursor = existingCursor?.cursor ?? null;
    let hasNextPage = true;

    while (hasNextPage) {
      const response = await this.requestIssues({
        owner: params.owner,
        name: params.name,
        pageSize: this.pageSize,
        cursor,
      });

      const repository = response.data?.repository;
      if (!repository?.issues) {
        throw new Error("Repository issues not found in GitHub response");
      }

      const nodes = repository.issues.nodes ?? [];
      const pageInfo = repository.issues.pageInfo;

      const issuesToUpsert = this.mapIssues(params.repoId, nodes);
      await this.issueRepository.upsertIssues(issuesToUpsert);

      const lastSyncedAt = this.getMaxUpdatedAt(nodes);

      await this.cursorService.persistCursorAfterPage({
        repoId: params.repoId,
        entityType,
        cursor: pageInfo.endCursor,
        lastSyncedAt,
      });

      cursor = pageInfo.endCursor;
      hasNextPage = pageInfo.hasNextPage;

      await this.applyRateLimitDelay(response.data?.rateLimit);
    }
  }

  private async requestIssues(input: {
    owner: string;
    name: string;
    pageSize: number;
    cursor: string | null;
  }): Promise<GraphQLResponse> {
    const headers = {
      "Content-Type": "application/json",
      ...buildGitHubAuthHeaders(),
    };

    const response = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers,
      body: JSON.stringify({
        query: ISSUE_QUERY,
        variables: {
          owner: input.owner,
          name: input.name,
          pageSize: input.pageSize,
          cursor: input.cursor,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`GitHub GraphQL error: ${response.status} ${response.statusText}`);
    }

    const payload = (await response.json()) as GraphQLResponse;

    if (payload.errors && payload.errors.length > 0) {
      throw new Error(payload.errors.map((error) => error.message).join("; "));
    }

    return payload;
  }

  private mapIssues(repoId: string, nodes: IssueNode[]): IssueUpsertInput[] {
    return nodes.map((issue) => ({
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
    }));
  }

  private getMaxUpdatedAt(nodes: IssueNode[]): Date | null {
    if (nodes.length === 0) {
      return null;
    }

    let latest = new Date(nodes[0].updatedAt);

    for (const node of nodes) {
      const updatedAt = new Date(node.updatedAt);
      if (updatedAt > latest) {
        latest = updatedAt;
      }
    }

    return latest;
  }

  private async applyRateLimitDelay(rateLimit?: RateLimitInfo): Promise<void> {
    if (!rateLimit) {
      return;
    }

    if (rateLimit.remaining > this.minRemaining) {
      return;
    }

    const resetAtMs = Date.parse(rateLimit.resetAt);
    if (Number.isNaN(resetAtMs)) {
      return;
    }

    const delayMs = Math.max(0, resetAtMs - Date.now() + this.rateLimitBufferMs);
    if (delayMs === 0) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
}
