export type ParamDefinition = {
  id: string;
  label: string;
  kind: 'select' | 'text';
  options?: { value: string; label: string }[]; // for 'select'
  default: string;
};

// One named field of an operation that takes several values at once (R, G and
// B for a colour, say). Values live in `BlockState.params` under the field id,
// and the pipeline feeds the previous block's output into the linked field.
export type InputField = {
  id: string;
  label: string;
  placeholder?: string;
};

export type OperationCategory =
  | 'encoding'
  | 'hashing'
  | 'conversion'
  | 'data'
  | 'text'
  | 'network'
  | 'analysis'
  | 'logic'
  | 'flow';

// How the result of an operation should be presented. 'text' is a plain string;
// the others are rendered artifacts and only make sense at the end of a pipeline.
export type OperationOutput = 'text' | 'qr' | 'barcode';

export type Operation = {
  id: string;
  name: string;
  category: OperationCategory;
  params: ParamDefinition[];
  // Terminal operations end the pipeline: their result is a rendered artifact or
  // a human-readable report, not a value another block can transform.
  terminal?: boolean;
  output?: OperationOutput; // defaults to 'text'
  // Two or more named fields instead of the single input string. `fn` then
  // reads them from `params`; `input` is whatever the linked field received.
  inputs?: InputField[];
  // Flow blocks change how the pipeline runs rather than transforming a value,
  // so the runner handles them itself and never calls `fn`:
  //   'each'     splits the value into items and runs every later block per item
  //   'collect'  joins the items back into one value
  //   'remember' stores the value under a name for `{name}` references downstream
  //   'recall'   replaces the value with a remembered one
  control?: 'each' | 'collect' | 'remember' | 'recall';
  fn: (input: string, params: Record<string, string>) => string;
};

/**
 * Thrown by an operation to drop the current item instead of producing a
 * value. Inside an Each Line section that removes the line; outside it the
 * pipeline carries on with nothing.
 */
export class DroppedItem extends Error {
  constructor() {
    super('dropped');
    this.name = 'DroppedItem';
  }
}

export type BlockState = {
  id: string;
  operationId: string;
  params: Record<string, string>;
  enabled: boolean;
  // Multi-input operations only: the field that takes the previous block's
  // output, or null when every field is typed in. Absent means the first field.
  linked?: string | null;
};

/** The input field that receives the upstream value, or null when none does. */
export function linkedField(op: Operation, block: Pick<BlockState, 'linked'>): string | null {
  if (!op.inputs || op.inputs.length === 0) return null;
  if (block.linked === undefined) return op.inputs[0].id;
  return block.linked;
}

export type PipelineState = {
  input: string;
  blocks: BlockState[];
};

export type BlockResult = {
  blockId: string;
  output: string;
  error: string | null;
};

export type SavedPipeline = {
  name: string;
  savedAt: number;
  pipeline: PipelineState;
};
