'use client';

import { useTimeboxedWorker } from '@/Components/Functions/useTimeboxedWorker';
import { runPipeline } from '@/lib/blocks/pipeline';
import { spawnPipelineWorker } from '@/lib/blocks/spawn';
import { BlockResult, PipelineState } from '@/lib/blocks/types';

/** How long a pipeline may run before the worker holding it is killed. */
export const RUN_TIMEOUT_MS = 2000;

export type RunState = {
  results: BlockResult[];
  /** Set when the run produced no results, with the reason to put on screen. */
  note: string | null;
};

/** Runs the pipeline off the main thread, with a cap on how long it may take. */
export function usePipelineResults(pipeline: PipelineState): RunState {
  const { result, error, timedOut } = useTimeboxedWorker<PipelineState, BlockResult[]>({
    spawn: spawnPipelineWorker,
    request: pipeline.blocks.length === 0 ? null : pipeline,
    fallback: runPipeline,
    timeoutMs: RUN_TIMEOUT_MS,
  });

  if (timedOut) {
    return {
      results: [],
      note: `Stopped after ${RUN_TIMEOUT_MS / 1000} seconds — one of the blocks is taking too long. Disable it or change what you gave it.`,
    };
  }

  return { results: result ?? [], note: error };
}
