import {
  archiveNames,
  archiveTotals,
  createZip,
  describeArchive,
  detectArchiveFormat,
  extractArchiveEntry,
  formatArchiveListing,
  listArchive,
} from '@/Components/Functions/ArchiveTools/logic';

const encode = (text: string) => new TextEncoder().encode(text);
const decode = (bytes: Uint8Array) => new TextDecoder().decode(bytes);

const sampleZip = () =>
  createZip([
    { name: 'readme.txt', bytes: encode('hello from the archive') },
    { name: 'build/app.json', bytes: encode('{"name":"devoven"}') },
    { name: 'data.csv', bytes: encode('a,b,c\n1,2,3\n'.repeat(40)) },
  ]);

// ─── a minimal ustar writer, so the tar tests do not need a fixture file ─────

type TarFile = { name: string; body: string; type?: string };

function buildTar(files: TarFile[]): Uint8Array {
  const blocks: Uint8Array[] = [];

  const header = (name: string, size: number, type: string) => {
    const block = new Uint8Array(512);
    const put = (text: string, at: number) => {
      for (let i = 0; i < text.length; i++) block[at + i] = text.charCodeAt(i);
    };
    put(name.slice(0, 100), 0);
    put('000644 \0', 100); // mode
    put('000000 \0', 108); // uid
    put('000000 \0', 116); // gid
    put(size.toString(8).padStart(11, '0') + ' ', 124);
    put('14000000000 ', 136); // mtime, octal seconds
    put('        ', 148); // checksum is spaces while it is computed
    block[156] = type.charCodeAt(0);
    put('ustar\0', 257);
    put('00', 263);

    let sum = 0;
    for (let i = 0; i < 512; i++) sum += block[i];
    put(sum.toString(8).padStart(6, '0') + '\0 ', 148);
    return block;
  };

  for (const file of files) {
    const body = encode(file.body);
    blocks.push(header(file.name, body.length, file.type ?? '0'));
    if (body.length > 0) {
      const padded = new Uint8Array(Math.ceil(body.length / 512) * 512);
      padded.set(body);
      blocks.push(padded);
    }
  }
  blocks.push(new Uint8Array(1024)); // two zero blocks terminate the archive

  const total = blocks.reduce((n, b) => n + b.length, 0);
  const out = new Uint8Array(total);
  let at = 0;
  for (const block of blocks) {
    out.set(block, at);
    at += block.length;
  }
  return out;
}

const sampleTar = () =>
  buildTar([
    { name: 'etc/', body: '', type: '5' },
    { name: 'etc/hosts', body: '127.0.0.1 localhost\n' },
    { name: 'var/log/app.log', body: 'started\nstopped\n' },
  ]);

// ─── detection ───────────────────────────────────────────────────────────────

describe('detectArchiveFormat', () => {
  it('recognises a zip by its local file header', () => {
    expect(detectArchiveFormat(sampleZip())).toBe('zip');
  });

  it('recognises a tar by the ustar magic at offset 257', () => {
    expect(detectArchiveFormat(sampleTar())).toBe('tar');
  });

  it('returns null for anything else', () => {
    expect(detectArchiveFormat(encode('just some text'))).toBeNull();
    expect(detectArchiveFormat(new Uint8Array(0))).toBeNull();
  });

  it('recognises an empty zip, which has no local header at all', () => {
    expect(detectArchiveFormat(new Uint8Array([0x50, 0x4b, 0x05, 0x06]))).toBe('zip');
  });
});

// ─── zip ─────────────────────────────────────────────────────────────────────

