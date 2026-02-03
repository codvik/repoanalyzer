import type {
  EntitySyncConfig,
  IncrementalSyncEngineOptions,
  IncrementalSyncRequest,
  Logger,
  PageResult,
  RateLimitInfo,
} from "./types";

const DEFAULT_PAGE_SIZE = 50;
const DEFAULT_MIN_REMAINING = 50;
const DEFAULT_RATE_LIMIT_BUFFER_MS = 1000;

export class IncrementalSyncEngine {
  private readonly cursorService: IncrementalSyncEngineOptions["cursorService"];
  private readonly minRemaining: number;
  private readonly rateLimitBufferMs: number;
  private readonly logger: Logger;

  constructor(options: IncrementalSyncEngineOptions) {
    this.cursorService = options.cursorService;
    this.minRemaining = options.minRemaining ?? DEFAULT_MIN_REMAINING;
    this.rateLimitBufferMs =
      options.rateLimitBufferMs ?? DEFAULT_RATE_LIMIT_BUFFER_MS;
    this.logger = options.logger ?? console;
  }

  async run<T>(
    request: IncrementalSyncRequest,
    config: EntitySyncConfig<T>,
  ): Promise<void> {
    const pageSize = config.pageSize ?? DEFAULT_PAGE_SIZE;
    const entityType = config.entityType;

    this.logger.info("Starting incremental sync", {
      repoId: request.repoId,
      owner: request.owner,
      name: request.name,
      entityType,
      pageSize,
    });

    const cursorState = await this.cursorService.loadCursor(
      request.repoId,
      entityType,
    );

    let cursor = cursorState?.cursor ?? null;
    let lastSyncedAt = cursorState?.lastSyncedAt ?? null;
    let hasNextPage = true;

    while (hasNextPage) {
      const page = await config.fetchPage({
        owner: request.owner,
        name: request.name,
        cursor,
        pageSize,
      });

      const { nodes, pageInfo } = page;

      const { itemsToPersist, stopAfterPage, maxUpdatedAt } =
        this.filterByLastSyncedAt(nodes, lastSyncedAt, config.extractUpdatedAt);

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
        lastSyncedAt,
      });

      this.logger.info("Processed page", {
        repoId: request.repoId,
        entityType,
        fetched: nodes.length,
        persisted: itemsToPersist.length,
        cursor: pageInfo.endCursor,
        lastSyncedAt: lastSyncedAt?.toISOString() ?? null,
      });

      if (stopAfterPage) {
        this.logger.info("Stopping incremental sync at lastSyncedAt boundary", {
          repoId: request.repoId,
          entityType,
          lastSyncedAt: lastSyncedAt?.toISOString() ?? null,
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
      lastSyncedAt: lastSyncedAt?.toISOString() ?? null,
    });
  }

  private filterByLastSyncedAt<T>(
    nodes: T[],
    lastSyncedAt: Date | null,
    extractUpdatedAt: (item: T) => Date,
  ): {
    itemsToPersist: T[];
    stopAfterPage: boolean;
    maxUpdatedAt: Date | null;
  } {
    if (!lastSyncedAt) {
      return {
        itemsToPersist: nodes,
        stopAfterPage: false,
        maxUpdatedAt: this.maxUpdatedAt(nodes, extractUpdatedAt),
      };
    }

    let stopAfterPage = false;
    const itemsToPersist: T[] = [];

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
      maxUpdatedAt: this.maxUpdatedAt(itemsToPersist, extractUpdatedAt),
    };
  }

  private maxUpdatedAt<T>(
    nodes: T[],
    extractUpdatedAt: (item: T) => Date,
  ): Date | null {
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

  private async applyRateLimitDelay<T>(page: PageResult<T>): Promise<void> {
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
        resetAt: rateLimit.resetAt,
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
      resetAt: rateLimit.resetAt,
    });

    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
}
