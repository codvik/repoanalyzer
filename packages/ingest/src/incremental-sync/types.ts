import type { IngestionCursorService } from "@app/db";

export type EntityType = "ISSUE" | "PR" | "DISCUSSION";

export type RateLimitInfo = {
  remaining: number;
  resetAt: string;
};

export type PageInfo = {
  endCursor: string | null;
  hasNextPage: boolean;
};

export type PageResult<T> = {
  nodes: T[];
  pageInfo: PageInfo;
  rateLimit?: RateLimitInfo;
};

export type PageFetcherParams = {
  owner: string;
  name: string;
  cursor: string | null;
  pageSize: number;
};

export type PageFetcher<T> = (params: PageFetcherParams) => Promise<PageResult<T>>;

export type PersistFn<T> = (items: T[]) => Promise<void>;

export type UpdatedAtExtractor<T> = (item: T) => Date;

export type Logger = {
  info: (message: string, meta?: Record<string, unknown>) => void;
  warn: (message: string, meta?: Record<string, unknown>) => void;
  error: (message: string, meta?: Record<string, unknown>) => void;
};

export type EntitySyncConfig<T> = {
  entityType: EntityType;
  pageSize?: number;
  fetchPage: PageFetcher<T>;
  persist: PersistFn<T>;
  extractUpdatedAt: UpdatedAtExtractor<T>;
};

export type IncrementalSyncEngineOptions = {
  minRemaining?: number;
  rateLimitBufferMs?: number;
  logger?: Logger;
  cursorService: IngestionCursorService;
};

export type IncrementalSyncRequest = {
  repoId: string;
  owner: string;
  name: string;
};