describe('zip listing', () => {
  it('lists every entry with its sizes and method', () => {
    const listing = listArchive(sampleZip());
    expect(listing.format).toBe('zip');
    expect(listing.entries.map(e => e.name)).toEqual([
      'readme.txt',
      'build/app.json',
      'data.csv',
    ]);
    const readme = listing.entries[0];
    expect(readme.size).toBe('hello from the archive'.length);
    expect(readme.isDirectory).toBe(false);
    expect(readme.encrypted).toBe(false);
    expect(['Store', 'Deflate']).toContain(readme.method);
  });

  it('reports the repetitive entry as deflated smaller than its input', () => {
    const listing = listArchive(sampleZip());
    const csv = listing.entries.find(e => e.name === 'data.csv')!;
    expect(csv.method).toBe('Deflate');
    expect(csv.compressedSize).toBeLessThan(csv.size);
  });

  it('carries a CRC32 for each entry', () => {
    const listing = listArchive(sampleZip());
    expect(listing.entries[0].crc32).toBeGreaterThan(0);
  });

  it('rejects bytes that are not an archive', () => {
    expect(() => listArchive(encode('not an archive'))).toThrow(/Not a ZIP or TAR/);
  });

  it('names the .tar.gz case in the error, since that is the common mistake', () => {
    expect(() => listArchive(new Uint8Array([0x1f, 0x8b, 0x08, 0x00]))).toThrow(/decompressed first/);
  });

  it('reports a truncated zip rather than returning nothing', () => {
    const zip = sampleZip();
    expect(() => listArchive(zip.subarray(0, zip.length - 40))).toThrow(/truncated|end-of-central-directory/);
  });
});

describe('zip extraction', () => {
  it('extracts an entry by its exact name', () => {
    expect(decode(extractArchiveEntry(sampleZip(), 'readme.txt'))).toBe('hello from the archive');
  });

  it('extracts a nested entry by its full path', () => {
    expect(decode(extractArchiveEntry(sampleZip(), 'build/app.json'))).toBe('{"name":"devoven"}');
  });

  it('falls back to a unique file name without the path', () => {
    expect(decode(extractArchiveEntry(sampleZip(), 'app.json'))).toBe('{"name":"devoven"}');
  });

  it('matches case-insensitively before giving up', () => {
    expect(decode(extractArchiveEntry(sampleZip(), 'README.TXT'))).toBe('hello from the archive');
  });

  it('lists what is available when the name is wrong', () => {
    expect(() => extractArchiveEntry(sampleZip(), 'nope.txt')).toThrow(/readme\.txt/);
  });

  it('asks for a name when given none', () => {
    expect(() => extractArchiveEntry(sampleZip(), '   ')).toThrow(/which file/i);
  });

  it('refuses to guess between two files of the same name', () => {
    const zip = createZip([
      { name: 'a/index.js', bytes: encode('one') },
      { name: 'b/index.js', bytes: encode('two') },
    ]);
    expect(() => extractArchiveEntry(zip, 'index.js')).toThrow(/not in the archive/);
    expect(decode(extractArchiveEntry(zip, 'b/index.js'))).toBe('two');
  });
});

describe('createZip', () => {
  it('round-trips through listArchive and extractArchiveEntry', () => {
    const zip = createZip([{ name: 'note.md', bytes: encode('# title') }]);
    expect(archiveNames(listArchive(zip))).toBe('note.md');
    expect(decode(extractArchiveEntry(zip, 'note.md'))).toBe('# title');
  });

  it('is deterministic, so the same input gives the same bytes', () => {
    const a = createZip([{ name: 'x.txt', bytes: encode('same') }]);
    const b = createZip([{ name: 'x.txt', bytes: encode('same') }]);
    expect(Array.from(a)).toEqual(Array.from(b));
  });

  it('keeps both files when two share a name instead of dropping one', () => {
    const zip = createZip([
      { name: 'dup.txt', bytes: encode('first') },
      { name: 'dup.txt', bytes: encode('second') },
    ]);
    const names = archiveNames(listArchive(zip)).split('\n');
    expect(names).toHaveLength(2);
    expect(decode(extractArchiveEntry(zip, 'dup.txt'))).toBe('first');
    expect(decode(extractArchiveEntry(zip, 'dup (2).txt'))).toBe('second');
  });

  it('refuses an empty file list', () => {
    expect(() => createZip([])).toThrow(/at least one file/);
  });

  it('stores rather than deflates at level 0', () => {
    const zip = createZip([{ name: 'r.txt', bytes: encode('ab'.repeat(500)) }], 0);
    expect(listArchive(zip).entries[0].method).toBe('Store');
  });
});

// ─── tar ─────────────────────────────────────────────────────────────────────

