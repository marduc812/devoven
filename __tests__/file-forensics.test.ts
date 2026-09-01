import {
  byteEntropy,
  carvedFileName,
  describeFileType,
  detectFileType,
  extractStrings,
  formatDetection,
  formatEmbedded,
  formatStrings,
  guessTextShape,
  hexPreview,
  looksTextual,
  matchSignatures,
  parseMagic,
  scanEmbeddedFiles,
  sliceHit,
  toHex,
} from '@/Components/Functions/FileForensicsTools/logic';
import { SIGNATURES } from '@/Components/Functions/FileForensicsTools/signatures';

const bytes = (...values: number[]) => new Uint8Array(values);
const ascii = (text: string) => new TextEncoder().encode(text);

const concat = (...parts: Uint8Array[]) => {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(total);
  let at = 0;
  for (const part of parts) {
    out.set(part, at);
    at += part.length;
  }
  return out;
};

const PNG_HEADER = bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
const PNG_FOOTER = concat(ascii('IEND'), bytes(0xae, 0x42, 0x60, 0x82));
/** A minimal but structurally honest PNG: header, filler, IEND chunk. */
const png = (filler = 32) => concat(PNG_HEADER, new Uint8Array(filler).fill(0x41), PNG_FOOTER);

const JPEG = concat(bytes(0xff, 0xd8, 0xff, 0xe0), new Uint8Array(16).fill(0x20), bytes(0xff, 0xd9));

// ─── The signature table itself ─────────────────────────────────────────────

