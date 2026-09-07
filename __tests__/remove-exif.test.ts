import {
  describeStrip,
  formatBytes,
  stripMetadata,
  strippedName,
} from '@/Components/Functions/RemoveExifTools/logic';

// --- fixtures ----------------------------------------------------------------

const bytes = (...values: (number | number[])[]): number[] => values.flat();

const chars = (text: string): number[] => Array.from(text, (c) => c.charCodeAt(0));

/** An APPn or COM segment: marker, big-endian length, payload. */
const jpegSegment = (marker: number, payload: number[]): number[] => {
  const length = payload.length + 2;
  return [0xff, marker, (length >> 8) & 0xff, length & 0xff, ...payload];
};

const SCAN = [0xff, 0xda, 0x00, 0x08, 1, 1, 0, 0, 0x3f, 0x00, 0x11, 0x22, 0x33, 0xff, 0xd9];

const jpegFixture = (): Uint8Array =>
  new Uint8Array(
    bytes(
      [0xff, 0xd8], // SOI
      jpegSegment(0xe0, [...chars('JFIF'), 0, 1, 1, 0, 0, 1, 0, 1, 0, 0]),
      jpegSegment(0xe1, [...chars('Exif'), 0, 0, ...chars('II'), 42, 0, 8, 0, 0, 0]),
      jpegSegment(0xe2, [...chars('ICC_PROFILE'), 0, 1, 1, 9, 9, 9]),
      jpegSegment(0xed, chars('Photoshop 3.0')),
      jpegSegment(0xee, [...chars('Adobe'), 0, 100, 0, 0, 0, 0, 0]),
      jpegSegment(0xfe, chars('a comment')),
      jpegSegment(0xdb, [0, 1, 2, 3]), // DQT, must survive
      SCAN,
    ),
  );

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

/** A PNG chunk: length, type, data, and a CRC we never have to recompute. */
const pngChunk = (type: string, data: number[]): number[] => [
  (data.length >>> 24) & 0xff,
  (data.length >>> 16) & 0xff,
  (data.length >>> 8) & 0xff,
  data.length & 0xff,
  ...chars(type),
  ...data,
  0xde,
  0xad,
  0xbe,
  0xef,
];

const pngFixture = (): Uint8Array =>
  new Uint8Array(
    bytes(
      PNG_SIGNATURE,
      pngChunk('IHDR', [0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0]),
      pngChunk('tEXt', [...chars('Software'), 0, ...chars('Adobe Photoshop')]),
      pngChunk('eXIf', [...chars('II'), 42, 0]),
      pngChunk('iCCP', [...chars('sRGB'), 0, 0, 1, 2, 3]),
      pngChunk('tIME', [7, 230, 9, 7, 12, 0, 0]),
      pngChunk('pHYs', [0, 0, 11, 19, 0, 0, 11, 19, 1]),
      pngChunk('IDAT', [1, 2, 3, 4, 5]),
      pngChunk('IEND', []),
    ),
  );

/** A RIFF chunk, padded to an even length the way WebP requires. */
const riffChunk = (fourcc: string, data: number[]): number[] => [
  ...chars(fourcc),
  data.length & 0xff,
  (data.length >>> 8) & 0xff,
  (data.length >>> 16) & 0xff,
  (data.length >>> 24) & 0xff,
  ...data,
  ...(data.length % 2 ? [0] : []),
];

const VP8X_FLAGS = 0x20 | 0x08 | 0x04; // ICC, EXIF, XMP all claimed

