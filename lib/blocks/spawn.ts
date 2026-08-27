/** Creates a worker that runs one pipeline. Kept beside the worker it names. */
export function spawnPipelineWorker(): Worker {
  return new Worker(new URL('./pipeline.worker.ts', import.meta.url));
}
