import { detectFormat, parseTiffBlock, parseImageMetadata, toDms } from '@/Components/Functions/ExifTools/logic';
import type { ExifResult, FileFacts } from '@/Components/Functions/ExifTools/logic';
import type { TiffParse } from '@/Components/Functions/ExifTools/logic';

// ─── TIFF byte builders ───────────────────────────────────────────────────────
// Test inputs are assembled byte by byte so each test states exactly which bytes
// produce which result. No binary fixtures are committed.

const BYTE = 1, ASCII = 2, SHORT = 3, LONG = 4, RATIONAL = 5, UNDEFINED = 7, SRATIONAL = 10;

type TestEntry = { tag: number; type: number; values: number[] | string };

const entry = (tag: number, type: number, values: number[] | string): TestEntry =>
  ({ tag, type, values });

/** Component count for an entry, which is character count (incl. NUL) for ASCII. */
const componentCount = (e: TestEntry): number =>
  typeof e.values === 'string' ? e.values.length + 1 : e.type === RATIONAL || e.type === SRATIONAL
    ? e.values.length / 2
    : e.values.length;

const payloadBytes = (e: TestEntry, big: boolean): number[] => {
  const out: number[] = [];
  const push16 = (v: number) => big ? out.push((v >> 8) & 0xff, v & 0xff) : out.push(v & 0xff, (v >> 8) & 0xff);
  const push32 = (v: number) => {
    const u = v >>> 0;
    if (big) out.push((u >>> 24) & 0xff, (u >>> 16) & 0xff, (u >>> 8) & 0xff, u & 0xff);
    else out.push(u & 0xff, (u >>> 8) & 0xff, (u >>> 16) & 0xff, (u >>> 24) & 0xff);
  };

  if (typeof e.values === 'string') {
    for (const ch of e.values) out.push(ch.charCodeAt(0));
    out.push(0);
    return out;
  }
  for (const v of e.values) {
    if (e.type === SHORT) push16(v);
    else if (e.type === LONG || e.type === RATIONAL || e.type === SRATIONAL) push32(v);
    else out.push(v & 0xff);
  }
  return out;
};

const ifdSize = (entries: TestEntry[]) => 2 + 12 * entries.length + 4;

const dataSize = (entries: TestEntry[], big: boolean) =>
  entries.reduce((sum, e) => {
    const len = payloadBytes(e, big).length;
    return len <= 4 ? sum : sum + len + (len % 2);
  }, 0);

type TiffSpec = {
  big?: boolean;
  ifd0?: TestEntry[];
  exif?: TestEntry[];
  gps?: TestEntry[];
  ifd1?: TestEntry[];
  /** Thumbnail bytes appended to the block; IFD1 is pointed at them. */
  thumb?: number[];
};

/** Assemble a syntactically valid TIFF block from IFD specifications. */
function buildTiff(spec: TiffSpec): Uint8Array {
  const big = spec.big ?? false;
  const ifd0 = [...(spec.ifd0 ?? [])];
  const exif = spec.exif ?? [];
  const gps = spec.gps ?? [];
  const ifd1 = spec.thumb
    ? [entry(0x0201, LONG, [0]), entry(0x0202, LONG, [spec.thumb.length])]
    : spec.ifd1 ?? [];

  // Offsets are laid out ahead of writing so pointer entries can be filled in.
  const ifd0Start = 8;
  const withPointers = [...ifd0];
  if (exif.length) withPointers.push(entry(0x8769, LONG, [0]));
  if (gps.length) withPointers.push(entry(0x8825, LONG, [0]));

  const ifd0Data = ifd0Start + ifdSize(withPointers);
  const exifStart = ifd0Data + dataSize(withPointers, big);
  const exifData = exifStart + (exif.length ? ifdSize(exif) : 0);
  const gpsStart = exifData + dataSize(exif, big);
  const gpsData = gpsStart + (gps.length ? ifdSize(gps) : 0);
  const ifd1Start = gpsData + dataSize(gps, big);
  const ifd1Data = ifd1Start + (ifd1.length ? ifdSize(ifd1) : 0);
  const thumbStart = ifd1Data + dataSize(ifd1, big);
  const total = thumbStart + (spec.thumb?.length ?? 0);

  const buf = new Uint8Array(total);
  const view = new DataView(buf.buffer);
  const w16 = (o: number, v: number) => view.setUint16(o, v, !big);
  const w32 = (o: number, v: number) => view.setUint32(o, v >>> 0, !big);

  // Header
  buf[0] = big ? 0x4d : 0x49;
  buf[1] = big ? 0x4d : 0x49;
  w16(2, 42);
  w32(4, ifd0Start);

  const writeIfd = (entries: TestEntry[], start: number, dataStart: number, next: number) => {
    w16(start, entries.length);
    let cursor = dataStart;
    entries.forEach((e, i) => {
      const at = start + 2 + i * 12;
      const bytes = payloadBytes(e, big);
      w16(at, e.tag);
      w16(at + 2, e.type);
      w32(at + 4, componentCount(e));
      if (bytes.length <= 4) {
        // Values of four bytes or fewer sit inline, left-aligned.
        bytes.forEach((b, k) => { buf[at + 8 + k] = b; });
      } else {
        w32(at + 8, cursor);
        buf.set(bytes, cursor);
        cursor += bytes.length + (bytes.length % 2);
      }
    });
    w32(start + 2 + entries.length * 12, next);
  };

  writeIfd(withPointers, ifd0Start, ifd0Data, ifd1.length ? ifd1Start : 0);
  if (exif.length) {
    const idx = withPointers.findIndex(e => e.tag === 0x8769);
    w32(ifd0Start + 2 + idx * 12 + 8, exifStart);
    writeIfd(exif, exifStart, exifData, 0);
  }
  if (gps.length) {
    const idx = withPointers.findIndex(e => e.tag === 0x8825);
    w32(ifd0Start + 2 + idx * 12 + 8, gpsStart);
    writeIfd(gps, gpsStart, gpsData, 0);
  }
  if (ifd1.length) writeIfd(ifd1, ifd1Start, ifd1Data, 0);
  if (spec.thumb) {
    // JPEGInterchangeFormat is entry 0 of IFD1; its value slot holds the offset.
    w32(ifd1Start + 2 + 8, thumbStart);
    buf.set(spec.thumb, thumbStart);
  }

  return buf;
}

