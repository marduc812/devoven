import { OPERATION_MAP } from '@/lib/blocks/registry';
import { runPipeline, getFinalOutput } from '@/lib/blocks/pipeline';
import { BlockState, PipelineState } from '@/lib/blocks/types';
import { compare, parseNum, formatNum, parseBool } from '@/lib/blocks/operations/logic';

let nextId = 0;

function block(operationId: string, params: Record<string, string> = {}, linked?: string | null): BlockState {
  const op = OPERATION_MAP[operationId];
  const defaults = Object.fromEntries([
    ...(op?.params ?? []).map((p) => [p.id, p.default]),
    ...(op?.inputs ?? []).map((f) => [f.id, '']),
  ]);
  const b: BlockState = { id: `b${nextId++}`, operationId, params: { ...defaults, ...params }, enabled: true };
  if (linked !== undefined) b.linked = linked;
  return b;
}

function run(input: string, ...blocks: BlockState[]): string {
  return getFinalOutput({ input, blocks });
}

function firstError(input: string, ...blocks: BlockState[]): string | null {
  const results = runPipeline({ input, blocks });
  return results.find((r) => r.error)?.error ?? null;
}

describe('logic blocks are registered', () => {
  it('puts every block in the logic category', () => {
    for (const id of ['length', 'arithmetic', 'round', 'compare', 'logic-and', 'logic-or', 'logic-xor', 'logic-not', 'choose', 'keep-if']) {
      expect(OPERATION_MAP[id]?.category).toBe('logic');
      expect(OPERATION_MAP[id]?.terminal).toBeFalsy();
    }
  });
});

describe('numbers', () => {
  it('parses ordinary numbers and rejects the rest', () => {
    expect(parseNum(' 42 ', 'x')).toBe(42);
    expect(parseNum('-3.5', 'x')).toBe(-3.5);
    expect(parseNum('1,000', 'x')).toBe(1000);
    expect(parseNum('1e3', 'x')).toBe(1000);
    expect(() => parseNum('ten', 'Value A')).toThrow('Value A is "ten", not a number');
    expect(() => parseNum('', 'Value B')).toThrow('not a number');
  });

  it('formats without float noise', () => {
    expect(formatNum(0.1 + 0.2)).toBe('0.3');
    expect(formatNum(1e21)).toBe('1e+21');
    expect(() => formatNum(Infinity)).toThrow('infinite');
  });

  it('does arithmetic on two fields', () => {
    expect(run('7', block('arithmetic', { b: '3', op: 'add' }))).toBe('10');
    expect(run('7', block('arithmetic', { b: '3', op: 'sub' }))).toBe('4');
    expect(run('7', block('arithmetic', { b: '3', op: 'mul' }))).toBe('21');
    expect(run('7', block('arithmetic', { b: '2', op: 'div' }))).toBe('3.5');
    expect(run('7', block('arithmetic', { b: '3', op: 'mod' }))).toBe('1');
    expect(run('2', block('arithmetic', { b: '10', op: 'pow' }))).toBe('1024');
    expect(run('7', block('arithmetic', { b: '3', op: 'min' }))).toBe('3');
    expect(run('7', block('arithmetic', { b: '3', op: 'max' }))).toBe('7');
  });

  it('can take the upstream value on the right-hand side', () => {
    expect(run('3', block('arithmetic', { a: '10', op: 'sub' }, 'b'))).toBe('7');
  });

  it('refuses to divide by zero', () => {
    expect(firstError('1', block('arithmetic', { b: '0', op: 'div' }))).toBe('Cannot divide by zero');
  });

  it('rounds', () => {
    expect(run('3.14159', block('round', { decimals: '2' }))).toBe('3.14');
    expect(run('3.14159', block('round', { mode: 'ceil', decimals: '2' }))).toBe('3.15');
    expect(run('-2.5', block('round', { mode: 'floor' }))).toBe('-3');
    expect(run('-2.5', block('round', { mode: 'trunc' }))).toBe('-2');
    expect(firstError('1', block('round', { decimals: '20' }))).toMatch(/0 to 15/);
  });

  it('measures text', () => {
    expect(run('héllo wörld', block('length'))).toBe('11');
    expect(run('héllo wörld', block('length', { unit: 'bytes' }))).toBe('13');
    expect(run('one two  three', block('length', { unit: 'words' }))).toBe('3');
    expect(run('a\nb\r\nc', block('length', { unit: 'lines' }))).toBe('3');
    expect(run('', block('length', { unit: 'lines' }))).toBe('0');
  });

  it('chains a length into a comparison', () => {
    expect(run('hello world', block('length'), block('compare', { b: '10', how: 'gt' }))).toBe('true');
  });
});

