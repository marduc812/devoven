/** Creates a worker that runs one regex job. Kept beside the worker it names. */
export function spawnRegexWorker(): Worker {
  return new Worker(new URL('./regex.worker.ts', import.meta.url));
}
