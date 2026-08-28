'use client';

import { useEffect, useRef, useState } from 'react';
import type { WorkerRequest, WorkerResponse } from '@/lib/workers/protocol';

/** How long a run may take before the worker holding it is killed. */
export const DEFAULT_TIMEOUT_MS = 2000;

export type TimeboxedWorkerJob<TRequest, TResult> = {
  /** Creates the worker. Called again after a run has had to be killed. */
  spawn: () => Worker;
  /**
   * The job to run, or null to stay idle. Must be referentially stable across
   * renders - memoize it, or the effect will re-run forever.
   */
  request: TRequest | null;
  /** Runs the same job on this thread when no worker is available. */
  fallback: (request: TRequest) => TResult;
  timeoutMs?: number;
};

export type TimeboxedWorkerState<TRequest, TResult> = {
  result: TResult | null;
  /** The request `result` came from. Lags the current one while a run is in flight. */
  source: TRequest | null;
  /** What the job threw, if it threw. */
  error: string | null;
  /** Set when the run was killed for overstaying the timeout. */
  timedOut: boolean;
};

const IDLE = { result: null, source: null, error: null, timedOut: false };

/**
 * Runs a job off the main thread and kills it if it takes too long.
 *
 * The previous result stays on screen while a new run is in flight, so editing
 * an input does not blank the output between keystrokes.
 */
export function useTimeboxedWorker<TRequest, TResult>({
  spawn,
  request,
  fallback,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}: TimeboxedWorkerJob<TRequest, TResult>): TimeboxedWorkerState<TRequest, TResult> {
  const [state, setState] = useState<TimeboxedWorkerState<TRequest, TResult>>(IDLE);
  const workerRef = useRef<Worker | null>(null);
  const runIdRef = useRef(0);
  // Set once a worker has proved it cannot run, after which every job runs on
  // this thread. Losing the timeout is better than losing the tool.
  const brokenRef = useRef(false);

  // Latest values, read inside the run effect without making it re-run. This
  // effect is declared first, so the refs are fresh before the run effect fires.
  const spawnRef = useRef(spawn);
  const fallbackRef = useRef(fallback);
  useEffect(() => {
    spawnRef.current = spawn;
    fallbackRef.current = fallback;
  });

  useEffect(
    () => () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    },
    [],
  );

  useEffect(() => {
    if (request === null) {
      setState(IDLE);
      return;
    }

    const runSynchronously = () => {
      try {
        setState({ result: fallbackRef.current(request), source: request, error: null, timedOut: false });
      } catch (err) {
        setState({
          result: null,
          source: request,
          error: err instanceof Error ? err.message : String(err),
          timedOut: false,
        });
      }
    };

    if (typeof Worker === 'undefined' || brokenRef.current) {
      runSynchronously();
      return;
    }

    if (!workerRef.current) workerRef.current = spawnRef.current();
    const worker = workerRef.current;
    const runId = ++runIdRef.current;

    const timer = setTimeout(() => {
      // The worker is inside a call that will not return. Terminating is the
      // only way out; the next run spawns a fresh one.
      worker.terminate();
      if (workerRef.current === worker) workerRef.current = null;
      setState({ result: null, source: request, error: null, timedOut: true });
    }, timeoutMs);

    worker.onmessage = (event: MessageEvent<WorkerResponse<TResult>>) => {
      // A run the user superseded by editing again, or one from a worker that
      // was killed and has answered anyway.
      if (event.data.runId !== runIdRef.current) return;
      clearTimeout(timer);
      const { result, error } = event.data;
      setState({
        result: error === undefined ? (result as TResult) : null,
        source: request,
        error: error ?? null,
        timedOut: false,
      });
    };

    worker.onerror = () => {
      clearTimeout(timer);
      brokenRef.current = true;
      worker.terminate();
      if (workerRef.current === worker) workerRef.current = null;
      runSynchronously();
    };

    const message: WorkerRequest<TRequest> = { runId, request };
    worker.postMessage(message);

    return () => clearTimeout(timer);
  }, [request, timeoutMs]);

  return state;
}
