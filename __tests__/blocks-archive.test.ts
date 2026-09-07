import { OPERATION_MAP } from '@/lib/blocks/registry';
import { runPipeline, getFinalOutput } from '@/lib/blocks/pipeline';
import { BlockState } from '@/lib/blocks/types';
import { createZip, ZipInput } from '@/Components/Functions/ArchiveTools/logic';
import { bytesToBase64, bytesToHex, compressBytes } from '@/Components/Functions/CompressionTools/logic';

let nextId = 0;

function block(operationId: string, params: Record<string, string> = {}): BlockState {
  const op = OPERATION_MAP[operationId];
  const defaults = Object.fromEntries((op?.params ?? []).map(p => [p.id, p.default]));
  return { id: `b${nextId++}`, operationId, params: { ...defaults, ...params }, enabled: true };
}

const run = (input: string, ...blocks: BlockState[]): string => getFinalOutput({ input, blocks });
const outputs = (input: string, ...blocks: BlockState[]): (string | null)[] =>
  runPipeline({ input, blocks }).map(r => r.error ?? r.output);

const encode = (text: string) => new TextEncoder().encode(text);

const files: ZipInput[] = [
  { name: 'readme.txt', bytes: encode('read me') },
  { name: 'build/app.json', bytes: encode('{"ok":true}') },
  { name: 'logo.png', bytes: new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13]) },
];

const zipBase64 = () => bytesToBase64(createZip(files));

describe('registration', () => {
  it('registers the four archive operations under the right categories', () => {
    expect(OPERATION_MAP['archive-list'].category).toBe('data');
    expect(OPERATION_MAP['archive-extract'].category).toBe('data');
    expect(OPERATION_MAP['zip-create'].category).toBe('data');
    expect(OPERATION_MAP['archive-info'].category).toBe('analysis');
  });

  it('ends the pipeline on Archive Info but not on the others', () => {
    expect(OPERATION_MAP['archive-info'].terminal).toBe(true);
    expect(OPERATION_MAP['archive-list'].terminal).toBeUndefined();
    expect(OPERATION_MAP['archive-extract'].terminal).toBeUndefined();
    expect(OPERATION_MAP['zip-create'].terminal).toBeUndefined();
  });
});

describe('List Archive Contents', () => {
  it('lists names one per line', () => {
    expect(run(zipBase64(), block('archive-list'))).toBe('readme.txt\nbuild/app.json\nlogo.png');
  });

  it('reads a hex archive when told to', () => {
    expect(run(bytesToHex(createZip(files)), block('archive-list', { source: 'hex' }))).toContain('readme.txt');
  });

  it('chains into Each Line and Keep If', () => {
    const result = run(
      zipBase64(),
      block('archive-list'),
      block('each-line'),
      block('keep-if', { how: 'ends', value: '.json' }),
    );
    expect(result).toBe('build/app.json');
  });

  it('explains an empty input rather than throwing something opaque', () => {
    expect(outputs('   ', block('archive-list'))[0]).toBe('No archive to read');
  });

  it('says a .tar.gz needs decompressing first', () => {
    const gz = bytesToBase64(compressBytes(encode('anything'), 'gzip'));
    expect(outputs(gz, block('archive-list'))[0]).toMatch(/decompressed first/);
  });
});

describe('Extract from Archive', () => {
  it('pulls one entry out as text', () => {
    expect(run(zipBase64(), block('archive-extract', { file: 'build/app.json' }))).toBe('{"ok":true}');
  });

  it('feeds the extracted text into the next block', () => {
    const result = run(
      zipBase64(),
      block('archive-extract', { file: 'app.json' }),
      block('json-format'),
    );
    expect(result).toContain('"ok"');
    expect(result.split('\n').length).toBeGreaterThan(1);
  });

  it('hands a binary entry onward as Base64 for the byte blocks', () => {
    const result = run(
      zipBase64(),
      block('archive-extract', { file: 'logo.png', as: 'base64' }),
      block('detect-file-type'),
    );
    expect(result).toMatch(/PNG/i);
  });

  it('reports a name that is not in the archive, and says what is', () => {
    const error = outputs(zipBase64(), block('archive-extract', { file: 'missing.txt' }))[0];
    expect(error).toMatch(/not in the archive/);
    expect(error).toContain('readme.txt');
  });

  it('asks for a file name when the param is blank', () => {
    expect(outputs(zipBase64(), block('archive-extract'))[0]).toMatch(/which file/i);
  });
});