const section = (parse: TiffParse, name: string) =>
  parse.sections.find(s => s.name === name);

const tag = (parse: TiffParse, sectionName: string, tagName: string) =>
  section(parse, sectionName)?.tags.find(t => t.name === tagName);


/** JPEG SOI + APP0 marker. */
const jpegBytes = () => new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);

const pngBytes = () =>
  new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);

const webpBytes = () => {
  const b = new Uint8Array(16);
  b.set([0x52, 0x49, 0x46, 0x46], 0); // "RIFF"
  b.set([0x57, 0x45, 0x42, 0x50], 8); // "WEBP"
  return b;
};

const gifBytes = () =>
  new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x10, 0x00, 0x10, 0x00]);

/** ISO-BMFF: 4-byte box size, "ftyp", then the brand. */
const bmffBytes = (brand: string) => {
  const b = new Uint8Array(16);
  b.set([0x00, 0x00, 0x00, 0x18], 0);
  b.set([0x66, 0x74, 0x79, 0x70], 4); // "ftyp"
  for (let i = 0; i < 4; i++) b[8 + i] = brand.charCodeAt(i);
  return b;
};

describe('detectFormat', () => {
  it('detects JPEG from the SOI marker', () => {
    expect(detectFormat(jpegBytes())).toBe('JPEG');
  });

  it('detects PNG from its 8-byte signature', () => {
    expect(detectFormat(pngBytes())).toBe('PNG');
  });

  it('detects WebP from the RIFF/WEBP container', () => {
    expect(detectFormat(webpBytes())).toBe('WebP');
  });

  it('detects little-endian TIFF', () => {
    expect(detectFormat(new Uint8Array([0x49, 0x49, 0x2a, 0x00, 8, 0, 0, 0]))).toBe('TIFF');
  });

  it('detects big-endian TIFF', () => {
    expect(detectFormat(new Uint8Array([0x4d, 0x4d, 0x00, 0x2a, 0, 0, 0, 8]))).toBe('TIFF');
  });

  it('detects GIF', () => {
    expect(detectFormat(gifBytes())).toBe('GIF');
  });

  it('detects HEIC from the ftyp brand', () => {
    expect(detectFormat(bmffBytes('heic'))).toBe('HEIC');
  });

  it('detects AVIF from the ftyp brand', () => {
    expect(detectFormat(bmffBytes('avif'))).toBe('AVIF');
  });

  it('returns unknown for unrecognised bytes', () => {
    expect(detectFormat(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]))).toBe('unknown');
  });

  it('returns unknown for a buffer too short to identify', () => {
    expect(detectFormat(new Uint8Array([0xff]))).toBe('unknown');
  });
});

describe('parseTiffBlock — byte order', () => {
  const spec: TiffSpec = {
    ifd0: [entry(0x010f, ASCII, 'NIKON'), entry(0x0112, SHORT, [6])],
  };

  it('reads tags from a little-endian TIFF', () => {
    const parse = parseTiffBlock(buildTiff({ ...spec, big: false }));
    expect(parse.byteOrder).toBe('little');
    expect(tag(parse, 'IFD0', 'Make')?.raw).toBe('NIKON');
    expect(tag(parse, 'IFD0', 'Orientation')?.raw).toBe('6');
  });

  it('reads the same tags from a big-endian TIFF', () => {
    const parse = parseTiffBlock(buildTiff({ ...spec, big: true }));
    expect(parse.byteOrder).toBe('big');
    expect(tag(parse, 'IFD0', 'Make')?.raw).toBe('NIKON');
    expect(tag(parse, 'IFD0', 'Orientation')?.raw).toBe('6');
  });
});

