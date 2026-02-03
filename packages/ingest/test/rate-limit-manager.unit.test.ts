import { test } from "node:test";
import assert from "node:assert/strict";
import { GitHubRateLimitManager } from "../src/rate-limit/github-rate-limit-manager";

class FakeClock {
  private nowMs: number;
  private readonly timeouts: Array<{ at: number; resolve: () => void }> = [];

  constructor(startMs: number) {
    this.nowMs = startMs;
  }

  now(): number {
    return this.nowMs;
  }

  advance(ms: number): void {
    this.nowMs += ms;
    this.timeouts
      .filter((timeout) => timeout.at <= this.nowMs)
      .splice(0)
      .forEach((timeout) => timeout.resolve());
  }

  setTimeout(callback: () => void, ms: number): void {
    this.timeouts.push({ at: this.nowMs + ms, resolve: callback });
  }
}

test("Rate limit manager waits until reset", async () => {
  const clock = new FakeClock(Date.parse("2026-02-01T00:00:00Z"));
  const manager = new GitHubRateLimitManager({ threshold: 10, bufferMs: 0 });

  const originalNow = Date.now;
  const originalSetTimeout = global.setTimeout;

  Date.now = () => clock.now();
  global.setTimeout = ((cb: () => void, ms?: number) => {
    clock.setTimeout(cb, ms ?? 0);
    return 0 as unknown as NodeJS.Timeout;
  }) as typeof setTimeout;

  const waitPromise = manager.waitIfLimited({
    remaining: 0,
    resetAt: "2026-02-01T00:00:05Z",
  });

  clock.advance(4000);
  let resolved = false;
  waitPromise.then(() => {
    resolved = true;
  });

  assert.equal(resolved, false);

  clock.advance(1000);
  await waitPromise;
  assert.equal(resolved, true);

  Date.now = originalNow;
  global.setTimeout = originalSetTimeout;
});
