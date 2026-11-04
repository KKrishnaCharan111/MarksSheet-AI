export interface QueueTask<T, R> {
  id: string;
  item: T;
  execute: (item: T) => Promise<R>;
  retries?: number;
}

export interface QueueProgress {
  completed: number;
  total: number;
  activeCount: number;
  percent: number;
}

/**
 * Concurrency-limited worker pool with automatic retry and exponential backoff
 */
export async function processInParallel<T, R>(
  tasks: QueueTask<T, R>[],
  concurrency: number = 3,
  onProgress?: (progress: QueueProgress) => void
): Promise<Map<string, { result?: R; error?: Error }>> {
  const results = new Map<string, { result?: R; error?: Error }>();
  let activeCount = 0;
  let completed = 0;
  const total = tasks.length;

  const emitProgress = () => {
    if (onProgress) {
      onProgress({
        completed,
        total,
        activeCount,
        percent: total > 0 ? Math.round((completed / total) * 100) : 100,
      });
    }
  };

  emitProgress();

  const queue = [...tasks];

  const runTask = async (task: QueueTask<T, R>): Promise<void> => {
    activeCount++;
    emitProgress();

    const maxRetries = task.retries !== undefined ? task.retries : 2;
    let attempt = 0;
    let lastError: any = null;
    let success = false;

    while (attempt <= maxRetries && !success) {
      try {
        const res = await task.execute(task.item);
        results.set(task.id, { result: res });
        success = true;
      } catch (err: any) {
        lastError = err;
        attempt++;
        if (attempt <= maxRetries) {
          // Wait exponential backoff before retry (e.g., 600ms, 1200ms)
          await new Promise((r) => setTimeout(r, attempt * 600));
        }
      }
    }

    if (!success) {
      results.set(task.id, { error: lastError || new Error('Task failed') });
    }

    activeCount--;
    completed++;
    emitProgress();
  };

  const workers: Promise<void>[] = [];

  const next = async (): Promise<void> => {
    while (queue.length > 0) {
      const task = queue.shift();
      if (task) {
        await runTask(task);
      }
    }
  };

  const workerCount = Math.min(concurrency, tasks.length);
  for (let i = 0; i < workerCount; i++) {
    workers.push(next());
  }

  await Promise.all(workers);
  return results;
}