describe('signature table', () => {
  it('parses every magic string', () => {
    for (const signature of SIGNATURES) {
      expect(() => parseMagic(signature.magic)).not.toThrow();
      expect(parseMagic(signature.magic).length).toBeGreaterThan(0);
    }
  });

  it('gives every entry a name, mime and non-negative offset', () => {
    for (const signature of SIGNATURES) {
      expect(signature.name).not.toBe('');
      expect(signature.mime).toMatch(/\//);
      expect(signature.offset).toBeGreaterThanOrEqual(0);
    }
  });

  it('only carves signatures that start with a concrete byte', () => {
    for (const signature of SIGNATURES.filter(entry => entry.carve)) {
      expect(parseMagic(signature.magic)[0]).not.toBeNull();
    }
  });

  it('reads wildcards as gaps', () => {
    expect(parseMagic('52494646????????57454250')).toEqual([
      0x52, 0x49, 0x46, 0x46, null, null, null, null, 0x57, 0x45, 0x42, 0x50,
    ]);
  });

  it('rejects a malformed magic string', () => {
    expect(() => parseMagic('abc')).toThrow('odd number');
    expect(() => parseMagic('zzzz')).toThrow('not valid hex');
  });
});

// ─── Detect file type ───────────────────────────────────────────────────────

describe('detectFileType', () => {
  it('names a PNG from its header', () => {
    const detection = detectFileType(png());
    expect(describeFileType(detection)).toBe('PNG image');
    expect(detection.matches[0].signature.mime).toBe('image/png');
    expect(detection.matches[0].signature.ext).toBe('png');
  });

  it('names a JPEG by its APP0 marker', () => {
    expect(describeFileType(detectFileType(JPEG))).toBe('JPEG image (JFIF)');
  });

  it('prefers the longer signature when several match', () => {
    // ffd8ffe0 and the shorter ffd8ff both match a JFIF header.
    const names = matchSignatures(JPEG).map(hit => hit.signature.name);
    expect(names[0]).toBe('JPEG image (JFIF)');
    expect(names).toContain('JPEG image');
  });

  it('matches a signature that lives past the start of the file', () => {
    const mp4 = concat(bytes(0, 0, 0, 0x20), ascii('ftypisom'), new Uint8Array(8));
    expect(describeFileType(detectFileType(mp4))).toBe('MPEG-4 video (isom)');
  });

  it('matches a container pattern with a length field in the middle', () => {
    const webp = concat(ascii('RIFF'), bytes(0x24, 0, 0, 0), ascii('WEBPVP8 '));
    expect(describeFileType(detectFileType(webp))).toBe('WebP image');
  });

  it('finds the tar magic at offset 257', () => {
    const tar = concat(new Uint8Array(257), ascii('ustar'), new Uint8Array(10));
    expect(describeFileType(detectFileType(tar))).toBe('Tar archive');
  });

  it('flags the Mach-O and Java class collision', () => {
    const names = matchSignatures(bytes(0xca, 0xfe, 0xba, 0xbe, 0, 0, 0, 2)).map(hit => hit.signature.name);
    expect(names).toContain('Mach-O universal binary');
    expect(names).toContain('Java class file');
  });

  it('falls back to reading the content when there is no magic number', () => {
    expect(describeFileType(detectFileType(ascii('{"a": 1}')))).toBe('JSON (no magic number)');
    expect(describeFileType(detectFileType(ascii('<html><body></body></html>')))).toBe('HTML (no magic number)');
    expect(describeFileType(detectFileType(ascii('a,b,c\n1,2,3\n4,5,6')))).toContain('Delimited text');
    expect(describeFileType(detectFileType(ascii('just some words here')))).toBe('Plain text (no magic number)');
  });

  it('says so when nothing matches at all', () => {
    const noise = new Uint8Array(64);
    for (let i = 0; i < noise.length; i++) noise[i] = (i * 37 + 11) % 256;
    expect(describeFileType(detectFileType(noise))).toBe('Unrecognised — no known signature');
  });

  it('reports an empty file rather than guessing', () => {
    expect(formatDetection(detectFileType(new Uint8Array(0)), new Uint8Array(0))).toBe('The file is empty.');
  });

  it('writes a report with the matched bytes and a hex preview', () => {
    const report = formatDetection(detectFileType(png()), png(), 'logo.png');
    expect(report).toContain('logo.png');
    expect(report).toContain('image/png');
    expect(report).toContain('89 50 4e 47 0d 0a 1a 0a at offset 0');
    expect(report).toContain('First bytes');
  });
});

describe('content sniffing', () => {
  it('separates text from binary', () => {
    expect(looksTextual(ascii('hello world'))).toBe(true);
    expect(looksTextual(bytes(0, 1, 2, 3, 0, 0, 4, 5))).toBe(false);
    expect(looksTextual(new Uint8Array(0))).toBe(false);
  });

  it('names the shape of a text file', () => {
    expect(guessTextShape(ascii('[1, 2, 3]'))).toBe('json');
    expect(guessTextShape(ascii('<?xml version="1.0"?><a/>'))).toBe('xml');
    expect(guessTextShape(ascii('---\nname: value\n'))).toBe('yaml');
    expect(guessTextShape(ascii('aGVsbG8gd29ybGQgdGhpcyBpcyBiYXNlNjQ='))).toBe('base64');
    expect(guessTextShape(bytes(0xff, 0xfe, 0xfd))).toBeNull();
  });
});

describe('byteEntropy', () => {
  it('is zero for a single repeated byte', () => {
    expect(byteEntropy(new Uint8Array(256).fill(0x41))).toBe(0);
  });

  it('is eight when every byte value appears once', () => {
    const all = new Uint8Array(256);
    for (let i = 0; i < 256; i++) all[i] = i;
    expect(byteEntropy(all)).toBeCloseTo(8, 10);
  });

  it('is zero for no bytes at all', () => {
    expect(byteEntropy(new Uint8Array(0))).toBe(0);
  });
});

// ─── Strings ────────────────────────────────────────────────────────────────

describe('extractStrings', () => {
  const binary = concat(bytes(0, 1, 2), ascii('hello'), bytes(0), ascii('no'), bytes(0), ascii('/usr/bin/env'));

  it('finds runs at or above the minimum length', () => {
    expect(extractStrings(binary, { minLength: 4 }).map(hit => hit.text)).toEqual(['hello', '/usr/bin/env']);
  });

  it('lets a shorter minimum through', () => {
    expect(extractStrings(binary, { minLength: 2 }).map(hit => hit.text)).toEqual(['hello', 'no', '/usr/bin/env']);
  });

  it('records where each run starts', () => {
    expect(extractStrings(binary, { minLength: 4 })[0].offset).toBe(3);
  });

  it('reads UTF-16LE text that the ASCII pass would miss', () => {
    const wide = new Uint8Array(24);
    'C:\\Windows'.split('').forEach((char, i) => { wide[i * 2] = char.charCodeAt(0); });
    expect(extractStrings(wide, { minLength: 4, encoding: 'ascii' }).map(hit => hit.text)).toEqual([]);
    expect(extractStrings(wide, { minLength: 4, encoding: 'utf16le' }).map(hit => hit.text)).toEqual(['C:\\Windows']);
  });

  it('reports both encodings in offset order when asked', () => {
    const wide = new Uint8Array(20);
    'wide'.split('').forEach((char, i) => { wide[i * 2] = char.charCodeAt(0); });
    const mixed = concat(ascii('plaintext'), bytes(0), wide);
    const hits = extractStrings(mixed, { minLength: 4, encoding: 'both' });
    expect(hits.map(hit => hit.encoding)).toContain('ascii');
    expect(hits.map(hit => hit.encoding)).toContain('utf16le');
    expect(hits.map(hit => hit.offset)).toEqual([...hits.map(hit => hit.offset)].sort((a, b) => a - b));
  });

  it('stops at the hit limit', () => {
    const many = concat(...Array.from({ length: 50 }, () => concat(ascii('word'), bytes(0))));
    expect(extractStrings(many, { minLength: 4, limit: 10 })).toHaveLength(10);
  });

  it('formats with offsets and without duplicates', () => {
    const repeated = concat(ascii('same'), bytes(0), ascii('same'), bytes(0), ascii('other'));
    const hits = extractStrings(repeated, { minLength: 4 });
    expect(formatStrings(hits)).toBe('same\nsame\nother');
    expect(formatStrings(hits, { unique: true })).toBe('same\nother');
    expect(formatStrings(hits, { showOffsets: true }).split('\n')[0]).toBe('00000000  same');
  });
});

// ─── Embedded files ─────────────────────────────────────────────────────────

describe('scanEmbeddedFiles', () => {
  it('finds a PNG appended to a JPEG', () => {
    const blob = concat(JPEG, png());
    const hits = scanEmbeddedFiles(blob);
    expect(hits.map(hit => hit.signature.name)).toEqual(['JPEG image (JFIF)', 'PNG image']);
    expect(hits[1].offset).toBe(JPEG.length);
  });

  it('measures a PNG from its IEND chunk', () => {
    const blob = concat(new Uint8Array(10), png(32));
    const hit = scanEmbeddedFiles(blob, { minOffset: 1 })[0];
    expect(hit.offset).toBe(10);
    expect(hit.length).toBe(png(32).length);
    expect(sliceHit(blob, hit)).toEqual(png(32));
  });

  it('measures a RIFF container from its length field', () => {
    const body = new Uint8Array(20).fill(0x41);
    const wav = concat(ascii('RIFF'), bytes(body.length + 4, 0, 0, 0), ascii('WAVE'), body);
    const hit = scanEmbeddedFiles(concat(new Uint8Array(8), wav, new Uint8Array(64)), { minOffset: 1 })[0];
    expect(hit.signature.name).toBe('WAV audio');
    expect(hit.length).toBe(wav.length);
  });

  it('measures a ZIP from its end-of-central-directory record', () => {
    const zip = concat(ascii('PK\x03\x04'), new Uint8Array(24).fill(0x30), ascii('PK\x05\x06'), new Uint8Array(18));
    const hit = scanEmbeddedFiles(concat(ascii('%PDF-1.4 filler'), zip), { minOffset: 1 })[0];
    expect(hit.signature.name).toBe('ZIP archive');
    expect(hit.length).toBe(zip.length);
  });

  it('takes the last end marker, not the first, so a thumbnail cannot truncate the file', () => {
    // An outer PNG whose payload happens to contain a second IEND chunk.
    const tricky = concat(PNG_HEADER, new Uint8Array(8).fill(1), PNG_FOOTER, new Uint8Array(8).fill(2), PNG_FOOTER);
    const hit = scanEmbeddedFiles(tricky)[0];
    expect(hit.length).toBe(tricky.length);
  });

  it('reports an unknown extent when the format has no end marker', () => {
    const elf = concat(bytes(0x7f, 0x45, 0x4c, 0x46), new Uint8Array(32));
    const hit = scanEmbeddedFiles(elf)[0];
    expect(hit.signature.name).toBe('ELF executable');
    expect(hit.length).toBeNull();
    expect(hit.extent).toBe(elf.length);
  });

  it('can skip the host file own header', () => {
    const blob = concat(JPEG, png());
    expect(scanEmbeddedFiles(blob, { minOffset: 1 }).map(hit => hit.offset)).toEqual([JPEG.length]);
  });

  it('does not let a weak nested match cut a real file short', () => {
    // A real PNG's IHDR chunk contains 00 00 00 01 00, which is the TrueType
    // signature. Carving it would cap the PNG's footer search at that byte.
    const realPng = new Uint8Array(
      Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
        'base64',
      ),
    );
    const hits = scanEmbeddedFiles(concat(JPEG, realPng));
    expect(hits.map(hit => hit.signature.name)).toEqual(['JPEG image (JFIF)', 'PNG image']);
    expect(hits[1].length).toBe(realPng.length);
  });

  it('ignores short markers so plain binary does not light up', () => {
    // 'MZ' and 'BM' are two-byte signatures and are deliberately not carved.
    const noise = concat(ascii('MZ'), new Uint8Array(64), ascii('BM'), new Uint8Array(64));
    expect(scanEmbeddedFiles(noise)).toEqual([]);
  });

  it('stops at the hit limit', () => {
    const many = concat(...Array.from({ length: 20 }, () => png(4)));
    expect(scanEmbeddedFiles(many, { limit: 5 })).toHaveLength(5);
  });

  it('names carved files by index, offset and extension', () => {
    const hits = scanEmbeddedFiles(concat(JPEG, png()));
    expect(carvedFileName(hits[0], 1)).toBe('001_00000000.jpg');
    expect(carvedFileName(hits[1], 2)).toBe(`002_${JPEG.length.toString(16).padStart(8, '0')}.png`);
  });

  it('writes a report listing every offset', () => {
    const blob = concat(JPEG, png());
    const report = formatEmbedded(scanEmbeddedFiles(blob), blob.length, 'holiday.jpg');
    expect(report).toContain('holiday.jpg');
    expect(report).toContain('2 signatures');
    expect(report).toContain('PNG image');
    expect(report).toContain('(the file itself)');
  });

  it('says plainly when it found nothing', () => {
    expect(formatEmbedded([], 128)).toContain('No embedded file signatures found');
  });
});

// ─── Formatting helpers ─────────────────────────────────────────────────────

describe('hexPreview', () => {
  it('lays bytes out with an offset column and an ASCII column', () => {
    expect(hexPreview(ascii('ABC'), 16)).toMatch(/^00000000 {2}41 42 43 +\|ABC\|$/);
  });

  it('keeps the ASCII column aligned on a short final row', () => {
    const [first, second] = hexPreview(ascii('0123456789abcdefXY')).split('\n');
    expect(first.indexOf('|')).toBe(second.indexOf('|'));
  });

  it('replaces unprintable bytes with a dot', () => {
    expect(hexPreview(bytes(0x00, 0x41, 0xff))).toContain('|.A.|');
  });

  it('stops at the limit', () => {
    expect(hexPreview(new Uint8Array(64), 32).split('\n')).toHaveLength(2);
  });
});

describe('toHex', () => {
  it('pads each byte to two digits', () => {
    expect(toHex(bytes(0, 15, 255))).toBe('00 0f ff');
    expect(toHex(bytes(1, 2), '')).toBe('0102');
  });
});
