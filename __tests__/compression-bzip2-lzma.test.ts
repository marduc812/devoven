import {
  bzip2DecompressText,
  compressLzma,
  decompressBzip2,
  decompressLzma,
  looksLikeBzip2,
  looksLikeLzma,
  lzmaCompressText,
  lzmaDecompressText,
} from '@/Components/Functions/CompressionTools2/logic';
import { base64ToBytes, bytesToBase64 } from '@/Components/Functions/CompressionTools/logic';
import { listArchive } from '@/Components/Functions/ArchiveTools/logic';
import { OPERATION_MAP } from '@/lib/blocks/registry';
import { runPipeline } from '@/lib/blocks/pipeline';
import { BlockState } from '@/lib/blocks/types';

// Produced by the real CLIs, so these assert interoperability and not just a
// round trip through our own code:
//   bzip2 -9 < f.txt   where f.txt is the pangram line repeated 16 times
const PANGRAM = 'the quick brown fox jumps over the lazy dog\n'.repeat(16);
const PANGRAM_BZ2 =
  'QlpoOTFBWSZTWTjOT+IAASfRgAAQQAA////wMAC4CjQ0AAABRoaAAAAKqmmpiaYRozRtSeQzCA+BAZBQJBQPoeg2CQbAqFocB0CoTD8EgtCA4CYZBQOgmGochUJhyEBAews7DsP4u5IpwoSBxnJ/EA==';
//   lzma -9 < f.txt    which streams, so its header carries the unknown-size marker
const PANGRAM_LZMA =
  'XQAAAAT//////////wA6GgjOdsfl6dYHNMPRDr/OVeGqveDkj5gB3Y3lB1SeZSVfJzpqfrTTSP5Q/mEf0hGc51cn//6qyAA=';
//   tar cf s.tar a.txt b.txt && bzip2 -9 s.tar
const TAR_BZ2 =
  'QlpoOTFBWSZTWc3nae8AARD/lvcQAOBAif/iOmR5KH7v3+AEIBAAABAAmDABmAAcwmATACYTCaYAABMmmgY5hMAmAEwmE0wAACZNNAwVVNDRok0ngT1TaTTynpGg9TTamnpMyjTDTU7DrNp4MbgwEF9CEJoSCaxATZuXlhWG4imTZ1ob2tuaLazMgZBoIF8oZzRgv2zaV+iet3tbjbTGdx22whU1IrnEGC2cHEaSA1ticpECsw0GOAhMkWFDonI3FKsri5n0T/GBC4kXvON6KigspghOjezGY0IFZUT0KpumskVXtVM6pGKksnRWRWoxSUuZNlYXU6mtsbHa7DU2Nh7knqzrxS+aLvSVJt35d3jleRp/x0lZiP4wrZYbPRaWnW4NxjZUFzGYi+eL9LTz3nI9qRSR2nk9HIqIknsP2YrSJkOhOVkkTnOcoby5iVki0xbzWT5DecbGkkWE6suergocEB/xdyRThQkM3nae8A==';

describe('bzip2', () => {
  it('decompresses what the bzip2 CLI produced', () => {
    expect(bzip2DecompressText(PANGRAM_BZ2)).toBe(PANGRAM);
  });

  it('recognises the BZh header and nothing else', () => {
    expect(looksLikeBzip2(base64ToBytes(PANGRAM_BZ2))).toBe(true);
    expect(looksLikeBzip2(new TextEncoder().encode('BZh0not-a-level'))).toBe(false);
    expect(looksLikeBzip2(new Uint8Array([0x1f, 0x8b, 0x08, 0x00]))).toBe(false);
  });

  it('names the format when the header is wrong', () => {
    expect(() => bzip2DecompressText(bytesToBase64(new TextEncoder().encode('plain text')))).toThrow(
      /bzip2 header/,
    );
  });

  it('reports a bad stream rather than returning garbage', () => {
    const corrupt = base64ToBytes(PANGRAM_BZ2);
    corrupt[30] ^= 0xff;
    expect(() => decompressBzip2(corrupt)).toThrow(/bzip2/);
  });

  it('hands a .tar.bz2 straight to the archive reader', () => {
    const listing = listArchive(decompressBzip2(base64ToBytes(TAR_BZ2)));
    expect(listing.format).toBe('tar');
    expect(listing.entries.map((e) => e.name)).toEqual(['a.txt', 'b.txt']);
  });

  it('passes an empty payload through', () => {
    expect(bzip2DecompressText('')).toBe('');
  });
});

