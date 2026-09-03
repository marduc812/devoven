import { PipelineState, BlockResult, BlockState, Operation, DroppedItem, linkedField } from './types';
import { OPERATION_MAP } from './registry';
import { separatorOf, splitItems, memoryName } from './operations/flow';

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

/** Most items an Each Line block may fan out into. */
const MAX_ITEMS = 10_000;

/**
 * Index of the first enabled terminal block, or -1 if the pipeline has none.
 * A terminal block ends the pipeline: its result is a rendered artifact or a
 * human-readable report, so nothing downstream of it can run.
 */
export function terminalBlockIndex(blocks: BlockState[]): number {
  return blocks.findIndex((b) => b.enabled && OPERATION_MAP[b.operationId]?.terminal);
}

/**
 * One value flowing through the pipeline, with the values remembered along its
 * way. Outside an Each Line section there is exactly one item; inside, one per
 * line, each with its own memory on top of what was remembered before the
 * section began.
 */
type Item = { value: string; memory: Record<string, string> };

type Section = {
  items: Item[];
  /** Set while inside an Each Line section: the separator to show items joined with. */
  separator: string | null;
  /** Values remembered before the current Each Line section, shared by every item. */
  shared: Record<string, string>;
};

const REFERENCE = /\{([A-Za-z0-9_-]{1,32})\}/g;

/** Replaces `{name}` with the remembered value of that name; unknown names stay as typed. */
export function substituteReferences(text: string, memory: Record<string, string>): string {
  return text.replace(REFERENCE, (whole, name: string) =>
    Object.prototype.hasOwnProperty.call(memory, name) ? memory[name] : whole
  );
}

function memoryOf(section: Section, item: Item): Record<string, string> {
  return { ...section.shared, ...item.memory };
}

/** What a block shows as its output: the one value, or the items joined back up. */
function shown(section: Section): string {
  if (section.separator === null) return section.items[0]?.value ?? '';
  return section.items.map((i) => i.value).join(section.separator);
}

function fail(results: BlockResult[], block: BlockState, error: string): Section {
  results.push({ blockId: block.id, output: '', error });
  return { items: [], separator: null, shared: {} };
}

/** Runs one ordinary operation over every item, dropping items the operation rejects. */
function runOperation(op: Operation, block: BlockState, section: Section): Section {
  const linked = linkedField(op, block);
  const items: Item[] = [];
  for (const [index, item] of section.items.entries()) {
    const memory = memoryOf(section, item);
    const params: Record<string, string> = {};
    for (const [key, value] of Object.entries(block.params)) params[key] = substituteReferences(value, memory);
    if (linked) params[linked] = item.value;
    try {
      items.push({ value: op.fn(item.value, params), memory: item.memory });
    } catch (err) {
      if (err instanceof DroppedItem) continue;
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(section.separator === null ? message : `Item ${index + 1}: ${message}`);
    }
  }
  return { ...section, items };
}

function runControl(op: Operation, block: BlockState, section: Section): Section {
  switch (op.control) {
    case 'each': {
      const separator = separatorOf(block.params);
      const items: Item[] = [];
      for (const item of section.items) {
        for (const value of splitItems(item.value, block.params)) items.push({ value, memory: item.memory });
      }
      if (items.length > MAX_ITEMS) throw new Error(`Too many items — ${items.length.toLocaleString()}, the limit is ${MAX_ITEMS.toLocaleString()}`);
      // A section nested in another keeps the outer memory as shared; the
      // per-item memories were all identical before the split anyway.
      if (section.separator === null) {
        const shared = { ...section.shared, ...(section.items[0]?.memory ?? {}) };
        return { items: items.map((i) => ({ value: i.value, memory: {} })), separator, shared };
      }
      return { items, separator, shared: section.shared };
    }
    case 'collect': {
      const joined = section.items.map((i) => i.value).join(separatorOf(block.params));
      return { items: [{ value: joined, memory: {} }], separator: null, shared: section.shared };
    }
    case 'remember': {
      const name = memoryName(block.params);
      if (section.separator === null) {
        const value = section.items[0]?.value ?? '';
        return { ...section, shared: { ...section.shared, [name]: value } };
      }
      return { ...section, items: section.items.map((i) => ({ value: i.value, memory: { ...i.memory, [name]: i.value } })) };
    }
    case 'recall': {
      const name = memoryName(block.params);
      const items = section.items.map((item) => {
        const memory = memoryOf(section, item);
        if (!Object.prototype.hasOwnProperty.call(memory, name)) throw new Error(`Nothing remembered as "${name}"`);
        return { value: memory[name], memory: item.memory };
      });
      // With nothing flowing (everything dropped) a recall of a shared value still works.
      if (items.length === 0 && section.separator === null) {
        if (!Object.prototype.hasOwnProperty.call(section.shared, name)) throw new Error(`Nothing remembered as "${name}"`);
        return { ...section, items: [{ value: section.shared[name], memory: {} }] };
      }
      return { ...section, items };
    }
    default:
      throw new Error(`Unknown flow block "${op.control}"`);
  }
}

export function runPipeline(state: PipelineState): BlockResult[] {
  const results: BlockResult[] = [];
  let section: Section = { items: [{ value: state.input, memory: {} }], separator: null, shared: {} };

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
      results.push({ blockId: block.id, output: shown(section), error: null });
      continue;
    }

    const op = OPERATION_MAP[block.operationId];
    if (!op) {
      section = fail(results, block, `Unknown operation: ${block.operationId}`);
      continue;
    }

    try {
      section = op.control ? runControl(op, block, section) : runOperation(op, block, section);
      const output = shown(section);
      if (output.length > MAX_BLOCK_OUTPUT) {
        section = fail(results, block, `Output too large — ${output.length.toLocaleString()} characters, the limit is ${MAX_BLOCK_OUTPUT.toLocaleString()}`);
        continue;
      }
      results.push({ blockId: block.id, output, error: null });
    } catch (err) {
      section = fail(results, block, err instanceof Error ? err.message : String(err));
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