describe('parseTiffBlock — value storage', () => {
  it('reads a SHORT value stored inline', () => {
    const parse = parseTiffBlock(buildTiff({ ifd0: [entry(0x0112, SHORT, [3])] }));
    expect(tag(parse, 'IFD0', 'Orientation')?.raw).toBe('3');
  });

  it('reads a LONG value stored inline', () => {
    const parse = parseTiffBlock(buildTiff({ ifd0: [entry(0x0100, LONG, [4032])] }));
    expect(tag(parse, 'IFD0', 'ImageWidth')?.raw).toBe('4032');
  });

  it('follows the offset for an ASCII value longer than four bytes', () => {
    const parse = parseTiffBlock(buildTiff({ ifd0: [entry(0x0110, ASCII, 'Canon EOS R6')] }));
    expect(tag(parse, 'IFD0', 'Model')?.raw).toBe('Canon EOS R6');
  });

  it('follows the offset for a RATIONAL value', () => {
    const parse = parseTiffBlock(buildTiff({ ifd0: [entry(0x011a, RATIONAL, [72, 1])] }));
    expect(tag(parse, 'IFD0', 'XResolution')?.raw).toBe('72/1');
  });

  it('reads a negative SRATIONAL value', () => {
    const parse = parseTiffBlock(buildTiff({ exif: [entry(0x9204, SRATIONAL, [-2, 3])] }));
    expect(tag(parse, 'Exif', 'ExposureBiasValue')?.raw).toBe('-2/3');
  });

  it('renders UNDEFINED bytes as hex', () => {
    const parse = parseTiffBlock(buildTiff({ exif: [entry(0x9000, UNDEFINED, [0x30, 0x32, 0x33, 0x30, 0x00])] }));
    expect(tag(parse, 'Exif', 'ExifVersion')?.raw).toBe('30 32 33 30 00');
  });

  it('reads a multi-component SHORT array', () => {
    const parse = parseTiffBlock(buildTiff({ ifd0: [entry(0x0102, SHORT, [8, 8, 8])] }));
    expect(tag(parse, 'IFD0', 'BitsPerSample')?.raw).toBe('8, 8, 8');
  });
});

describe('parseTiffBlock — unknown tags', () => {
  it('keeps an unrecognised tag and labels it by hex id', () => {
    const parse = parseTiffBlock(buildTiff({ ifd0: [entry(0xfde8, SHORT, [1])] }));
    const unknown = section(parse, 'IFD0')?.tags.find(t => t.id === 0xfde8);
    expect(unknown?.name).toBe('Unknown (0xFDE8)');
    expect(unknown?.raw).toBe('1');
  });
});

describe('parseTiffBlock — nested directories', () => {
  it('follows the Exif SubIFD pointer into its own section', () => {
    const parse = parseTiffBlock(buildTiff({
      ifd0: [entry(0x010f, ASCII, 'Apple')],
      exif: [entry(0x829a, RATIONAL, [1, 250])],
    }));
    expect(tag(parse, 'Exif', 'ExposureTime')?.raw).toBe('1/250');
  });

  it('follows the GPS IFD pointer into its own section', () => {
    const parse = parseTiffBlock(buildTiff({
      gps: [entry(0x0001, ASCII, 'N')],
    }));
    expect(tag(parse, 'GPS', 'GPSLatitudeRef')?.raw).toBe('N');
  });

  it('does not emit the pointer tags themselves as data', () => {
    const parse = parseTiffBlock(buildTiff({
      ifd0: [entry(0x010f, ASCII, 'Apple')],
      exif: [entry(0x829a, RATIONAL, [1, 250])],
    }));
    expect(section(parse, 'IFD0')?.tags.some(t => t.id === 0x8769)).toBe(false);
  });

  it('reads IFD1 as the thumbnail directory', () => {
    const parse = parseTiffBlock(buildTiff({
      ifd0: [entry(0x010f, ASCII, 'Apple')],
      ifd1: [entry(0x0201, LONG, [1000]), entry(0x0202, LONG, [4096])],
    }));
    expect(tag(parse, 'Thumbnail', 'JPEGInterchangeFormat')?.raw).toBe('1000');
    expect(parse.thumbnail).toEqual({ offset: 1000, length: 4096 });
  });

  it('omits empty sections', () => {
    const parse = parseTiffBlock(buildTiff({ ifd0: [entry(0x010f, ASCII, 'Apple')] }));
    expect(section(parse, 'GPS')).toBeUndefined();
    expect(section(parse, 'Exif')).toBeUndefined();
  });
});

describe('parseTiffBlock — malformed input', () => {
  it('warns instead of throwing when the buffer is truncated mid-IFD', () => {
    const full = buildTiff({ ifd0: [entry(0x0110, ASCII, 'Canon EOS R6')] });
    const truncated = full.slice(0, 12);
    const parse = parseTiffBlock(truncated);
    expect(parse.warnings.length).toBeGreaterThan(0);
    expect(parse.sections).toEqual([]);
  });

  it('warns when a value offset points past the end of the buffer', () => {
    const buf = buildTiff({ ifd0: [entry(0x0110, ASCII, 'Canon EOS R6')] });
    // Repoint the Model value at an offset far beyond the buffer.
    new DataView(buf.buffer).setUint32(8 + 2 + 8, 0xfffff, true);
    const parse = parseTiffBlock(buf);
    expect(parse.warnings.some(w => /offset/i.test(w))).toBe(true);
  });

  it('warns when the first IFD offset is out of range', () => {
    const buf = buildTiff({ ifd0: [entry(0x0112, SHORT, [1])] });
    new DataView(buf.buffer).setUint32(4, 0xfffff, true);
    const parse = parseTiffBlock(buf);
    expect(parse.warnings.length).toBeGreaterThan(0);
    expect(parse.sections).toEqual([]);
  });

  it('terminates on a self-referential IFD chain', () => {
    const buf = buildTiff({ ifd0: [entry(0x0112, SHORT, [1])], ifd1: [entry(0x0112, SHORT, [1])] });
    // Point IFD0's next-IFD pointer back at IFD0.
    new DataView(buf.buffer).setUint32(8 + 2 + 12, 8, true);
    const parse = parseTiffBlock(buf);
    expect(parse.warnings.some(w => /loop|circular/i.test(w))).toBe(true);
  });

  it('rejects a block whose byte-order mark is not II or MM', () => {
    const buf = buildTiff({ ifd0: [entry(0x0112, SHORT, [1])] });
    buf[0] = 0x00;
    const parse = parseTiffBlock(buf);
    expect(parse.warnings.length).toBeGreaterThan(0);
    expect(parse.sections).toEqual([]);
  });
});

