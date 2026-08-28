/**
 * The wire between a timeboxed worker and `useTimeboxedWorker`.
 *
 * Everything here exists because a regular expression cannot be interrupted
 * once it starts backtracking: terminating the worker is the only way to stop
 * one. Runs are tagged so a result that arrives after the user has moved on can
 * be dropped, and so a killed worker's late answer can never be mistaken for
 * the current one.
 */

export type WorkerRequest<TRequest> = { runId: number; request: TRequest };

export type WorkerResponse<TResult> =
  | { runId: number; result: TResult; error?: undefined }
  | { runId: number; result?: undefined; error: string };

/** Installs `run` as the worker's message handler. */
export function serveWorker<TRequest, TResult>(run: (request: TRequest) => TResult): void {
  // `self` types as a Window under the DOM lib, so it is narrowed here instead
  // of adding the webworker lib to tsconfig for a handful of files.
  const ctx = self as unknown as {
    onmessage: ((event: MessageEvent<WorkerRequest<TRequest>>) => void) | null;
    postMessage: (message: WorkerResponse<TResult>) => void;
  };

  ctx.onmessage = (event) => {
    const { runId, request } = event.data;
    try {
      ctx.postMessage({ runId, result: run(request) });
    } catch (err) {
      ctx.postMessage({ runId, error: err instanceof Error ? err.message : String(err) });
    }
  };
}