describe('LZMA', () => {
  it('decompresses what the lzma CLI produced', () => {
    expect(lzmaDecompressText(PANGRAM_LZMA)).toBe(PANGRAM);
  });

  it('writes the alone-format header the CLI reads', () => {
    const bytes = compressLzma(new TextEncoder().encode(PANGRAM), 6);
    expect(Array.from(bytes.subarray(0, 3))).toEqual([0x5d, 0x00, 0x00]);
    expect(looksLikeLzma(bytes)).toBe(true);
  });

  it('round trips text through every preset', () => {
    for (const preset of ['1', '6', '9']) {
      expect(lzmaDecompressText(lzmaCompressText(PANGRAM, 'base64', preset))).toBe(PANGRAM);
    }
  });

  it('round trips hex as well as Base64', () => {
    expect(lzmaDecompressText(lzmaCompressText('hello hex', 'hex'), 'hex')).toBe('hello hex');
  });

  it('round trips bytes that are not text, including NULs', () => {
    const binary = Uint8Array.from({ length: 512 }, (_, i) => (i * 37) % 256);
    expect(Array.from(decompressLzma(compressLzma(binary)))).toEqual(Array.from(binary));
  });

  it('round trips text the library cannot decode back to a string', () => {
    // Four byte UTF-8 makes LZMA-JS give up on decoding and return raw bytes.
    const emoji = 'ovens 🔥 everywhere';
    expect(lzmaDecompressText(lzmaCompressText(emoji))).toBe(emoji);
  });

  it('actually compresses repetitive input', () => {
    const compressed = compressLzma(new TextEncoder().encode(PANGRAM), 9);
    expect(compressed.length).toBeLessThan(PANGRAM.length / 4);
  });

  it('rejects input too short to hold a header', () => {
    expect(() => decompressLzma(new Uint8Array([0x5d, 0x00, 0x00]))).toThrow(/too short/);
  });

  it('refuses a header that declares an absurd output size', () => {
    const bomb = new Uint8Array(64);
    bomb[0] = 0x5d;
    // 8 byte little-endian size, every byte but the top one set: ~72 PB.
    for (let i = 5; i < 12; i++) bomb[i] = 0xff;
    expect(() => decompressLzma(bomb)).toThrow(/past what this tool will decompress/);
  });

  it('passes an empty payload through', () => {
    expect(lzmaCompressText('')).toBe('');
    expect(lzmaDecompressText('')).toBe('');
  });
});

// The point of the blocks is the chain: a .tar.bz2 has to survive being handed
// from one operation to the next as Base64, which reading it as text would ruin.
describe('in a pipeline', () => {
  const block = (operationId: string, params: Record<string, string> = {}): BlockState => {
    const op = OPERATION_MAP[operationId];
    const defaults = Object.fromEntries((op?.params ?? []).map((p) => [p.id, p.default]));
    return { id: operationId, operationId, params: { ...defaults, ...params }, enabled: true };
  };
  const run = (input: string, ...blocks: BlockState[]) =>
    runPipeline({ input, blocks });

  it('unpacks a .tar.bz2 through the archive blocks', () => {
    const results = run(
      TAR_BZ2,
      block('bzip2-decompress', { as: 'base64' }),
      block('archive-list', { source: 'base64' }),
    );
    expect(results.map((r) => r.error)).toEqual([null, null]);
    expect(results[1].output).toContain('a.txt');
    expect(results[1].output).toContain('b.txt');
  });

  it('round trips LZMA between two blocks', () => {
    const results = run(
      'pipelines all the way down',
      block('lzma-compress', { level: '9' }),
      block('lzma-decompress', { as: 'text' }),
    );
    expect(results.map((r) => r.error)).toEqual([null, null]);
    expect(results[1].output).toBe('pipelines all the way down');
  });

  it('shows the codec\'s own message on the block when the input is wrong', () => {
    const results = run('bm90IGJ6aXAy', block('bzip2-decompress'));
    expect(results[0].error).toMatch(/bzip2 header/);
  });
});
