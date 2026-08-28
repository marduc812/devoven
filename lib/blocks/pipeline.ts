import { PipelineState, BlockResult, BlockState } from './types';
import { OPERATION_MAP } from './registry';

/**
 * Longest string a block may hand to the next one.
 *
 * Several operations expand what they are given - String to Binary emits nine
 * characters per input character - so a short chain of them multiplies a small
 * input into hundreds of megabytes, and every intermediate is held in `results`
 * at once. Checking after each block stops the growth one step in rather than
 * letting it run to an out-of-memory crash.
 */
const MAX_BLOCK_OUTPUT = 1_000_000;

/**
 * Index of the first enabled terminal block, or -1 if the pipeline has none.
 * A terminal block ends the pipeline: its result is a rendered artifact or a
 * human-readable report, so nothing downstream of it can run.
 */
export function terminalBlockIndex(blocks: BlockState[]): number {
  return blocks.findIndex((b) => b.enabled && OPERATION_MAP[b.operationId]?.terminal);
}

export function runPipeline(state: PipelineState): BlockResult[] {
  const results: BlockResult[] = [];
  let currentInput = state.input;

  const endsAt = terminalBlockIndex(state.blocks);

  for (const [index, block] of state.blocks.entries()) {
    if (endsAt !== -1 && index > endsAt) {
      const terminalOp = OPERATION_MAP[state.blocks[endsAt].operationId];
      results.push({
        blockId: block.id,
        output: '',
        error: `Unreachable — ${terminalOp?.name ?? 'the previous block'} ends the pipeline`,
      });
      continue;
    }

    if (!block.enabled) {
      // Pass-through: disabled blocks forward input unchanged
      results.push({ blockId: block.id, output: currentInput, error: null });
      continue;
    }

    const op = OPERATION_MAP[block.operationId];
    if (!op) {
      results.push({ blockId: block.id, output: '', error: `Unknown operation: ${block.operationId}` });
      currentInput = '';
      continue;
    }

    try {
      const output = op.fn(currentInput, block.params);
      if (output.length > MAX_BLOCK_OUTPUT) {
        results.push({
          blockId: block.id,
          output: '',
          error: `Output too large — ${output.length.toLocaleString()} characters, the limit is ${MAX_BLOCK_OUTPUT.toLocaleString()}`,
        });
        currentInput = '';
        continue;
      }
      results.push({ blockId: block.id, output, error: null });
      currentInput = output;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      results.push({ blockId: block.id, output: '', error: message });
      currentInput = '';
    }
  }

  return results;
}

/** The block whose result is the pipeline's final output, or null when there is none. */
export function finalBlock(state: PipelineState): BlockState | null {
  const endsAt = terminalBlockIndex(state.blocks);
  const blocks = endsAt === -1 ? state.blocks : state.blocks.slice(0, endsAt + 1);
  return blocks.length === 0 ? null : blocks[blocks.length - 1];
}

export function getFinalOutput(state: PipelineState): string {
  const results = runPipeline(state);
  if (results.length === 0) return state.input;
  const last = finalBlock(state);
  if (!last) return state.input;
  const result = results.find((r) => r.blockId === last.id);
  if (!result) return state.input;
  return result.error ? '' : result.output;
}
