import { BlockState, PipelineState } from './types';
import { OPERATION_MAP } from './registry';

type SerializedPayload = {
  v: 1;
  pipeline: PipelineState;
};

// A `?p=` link is attacker-supplied and runs the moment /blocks loads, so what
// it decodes to has to look like something the builder itself could have built
// before any of it reaches runPipeline. The caps are far above any pipeline a
// person would share by hand, and the server rejects query strings past ~16KB
// long before the input cap bites.
const MAX_INPUT_LENGTH = 100_000;
const MAX_BLOCKS = 50;
const MAX_PARAM_LENGTH = 2_000;
const MAX_ID_LENGTH = 64;

export function serializePipeline(state: PipelineState): string {
  const payload: SerializedPayload = { v: 1, pipeline: state };
  return btoa(encodeURIComponent(JSON.stringify(payload)));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function own(obj: Record<string, unknown>, key: string): unknown {
  return Object.prototype.hasOwnProperty.call(obj, key) ? obj[key] : undefined;
}

function validateBlock(raw: unknown): BlockState | null {
  if (!isRecord(raw)) return null;

  const id = own(raw, 'id');
  const operationId = own(raw, 'operationId');
  const params = own(raw, 'params');
  const enabled = own(raw, 'enabled');

  if (typeof id !== 'string' || id.length === 0 || id.length > MAX_ID_LENGTH) return null;
  if (typeof operationId !== 'string') return null;
  if (typeof enabled !== 'boolean') return null;
  if (!isRecord(params)) return null;
  // hasOwnProperty, not `in`: 'constructor' and 'toString' would otherwise
  // resolve through Object.prototype and pass for operation ids.
  if (!Object.prototype.hasOwnProperty.call(OPERATION_MAP, operationId)) return null;

  const op = OPERATION_MAP[operationId];
  const clean: Record<string, string> = {};

  // Only the parameters the operation declares survive, and a select can only
  // hold one of the values it offers. Anything else falls back to the default,
  // which is also what keeps older links working when an option is renamed.
  for (const def of op.params) {
    const value = own(params, def.id);
    if (typeof value !== 'string' || value.length > MAX_PARAM_LENGTH) {
      clean[def.id] = def.default;
      continue;
    }
    if (def.kind === 'select' && !def.options?.some((o) => o.value === value)) {
      clean[def.id] = def.default;
      continue;
    }
    clean[def.id] = value;
  }

  if (!op.inputs || op.inputs.length === 0) {
    return { id, operationId, params: clean, enabled };
  }

  // A multi-input block also carries one value per field, and the name of the
  // field the previous block feeds. A link that names a field the operation
  // does not have falls back to the first field, like a missing one.
  for (const field of op.inputs) {
    const value = own(params, field.id);
    clean[field.id] = typeof value === 'string' && value.length <= MAX_PARAM_LENGTH ? value : '';
  }
  const linked = own(raw, 'linked');
  const linkedClean =
    linked === null ? null
    : typeof linked === 'string' && op.inputs.some((f) => f.id === linked) ? linked
    : op.inputs[0].id;

  return { id, operationId, params: clean, enabled, linked: linkedClean };
}

/** The one gate between a decoded payload and a pipeline the app will run. */
export function validatePipeline(raw: unknown): PipelineState | null {
  if (!isRecord(raw)) return null;

  const input = own(raw, 'input');
  const blocks = own(raw, 'blocks');

  if (typeof input !== 'string' || input.length > MAX_INPUT_LENGTH) return null;
  if (!Array.isArray(blocks) || blocks.length > MAX_BLOCKS) return null;

  const validated: BlockState[] = [];
  for (const block of blocks) {
    const clean = validateBlock(block);
    if (!clean) return null;
    validated.push(clean);
  }

  return { input, blocks: validated };
}

export function deserializePipeline(encoded: string): PipelineState | null {
  try {
    const json = decodeURIComponent(atob(encoded));
    const payload = JSON.parse(json) as unknown;
    if (!isRecord(payload) || payload.v !== 1) return null;
    return validatePipeline(own(payload, 'pipeline'));
  } catch {
    return null;
  }
}
