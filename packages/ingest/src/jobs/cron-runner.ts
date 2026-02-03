import type { IncrementalSyncEngine } from "../incremental-sync/engine";
import type { EntitySyncConfig } from "../incremental-sync/types";

export type CronRunConfig<T> = {
  engine: IncrementalSyncEngine;
  entity: EntitySyncConfig<T>;
  repo: { repoId: string; owner: string; name: string };
};

export async function runCronSync<T>(config: CronRunConfig<T>): Promise<void> {
  await config.engine.run(
    {
      repoId: config.repo.repoId,
      owner: config.repo.owner,
      name: config.repo.name,
    },
    config.entity,
  );
}
