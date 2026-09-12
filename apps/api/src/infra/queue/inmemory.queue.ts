import type { QueuePort } from "@/core/ports";

/** Test/dev adapter: records messages; optional handler runs them inline. */
export class InMemoryQueue implements QueuePort {
  readonly messages: Array<{ queue: string; message: object; jobId?: string }> =
    [];
  handler: ((queue: string, message: object) => Promise<void>) | null = null;
  async enqueue<T extends object>(
    queue: string,
    message: T,
    opts?: { jobId?: string },
  ): Promise<void> {
    this.messages.push({ queue, message, jobId: opts?.jobId });
    if (this.handler) await this.handler(queue, message);
  }
  async close(): Promise<void> {}
}
