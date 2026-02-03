import { test } from "node:test";
import assert from "node:assert/strict";
import { IncrementalSyncEngine } from "../src/incremental-sync/engine";
import type { EntitySyncConfig } from "../src/incremental-sync/types";
import { InMemoryCursorService } from "./helpers/in-memory-repos";

type Item = { id: string; updatedAt: string };

test("IncrementalSyncEngine stops when updatedAt <= lastSyncedAt", async () => {
  const cursorService = new InMemoryCursorService();
  await cursorService.persistCursorAfterPage({
    repoId: "repo-1",
    entityType: "ISSUE",
    cursor: "cursor-0",
    lastSyncedAt: new Date("2026-02-01T01:00:00Z"),
  });

  const fetchedPages: Item[][] = [
    [
      { id: "1", updatedAt: "2026-02-01T03:00:00Z" },
      { id: "2", updatedAt: "2026-02-01T01:00:00Z" },
    ],
    [{ id: "3", updatedAt: "2026-02-01T04:00:00Z" }],
  ];

  const persisted: Item[] = [];

  const config: EntitySyncConfig<Item> = {
    entityType: "ISSUE",
    pageSize: 2,
    fetchPage: async ({ cursor }) => {
      const pageIndex = cursor ? 1 : 0;
      return {
        nodes: fetchedPages[pageIndex],
        pageInfo: {
          endCursor: pageIndex === 0 ? "cursor-1" : "cursor-2",
          hasNextPage: pageIndex === 0,
        },
      };
    },
    persist: async (items) => {
      persisted.push(...items);
    },
    extractUpdatedAt: (item) => new Date(item.updatedAt),
  };

  const engine = new IncrementalSyncEngine({ cursorService });
  await engine.run({ repoId: "repo-1", owner: "org", name: "repo" }, config);

  assert.equal(persisted.length, 1);
  assert.equal(persisted[0].id, "1");
  const cursor = await cursorService.loadCursor("repo-1", "ISSUE");
  assert.equal(cursor?.cursor, "cursor-1");
});
