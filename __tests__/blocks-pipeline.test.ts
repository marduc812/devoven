import { OPERATIONS, OPERATION_MAP } from '@/lib/blocks/registry';
import { runPipeline, getFinalOutput, terminalBlockIndex, finalBlock } from '@/lib/blocks/pipeline';
import { BlockState, PipelineState } from '@/lib/blocks/types';

let nextBlockId = 0;

function block(operationId: string, params: Record<string, string> = {}, enabled = true): BlockState {
  const op = OPERATION_MAP[operationId];
  const defaults = Object.fromEntries((op?.params ?? []).map((p) => [p.id, p.default]));
  return { id: `b${nextBlockId++}`, operationId, params: { ...defaults, ...params }, enabled };
}

function pipeline(input: string, ...blocks: BlockState[]): PipelineState {
  return { input, blocks };
}

describe('block registry', () => {
  it('has no duplicate operation ids', () => {
    const ids = OPERATIONS.map((op) => op.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('never marks a terminal operation as chainable', () => {
    const bad = OPERATIONS.filter((op) => op.terminal && op.chainable).map((op) => op.id);
    expect(bad).toEqual([]);
  });

  it('only gives rendered output kinds to terminal operations', () => {
    const bad = OPERATIONS
      .filter((op) => op.output && op.output !== 'text' && !op.terminal)
      .map((op) => op.id);
    expect(bad).toEqual([]);
  });

  it('gives every select param a default that is one of its options', () => {
    const bad: string[] = [];
    for (const op of OPERATIONS) {
      for (const param of op.params) {
        if (param.kind !== 'select') continue;
        if (!param.options?.some((o) => o.value === param.default)) bad.push(`${op.id}.${param.id}`);
      }
    }
    expect(bad).toEqual([]);
  });
});

describe('runPipeline', () => {
  it('chains each block output into the next', () => {
    const state = pipeline('hello', block('base64-encode'), block('sha256'));
    const results = runPipeline(state);
    expect(results[0].output).toBe('aGVsbG8=');
    expect(results[1].error).toBeNull();
    expect(getFinalOutput(state)).toBe(results[1].output);
  });

  it('passes input through disabled blocks unchanged', () => {
    const state = pipeline('hello', block('base64-encode', {}, false), block('rot13'));
    expect(getFinalOutput(state)).toBe('uryyb');
  });

  it('reports an operation error without throwing', () => {
    const state = pipeline('not json', block('json-minify'));
    const results = runPipeline(state);
    expect(results[0].error).toMatch(/./);
    expect(getFinalOutput(state)).toBe('');
  });
});

describe('terminal blocks', () => {
  it('finds the first enabled terminal block', () => {
    expect(terminalBlockIndex([block('rot13'), block('qr-code'), block('sha256')])).toBe(1);
    expect(terminalBlockIndex([block('rot13'), block('sha256')])).toBe(-1);
  });

  it('ignores a disabled terminal block', () => {
    expect(terminalBlockIndex([block('qr-code', {}, false), block('rot13')])).toBe(-1);
  });

  it('marks every block after a terminal block unreachable', () => {
    const state = pipeline('hello', block('qr-code'), block('sha256'), block('rot13'));
    const results = runPipeline(state);
    expect(results[0].error).toBeNull();
    expect(results[1].error).toMatch(/Unreachable/);
    expect(results[2].error).toMatch(/Unreachable/);
  });

  it('takes the final output from the terminal block, not the last block', () => {
    const state = pipeline('hello', block('qr-code'), block('sha256'));
    expect(finalBlock(state)?.operationId).toBe('qr-code');
    expect(getFinalOutput(state)).toBe('hello');
  });

  it('rejects input a QR code cannot hold', () => {
    const state = pipeline('x'.repeat(3000), block('qr-code'));
    expect(runPipeline(state)[0].error).toMatch(/Too long/);
  });

  it('rejects non-ASCII input for CODE128', () => {
    expect(runPipeline(pipeline('héllo', block('barcode')))[0].error).toMatch(/ASCII/);
  });
});

describe('newly registered operations', () => {
  it('round-trips the cipher blocks', () => {
    expect(getFinalOutput(pipeline('Attack at dawn', block('atbash'), block('atbash')))).toBe('Attack at dawn');
    expect(getFinalOutput(pipeline('hello', block('affine-encrypt'), block('affine-decrypt')))).toBe('hello');
    expect(getFinalOutput(pipeline('hello', block('vigenere-encrypt', { key: 'key' }), block('vigenere-decrypt', { key: 'key' })))).toBe('hello');
    expect(getFinalOutput(pipeline('hello', block('rail-fence-encode'), block('rail-fence-decode')))).toBe('hello');
    expect(getFinalOutput(pipeline('secret', block('xor-encrypt', { key: 'k' }), block('xor-decrypt', { key: 'k' })))).toBe('secret');
  });

  it('round-trips the extra encodings', () => {
    expect(getFinalOutput(pipeline('hello', block('base62-encode'), block('base62-decode')))).toBe('hello');
    expect(getFinalOutput(pipeline('hello world', block('base64url-encode'), block('base64url-decode')))).toBe('hello world');
    expect(getFinalOutput(pipeline('a<b', block('escape', { flavor: 'html' }), block('unescape', { flavor: 'html' })))).toBe('a<b');
  });

  it('computes the extra hashes', () => {
    expect(getFinalOutput(pipeline('hello', block('crc32')))).toBe('3610a686');
    expect(getFinalOutput(pipeline('hello', block('crc32', { case: 'upper' })))).toBe('3610A686');
    expect(getFinalOutput(pipeline('hello', block('crc32', { case: 'decimal' })))).toBe('907060870');
  });

  it('converts network values', () => {
    expect(getFinalOutput(pipeline('192.168.1.1', block('ipv4-to-int')))).toBe('3232235777');
    expect(getFinalOutput(pipeline('192.168.1.1', block('ipv4-to-int'), block('int-to-ipv4')))).toBe('192.168.1.1');
  });

  it('reshapes text', () => {
    expect(getFinalOutput(pipeline('a\nb', block('line-numbers-add')))).toBe('1. a\n2. b');
    expect(getFinalOutput(pipeline('one two three', block('tokenize', { mode: 'words' })))).toBe('one\ntwo\nthree');
    expect(getFinalOutput(pipeline('ab', block('repeat-text', { times: '3', separator: '-' })))).toBe('ab-ab-ab');
  });

  it('reformats data', () => {
    expect(getFinalOutput(pipeline('{"b":1,"a":2}', block('json-sort-keys'), block('json-minify')))).toBe('{"a":2,"b":1}');
    expect(getFinalOutput(pipeline('{"a":1}\n{"a":2}', block('jsonl-to-json'), block('json-minify')))).toBe('[{"a":1},{"a":2}]');
  });
});

describe('output budget', () => {
  it('stops a chain that multiplies its input instead of running it out of memory', () => {
    // String to Binary emits nine characters per input character, so six of
    // them turn 800 bytes into 425 million - and the pipeline holds every
    // intermediate at once. A `?p=` link is one URL under 1KB.
    const blocks = Array.from({ length: 6 }, () => block('string-to-binary'));
    const results = runPipeline(pipeline('A'.repeat(800), ...blocks));

    const stoppedAt = results.findIndex((r) => /Output too large/.test(r.error ?? ''));
    expect(stoppedAt).toBe(3);
    expect(results.slice(stoppedAt + 1).every((r) => r.output === '')).toBe(true);
  });

  it('leaves an ordinary expansion alone', () => {
    const results = runPipeline(pipeline('hello world', block('string-to-binary')));
    expect(results[0].error).toBeNull();
    expect(results[0].output.startsWith('01101000')).toBe(true);
  });
});

describe('compression operations', () => {
  it('round-trips through every format', () => {
    const text = 'compress me '.repeat(10);
    const pairs: [string, string][] = [
      ['gzip-compress', 'gzip-decompress'],
      ['zlib-deflate', 'zlib-inflate'],
      ['raw-deflate', 'raw-inflate'],
    ];
    for (const [compress, decompress] of pairs) {
      expect(getFinalOutput(pipeline(text, block(compress), block(decompress)))).toBe(text);
    }
  });

  it('carries the compressed bytes as hex when asked', () => {
    const results = runPipeline(pipeline('hello', block('gzip-compress', { encoding: 'hex' })));
    expect(results[0].error).toBeNull();
    expect(results[0].output.startsWith('1f8b')).toBe(true);
  });

  it('reports input that is not in the chosen format', () => {
    // Valid Base64, but the bytes underneath are not a gzip stream.
    const results = runPipeline(pipeline('bm90IGNvbXByZXNzZWQ=', block('gzip-decompress')));
    expect(results[0].error).toMatch(/not valid gzip/);
  });

  it('reports input that is not valid Base64 at all', () => {
    const results = runPipeline(pipeline('%%%', block('gzip-decompress')));
    expect(results[0].error).toMatch(/not valid Base64/);
  });
});
