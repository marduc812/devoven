import { OPERATION_MAP } from '@/lib/blocks/registry';
import { runPipeline, getFinalOutput, substituteReferences } from '@/lib/blocks/pipeline';
import { BlockState, PipelineState } from '@/lib/blocks/types';
import { splitItems, separatorOf } from '@/lib/blocks/operations/flow';

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

function outputs(input: string, ...blocks: BlockState[]): (string | null)[] {
  return runPipeline({ input, blocks }).map((r) => r.error ?? r.output);
}

describe('flow blocks are registered', () => {
  it('marks each one as a control block the runner handles', () => {
    expect(OPERATION_MAP['each-line'].control).toBe('each');
    expect(OPERATION_MAP['collect'].control).toBe('collect');
    expect(OPERATION_MAP['remember'].control).toBe('remember');
    expect(OPERATION_MAP['recall'].control).toBe('recall');
    for (const id of ['each-line', 'collect', 'remember', 'recall']) expect(OPERATION_MAP[id].category).toBe('flow');
  });
});

describe('splitting', () => {
  it('splits on every newline convention, commas, whitespace or a custom string', () => {
    expect(splitItems('a\nb\r\nc\rd', { by: 'line' })).toEqual(['a', 'b', 'c', 'd']);
    expect(splitItems('a, b,c', { by: 'comma' })).toEqual(['a', ' b', 'c']);
    expect(splitItems('  a  b\tc ', { by: 'space' })).toEqual(['a', 'b', 'c']);
    expect(splitItems('a::b', { by: 'custom', custom: '::' })).toEqual(['a', 'b']);
    expect(splitItems('', { by: 'line' })).toEqual([]);
    expect(() => splitItems('a', { by: 'custom', custom: '' })).toThrow('custom separator');
  });

  it('joins with the matching separator', () => {
    expect(separatorOf({ by: 'line' })).toBe('\n');
    expect(separatorOf({ by: 'comma' })).toBe(',');
    expect(separatorOf({ by: 'custom', custom: ' | ' })).toBe(' | ');
  });
});

describe('each line', () => {
  it('runs every later block once per line', () => {
    expect(run('hello\nworld', block('each-line'), block('case-convert', { case: 'upper' }))).toBe('HELLO\nWORLD');
  });

  it('shows each block output joined back with the separator', () => {
    expect(outputs('a,b', block('each-line', { by: 'comma' }), block('base64-encode'))).toEqual(['a,b', 'YQ==,Yg==']);
  });

  it('collects with a separator of its own', () => {
    expect(run('a\nb\nc', block('each-line'), block('case-convert', { case: 'upper' }), block('collect', { by: 'comma' }))).toBe('A,B,C');
  });

  it('goes back to one value after Collect', () => {
    expect(run('a\nb', block('each-line'), block('case-convert', { case: 'upper' }), block('collect', { by: 'custom', custom: '' }), block('length'))).toBe('2');
  });

  it('filters lines with Keep If', () => {
    expect(run('3\n12\n7\n40', block('each-line'), block('keep-if', { how: 'gt', value: '10' }))).toBe('12\n40');
  });

  it('sums a column with a per-line arithmetic and a length afterwards', () => {
    expect(run('a\nbb\nccc', block('each-line'), block('length'), block('collect', { by: 'comma' }))).toBe('1,2,3');
  });

  it('names the item that failed', () => {
    expect(outputs('1\nx\n3', block('each-line'), block('arithmetic', { b: '1' }))[1]).toBe('Item 2: Value A is "x", not a number');
  });

  it('refuses to fan out past the item limit', () => {
    const input = Array.from({ length: 10_001 }, () => 'a').join('\n');
    expect(outputs(input, block('each-line'))[0]).toMatch(/Too many items/);
  });

  it('runs a terminal block per item and stops there', () => {
    const results = runPipeline({ input: 'a\nb', blocks: [block('each-line'), block('qr-code'), block('case-convert', { case: 'upper' })] });
    expect(results[1].error).toBeNull();
    expect(results[2].error).toMatch(/Unreachable/);
  });
});

describe('remember and recall', () => {
  it('substitutes known names only', () => {
    expect(substituteReferences('{a} and {b}', { a: '1' })).toBe('1 and {b}');
    expect(substituteReferences('x{2,3}', { a: '1' })).toBe('x{2,3}');
  });

  it('passes the value through and makes it available to later params', () => {
    expect(outputs('hello', block('remember', { name: 'orig' }), block('sha256'), block('compare', { b: '{orig}' }))).toEqual([
      'hello',
      '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
      'false',
    ]);
  });

  it('brings the value back with Recall', () => {
    expect(run('hello', block('remember', { name: 'orig' }), block('sha256'), block('recall', { name: 'orig' }))).toBe('hello');
  });

  it('fills text params as well as fields', () => {
    expect(run('abc', block('remember', { name: 'x' }), block('case-convert', { case: 'upper' }), block('text-replace', { find: 'ABC', replace: '{x}' }))).toBe('abc');
  });

  it('remembers per item inside an Each Line section', () => {
    expect(
      run('a\nb', block('each-line'), block('remember', { name: 'line' }), block('case-convert', { case: 'upper' }), block('compare', { b: '{line}', how: 'ne' }))
    ).toBe('true\ntrue');
    expect(run('a\nb', block('each-line'), block('remember', { name: 'line' }), block('case-convert', { case: 'upper' }), block('recall', { name: 'line' }))).toBe('a\nb');
  });

  it('keeps a value remembered before the section, and reads it after Collect', () => {
    const state: PipelineState = {
      input: 'x\ny',
      blocks: [
        block('remember', { name: 'all' }),
        block('each-line'),
        block('case-convert', { case: 'upper' }),
        block('collect', { by: 'comma' }),
        block('compare', { b: '{all}', how: 'ne' }),
      ],
    };
    expect(getFinalOutput(state)).toBe('true');
  });

  it('reports a bad or missing name', () => {
    expect(outputs('a', block('remember'))[0]).toBe('Give the value a name');
    expect(outputs('a', block('remember', { name: 'no spaces' }))[0]).toMatch(/not a valid name/);
    expect(outputs('a', block('recall', { name: 'nope' }))[0]).toBe('Nothing remembered as "nope"');
  });

  it('still recalls after everything was dropped', () => {
    expect(run('3', block('remember', { name: 'n' }), block('keep-if', { how: 'gt', value: '10' }), block('recall', { name: 'n' }))).toBe('3');
  });
});
