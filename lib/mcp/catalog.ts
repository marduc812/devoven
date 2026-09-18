/**
 * The MCP view of the blocks registry.
 *
 * Every operation in `lib/blocks/operations/` that transforms a value becomes
 * one MCP tool, named after its operation id, with a JSON Schema built from
 * its params and input fields. One more tool, `run-pipeline`, chains any of
 * them the way /blocks does. Nothing here touches HTTP: the route handler and
 * the tests both drive this module.
 */
import { OPERATIONS, OPERATION_MAP } from '@/lib/blocks/registry';
import { runPipeline } from '@/lib/blocks/pipeline';
import { BlockState, Operation, ParamDefinition } from '@/lib/blocks/types';

export const PIPELINE_TOOL = 'run-pipeline';
export const LIST_TOOL = 'list-operations';

/**
 * Which tools a server offers. 'full' is one tool per operation, which reads
 * best in a client that can hold a few hundred tools. 'compact' is two tools,
 * a catalogue and the pipeline runner, for clients that cap tools per server.
 */
export type ToolSet = 'full' | 'compact';
export const TOOL_SETS: ToolSet[] = ['full', 'compact'];

/** Longest input a single call may carry; matches what a `?p=` link may hold. */
export const MAX_INPUT_LENGTH = 100_000;
export const MAX_BLOCKS = 50;

export type JsonSchema = {
  type: 'object';
  properties: Record<string, unknown>;
  required?: string[];
  additionalProperties?: boolean;
};

export type McpTool = {
  name: string;
  description: string;
  inputSchema: JsonSchema;
};

export type ToolOutcome = { text: string; isError: boolean };

/**
 * Operations worth calling on their own. Flow blocks only mean something
 * inside a pipeline, and a QR or barcode block returns its own input for the
 * page to draw, which is nothing to an agent.
 */
export function callableOperations(): Operation[] {
  return OPERATIONS.filter((op) => !op.control && (op.output ?? 'text') === 'text');
}

function paramSchema(param: ParamDefinition): Record<string, unknown> {
  if (param.kind === 'select') {
    const options = param.options ?? [];
    return {
      type: 'string',
      description: `${param.label}. ${options.map((o) => `${o.value}: ${o.label}`).join('; ')}`,
      enum: options.map((o) => o.value),
      default: param.default,
    };
  }
  return { type: 'string', description: param.label, default: param.default };
}

export function describeOperation(op: Operation): string {
  const parts = [`${op.name} (${op.category}).`];
  if (op.inputs) {
    parts.push(`Takes ${op.inputs.map((f) => `"${f.id}" (${f.label})`).join(' and ')}.`);
  }
  if (op.terminal) parts.push('Returns a human-readable report rather than a value.');
  return parts.join(' ');
}

export function operationSchema(op: Operation): JsonSchema {
  const properties: Record<string, unknown> = {};
  const required: string[] = [];
  if (op.inputs) {
    for (const field of op.inputs) {
      properties[field.id] = { type: 'string', description: field.label };
      required.push(field.id);
    }
  } else {
    properties.input = { type: 'string', description: 'The text to transform.' };
    required.push('input');
  }
  for (const param of op.params) properties[param.id] = paramSchema(param);
  return { type: 'object', properties, required, additionalProperties: false };
}

const pipelineTool: McpTool = {
  name: PIPELINE_TOOL,
  description:
    'Run several operations in a row, each block\'s output feeding the next, like the /blocks page. ' +
    'Every other tool on this server is a valid operation id, plus the flow blocks each-line, collect, remember and recall. ' +
    'A multi-input operation (an HMAC, say) receives the upstream value in its first field unless "linked" names another; the rest come from "params". ' +
    'Returns the last block\'s output.',
  inputSchema: {
    type: 'object',
    properties: {
      input: { type: 'string', description: 'What the first block receives.' },
      blocks: {
        type: 'array',
        description: 'The operations to run, in order.',
        maxItems: MAX_BLOCKS,
        items: {
          type: 'object',
          properties: {
            operation: { type: 'string', description: 'An operation id, such as base64-decode or sha256.' },
            params: {
              type: 'object',
              description: 'Settings and extra fields for the operation, by id. Omitted params take their defaults.',
              additionalProperties: { type: 'string' },
            },
            linked: {
              type: ['string', 'null'],
              description: 'Multi-input operations only: the field the previous block feeds, or null to feed none.',
            },
          },
          required: ['operation'],
          additionalProperties: false,
        },
      },
    },
    required: ['input', 'blocks'],
    additionalProperties: false,
  },
};