describe('parseTiffBlock — value formatting', () => {
  const formattedExif = (e: TestEntry) =>
    tag(parseTiffBlock(buildTiff({ exif: [e] })), 'Exif', 'ExposureTime')?.formatted;

  it('renders a sub-second exposure as a fraction with units', () => {
    expect(formattedExif(entry(0x829a, RATIONAL, [1, 250]))).toBe('1/250 s');
  });

  it('renders a whole-second exposure as a decimal', () => {
    expect(formattedExif(entry(0x829a, RATIONAL, [2, 1]))).toBe('2 s');
  });

  it('renders FNumber in f-stop notation', () => {
    const parse = parseTiffBlock(buildTiff({ exif: [entry(0x829d, RATIONAL, [28, 10])] }));
    expect(tag(parse, 'Exif', 'FNumber')?.formatted).toBe('f/2.8');
  });

  it('renders FocalLength in millimetres', () => {
    const parse = parseTiffBlock(buildTiff({ exif: [entry(0x920a, RATIONAL, [50, 1])] }));
    expect(tag(parse, 'Exif', 'FocalLength')?.formatted).toBe('50 mm');
  });

  it('renders ISO with its prefix', () => {
    const parse = parseTiffBlock(buildTiff({ exif: [entry(0x8827, SHORT, [400])] }));
    expect(tag(parse, 'Exif', 'ISOSpeedRatings')?.formatted).toBe('ISO 400');
  });

  it('renders exposure bias in EV', () => {
    const parse = parseTiffBlock(buildTiff({ exif: [entry(0x9204, SRATIONAL, [-2, 3])] }));
    expect(tag(parse, 'Exif', 'ExposureBiasValue')?.formatted).toBe('-0.67 EV');
  });

  it('reduces a plain rational to a number', () => {
    const parse = parseTiffBlock(buildTiff({ ifd0: [entry(0x011a, RATIONAL, [72, 1])] }));
    expect(tag(parse, 'IFD0', 'XResolution')?.formatted).toBe('72');
  });

  it('resolves an enumerated value to its name', () => {
    const parse = parseTiffBlock(buildTiff({ ifd0: [entry(0x0112, SHORT, [6])] }));
    expect(tag(parse, 'IFD0', 'Orientation')?.formatted).toBe('Rotated 90° CW');
  });

  it('resolves an enum in the Exif directory', () => {
    const parse = parseTiffBlock(buildTiff({ exif: [entry(0xa001, SHORT, [1])] }));
    expect(tag(parse, 'Exif', 'ColorSpace')?.formatted).toBe('sRGB');
  });

  it('labels an enumerated value that is not in the standard', () => {
    const parse = parseTiffBlock(buildTiff({ ifd0: [entry(0x0112, SHORT, [99])] }));
    expect(tag(parse, 'IFD0', 'Orientation')?.formatted).toBe('Unknown (99)');
  });

  it('decodes the Flash bit field', () => {
    // 0x09 = bit 0 set (fired) + bits 3-4 = 01 (compulsory firing).
    const parse = parseTiffBlock(buildTiff({ exif: [entry(0x9209, SHORT, [0x09])] }));
    expect(tag(parse, 'Exif', 'Flash')?.formatted).toBe('Fired, compulsory firing');
  });

  it('reports a flash that did not fire', () => {
    const parse = parseTiffBlock(buildTiff({ exif: [entry(0x9209, SHORT, [0x10])] }));
    expect(tag(parse, 'Exif', 'Flash')?.formatted).toBe('Did not fire, compulsory suppression');
  });

  it('leaves ASCII values untouched', () => {
    const parse = parseTiffBlock(buildTiff({ ifd0: [entry(0x010f, ASCII, 'NIKON')] }));
    expect(tag(parse, 'IFD0', 'Make')?.formatted).toBe('NIKON');
  });
});