const webpFixture = (): Uint8Array => {
  const body = bytes(
    chars('WEBP'),
    riffChunk('VP8X', [VP8X_FLAGS, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
    riffChunk('ICCP', [1, 2, 3]),
    riffChunk('VP8 ', [9, 8, 7, 6]),
    riffChunk('EXIF', [...chars('II'), 42, 0]),
    riffChunk('XMP ', chars('<x:xmpmeta/>')),
  );
  return new Uint8Array(
    bytes(
      chars('RIFF'),
      [body.length & 0xff, (body.length >>> 8) & 0xff, (body.length >>> 16) & 0xff, 0],
      body,
    ),
  );
};

const labels = (result: { removed: { label: string }[] }) => result.removed.map((r) => r.label);

// --- JPEG --------------------------------------------------------------------

describe('JPEG', () => {
  const source = jpegFixture();

  it('removes EXIF, Photoshop, the comment and the colour profile', () => {
    const result = stripMetadata(source);
    expect(result.format).toBe('JPEG');
    expect(labels(result)).toEqual(['APP1 (Exif)', 'APP2 (ICC_PROFILE)', 'APP13 (Photoshop)', 'COM']);
    expect(result.bytesRemoved).toBeGreaterThan(0);
    expect(result.bytes.length).toBe(source.length - result.bytesRemoved);
  });

  it('keeps the JFIF header, the Adobe transform and the quantisation table', () => {
    const out = stripMetadata(source).bytes;
    expect(Array.from(out.subarray(0, 2))).toEqual([0xff, 0xd8]);
    expect(indexOfBytes(out, chars('JFIF'))).toBeGreaterThan(0);
    expect(indexOfBytes(out, chars('Adobe'))).toBeGreaterThan(0);
    expect(indexOfBytes(out, [0xff, 0xdb])).toBeGreaterThan(0);
  });

  it('passes the scan through byte for byte', () => {
    const out = stripMetadata(source).bytes;
    expect(Array.from(out.subarray(out.length - SCAN.length))).toEqual(SCAN);
  });

  it('leaves nothing identifying behind', () => {
    const out = stripMetadata(source).bytes;
    expect(indexOfBytes(out, chars('Exif'))).toBe(-1);
    expect(indexOfBytes(out, chars('Photoshop'))).toBe(-1);
    expect(indexOfBytes(out, chars('a comment'))).toBe(-1);
  });

  it('keeps the colour profile when asked', () => {
    const result = stripMetadata(source, { keepColorProfile: true });
    expect(labels(result)).toEqual(['APP1 (Exif)', 'APP13 (Photoshop)', 'COM']);
    expect(indexOfBytes(result.bytes, chars('ICC_PROFILE'))).toBeGreaterThan(0);
  });

  it('is idempotent', () => {
    const once = stripMetadata(source).bytes;
    const twice = stripMetadata(once);
    expect(twice.removed).toEqual([]);
    expect(Array.from(twice.bytes)).toEqual(Array.from(once));
  });

  it('handles a file that has nothing to remove', () => {
    const plain = new Uint8Array(bytes([0xff, 0xd8], jpegSegment(0xdb, [1, 2]), SCAN));
    const result = stripMetadata(plain);
    expect(result.removed).toEqual([]);
    expect(result.bytesRemoved).toBe(0);
    expect(Array.from(result.bytes)).toEqual(Array.from(plain));
  });

  it('stops at a truncated segment instead of running off the end', () => {
    // An APP1 whose declared length reaches past the end of the file.
    const truncated = new Uint8Array(bytes([0xff, 0xd8], [0xff, 0xe1, 0xff, 0xfe], chars('Exif')));
    const result = stripMetadata(truncated);
    expect(result.removed).toEqual([]);
    expect(Array.from(result.bytes)).toEqual(Array.from(truncated));
  });
});

// --- PNG ---------------------------------------------------------------------

describe('PNG', () => {
  const source = pngFixture();

  it('removes the text, EXIF, timestamp and profile chunks', () => {
    const result = stripMetadata(source);
    expect(result.format).toBe('PNG');
    expect(labels(result)).toEqual(['tEXt', 'eXIf', 'iCCP', 'tIME']);
    expect(result.removed[0].what).toContain('Software');
  });

  it('keeps the header, the physical size and the image data', () => {
    const out = stripMetadata(source).bytes;
    expect(Array.from(out.subarray(0, 8))).toEqual(PNG_SIGNATURE);
    expect(indexOfBytes(out, chars('IHDR'))).toBe(12);
    expect(indexOfBytes(out, chars('pHYs'))).toBeGreaterThan(0);
    expect(indexOfBytes(out, chars('IDAT'))).toBeGreaterThan(0);
    expect(indexOfBytes(out, chars('IEND'))).toBeGreaterThan(0);
  });

  it('keeps the colour profile when asked', () => {
    const result = stripMetadata(source, { keepColorProfile: true });
    expect(labels(result)).toEqual(['tEXt', 'eXIf', 'tIME']);
    expect(indexOfBytes(result.bytes, chars('iCCP'))).toBeGreaterThan(0);
  });

  it('is idempotent', () => {
    const once = stripMetadata(source).bytes;
    expect(stripMetadata(once).removed).toEqual([]);
  });

  it('stops at a chunk whose length overruns the file', () => {
    const truncated = new Uint8Array(
      bytes(PNG_SIGNATURE, pngChunk('IHDR', [0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0]), [
        0x7f, 0xff, 0xff, 0xff, ...chars('tEXt'), 1, 2,
      ]),
    );
    const result = stripMetadata(truncated);
    expect(result.removed).toEqual([]);
    // The overrunning chunk is dropped rather than copied, so the file shrinks.
    expect(result.bytes.length).toBe(8 + 25);
  });
});

// --- WebP --------------------------------------------------------------------

describe('WebP', () => {
  const source = webpFixture();

  it('removes the EXIF, XMP and ICC chunks', () => {
    const result = stripMetadata(source);
    expect(result.format).toBe('WebP');
    expect(labels(result)).toEqual(['ICCP chunk', 'EXIF chunk', 'XMP chunk']);
    expect(indexOfBytes(result.bytes, chars('EXIF'))).toBe(-1);
    expect(indexOfBytes(result.bytes, chars('XMP '))).toBe(-1);
  });

  it('keeps the image data and the container header', () => {
    const out = stripMetadata(source).bytes;
    expect(indexOfBytes(out, chars('RIFF'))).toBe(0);
    expect(indexOfBytes(out, chars('WEBP'))).toBe(8);
    expect(indexOfBytes(out, chars('VP8 '))).toBeGreaterThan(0);
  });

  it('rewrites the RIFF size to match the shorter file', () => {
    const out = stripMetadata(source).bytes;
    const declared = out[4] + (out[5] << 8) + (out[6] << 16) + out[7] * 0x1000000;
    expect(declared).toBe(out.length - 8);
  });

  it('clears the VP8X flags for what it removed', () => {
    const flagsAt = indexOfBytes(source, chars('VP8X')) + 8;
    expect(source[flagsAt]).toBe(VP8X_FLAGS);

    const stripped = stripMetadata(source).bytes;
    expect(stripped[indexOfBytes(stripped, chars('VP8X')) + 8]).toBe(0);

    const kept = stripMetadata(source, { keepColorProfile: true }).bytes;
    expect(kept[indexOfBytes(kept, chars('VP8X')) + 8]).toBe(0x20);
  });

  it('is idempotent', () => {
    const once = stripMetadata(source).bytes;
    expect(stripMetadata(once).removed).toEqual([]);
  });
});

// --- formats it will not touch ------------------------------------------------

describe('unsupported input', () => {
  it('explains why a TIFF cannot be stripped', () => {
    const tiff = new Uint8Array(bytes([0x49, 0x49, 0x2a, 0x00], new Array(40).fill(0)));
    expect(() => stripMetadata(tiff)).toThrow(/TIFF is metadata all the way down/);
  });

  it('points HEIC and GIF at a conversion first', () => {
    const heic = new Uint8Array(bytes([0, 0, 0, 24], chars('ftypheic'), new Array(24).fill(0)));
    expect(() => stripMetadata(heic)).toThrow(/Convert it to JPEG/);
    const gif = new Uint8Array(bytes(chars('GIF89a'), new Array(30).fill(0)));
    expect(() => stripMetadata(gif)).toThrow(/almost no metadata/);
  });

  it('rejects something that is not an image at all', () => {
    expect(() => stripMetadata(new Uint8Array(chars('hello world, not an image')))).toThrow(
      /not a JPEG, PNG or WebP/,
    );
  });

  it('rejects a file too short to be the format it claims', () => {
    expect(() => stripMetadata(new Uint8Array(PNG_SIGNATURE))).toThrow(/truncated/);
    expect(() => stripMetadata(new Uint8Array([0xff, 0xd8, 0xff]))).toThrow(/truncated/);
  });
});

// --- naming and reporting -----------------------------------------------------

describe('output naming', () => {
  it('marks the file as cleaned and keeps a sensible extension', () => {
    expect(strippedName('holiday.jpg', 'JPEG')).toBe('holiday-clean.jpg');
    expect(strippedName('holiday.jpeg', 'JPEG')).toBe('holiday-clean.jpeg');
    expect(strippedName('shot.PNG', 'PNG')).toBe('shot-clean.png');
    expect(strippedName('sticker.webp', 'WebP')).toBe('sticker-clean.webp');
  });

  it('corrects an extension that lies about the format', () => {
    expect(strippedName('actually-a-png.jpg', 'PNG')).toBe('actually-a-png-clean.png');
  });

  it('copes with no name and no extension', () => {
    expect(strippedName('', 'PNG')).toBe('image-clean.png');
    expect(strippedName('screenshot', 'PNG')).toBe('screenshot-clean.png');
  });
});

describe('reporting', () => {
  it('counts what came off', () => {
    expect(describeStrip(stripMetadata(jpegFixture()))).toMatch(/^4 blocks removed, /);
  });

  it('says so when there was nothing there', () => {
    const clean = stripMetadata(stripMetadata(jpegFixture()).bytes);
    expect(describeStrip(clean)).toBe('Nothing to remove: this file carried no metadata.');
  });

  it('scales byte counts', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(2048)).toBe('2.0 KB');
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.00 MB');
  });
});

/** Index of a byte sequence inside another, or -1. */
function indexOfBytes(haystack: Uint8Array, needle: number[]): number {
  outer: for (let i = 0; i + needle.length <= haystack.length; i++) {
    for (let j = 0; j < needle.length; j++) {
      if (haystack[i + j] !== needle[j]) continue outer;
    }
    return i;
  }
  return -1;
}