const CATEGORIES = Array.from(new Set(OPERATIONS.map((op) => op.category)));

const listTool: McpTool = {
  name: LIST_TOOL,
  description:
    'List the operations run-pipeline can run: one line per operation with its id, name, category and settings. ' +
    'Filter by category or by a word in the id or name to keep the list short.',
  inputSchema: {
    type: 'object',
    properties: {
      category: { type: 'string', description: 'Only operations in this category.', enum: CATEGORIES },
      search: { type: 'string', description: 'Only operations whose id or name contains this text (case-insensitive).' },
    },
    additionalProperties: false,
  },
};

/** One line of the catalogue: id, name, category, then the fields and settings. */
export function describeLine(op: Operation): string {
  const notes: string[] = [];
  if (op.inputs) notes.push(`fields: ${op.inputs.map((f) => f.id).join(', ')}`);
  for (const param of op.params) {
    if (param.kind === 'select') {
      notes.push(`${param.id}: ${(param.options ?? []).map((o) => o.value).join('|')} (default ${param.default})`);
    } else {
      notes.push(`${param.id}: text${param.default ? ` (default ${JSON.stringify(param.default)})` : ''}`);
    }
  }
  if (op.terminal) notes.push('report');
  const suffix = notes.length ? ` [${notes.join('; ')}]` : '';
  return `${op.id} — ${op.name} (${op.category})${suffix}`;
}

/** Every operation run-pipeline accepts: the callable ones plus the flow blocks. */
export function pipelineOperations(): Operation[] {
  return OPERATIONS.filter((op) => (op.output ?? 'text') === 'text');
}

export function listOperations(args: Record<string, unknown>): string {
  const category = args.category;
  if (category !== undefined && category !== null && (typeof category !== 'string' || !CATEGORIES.includes(category as Operation['category']))) {
    throw new Error(`"category" must be one of: ${CATEGORIES.join(', ')}`);
  }
  const search = stringArg(args, 'search', '"search"').trim().toLowerCase();
  const lines = pipelineOperations()
    .filter((op) => !category || op.category === category)
    .filter((op) => !search || op.id.includes(search) || op.name.toLowerCase().includes(search))
    .map(describeLine);
  if (lines.length === 0) return 'No operations match.';
  return lines.join('\n');
}