describe('parseTiffBlock — GPS extraction', () => {
  const northEast: TestEntry[] = [
    entry(0x0001, ASCII, 'N'),
    entry(0x0002, RATIONAL, [51, 1, 30, 1, 30, 1]),
    entry(0x0003, ASCII, 'E'),
    entry(0x0004, RATIONAL, [0, 1, 7, 1, 30, 1]),
  ];

  it('converts degrees/minutes/seconds to decimal degrees', () => {
    const parse = parseTiffBlock(buildTiff({ gps: northEast }));
    expect(parse.gps?.lat).toBeCloseTo(51.508333, 5);
    expect(parse.gps?.lon).toBeCloseTo(0.125, 5);
  });

  it('negates a southern latitude', () => {
    const parse = parseTiffBlock(buildTiff({
      gps: [...northEast.slice(1), entry(0x0001, ASCII, 'S')],
    }));
    expect(parse.gps?.lat).toBeCloseTo(-51.508333, 5);
  });

  it('negates a western longitude', () => {
    const parse = parseTiffBlock(buildTiff({
      gps: [...northEast.slice(0, 2), entry(0x0003, ASCII, 'W'), northEast[3]],
    }));
    expect(parse.gps?.lon).toBeCloseTo(-0.125, 5);
  });

  it('reads altitude above sea level', () => {
    const parse = parseTiffBlock(buildTiff({
      gps: [...northEast, entry(0x0005, BYTE, [0]), entry(0x0006, RATIONAL, [1234, 10])],
    }));
    expect(parse.gps?.altitude).toBeCloseTo(123.4, 3);
  });

  it('negates altitude below sea level', () => {
    const parse = parseTiffBlock(buildTiff({
      gps: [...northEast, entry(0x0005, BYTE, [1]), entry(0x0006, RATIONAL, [1234, 10])],
    }));
    expect(parse.gps?.altitude).toBeCloseTo(-123.4, 3);
  });

  it('combines the GPS date and time stamps', () => {
    const parse = parseTiffBlock(buildTiff({
      gps: [
        ...northEast,
        entry(0x0007, RATIONAL, [14, 1, 30, 1, 15, 1]),
        entry(0x001d, ASCII, '2026:08:05'),
      ],
    }));
    expect(parse.gps?.timestamp).toBe('2026:08:05 14:30:15 UTC');
  });

  it('reports no coordinates when only a reference is present', () => {
    const parse = parseTiffBlock(buildTiff({ gps: [entry(0x0001, ASCII, 'N')] }));
    expect(parse.gps).toBeUndefined();
  });

  it('formats latitude as degrees, minutes and seconds', () => {
    expect(toDms(51.508333, 'lat')).toBe('51° 30′ 30.0″ N');
  });

  it('formats a negative longitude with a western hemisphere marker', () => {
    expect(toDms(-0.125, 'lon')).toBe('0° 7′ 30.0″ W');
  });
});

// ─── Container byte builders ──────────────────────────────────────────────────

const ascii = (s: string): number[] => Array.from(s, c => c.charCodeAt(0));

/** One JPEG marker segment: 0xFF, marker, 2-byte length, payload. */
const jpegSegment = (marker: number, payload: number[]): number[] => {
  const length = payload.length + 2;
  return [0xff, marker, (length >> 8) & 0xff, length & 0xff, ...payload];
};

type JpegSpec = {
  tiff?: Uint8Array;
  xmp?: boolean;
  iptc?: boolean;
  icc?: boolean;
  comment?: string;
  size?: { width: number; height: number };
};

function buildJpeg(spec: JpegSpec): Uint8Array {
  const out: number[] = [0xff, 0xd8];

  if (spec.tiff) {
    out.push(...jpegSegment(0xe1, [...ascii('Exif'), 0, 0, ...Array.from(spec.tiff)]));
  }
  if (spec.xmp) {
    out.push(...jpegSegment(0xe1, [...ascii('http://ns.adobe.com/xap/1.0/'), 0, ...ascii('<x:xmpmeta/>')]));
  }
  if (spec.icc) {
    out.push(...jpegSegment(0xe2, [...ascii('ICC_PROFILE'), 0, 1, 1, 0, 0, 0, 0]));
  }
  if (spec.iptc) {
    out.push(...jpegSegment(0xed, [...ascii('Photoshop 3.0'), 0, 0x38, 0x42, 0x49, 0x4d]));
  }
  if (spec.comment) {
    out.push(...jpegSegment(0xfe, ascii(spec.comment)));
  }
  if (spec.size) {
    out.push(...jpegSegment(0xc0, [
      8,
      (spec.size.height >> 8) & 0xff, spec.size.height & 0xff,
      (spec.size.width >> 8) & 0xff, spec.size.width & 0xff,
      3, 1, 0x11, 0, 2, 0x11, 0, 3, 0x11, 0,
    ]));
  }

  out.push(...jpegSegment(0xda, [3, 1, 0, 2, 0x11, 3, 0x11, 0, 0x3f, 0])); // SOS
  out.push(0x12, 0x34, 0x56);                                             // entropy data
  out.push(0xff, 0xd9);                                                   // EOI
  return new Uint8Array(out);
}

/** One PNG chunk: 4-byte length, 4-byte type, data, 4-byte CRC (not verified). */
const pngChunk = (type: string, data: number[]): number[] => [
  (data.length >>> 24) & 0xff, (data.length >>> 16) & 0xff,
  (data.length >>> 8) & 0xff, data.length & 0xff,
  ...ascii(type), ...data, 0, 0, 0, 0,
];

type PngSpec = {
  tiff?: Uint8Array;
  text?: [string, string][];
  size?: { width: number; height: number };
};

function buildPng(spec: PngSpec): Uint8Array {
  const out: number[] = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  const { width = 800, height = 600 } = spec.size ?? {};
  out.push(...pngChunk('IHDR', [
    (width >>> 24) & 0xff, (width >>> 16) & 0xff, (width >>> 8) & 0xff, width & 0xff,
    (height >>> 24) & 0xff, (height >>> 16) & 0xff, (height >>> 8) & 0xff, height & 0xff,
    8, 6, 0, 0, 0,
  ]));
  for (const [key, value] of spec.text ?? []) {
    out.push(...pngChunk('tEXt', [...ascii(key), 0, ...ascii(value)]));
  }
  if (spec.tiff) out.push(...pngChunk('eXIf', Array.from(spec.tiff)));
  out.push(...pngChunk('IEND', []));
  return new Uint8Array(out);
}

/** One RIFF chunk: 4-byte fourCC, 4-byte little-endian size, data, pad to even. */
const riffChunk = (fourCC: string, data: number[]): number[] => {
  const size = data.length;
  const chunk = [
    ...ascii(fourCC),
    size & 0xff, (size >>> 8) & 0xff, (size >>> 16) & 0xff, (size >>> 24) & 0xff,
    ...data,
  ];
  if (size % 2) chunk.push(0);
  return chunk;
};

