import { deserializePipeline, serializePipeline, validatePipeline } from '@/lib/blocks/serialization';
import { PipelineState } from '@/lib/blocks/types';

/** Encodes a payload the way the app does, bypassing every validity check. */
function encode(payload: unknown): string {
  return Buffer.from(encodeURIComponent(JSON.stringify(payload))).toString('base64');
}

function link(pipeline: unknown): string | null {
  return deserializePipeline(encode({ v: 1, pipeline })) as unknown as string | null;
}

const rot13: PipelineState = {
  input: 'hello',
  blocks: [{ id: 'b1', operationId: 'rot13', params: {}, enabled: true }],
};

describe('serializePipeline / deserializePipeline', () => {
  it('round-trips a pipeline the builder produced', () => {
    expect(deserializePipeline(serializePipeline(rot13))).toEqual(rot13);
  });

  it('rejects garbage, a wrong version, and a missing pipeline', () => {
    expect(deserializePipeline('not base64 @@@')).toBeNull();
    expect(deserializePipeline(encode({ v: 2, pipeline: rot13 }))).toBeNull();
    expect(deserializePipeline(encode({ v: 1 }))).toBeNull();
  });
});

describe('validation of a shared pipeline', () => {
  it('rejects an operation id that is not in the registry', () => {
    expect(link({ input: 'x', blocks: [{ id: 'b1', operationId: 'nope', params: {}, enabled: true }] })).toBeNull();
  });

  it('rejects operation ids that only resolve through Object.prototype', () => {
    for (const operationId of ['constructor', 'toString', '__proto__']) {
      expect(link({ input: 'x', blocks: [{ id: 'b1', operationId, params: {}, enabled: true }] })).toBeNull();
    }
  });

  it('rejects a malformed block', () => {
    expect(link({ input: 'x', blocks: [{ id: 'b1', operationId: 'rot13', params: {} }] })).toBeNull();
    expect(link({ input: 'x', blocks: [{ id: 'b1', operationId: 'rot13', params: null, enabled: true }] })).toBeNull();
    expect(link({ input: 'x', blocks: [{ id: 42, operationId: 'rot13', params: {}, enabled: true }] })).toBeNull();
    expect(link({ input: 'x', blocks: ['rot13'] })).toBeNull();
  });

  it('rejects a pipeline with no input string or no block list', () => {
    expect(link({ blocks: [] })).toBeNull();
    expect(link({ input: 'x' })).toBeNull();
    expect(link({ input: 'x', blocks: {} })).toBeNull();
  });

  it('caps the block count and the input length', () => {
    const many = Array.from({ length: 51 }, (_, i) => ({ id: `b${i}`, operationId: 'rot13', params: {}, enabled: true }));
    expect(link({ input: 'x', blocks: many })).toBeNull();
    expect(link({ input: 'a'.repeat(100_001), blocks: [] })).toBeNull();
    expect(link({ input: 'a'.repeat(100_000), blocks: [] })).not.toBeNull();
  });

  it('keeps only the params the operation declares', () => {
    const loaded = validatePipeline({
      input: 'hello',
      blocks: [{ id: 'b1', operationId: 'text-replace', params: { find: 'l', replace: 'L', mode: 'plain', evil: 'x' }, enabled: true }],
    });
    expect(loaded?.blocks[0].params).toEqual({ find: 'l', replace: 'L', mode: 'plain' });
  });

  it('falls back to the default for a select value that is not on offer', () => {
    const loaded = validatePipeline({
      input: 'hello',
      blocks: [{ id: 'b1', operationId: 'text-replace', params: { find: 'l', replace: 'L', mode: 'regex-ish' }, enabled: true }],
    });
    expect(loaded?.blocks[0].params.mode).toBe('plain');
  });

  it('falls back to the default for an oversized param', () => {
    const loaded = validatePipeline({
      input: 'hello',
      blocks: [{ id: 'b1', operationId: 'regex-replace', params: { pattern: 'a'.repeat(2001), flags: 'g', replacement: '' }, enabled: true }],
    });
    expect(loaded?.blocks[0].params.pattern).toBe('');
  });

  it('fills in a param the payload left out', () => {
    const loaded = validatePipeline({
      input: 'hello',
      blocks: [{ id: 'b1', operationId: 'text-replace', params: {}, enabled: true }],
    });
    expect(loaded?.blocks[0].params).toEqual({ find: '', replace: '', mode: 'plain' });
  });
});
