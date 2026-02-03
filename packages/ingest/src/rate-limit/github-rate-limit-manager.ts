export type GitHubRateLimit = {
  remaining: number;
  resetAt: string;
};

export type RateLimitManagerOptions = {
  threshold?: number;
  bufferMs?: number;
  logger?: {
    info: (message: string, meta?: Record<string, unknown>) => void;
    warn: (message: string, meta?: Record<string, unknown>) => void;
  };
};

const DEFAULT_THRESHOLD = 50;
const DEFAULT_BUFFER_MS = 1000;

export class GitHubRateLimitManager {
  private readonly threshold: number;
  private readonly bufferMs: number;
  private readonly logger: RateLimitManagerOptions["logger"];

  constructor(options: RateLimitManagerOptions = {}) {
    this.threshold = options.threshold ?? DEFAULT_THRESHOLD;
    this.bufferMs = options.bufferMs ?? DEFAULT_BUFFER_MS;
    this.logger = options.logger;
  }

  async waitIfLimited(rateLimit?: GitHubRateLimit): Promise<void> {
    if (!rateLimit) {
      return;
    }

    if (rateLimit.remaining >= this.threshold) {
      return;
    }

    const resetAtMs = Date.parse(rateLimit.resetAt);
    if (Number.isNaN(resetAtMs)) {
      this.logger?.warn("Rate limit reset time invalid", {
        resetAt: rateLimit.resetAt,
      });
      return;
    }

    const delayMs = Math.max(0, resetAtMs - Date.now() + this.bufferMs);
    if (delayMs === 0) {
      return;
    }

    this.logger?.warn("Rate limit reached, delaying", {
      delayMs,
      remaining: rateLimit.remaining,
      resetAt: rateLimit.resetAt,
    });

    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
}