function buildWebp(spec: { tiff?: Uint8Array; xmp?: boolean; size?: { width: number; height: number } }): Uint8Array {
  const body: number[] = ascii('WEBP');
  if (spec.size) {
    const w = spec.size.width - 1, h = spec.size.height - 1;
    body.push(...riffChunk('VP8X', [
      0x08, 0, 0, 0,
      w & 0xff, (w >>> 8) & 0xff, (w >>> 16) & 0xff,
      h & 0xff, (h >>> 8) & 0xff, (h >>> 16) & 0xff,
    ]));
  }
  if (spec.tiff) body.push(...riffChunk('EXIF', Array.from(spec.tiff)));
  if (spec.xmp) body.push(...riffChunk('XMP ', ascii('<x:xmpmeta/>')));

  const size = body.length;
  return new Uint8Array([
    ...ascii('RIFF'),
    size & 0xff, (size >>> 8) & 0xff, (size >>> 16) & 0xff, (size >>> 24) & 0xff,
    ...body,
  ]);
}

const facts = (over: Partial<FileFacts> = {}): FileFacts => ({
  name: 'photo.jpg', size: 1024, type: 'image/jpeg', lastModified: 0, ...over,
});

const parse = (bytes: Uint8Array, over?: Partial<FileFacts>) =>
  parseImageMetadata(bytes.buffer as ArrayBuffer, facts(over));

const resultTag = (result: ExifResult, sectionName: string, tagName: string) =>
  result.sections.find(s => s.name === sectionName)?.tags.find(t => t.name === tagName);

