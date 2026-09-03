import { OPERATIONS, OPERATION_MAP } from '@/lib/blocks/registry';
import { runPipeline, getFinalOutput, terminalBlockIndex, finalBlock } from '@/lib/blocks/pipeline';
import { BlockState, PipelineState, linkedField } from '@/lib/blocks/types';

let nextBlockId = 0;

function block(operationId: string, params: Record<string, string> = {}, enabled = true): BlockState {
  const op = OPERATION_MAP[operationId];
  const defaults = Object.fromEntries((op?.params ?? []).map((p) => [p.id, p.default]));
  return { id: `b${nextBlockId++}`, operationId, params: { ...defaults, ...params }, enabled };
}

/** A multi-input block with every field typed in and nothing linked. */
function fields(operationId: string, params: Record<string, string>, linked: string | null = null): BlockState {
  return { ...block(operationId, params), linked };
}

function pipeline(input: string, ...blocks: BlockState[]): PipelineState {
  return { input, blocks };
}

describe('block registry', () => {
  it('has no duplicate operation ids', () => {
    const ids = OPERATIONS.map((op) => op.id);
    expect(new Set(ids).size).toBe(ids.length);
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

describe('multi-input operations', () => {
  it('declares at least two fields, each with a unique id that is not also a param', () => {
    const bad: string[] = [];
    for (const op of OPERATIONS) {
      if (!op.inputs) continue;
      if (op.inputs.length < 2) bad.push(`${op.id}: ${op.inputs.length} field`);
      const ids = op.inputs.map((f) => f.id);
      if (new Set(ids).size !== ids.length) bad.push(`${op.id}: duplicate field id`);
      for (const p of op.params) if (ids.includes(p.id)) bad.push(`${op.id}.${p.id}: field and param`);
    }
    expect(bad).toEqual([]);
  });

  it('feeds the first field from upstream unless the block says otherwise', () => {
    const op = OPERATION_MAP['rgb-to-hex'];
    expect(linkedField(op, {})).toBe('r');
    expect(linkedField(op, { linked: 'b' })).toBe('b');
    expect(linkedField(op, { linked: null })).toBeNull();
    expect(linkedField(OPERATION_MAP['rot13'], {})).toBeNull();
  });

  it('converts typed-in fields with nothing linked', () => {
    expect(getFinalOutput(pipeline('', fields('rgb-to-hex', { r: '255', g: '128', b: '0' })))).toBe('#FF8000');
  });

  it('puts the upstream value into the linked field', () => {
    const state = pipeline('255', { ...block('rgb-to-hex', { r: '', g: '128', b: '0' }), linked: 'r' });
    expect(getFinalOutput(state)).toBe('#FF8000');
    // The stored value of the linked field is what the user typed before linking; upstream wins.
    const stale = pipeline('0', { ...block('rgb-to-hex', { r: '255', g: '128', b: '0' }), linked: 'r' });
    expect(getFinalOutput(stale)).toBe('#008000'.toUpperCase());
  });

  it('links the first field for a block that never set one', () => {
    expect(getFinalOutput(pipeline('255', block('rgb-to-hex', { g: '0', b: '0' })))).toBe('#FF0000');
  });

  it('chains a block output into a field of the next block', () => {
    const state = pipeline('ff', block('hex-to-dec'), { ...block('rgb-to-hex', { g: '0', b: '255' }), linked: 'r' });
    expect(getFinalOutput(state)).toBe('#FF00FF');
  });

  it('names the field that is wrong', () => {
    expect(runPipeline(pipeline('', fields('rgb-to-hex', { r: '255', g: '', b: '0' })))[0].error).toBe('G is empty');
    expect(runPipeline(pipeline('', fields('rgb-to-hex', { r: '255', g: '300', b: '0' })))[0].error).toBe('G must be a number between 0 and 255');
    expect(runPipeline(pipeline('', fields('hsl-to-hex', { h: '400', s: '50', l: '50' })))[0].error).toBe('H must be a number between 0 and 360');
  });

  it('converts the other colour spaces', () => {
    expect(getFinalOutput(pipeline('', fields('rgb-to-cmyk', { r: '164', g: '55', b: '55' })))).toBe('cmyk(0%, 66%, 66%, 36%)');
    expect(getFinalOutput(pipeline('', fields('rgb-to-cmyk', { r: '0', g: '0', b: '0' })))).toBe('cmyk(0%, 0%, 0%, 100%)');
    expect(getFinalOutput(pipeline('', fields('cmyk-to-rgb', { c: '85', m: '0', y: '75', k: '14' })))).toBe('rgb(33, 219, 55)');
    expect(getFinalOutput(pipeline('', fields('hsl-to-hex', { h: '0', s: '100', l: '50' })))).toBe('#FF0000');
    expect(getFinalOutput(pipeline('', fields('hsl-to-rgb', { h: '120', s: '100', l: '50' })))).toBe('rgb(0, 255, 0)');
    expect(getFinalOutput(pipeline('', fields('hsv-to-hex', { h: '240', s: '100', v: '100' })))).toBe('#0000FF');
    expect(getFinalOutput(pipeline('#ff0000', block('hex-to-hsl')))).toBe('hsl(0, 100%, 50%)');
    expect(getFinalOutput(pipeline('rgb(0, 255, 0)', block('rgb-to-hsl')))).toBe('hsl(120, 100%, 50%)');
    expect(getFinalOutput(pipeline('#0000ff', block('hex-to-hsv')))).toBe('hsv(240, 100%, 100%)');
  });

  it('round-trips through the colour spaces', () => {
    const state = pipeline('', fields('hsl-to-hex', { h: '210', s: '50', l: '40' }), block('hex-to-hsl'));
    expect(getFinalOutput(state)).toBe('hsl(210, 50%, 40%)');
  });

  it('reports contrast as a terminal block', () => {
    const state = pipeline('#000000', { ...block('color-contrast', { bg: '#ffffff' }), linked: 'fg' }, block('rot13'));
    const results = runPipeline(state);
    expect(results[0].error).toBeNull();
    expect(results[0].output).toContain('Contrast ratio: 21.00:1');
    expect(results[0].output).toContain('Normal text  AA pass  AAA pass');
    expect(results[1].error).toMatch(/Unreachable/);
    expect(runPipeline(pipeline('', fields('color-contrast', { fg: '#767676', bg: '#ffffff' })))[0].output).toContain('Normal text  AA pass  AAA fail');
    expect(runPipeline(pipeline('', fields('color-contrast', { fg: '', bg: '#fff' })))[0].error).toBe('Text is empty');
  });
});

describe('keyed operations as named fields', () => {
  const keyed = OPERATIONS.filter((op) => op.inputs?.some((f) => f.id === 'key' || f.id === 'keyword' || f.id === 'salt'));

  it('covers every cipher, HMAC and KDF that needs a second value', () => {
    const ids = keyed.map((op) => op.id);
    for (const id of ['xor-encrypt', 'vigenere-encrypt', 'beaufort', 'polybius-encode', 'columnar-encrypt',
      'playfair-encrypt', 'hmac-sha256', 'hmac-md5', 'pbkdf2', 'hkdf', 'scrypt', 'argon2']) {
      expect(ids).toContain(id);
    }
  });

  it('never keeps the key as a param as well', () => {
    for (const op of keyed) {
      expect(op.params.map((p) => p.id)).not.toContain('key');
      expect(op.params.map((p) => p.id)).not.toContain('salt');
    }
  });

  it('feeds the message from upstream and takes the key from the block', () => {
    const out = getFinalOutput(pipeline('hello', block('hmac-sha256', { key: 'secret' })));
    expect(out).toBe('88aab3ede8d3adf94d26ab90d3bafd4a2083070c3bcce9c014ee04a443847c0b');
  });

  it('can feed the key from upstream instead', () => {
    const viaKey = getFinalOutput(pipeline('secret', fields('hmac-sha256', { message: 'hello' }, 'key')));
    const viaMessage = getFinalOutput(pipeline('hello', block('hmac-sha256', { key: 'secret' })));
    expect(viaKey).toBe(viaMessage);
  });

  it('derives a key upstream and hands it to the cipher', () => {
    const hashed = getFinalOutput(pipeline('pw', block('md5')));
    const direct = getFinalOutput(pipeline('attack at dawn', block('vigenere-encrypt', { key: hashed })));
    const chained = getFinalOutput(pipeline('pw', block('md5'), fields('vigenere-encrypt', { text: 'attack at dawn' }, 'key')));
    expect(chained).toBe(direct);
  });

  it('runs the XOR round trip with the key format still a param', () => {
    const hex = getFinalOutput(pipeline('secret', block('xor-encrypt', { key: '6b', format: 'hex' })));
    expect(getFinalOutput(pipeline(hex, block('xor-decrypt', { key: 'k' })))).toBe('secret');
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

describe('binary inspection operations', () => {
  // A PNG header, eight bytes of filler, and the IEND chunk that closes a file.
  const PNG_BASE64 = 'iVBORw0KGgpBQUFBQUFBQUlFTkSuQmCC';
  // The same idea for JPEG: an APP0 header, filler, and the FFD9 end marker.
  const JPEG_PLUS_PNG = '/9j/4CAgICAgICAgICAgICAgICD/2YlQTkcNChoKQUFBQUFBQUFJRU5ErkJggg==';

  it('names a file from Base64 bytes', () => {
    const results = runPipeline(pipeline(PNG_BASE64, block('detect-file-type')));
    expect(results[0].error).toBeNull();
    expect(results[0].output).toContain('PNG image');
    expect(results[0].output).toContain('image/png');
  });

  it('reads the same bytes as hex when told to', () => {
    const results = runPipeline(
      pipeline('89504e470d0a1a0a', block('detect-file-type', { source: 'hex' })),
    );
    expect(results[0].output).toContain('PNG image');
  });

  it('inspects the output of an upstream compression block', () => {
    const results = runPipeline(
      pipeline(
        PNG_BASE64,
        block('gzip-compress', { encoding: 'base64', level: '6' }),
        block('scan-embedded-files'),
      ),
    );
    // Gzip's three-byte header is too short to carve, so nothing is found.
    expect(results[1].error).toBeNull();
    expect(results[1].output).toContain('No embedded file signatures found');
  });

  it('carves a PNG appended to a JPEG', () => {
    const results = runPipeline(pipeline(JPEG_PLUS_PNG, block('scan-embedded-files')));
    expect(results[0].error).toBeNull();
    expect(results[0].output).toContain('JPEG image');
    expect(results[0].output).toContain('PNG image');
  });

  it('pulls printable runs out of raw text and keeps chaining', () => {
    const results = runPipeline(
      pipeline(
        // Space is printable, so NUL is what actually separates the runs.
        'keep-this\u0000ok\u0000/usr/local/bin',
        block('extract-strings', { source: 'text', minLength: '4', encoding: 'ascii' }),
        block('case-convert', { case: 'upper' }),
      ),
    );
    expect(results[0].output).toBe('keep-this\n/usr/local/bin');
    expect(results[1].output).toBe('KEEP-THIS\n/USR/LOCAL/BIN');
  });

  it('says so when no run is long enough', () => {
    const results = runPipeline(
      pipeline('ab', block('extract-strings', { source: 'text', minLength: '12', encoding: 'ascii' })),
    );
    expect(results[0].error).toMatch(/No printable runs/);
  });

  it('refuses an empty input', () => {
    const results = runPipeline(pipeline('   ', block('detect-file-type')));
    expect(results[0].error).toMatch(/Nothing to inspect/);
  });
});