export function mcpTools(set: ToolSet = 'full'): McpTool[] {
  if (set === 'compact') return [listTool, pipelineTool];
  const tools = callableOperations().map((op) => ({
    name: op.id,
    description: describeOperation(op),
    inputSchema: operationSchema(op),
  }));
  return [...tools, pipelineTool];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringArg(args: Record<string, unknown>, key: string, label: string): string {
  const value = args[key];
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  throw new Error(`${label} must be a string`);
}

/**
 * Turns tool arguments into a block the pipeline can run, rejecting what the
 * schema forbids. A select that is handed a value outside its options is an
 * error here, not a silent fall-back to the default the way a shared link is
 * treated: an agent that passes a wrong option should hear about it.
 */
export function toBlock(op: Operation, args: Record<string, unknown>, id: string, linked?: string | null): BlockState {
  const params: Record<string, string> = {};
  for (const param of op.params) {
    const given = args[param.id];
    if (given === undefined || given === null) {
      params[param.id] = param.default;
      continue;
    }
    const value = stringArg(args, param.id, `"${param.id}"`);
    if (param.kind === 'select' && !param.options?.some((o) => o.value === value)) {
      const allowed = (param.options ?? []).map((o) => o.value).join(', ');
      throw new Error(`"${param.id}" must be one of: ${allowed}`);
    }
    params[param.id] = value;
  }
  if (!op.inputs) return { id, operationId: op.id, params, enabled: true };

  for (const field of op.inputs) params[field.id] = stringArg(args, field.id, `"${field.id}"`);
  let link: string | null | undefined = undefined;
  if (linked !== undefined) {
    if (linked !== null && !op.inputs.some((f) => f.id === linked)) {
      throw new Error(`"linked" must be null or one of: ${op.inputs.map((f) => f.id).join(', ')}`);
    }
    link = linked;
  }
  return { id, operationId: op.id, params, enabled: true, linked: link };
}

function checkInput(input: string): void {
  if (input.length > MAX_INPUT_LENGTH) {
    throw new Error(`Input too long: ${input.length.toLocaleString()} characters, the limit is ${MAX_INPUT_LENGTH.toLocaleString()}`);
  }
}

function runOne(op: Operation, args: Record<string, unknown>): string {
  const block = toBlock(op, args, 'b0');
  // A multi-input tool has no upstream value; every field was typed in.
  if (op.inputs) block.linked = null;
  const input = op.inputs ? '' : stringArg(args, 'input', '"input"');
  checkInput(input);
  for (const value of Object.values(block.params)) checkInput(value);
  const [result] = runPipeline({ input, blocks: [block] });
  if (result.error) throw new Error(result.error);
  return result.output;
}

function runChain(args: Record<string, unknown>): string {
  const input = stringArg(args, 'input', '"input"');
  checkInput(input);
  const raw = args.blocks;
  if (!Array.isArray(raw)) throw new Error('"blocks" must be an array');
  if (raw.length === 0) throw new Error('"blocks" is empty');
  if (raw.length > MAX_BLOCKS) throw new Error(`Too many blocks: ${raw.length}, the limit is ${MAX_BLOCKS}`);

  const blocks: BlockState[] = [];
  for (const [index, entry] of raw.entries()) {
    const where = `Block ${index + 1}`;
    if (!isRecord(entry)) throw new Error(`${where} must be an object`);
    const operationId = entry.operation;
    if (typeof operationId !== 'string') throw new Error(`${where}: "operation" must be a string`);
    if (!Object.prototype.hasOwnProperty.call(OPERATION_MAP, operationId)) {
      throw new Error(`${where}: unknown operation "${operationId}"`);
    }
    const op = OPERATION_MAP[operationId];
    if ((op.output ?? 'text') !== 'text') throw new Error(`${where}: ${op.name} draws an image and cannot run here`);
    const params = entry.params === undefined ? {} : entry.params;
    if (!isRecord(params)) throw new Error(`${where}: "params" must be an object`);
    const linked = entry.linked;
    if (linked !== undefined && linked !== null && typeof linked !== 'string') {
      throw new Error(`${where}: "linked" must be a string or null`);
    }
    try {
      const block = toBlock(op, params, `b${index}`, linked as string | null | undefined);
      for (const value of Object.values(block.params)) checkInput(value);
      blocks.push(block);
    } catch (err) {
      throw new Error(`${where} (${op.name}): ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  const results = runPipeline({ input, blocks });
  for (const [index, result] of results.entries()) {
    if (result.error) {
      const op = OPERATION_MAP[blocks[index].operationId];
      throw new Error(`Block ${index + 1} (${op.name}): ${result.error}`);
    }
  }
  return results[results.length - 1].output;
}

/** Runs one tool by name. Never throws: a failure comes back as an error outcome. */
export function callTool(name: string, args: unknown, set: ToolSet = 'full'): ToolOutcome {
  const input = isRecord(args) ? args : {};
  try {
    if (name === PIPELINE_TOOL) return { text: runChain(input), isError: false };
    if (set === 'compact') {
      if (name === LIST_TOOL) return { text: listOperations(input), isError: false };
      throw new Error(`Unknown tool "${name}". This server offers ${LIST_TOOL} and ${PIPELINE_TOOL}; run an operation as a one-block pipeline.`);
    }
    const op = Object.prototype.hasOwnProperty.call(OPERATION_MAP, name) ? OPERATION_MAP[name] : undefined;
    if (!op || op.control || (op.output ?? 'text') !== 'text') throw new Error(`Unknown tool "${name}"`);
    return { text: runOne(op, input), isError: false };
  } catch (err) {
    return { text: err instanceof Error ? err.message : String(err), isError: true };
  }
}