describe('parseImageMetadata — JPEG', () => {
  const tiff = () => buildTiff({
    ifd0: [entry(0x010f, ASCII, 'Apple'), entry(0x0110, ASCII, 'iPhone 15')],
    exif: [entry(0x829a, RATIONAL, [1, 60])],
  });

  it('reads EXIF out of the APP1 segment', () => {
    const result = parse(buildJpeg({ tiff: tiff() }));
    expect(result.format).toBe('JPEG');
    expect(resultTag(result, 'IFD0', 'Make')?.raw).toBe('Apple');
    expect(resultTag(result, 'Exif', 'ExposureTime')?.formatted).toBe('1/60 s');
  });

  it('reads pixel dimensions from the SOF0 frame header', () => {
    const result = parse(buildJpeg({ tiff: tiff(), size: { width: 4032, height: 3024 } }));
    expect(result.file.width).toBe(4032);
    expect(result.file.height).toBe(3024);
  });

  it('records which auxiliary metadata blocks are present', () => {
    const result = parse(buildJpeg({ tiff: tiff(), xmp: true, iptc: true, icc: true }));
    expect(result.extras).toMatchObject({ xmp: true, iptc: true, icc: true });
  });

  it('records the absence of auxiliary blocks', () => {
    const result = parse(buildJpeg({ tiff: tiff() }));
    expect(result.extras).toMatchObject({ xmp: false, iptc: false, icc: false });
  });

  it('captures the JPEG comment segment', () => {
    const result = parse(buildJpeg({ tiff: tiff(), comment: 'shot on set' }));
    expect(result.extras.comment).toBe('shot on set');
  });

  it('returns no sections for a JPEG carrying no EXIF', () => {
    const result = parse(buildJpeg({ size: { width: 10, height: 10 } }));
    expect(result.sections).toEqual([]);
    expect(result.warnings).toEqual([]);
    expect(result.file.width).toBe(10);
  });

  it('warns when a segment length runs past the end of the file', () => {
    const bytes = buildJpeg({ tiff: tiff() });
    bytes[4] = 0xff; // oversized APP1 length
    bytes[5] = 0xf0;
    const result = parse(bytes);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});

describe('parseImageMetadata — PNG', () => {
  it('reads EXIF out of an eXIf chunk', () => {
    const result = parse(buildPng({ tiff: buildTiff({ ifd0: [entry(0x010f, ASCII, 'Pixel')] }) }));
    expect(result.format).toBe('PNG');
    expect(resultTag(result, 'IFD0', 'Make')?.raw).toBe('Pixel');
  });

  it('reads dimensions from IHDR', () => {
    const result = parse(buildPng({ size: { width: 1920, height: 1080 } }));
    expect(result.file.width).toBe(1920);
    expect(result.file.height).toBe(1080);
  });

  it('collects tEXt chunks into their own section', () => {
    const result = parse(buildPng({ text: [['Author', 'Jo'], ['Software', 'GIMP']] }));
    expect(resultTag(result, 'PNG Text', 'Author')?.raw).toBe('Jo');
    expect(resultTag(result, 'PNG Text', 'Software')?.raw).toBe('GIMP');
  });

  it('returns no sections for a PNG with no text or EXIF chunks', () => {
    const result = parse(buildPng({}));
    expect(result.sections).toEqual([]);
  });
});

describe('parseImageMetadata — WebP', () => {
  it('reads EXIF out of the EXIF chunk', () => {
    const result = parse(buildWebp({ tiff: buildTiff({ ifd0: [entry(0x010f, ASCII, 'Canon')] }) }));
    expect(result.format).toBe('WebP');
    expect(resultTag(result, 'IFD0', 'Make')?.raw).toBe('Canon');
  });

  it('reads dimensions from the VP8X chunk', () => {
    const result = parse(buildWebp({ size: { width: 640, height: 480 } }));
    expect(result.file.width).toBe(640);
    expect(result.file.height).toBe(480);
  });

  it('flags an XMP chunk', () => {
    const result = parse(buildWebp({ xmp: true }));
    expect(result.extras.xmp).toBe(true);
  });
});

describe('parseImageMetadata — other containers', () => {
  it('reads GIF dimensions from the header', () => {
    const gif = new Uint8Array([...ascii('GIF89a'), 0x40, 0x01, 0xf0, 0x00]);
    const result = parse(gif);
    expect(result.format).toBe('GIF');
    expect(result.file.width).toBe(320);
    expect(result.file.height).toBe(240);
  });

  it('names HEIC as unsupported rather than reporting an empty file', () => {
    const result = parse(bmffBytes('heic'));
    expect(result.format).toBe('HEIC');
    expect(result.warnings.join(' ')).toMatch(/HEIC/);
  });

  it('warns on a file it cannot identify', () => {
    const result = parse(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]));
    expect(result.format).toBe('unknown');
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('passes the file facts through unchanged', () => {
    const result = parse(buildPng({}), { name: 'holiday.png', size: 4096, type: 'image/png' });
    expect(result.file.name).toBe('holiday.png');
    expect(result.file.size).toBe(4096);
  });
});

describe('parseImageMetadata — embedded thumbnail', () => {
  const thumbJpeg = (width: number, height: number) =>
    Array.from(buildJpeg({ size: { width, height } }));

  it('extracts the thumbnail bytes and reads their dimensions', () => {
    const thumb = thumbJpeg(160, 120);
    const result = parse(buildJpeg({
      tiff: buildTiff({ ifd0: [entry(0x010f, ASCII, 'Apple')], thumb }),
    }));
    expect(result.thumbnail?.bytes.length).toBe(thumb.length);
    expect(result.thumbnail?.width).toBe(160);
    expect(result.thumbnail?.height).toBe(120);
  });

  it('reports no thumbnail when IFD1 is absent', () => {
    const result = parse(buildJpeg({ tiff: buildTiff({ ifd0: [entry(0x010f, ASCII, 'Apple')] }) }));
    expect(result.thumbnail).toBeUndefined();
  });

  it('ignores a thumbnail whose byte range falls outside the block', () => {
    const tiff = buildTiff({
      ifd0: [entry(0x010f, ASCII, 'Apple')],
      ifd1: [entry(0x0201, LONG, [0xffff]), entry(0x0202, LONG, [4096])],
    });
    const result = parse(buildJpeg({ tiff }));
    expect(result.thumbnail).toBeUndefined();
    expect(result.warnings.some(w => /thumbnail/i.test(w))).toBe(true);
  });
});

describe('UserComment decoding', () => {
  const userComment = (prefix: string, text: string) =>
    entry(0x9286, UNDEFINED, [...ascii(prefix.padEnd(8, '\0')), ...ascii(text)]);

  it('decodes a comment marked as ASCII', () => {
    const parse = parseTiffBlock(buildTiff({ exif: [userComment('ASCII', 'do not share')] }));
    expect(tag(parse, 'Exif', 'UserComment')?.formatted).toBe('do not share');
  });

  it('reports an unsupported comment charset rather than showing raw bytes', () => {
    const parse = parseTiffBlock(buildTiff({ exif: [userComment('JIS', 'x')] }));
    expect(tag(parse, 'Exif', 'UserComment')?.formatted).toBe('(JIS-encoded comment)');
  });
});

describe('analyzePrivacy', () => {
  const withExif = (spec: TiffSpec, jpeg: Omit<JpegSpec, 'tiff'> = {}) =>
    parse(buildJpeg({ ...jpeg, tiff: buildTiff(spec) }));

  const bySource = (result: ExifResult, source: string) =>
    result.findings.find(f => f.source === source);

  const gpsEntries: TestEntry[] = [
    entry(0x0001, ASCII, 'N'),
    entry(0x0002, RATIONAL, [51, 1, 30, 1, 30, 1]),
    entry(0x0003, ASCII, 'W'),
    entry(0x0004, RATIONAL, [0, 1, 7, 1, 30, 1]),
  ];

  it('reports GPS coordinates as the highest severity', () => {
    const result = withExif({ ifd0: [entry(0x010f, ASCII, 'Apple')], gps: gpsEntries });
    const finding = bySource(result, 'GPSLatitude');
    expect(finding?.severity).toBe('high');
    expect(finding?.detail).toMatch(/51\.5/);
  });

  it('reports no GPS finding when there are no coordinates', () => {
    const result = withExif({ ifd0: [entry(0x010f, ASCII, 'Apple')] });
    expect(result.findings.some(f => f.severity === 'high')).toBe(false);
  });

  it('flags a camera body serial number', () => {
    const result = withExif({ exif: [entry(0xa431, ASCII, 'SN12345')] });
    expect(bySource(result, 'BodySerialNumber')?.severity).toBe('medium');
  });

  it('flags a lens serial number', () => {
    const result = withExif({ exif: [entry(0xa435, ASCII, 'LN999')] });
    expect(bySource(result, 'LensSerialNumber')?.severity).toBe('medium');
  });

  it('flags a named camera owner', () => {
    const result = withExif({ exif: [entry(0xa430, ASCII, 'Jo Smith')] });
    expect(bySource(result, 'CameraOwnerName')?.detail).toMatch(/Jo Smith/);
  });

  it('flags the Artist tag', () => {
    const result = withExif({ ifd0: [entry(0x013b, ASCII, 'Jo Smith')] });
    expect(bySource(result, 'Artist')?.severity).toBe('medium');
  });

  it('flags the Windows XPAuthor tag', () => {
    const result = withExif({ ifd0: [entry(0x9c9d, ASCII, 'Jo')] });
    expect(bySource(result, 'XPAuthor')?.severity).toBe('medium');
  });

  it('identifies the device from make and model together', () => {
    const result = withExif({
      ifd0: [entry(0x010f, ASCII, 'Apple'), entry(0x0110, ASCII, 'iPhone 15')],
    });
    expect(bySource(result, 'Model')?.detail).toMatch(/Apple iPhone 15/);
  });

  it('flags the software that wrote the file', () => {
    const result = withExif({ ifd0: [entry(0x0131, ASCII, 'Adobe Photoshop 2026')] });
    expect(bySource(result, 'Software')?.detail).toMatch(/Adobe Photoshop 2026/);
  });

  it('flags the original capture timestamp', () => {
    const result = withExif({ exif: [entry(0x9003, ASCII, '2026:08:05 14:30:00')] });
    const finding = bySource(result, 'DateTimeOriginal');
    expect(finding?.severity).toBe('medium');
    expect(finding?.detail).toMatch(/2026:08:05/);
  });

  it('calls out the timezone offset separately', () => {
    const result = withExif({ exif: [entry(0x9011, ASCII, '+02:00')] });
    expect(bySource(result, 'OffsetTimeOriginal')?.detail).toMatch(/time zone/i);
  });

  it('flags a thumbnail whose aspect ratio disagrees with the image', () => {
    const result = parse(buildJpeg({
      size: { width: 4000, height: 1000 },
      tiff: buildTiff({
        ifd0: [entry(0x010f, ASCII, 'Apple')],
        thumb: Array.from(buildJpeg({ size: { width: 160, height: 120 } })),
      }),
    }));
    const finding = bySource(result, 'Thumbnail');
    expect(finding?.severity).toBe('medium');
    expect(finding?.detail).toMatch(/crop/i);
  });

  it('does not flag a thumbnail with a matching aspect ratio', () => {
    const result = parse(buildJpeg({
      size: { width: 4032, height: 3024 },
      tiff: buildTiff({
        ifd0: [entry(0x010f, ASCII, 'Apple')],
        thumb: Array.from(buildJpeg({ size: { width: 160, height: 120 } })),
      }),
    }));
    expect(bySource(result, 'Thumbnail')).toBeUndefined();
  });

  it('notes an XMP block as low severity', () => {
    const result = withExif({ ifd0: [entry(0x010f, ASCII, 'Apple')] }, { xmp: true });
    expect(bySource(result, 'XMP')?.severity).toBe('low');
  });

  it('notes an IPTC block', () => {
    const result = withExif({ ifd0: [entry(0x010f, ASCII, 'Apple')] }, { iptc: true });
    expect(bySource(result, 'IPTC')?.severity).toBe('low');
  });

  it('notes free text in a JPEG comment', () => {
    const result = withExif({ ifd0: [entry(0x010f, ASCII, 'Apple')] }, { comment: 'internal draft' });
    expect(bySource(result, 'JPEG comment')?.detail).toMatch(/internal draft/);
  });

  it('notes a non-empty image description', () => {
    const result = withExif({ ifd0: [entry(0x010e, ASCII, 'Backyard')] });
    expect(bySource(result, 'ImageDescription')?.severity).toBe('low');
  });

  it('reports a clean file with a single informational finding', () => {
    const result = parse(buildJpeg({ size: { width: 10, height: 10 } }));
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0].severity).toBe('info');
  });

  it('orders findings by severity, most serious first', () => {
    const result = withExif(
      {
        ifd0: [entry(0x010e, ASCII, 'Backyard'), entry(0x0131, ASCII, 'GIMP')],
        gps: gpsEntries,
      },
      { xmp: true }
    );
    const severities = result.findings.map(f => f.severity);
    expect(severities).toEqual([...severities].sort(
      (a, b) => ['high', 'medium', 'low', 'info'].indexOf(a) - ['high', 'medium', 'low', 'info'].indexOf(b)
    ));
    expect(severities[0]).toBe('high');
  });

  it('does not add an informational finding when real findings exist', () => {
    const result = withExif({ ifd0: [entry(0x0131, ASCII, 'GIMP')] });
    expect(result.findings.some(f => f.severity === 'info')).toBe(false);
  });
});

describe('GPS coordinate display', () => {
  it('rounds seconds so encoder rounding does not leak into the display', () => {
    // Real encoders store seconds as a large fraction: 299988/10000 = 29.9988.
    const parse = parseTiffBlock(buildTiff({
      gps: [entry(0x0002, RATIONAL, [51, 1, 30, 1, 299988, 10000]), entry(0x0001, ASCII, 'N')],
    }));
    expect(tag(parse, 'GPS', 'GPSLatitude')?.formatted).toBe('51° 30′ 30″');
  });

  it('keeps genuinely fractional seconds', () => {
    const parse = parseTiffBlock(buildTiff({
      gps: [entry(0x0002, RATIONAL, [51, 1, 30, 1, 2925, 100]), entry(0x0001, ASCII, 'N')],
    }));
    expect(tag(parse, 'GPS', 'GPSLatitude')?.formatted).toBe('51° 30′ 29.25″');
  });
});
