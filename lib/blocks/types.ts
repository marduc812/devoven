export type ParamDefinition = {
  id: string;
  label: string;
  kind: 'select' | 'text';
  options?: { value: string; label: string }[]; // for 'select'
  default: string;
};

export type OperationCategory =
  | 'encoding'
  | 'hashing'
  | 'conversion'
  | 'data'
  | 'text'
  | 'network'
  | 'analysis';

// How the result of an operation should be presented. 'text' is a plain string;
// the others are rendered artifacts and only make sense at the end of a pipeline.
export type OperationOutput = 'text' | 'qr' | 'barcode';

export type Operation = {
  id: string;
  name: string;
  category: OperationCategory;
  params: ParamDefinition[];
  chainable: boolean; // false = warn in picker (e.g. color converters)
  // Terminal operations end the pipeline: their result is a rendered artifact or
  // a human-readable report, not a value another block can transform.
  terminal?: boolean;
  output?: OperationOutput; // defaults to 'text'
  fn: (input: string, params: Record<string, string>) => string;
};

export type BlockState = {
  id: string;
  operationId: string;
  params: Record<string, string>;
  enabled: boolean;
};

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