describe('compare', () => {
  it('compares numerically when both sides are numbers', () => {
    expect(compare('10', '9', 'gt')).toBe(true);
    expect(compare('10', '9.0', 'eq')).toBe(false);
    expect(compare('9', '9.0', 'eq')).toBe(true);
    expect(compare(' 5 ', '5', 'lte')).toBe(true);
  });

  it('falls back to text otherwise', () => {
    expect(compare('10', 'nine', 'gt')).toBe(false);
    expect(compare('b', 'a', 'gt')).toBe(true);
    expect(compare('Hello', 'hello', 'eq')).toBe(false);
  });

  it('does the string tests', () => {
    expect(compare('hello world', 'wor', 'contains')).toBe(true);
    expect(compare('hello world', 'wor', 'not-contains')).toBe(false);
    expect(compare('hello', 'he', 'starts')).toBe(true);
    expect(compare('hello', 'lo', 'ends')).toBe(true);
    expect(compare('abc123', '\\d+$', 'matches')).toBe(true);
    expect(compare('  ', '', 'empty')).toBe(true);
    expect(compare('x', '', 'not-empty')).toBe(true);
    expect(() => compare('x', '(', 'matches')).toThrow('not a valid regex');
  });

  it('runs as a block with either side linked', () => {
    expect(run('5', block('compare', { b: '3', how: 'gt' }))).toBe('true');
    expect(run('5', block('compare', { a: '3', how: 'gt' }, 'b'))).toBe('false');
  });
});

describe('booleans', () => {
  it('reads the usual spellings', () => {
    for (const v of ['true', 'TRUE', '1', 'yes', 'on']) expect(parseBool(v, 'x')).toBe(true);
    for (const v of ['false', '0', 'no', 'off', '']) expect(parseBool(v, 'x')).toBe(false);
    expect(() => parseBool('maybe', 'Condition')).toThrow('Condition is "maybe", expected true or false');
  });

  it('combines two values', () => {
    expect(run('true', block('logic-and', { b: 'false' }))).toBe('false');
    expect(run('true', block('logic-or', { b: 'false' }))).toBe('true');
    expect(run('true', block('logic-xor', { b: 'true' }))).toBe('false');
    expect(run('yes', block('logic-not'))).toBe('false');
  });

  it('chooses between two texts', () => {
    expect(run('true', block('choose', { then: 'big', else: 'small' }))).toBe('big');
    expect(run('0', block('choose', { then: 'big', else: 'small' }))).toBe('small');
    expect(firstError('?', block('choose', { then: 'a', else: 'b' }))).toMatch(/expected true or false/);
  });

  it('builds the "if bigger" chain end to end', () => {
    const state: PipelineState = {
      input: '42',
      blocks: [block('compare', { b: '10', how: 'gt' }), block('choose', { then: 'bigger', else: 'smaller' })],
    };
    expect(getFinalOutput(state)).toBe('bigger');
    state.input = '3';
    expect(getFinalOutput(state)).toBe('smaller');
  });
});

describe('keep if', () => {
  it('passes the input through when the test holds', () => {
    expect(run('42', block('keep-if', { how: 'gt', value: '10' }))).toBe('42');
  });

  it('drops it otherwise, without an error, and nothing runs downstream', () => {
    const results = runPipeline({ input: '3', blocks: [block('keep-if', { how: 'gt', value: '10' }), block('sha256')] });
    expect(results[0]).toEqual(expect.objectContaining({ output: '', error: null }));
    expect(results[1]).toEqual(expect.objectContaining({ output: '', error: null }));
  });
});