describe('Archive Info', () => {
  it('reports the whole listing as a table', () => {
    const report = run(zipBase64(), block('archive-info'));
    expect(report).toContain('ZIP archive');
    expect(report).toContain('Packed');
    expect(report).toContain('3 files');
  });

  it('marks a block after it unreachable', () => {
    const results = outputs(zipBase64(), block('archive-info'), block('archive-list'));
    expect(results[1]).toMatch(/Unreachable/);
  });
});

describe('Create Zip', () => {
  it('round-trips back through the listing blocks', () => {
    expect(run('hello', block('zip-create', { file: 'greeting.txt' }), block('archive-list')))
      .toBe('greeting.txt');
    expect(run('hello', block('zip-create', { file: 'greeting.txt' }), block('archive-extract', { file: 'greeting.txt' })))
      .toBe('hello');
  });

  it('falls back to a default name rather than writing an unnamed entry', () => {
    expect(run('x', block('zip-create', { file: '  ' }), block('archive-list'))).toBe('file.txt');
  });

  it('is recognised downstream as a ZIP', () => {
    expect(run('x', block('zip-create'), block('detect-file-type'))).toMatch(/zip/i);
  });
});

describe('the .tar.gz pipeline', () => {
  // A tar of two files, gzipped, which is how most Linux archives arrive.
  function tarGzBase64(): string {
    const header = (name: string, size: number) => {
      const b = new Uint8Array(512);
      const put = (text: string, at: number) => {
        for (let i = 0; i < text.length; i++) b[at + i] = text.charCodeAt(i);
      };
      put(name, 0);
      put('000644 \0', 100);
      put(size.toString(8).padStart(11, '0') + ' ', 124);
      put('14000000000 ', 136);
      put('        ', 148);
      b[156] = '0'.charCodeAt(0);
      put('ustar\0', 257);
      put('00', 263);
      let sum = 0;
      for (let i = 0; i < 512; i++) sum += b[i];
      put(sum.toString(8).padStart(6, '0') + '\0 ', 148);
      return b;
    };

    const members: { name: string; body: Uint8Array }[] = [
      { name: 'etc/hosts', body: encode('127.0.0.1 localhost\n') },
      { name: 'etc/passwd', body: encode('root:x:0:0\n') },
    ];

    const blocks: Uint8Array[] = [];
    for (const m of members) {
      blocks.push(header(m.name, m.body.length));
      const padded = new Uint8Array(Math.ceil(m.body.length / 512) * 512);
      padded.set(m.body);
      blocks.push(padded);
    }
    blocks.push(new Uint8Array(1024));

    const tar = new Uint8Array(blocks.reduce((n, b) => n + b.length, 0));
    let at = 0;
    for (const b of blocks) {
      tar.set(b, at);
      at += b.length;
    }
    return bytesToBase64(compressBytes(tar, 'gzip'));
  }

  it('lists a .tar.gz once the gzip layer is peeled off', () => {
    expect(run(tarGzBase64(), block('gzip-decompress', { as: 'base64' }), block('archive-list'))).toBe(
      'etc/hosts\netc/passwd',
    );
  });

  it('extracts a file straight out of a .tar.gz', () => {
    const result = run(
      tarGzBase64(),
      block('gzip-decompress', { as: 'base64' }),
      block('archive-extract', { file: 'etc/hosts' }),
    );
    expect(result).toBe('127.0.0.1 localhost\n');
  });
});
