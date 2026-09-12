import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import type { QueuePort } from '@/core/ports';

/** §37 — retry ≤ 3 is a BullMQ job option; the worker sets FAILED after the last attempt. */
export class BullMqQueue implements QueuePort {
  private readonly conn: IORedis;
  private readonly queues = new Map<string, Queue>();
  constructor(redisUrl: string) {
    this.conn = new IORedis(redisUrl, { maxRetriesPerRequest: null });
  }
  private get(name: string): Queue {
    let q = this.queues.get(name);
    if (!q) {
      q = new Queue(name, {
        connection: this.conn,
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: 1000,
          removeOnFail: 5000,
        },
      });
      this.queues.set(name, q);
    }
    return q;
  }
  async enqueue<T extends object>(
    queue: string,
    message: T,
    opts?: { jobId?: string },
  ): Promise<void> {
    await this.get(queue).add(queue, message, { jobId: opts?.jobId });
  }
  async close(): Promise<void> {
    await Promise.all([...this.queues.values()].map((q) => q.close()));
    await this.conn.quit();
  }
  async healthCheck(): Promise<boolean> {
    try {
      return (await this.conn.ping()) === 'PONG';
    } catch {
      return false;
    }
  }
}