describe('tar listing', () => {
  it('lists files and directories', () => {
    const listing = listArchive(sampleTar());
    expect(listing.format).toBe('tar');
    expect(listing.entries.map(e => e.name)).toEqual(['etc/', 'etc/hosts', 'var/log/app.log']);
    expect(listing.entries[0].isDirectory).toBe(true);
    expect(listing.entries[1].size).toBe('127.0.0.1 localhost\n'.length);
  });

  it('reports no compression, since a tar stores its members verbatim', () => {
    const entry = listArchive(sampleTar()).entries[1];
    expect(entry.method).toBe('-');
    expect(entry.compressedSize).toBe(entry.size);
  });

  it('reads the mtime out of the octal header field', () => {
    const entry = listArchive(sampleTar()).entries[1];
    expect(entry.modified?.getTime()).toBe(parseInt('14000000000', 8) * 1000);
  });

  it('omits directories from the name list by default', () => {
    expect(archiveNames(listArchive(sampleTar())).split('\n')).toEqual([
      'etc/hosts',
      'var/log/app.log',
    ]);
    expect(archiveNames(listArchive(sampleTar()), true)).toContain('etc/');
  });

  it('stops at the zero-block terminator instead of reading trailing padding', () => {
    expect(listArchive(sampleTar()).entries).toHaveLength(3);
  });

  it('resolves a GNU long name from the preceding L block', () => {
    const longName = 'deeply/nested/'.repeat(10) + 'file.txt';
    const tar = buildTar([
      { name: '././@LongLink', body: longName, type: 'L' },
      { name: longName.slice(0, 100), body: 'long name body' },
    ]);
    const listing = listArchive(tar);
    expect(listing.entries.map(e => e.name)).toEqual([longName]);
    expect(decode(extractArchiveEntry(tar, longName))).toBe('long name body');
  });

  it('resolves a pax path record from the preceding x block', () => {
    const path = 'pax/very-long-path/file.txt';
    const record = `${`${' path='.length + path.length + 2}`} path=${path}\n`;
    const tar = buildTar([
      { name: 'PaxHeaders/file', body: record, type: 'x' },
      { name: 'file.txt', body: 'pax body' },
    ]);
    expect(listArchive(tar).entries.map(e => e.name)).toEqual([path]);
  });
});

describe('tar extraction', () => {
  it('extracts by name', () => {
    expect(decode(extractArchiveEntry(sampleTar(), 'etc/hosts'))).toBe('127.0.0.1 localhost\n');
  });

  it('extracts by unique file name without the path', () => {
    expect(decode(extractArchiveEntry(sampleTar(), 'app.log'))).toBe('started\nstopped\n');
  });

  it('refuses to extract a directory', () => {
    expect(() => extractArchiveEntry(sampleTar(), 'etc/')).toThrow(/not in the archive|directory/);
  });
});

// ─── reporting ───────────────────────────────────────────────────────────────

describe('reporting', () => {
  it('totals files and directories separately', () => {
    const totals = archiveTotals(listArchive(sampleTar()));
    expect(totals.files).toBe(2);
    expect(totals.directories).toBe(1);
  });

  it('excludes directory entries from the size totals', () => {
    const totals = archiveTotals(listArchive(sampleTar()));
    expect(totals.size).toBe('127.0.0.1 localhost\n'.length + 'started\nstopped\n'.length);
  });

  it('formats a zip listing with the packed column', () => {
    const report = formatArchiveListing(listArchive(sampleZip()));
    expect(report).toContain('ZIP archive');
    expect(report).toContain('Packed');
    expect(report).toContain('readme.txt');
    expect(report).toContain('3 files');
  });

  it('leaves the packed column out of a tar listing, which has nothing to pack', () => {
    const report = formatArchiveListing(listArchive(sampleTar()));
    expect(report).toContain('TAR archive');
    expect(report).not.toContain('Packed');
    expect(report).toContain('1 directory');
  });

  it('prints timestamps as wall-clock, not shifted into UTC', () => {
    // A zip's DOS date carries no timezone, so formatting it through
    // toISOString() would move every entry by the reader's offset. createZip
    // stamps the DOS epoch, which must read back as midnight on the 2nd.
    const report = formatArchiveListing(listArchive(sampleZip()));
    expect(report).toContain('1980-01-02 00:00');
    expect(report).not.toContain('1980-01-01');
  });

  it('describes an archive in one line', () => {
    expect(describeArchive(listArchive(sampleZip()))).toMatch(/^ZIP · 3 files · /);
    expect(describeArchive(listArchive(sampleTar()))).toMatch(/^TAR · 2 files · /);
  });
});
