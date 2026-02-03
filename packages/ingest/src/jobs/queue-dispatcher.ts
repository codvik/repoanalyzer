export type IngestionJob = {
  repoId: string;
  owner: string;
  name: string;
  entityType: "ISSUE" | "PR" | "DISCUSSION";
};

export type JobQueue = {
  enqueue: (job: IngestionJob) => Promise<void>;
};

export class IngestionQueueDispatcher {
  private readonly queue: JobQueue;

  constructor(queue: JobQueue) {
    this.queue = queue;
  }

  async dispatch(job: IngestionJob): Promise<void> {
    await this.queue.enqueue(job);
  }
}
