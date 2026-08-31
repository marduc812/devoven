import {
  compressText,
  decompressText,
  compressBytes,
  decompressBytes,
  compressionStats,
  describeCompression,
  formatBytes,
  bytesToHex,
  hexToBytes,
  bytesToBase64,
  base64ToBytes,
  COMPRESSION_FORMATS,
  CompressionFormat,
} from '@/Components/Functions/CompressionTools/logic';

const sample = 'The quick brown fox jumps over the lazy dog. '.repeat(20);

describe('byte encodings', () => {
  it('round-trips bytes through base64', () => {
    const bytes = new Uint8Array([0, 1, 2, 250, 251, 255]);
    expect(Array.from(base64ToBytes(bytesToBase64(bytes)))).toEqual(Array.from(bytes));
  });

  it('round-trips bytes through hex', () => {
    const bytes = new Uint8Array([0, 15, 16, 255]);
    expect(bytesToHex(bytes)).toBe('000f10ff');
    expect(Array.from(hexToBytes('000f10ff'))).toEqual(Array.from(bytes));
  });

  it('tolerates whitespace, separators and 0x prefixes in hex', () => {
    expect(Array.from(hexToBytes('0x1f 0x8b\n0a:0b-0c'))).toEqual([0x1f, 0x8b, 0x0a, 0x0b, 0x0c]);
  });

  it('accepts url-safe base64 and missing padding', () => {
    const bytes = new Uint8Array([251, 255, 190]);
    const urlSafe = bytesToBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    expect(Array.from(base64ToBytes(urlSafe))).toEqual(Array.from(bytes));
  });

  it('rejects malformed hex', () => {
    expect(() => hexToBytes('abc')).toThrow('odd number');
    expect(() => hexToBytes('zz')).toThrow('not valid hex');
  });
});

describe.each(COMPRESSION_FORMATS)('%s', (format: CompressionFormat) => {
  it('round-trips text through base64', () => {
    expect(decompressText(compressText(sample, format), format)).toBe(sample);
  });

  it('round-trips text through hex', () => {
    expect(decompressText(compressText(sample, format, 'hex'), format, 'hex')).toBe(sample);
  });

  it('round-trips unicode', () => {
    const text = 'héllo → 世界 🌍';
    expect(decompressText(compressText(text, format), format)).toBe(text);
  });

  it('actually shrinks repetitive input', () => {
    const compressed = compressBytes(new TextEncoder().encode(sample), format);
    expect(compressed.length).toBeLessThan(sample.length / 4);
  });

  it('returns an empty string for empty input', () => {
    expect(compressText('', format)).toBe('');
    expect(decompressText('   ', format)).toBe('');
  });

  it('rejects data that is not in this format', () => {
    expect(() => decompressText('bm90IGNvbXByZXNzZWQ=', format)).toThrow(/is not valid/);
  });

  it('honours the compression level', () => {
    const input = new TextEncoder().encode(sample);
    expect(compressBytes(input, format, 9).length).toBeLessThanOrEqual(
      compressBytes(input, format, 1).length,
    );
  });
});

describe('gzip specifics', () => {
  it('writes the gzip magic bytes', () => {
    const bytes = compressBytes(new TextEncoder().encode('hello'), 'gzip');
    expect(bytes[0]).toBe(0x1f);
    expect(bytes[1]).toBe(0x8b);
  });

  it('is deterministic, so the mtime header does not leak the clock', () => {
    const first = compressText(sample, 'gzip');
    const second = compressText(sample, 'gzip');
    expect(first).toBe(second);
  });

  it('decompresses a stream produced elsewhere', () => {
    // echo -n 'hello world' | gzip -n | base64
    const fixture = 'H4sIAAAAAAAAA8tIzcnJVyjPL8pJAQCFEUoNCwAAAA==';
    expect(decompressText(fixture, 'gzip')).toBe('hello world');
  });
});

describe('zlib and raw specifics', () => {
  it('writes the usual zlib header', () => {
    const bytes = compressBytes(new TextEncoder().encode('hello'), 'zlib');
    expect(bytesToHex(bytes.subarray(0, 2))).toBe('789c');
  });

  it('leaves raw deflate without a container', () => {
    const input = new TextEncoder().encode(sample);
    const raw = compressBytes(input, 'raw');
    const zlib = compressBytes(input, 'zlib');
    // zlib is raw plus a 2-byte header and a 4-byte Adler-32 checksum.
    expect(zlib.length).toBe(raw.length + 6);
  });

  it('inflates a raw stream that zlib wrapped', () => {
    const zlib = compressBytes(new TextEncoder().encode('hello world'), 'zlib');
    const raw = zlib.subarray(2, zlib.length - 4);
    expect(new TextDecoder().decode(decompressBytes(raw, 'raw'))).toBe('hello world');
  });
});

describe('reporting', () => {
  it('formats byte counts', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(2048)).toBe('2.0 KB');
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.00 MB');
  });

  it('reports the saving for compressible input', () => {
    const compressed = compressBytes(new TextEncoder().encode(sample), 'gzip');
    const stats = compressionStats(sample, compressed);
    expect(stats.inputBytes).toBe(sample.length);
    expect(stats.savedPercent).toBeGreaterThan(80);
    expect(describeCompression(stats)).toContain('smaller');
  });

  it('reports growth when the container costs more than it saves', () => {
    const text = 'a';
    const compressed = compressBytes(new TextEncoder().encode(text), 'gzip');
    expect(describeCompression(compressionStats(text, compressed))).toContain('larger');
  });
});
