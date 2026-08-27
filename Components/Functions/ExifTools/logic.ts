/**
 * Client-side image metadata parser.
 *
 * Every offset read here comes from the file itself, so every read is
 * bounds-checked: malformed and truncated images are the normal input for this
 * tool, not the exception.
 */

export type ImageFormat =
  | 'JPEG'
  | 'PNG'
  | 'WebP'
  | 'TIFF'
  | 'GIF'
  | 'HEIC'
  | 'AVIF'
  | 'unknown';

const startsWith = (bytes: Uint8Array, sig: number[], at = 0): boolean => {
  if (bytes.length < at + sig.length) return false;
  return sig.every((b, i) => bytes[at + i] === b);
};

const asciiAt = (bytes: Uint8Array, at: number, length: number): string => {
  if (bytes.length < at + length) return '';
  let s = '';
  for (let i = 0; i < length; i++) s += String.fromCharCode(bytes[at + i]);
  return s;
};

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

/** ftyp brands that carry HEIF-family images. */
const HEIC_BRANDS = ['heic', 'heix', 'hevc', 'heim', 'heis', 'mif1', 'msf1'];
const AVIF_BRANDS = ['avif', 'avis'];

export function detectFormat(bytes: Uint8Array): ImageFormat {
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return 'JPEG';
  if (startsWith(bytes, PNG_SIGNATURE)) return 'PNG';
  if (startsWith(bytes, [0x49, 0x49, 0x2a, 0x00])) return 'TIFF';
  if (startsWith(bytes, [0x4d, 0x4d, 0x00, 0x2a])) return 'TIFF';
  if (asciiAt(bytes, 0, 3) === 'GIF') return 'GIF';

  if (asciiAt(bytes, 0, 4) === 'RIFF' && asciiAt(bytes, 8, 4) === 'WEBP') return 'WebP';

  if (asciiAt(bytes, 4, 4) === 'ftyp') {
    const brand = asciiAt(bytes, 8, 4);
    if (HEIC_BRANDS.includes(brand)) return 'HEIC';
    if (AVIF_BRANDS.includes(brand)) return 'AVIF';
  }

  return 'unknown';
}

// ─── TIFF / IFD parsing ───────────────────────────────────────────────────────

import {
  TIFF_TAGS,
  EXIF_TAGS,
  GPS_TAGS,
  INTEROP_TAGS,
  EXIF_IFD_POINTER,
  GPS_IFD_POINTER,
  INTEROP_IFD_POINTER,
  THUMBNAIL_OFFSET,
  THUMBNAIL_LENGTH,
  ENUM_TAGS,
  describeFlash,
  type TagDictionary,
} from './tags';

export type ByteOrder = 'little' | 'big';

/** Which dictionary a directory's tag ids should be read against. */
export type Directory = 'tiff' | 'exif' | 'gps' | 'interop';

export type ExifTag = {
  id: number;
  name: string;
  /** EXIF field type, e.g. "ASCII", "RATIONAL". */
  type: string;
  /** The value as stored, before any interpretation. */
  raw: string;
  /** The value made readable: enums resolved, rationals rendered. */
  formatted: string;
};

export type ExifSection = {
  name: string;
  /** "text" covers PNG keyword chunks, which are not a TIFF directory. */
  directory: Directory | 'text';
  tags: ExifTag[];
};

export type GpsInfo = {
  lat: number;
  lon: number;
  altitude?: number;
  timestamp?: string;
};

export type TiffParse = {
  byteOrder: ByteOrder | null;
  sections: ExifSection[];
  gps?: GpsInfo;
  /** Byte range of the embedded thumbnail, relative to the TIFF block. */
  thumbnail?: { offset: number; length: number };
  warnings: string[];
};

const TYPE_NAMES: Record<number, string> = {
  1: 'BYTE', 2: 'ASCII', 3: 'SHORT', 4: 'LONG', 5: 'RATIONAL',
  6: 'SBYTE', 7: 'UNDEFINED', 8: 'SSHORT', 9: 'SLONG', 10: 'SRATIONAL',
  11: 'FLOAT', 12: 'DOUBLE', 13: 'IFD',
};

const TYPE_SIZES: Record<number, number> = {
  1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 6: 1, 7: 1, 8: 2, 9: 4, 10: 8, 11: 4, 12: 8, 13: 4,
};

const DICTIONARIES: Record<Directory, TagDictionary> = {
  tiff: TIFF_TAGS,
  exif: EXIF_TAGS,
  gps: GPS_TAGS,
  interop: INTEROP_TAGS,
};

const hexId = (id: number) => `0x${id.toString(16).toUpperCase().padStart(4, '0')}`;

export const tagName = (id: number, directory: Directory): string =>
  DICTIONARIES[directory][id] ?? `Unknown (${hexId(id)})`;

/** A tag's value in its native shape, for consumers that need numbers. */
export type RawValue = {
  type: number;
  numbers: number[];
  rationals: [number, number][];
  text: string;
  bytes: Uint8Array;
};

/** MakerNote and similar UNDEFINED blobs can be enormous; only show a prefix. */
const MAX_HEX_BYTES = 32;

const toHex = (bytes: Uint8Array): string => {
  const shown = Array.from(bytes.slice(0, MAX_HEX_BYTES))
    .map(b => b.toString(16).toUpperCase().padStart(2, '0'))
    .join(' ');
  return bytes.length > MAX_HEX_BYTES ? `${shown} … (${bytes.length} bytes)` : shown;
};

const decodeAscii = (bytes: Uint8Array): string => {
  let end = bytes.length;
  while (end > 0 && bytes[end - 1] === 0) end--;
  let s = '';
  for (let i = 0; i < end; i++) s += String.fromCharCode(bytes[i]);
  return s.trim();
};

/** Drop floating-point noise without forcing a fixed number of decimals. */
const trimNumber = (n: number): string =>
  Number.isFinite(n) ? String(parseFloat(n.toFixed(6))) : '—';

const ratioValue = (r: [number, number]): number => (r[1] === 0 ? NaN : r[0] / r[1]);

/**
 * Degrees/minutes/seconds triplet to signed decimal degrees.
 * The reference ("S" or "W") decides the sign.
 */
export function dmsToDegrees(
  rationals: [number, number][],
  ref: string
): number | undefined {
  if (rationals.length < 3) return undefined;
  const [d, m, s] = rationals.map(ratioValue);
  if (![d, m, s].every(Number.isFinite)) return undefined;
  const magnitude = d + m / 60 + s / 3600;
  const negative = ref.toUpperCase() === 'S' || ref.toUpperCase() === 'W';
  return negative ? -magnitude : magnitude;
}

/** Decimal degrees rendered as degrees/minutes/seconds with a hemisphere. */
export function toDms(degrees: number, kind: 'lat' | 'lon'): string {
  const hemisphere = kind === 'lat' ? (degrees < 0 ? 'S' : 'N') : (degrees < 0 ? 'W' : 'E');
  const absolute = Math.abs(degrees);
  const d = Math.floor(absolute);
  const minutesFloat = (absolute - d) * 60;
  const m = Math.floor(minutesFloat);
  const s = (minutesFloat - m) * 60;
  return `${d}° ${m}′ ${s.toFixed(1)}″ ${hemisphere}`;
}

const rawString = (value: RawValue): string => {
  switch (value.type) {
    case 2:
      return value.text;
    case 5:
    case 10:
      return value.rationals.map(([n, d]) => `${n}/${d}`).join(', ');
    case 1:
    case 7:
      return toHex(value.bytes);
    default:
      return value.numbers.join(', ');
  }
};

const pad2 = (n: number) => String(Math.floor(n)).padStart(2, '0');

/**
 * UserComment stores an 8-byte character-set marker ahead of the text. Only
 * ASCII is decoded; anything else is named rather than shown as raw bytes.
 */
function decodeUserComment(bytes: Uint8Array): string {
  if (bytes.length <= 8) return '';
  const charset = decodeAscii(bytes.subarray(0, 8)).replace(/\0/g, '').trim();
  const body = bytes.subarray(8);
  if (charset === 'ASCII' || charset === '') return decodeAscii(body);
  return `(${charset}-encoded comment)`;
}

/**
 * Turn a stored value into something a person can read: enumerations resolved
 * to names, rationals reduced, units attached.
 *
 * Falls back to `raw` whenever there is no better interpretation, so no tag
 * ever renders as blank.
 */
export function formatValue(
  id: number,
  directory: Directory,
  value: RawValue,
  raw: string
): string {
  const first = value.rationals[0];
  const single = first ? ratioValue(first) : value.numbers[0];

  if (directory === 'gps') {
    switch (id) {
      case 0x0000: // GPSVersionID
        return value.numbers.join('.');
      case 0x0002: case 0x0004: case 0x0014: case 0x0016: {
        if (value.rationals.length < 3) break;
        const [d, m, s] = value.rationals.map(ratioValue);
        // Encoders store seconds as a large fraction (299988/10000); rounding to
        // hundredths keeps real precision without showing their rounding error.
        const seconds = Number.isFinite(s) ? parseFloat(s.toFixed(2)) : s;
        return `${trimNumber(d)}° ${trimNumber(m)}′ ${trimNumber(seconds)}″`;
      }
      case 0x0006:
        return Number.isFinite(single) ? `${trimNumber(single)} m` : raw;
      case 0x0007: {
        if (value.rationals.length < 3) break;
        const [h, m, s] = value.rationals.map(ratioValue);
        return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
      }
    }
  }

  if (directory === 'exif') {
    switch (id) {
      case 0x829a: { // ExposureTime
        if (!first) break;
        const seconds = ratioValue(first);
        if (!Number.isFinite(seconds)) break;
        return seconds < 1 && first[0] !== 0
          ? `1/${Math.round(first[1] / first[0])} s`
          : `${trimNumber(seconds)} s`;
      }
      case 0x829d: // FNumber
        return Number.isFinite(single) ? `f/${trimNumber(single)}` : raw;
      case 0x920a: // FocalLength
        return Number.isFinite(single) ? `${trimNumber(single)} mm` : raw;
      case 0xa405: // FocalLengthIn35mmFilm
        return `${raw} mm`;
      case 0x8827: // ISOSpeedRatings
        return `ISO ${raw}`;
      case 0x9204: // ExposureBiasValue
        return Number.isFinite(single) ? `${single.toFixed(2)} EV` : raw;
      case 0x9209: // Flash
        return describeFlash(value.numbers[0] ?? 0);
      case 0x9286: // UserComment: an 8-byte charset marker, then the text
        return decodeUserComment(value.bytes);
      case 0xa404: // DigitalZoomRatio
        return Number.isFinite(single) ? `${trimNumber(single)}×` : raw;
    }
  }

  const enums = ENUM_TAGS[directory]?.[id];
  if (enums) {
    const key = value.numbers[0];
    if (key === undefined) return raw;
    return enums[key] ?? `Unknown (${key})`;
  }

  // A lone rational is almost always meant to be read as a number.
  if (value.rationals.length === 1 && Number.isFinite(single)) return trimNumber(single);

  return raw;
}

/**
 * Walk a TIFF block: header, IFD chain, and the Exif/GPS/Interop sub-directories
 * that IFD0 points at.
 *
 * `bytes` must start at the TIFF header (the "II"/"MM" mark), which is the
 * offset base for every pointer inside the block.
 */
export function parseTiffBlock(bytes: Uint8Array): TiffParse {
  const warnings: string[] = [];
  const sections: ExifSection[] = [];
  const result: TiffParse = { byteOrder: null, sections, warnings };

  if (bytes.length < 8) {
    warnings.push('TIFF block is too short to contain a header.');
    return result;
  }

  const mark = String.fromCharCode(bytes[0], bytes[1]);
  if (mark !== 'II' && mark !== 'MM') {
    warnings.push(`Unrecognised byte-order mark "${mark}" — not a TIFF block.`);
    return result;
  }
  const little = mark === 'II';
  result.byteOrder = little ? 'little' : 'big';

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const u16 = (o: number) => view.getUint16(o, little);
  const u32 = (o: number) => view.getUint32(o, little);
  const i32 = (o: number) => view.getInt32(o, little);

  const magic = u16(2);
  if (magic !== 42) {
    warnings.push(
      magic === 43
        ? 'BigTIFF (magic 43) is not supported.'
        : `Unexpected TIFF magic number ${magic}; expected 42.`
    );
    return result;
  }

  /** Read one directory's entries, without following any pointers. */
  const readIfd = (offset: number, directory: Directory): {
    tags: ExifTag[];
    values: Map<number, RawValue>;
  } | null => {
    if (offset + 2 > bytes.length) {
      warnings.push(`Directory offset ${offset} is outside the file.`);
      return null;
    }
    const count = u16(offset);
    const end = offset + 2 + count * 12 + 4;
    if (end > bytes.length) {
      warnings.push(`Directory at offset ${offset} runs past the end of the file.`);
      return null;
    }

    const tags: ExifTag[] = [];
    const values = new Map<number, RawValue>();

    for (let i = 0; i < count; i++) {
      const at = offset + 2 + i * 12;
      const id = u16(at);
      const type = u16(at + 2);
      const components = u32(at + 4);
      const size = TYPE_SIZES[type];

      if (!size) {
        warnings.push(`Tag ${hexId(id)} has unknown field type ${type}; skipped.`);
        continue;
      }

      const byteLength = size * components;
      const valueAt = byteLength <= 4 ? at + 8 : u32(at + 8);

      if (valueAt + byteLength > bytes.length) {
        warnings.push(`Value offset for tag ${hexId(id)} is outside the file; skipped.`);
        continue;
      }

      const value: RawValue = {
        type,
        numbers: [],
        rationals: [],
        text: '',
        bytes: bytes.subarray(valueAt, valueAt + byteLength),
      };

      if (type === 2) {
        value.text = decodeAscii(value.bytes);
      } else if (type === 5 || type === 10) {
        for (let c = 0; c < components; c++) {
          const o = valueAt + c * 8;
          value.rationals.push(type === 5 ? [u32(o), u32(o + 4)] : [i32(o), i32(o + 4)]);
        }
      } else if (type !== 1 && type !== 7) {
        for (let c = 0; c < components; c++) {
          const o = valueAt + c * size;
          switch (type) {
            case 3: value.numbers.push(u16(o)); break;
            case 4: case 13: value.numbers.push(u32(o)); break;
            case 6: value.numbers.push(view.getInt8(o)); break;
            case 8: value.numbers.push(view.getInt16(o, little)); break;
            case 9: value.numbers.push(i32(o)); break;
            case 11: value.numbers.push(view.getFloat32(o, little)); break;
            case 12: value.numbers.push(view.getFloat64(o, little)); break;
          }
        }
      } else {
        for (const b of value.bytes) value.numbers.push(b);
      }

      values.set(id, value);

      // Pointer tags are structure, not content; the walker consumes them.
      if (
        directory === 'tiff' &&
        (id === EXIF_IFD_POINTER || id === GPS_IFD_POINTER)
      ) continue;
      if (directory === 'exif' && id === INTEROP_IFD_POINTER) continue;

      const raw = rawString(value);
      tags.push({
        id,
        name: tagName(id, directory),
        type: TYPE_NAMES[type] ?? `Type ${type}`,
        raw,
        formatted: formatValue(id, directory, value, raw),
      });
    }

    return { tags, values };
  };

  const addSection = (name: string, directory: Directory, tags: ExifTag[]) => {
    if (tags.length) sections.push({ name, directory, tags });
  };

  // Main IFD chain: IFD0, then IFD1 (thumbnail), and any further directories.
  const visited = new Set<number>();
  let offset = u32(4);
  let index = 0;
  let ifd0Values: Map<number, RawValue> | null = null;

  while (offset !== 0) {
    if (visited.has(offset)) {
      warnings.push(`IFD chain loops back to offset ${offset}; stopped.`);
      break;
    }
    visited.add(offset);

    const ifd = readIfd(offset, 'tiff');
    if (!ifd) break;

    if (index === 0) {
      ifd0Values = ifd.values;
      addSection('IFD0', 'tiff', ifd.tags);
    } else if (index === 1) {
      addSection('Thumbnail', 'tiff', ifd.tags);
      const start = ifd.values.get(THUMBNAIL_OFFSET)?.numbers[0];
      const length = ifd.values.get(THUMBNAIL_LENGTH)?.numbers[0];
      if (start !== undefined && length !== undefined) {
        result.thumbnail = { offset: start, length };
      }
    } else {
      addSection(`IFD${index}`, 'tiff', ifd.tags);
    }

    const nextAt = offset + 2 + u16(offset) * 12;
    offset = nextAt + 4 <= bytes.length ? u32(nextAt) : 0;
    index++;
  }

  // Sub-directories hanging off IFD0.
  const exifPointer = ifd0Values?.get(EXIF_IFD_POINTER)?.numbers[0];
  if (exifPointer !== undefined) {
    const exif = readIfd(exifPointer, 'exif');
    if (exif) {
      addSection('Exif', 'exif', exif.tags);
      const interopPointer = exif.values.get(INTEROP_IFD_POINTER)?.numbers[0];
      if (interopPointer !== undefined) {
        const interop = readIfd(interopPointer, 'interop');
        if (interop) addSection('Interop', 'interop', interop.tags);
      }
    }
  }

  const gpsPointer = ifd0Values?.get(GPS_IFD_POINTER)?.numbers[0];
  if (gpsPointer !== undefined) {
    const gps = readIfd(gpsPointer, 'gps');
    if (gps) {
      addSection('GPS', 'gps', gps.tags);
      result.gps = extractGps(gps.values);
    }
  }

  return result;
}

/** Pull usable coordinates out of a GPS directory, if it has a full pair. */
function extractGps(values: Map<number, RawValue>): GpsInfo | undefined {
  const latValue = values.get(0x0002);
  const lonValue = values.get(0x0004);
  if (!latValue || !lonValue) return undefined;

  const lat = dmsToDegrees(latValue.rationals, values.get(0x0001)?.text ?? 'N');
  const lon = dmsToDegrees(lonValue.rationals, values.get(0x0003)?.text ?? 'E');
  if (lat === undefined || lon === undefined) return undefined;

  const gps: GpsInfo = { lat, lon };

  const altitude = values.get(0x0006)?.rationals[0];
  if (altitude) {
    const metres = ratioValue(altitude);
    if (Number.isFinite(metres)) {
      // AltitudeRef 1 means the value is measured downward from sea level.
      gps.altitude = values.get(0x0005)?.numbers[0] === 1 ? -metres : metres;
    }
  }

  const time = values.get(0x0007)?.rationals;
  if (time && time.length >= 3) {
    const [h, m, s] = time.map(ratioValue);
    if ([h, m, s].every(Number.isFinite)) {
      const clock = `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
      const date = values.get(0x001d)?.text;
      gps.timestamp = `${date ? `${date} ` : ''}${clock} UTC`;
    }
  }

  return gps;
}

// ─── Container walking ────────────────────────────────────────────────────────

export type FileFacts = {
  name: string;
  size: number;
  type: string;
  lastModified: number;
};

export type ExifExtras = {
  xmp: boolean;
  iptc: boolean;
  icc: boolean;
  comment?: string;
};

export type ExifResult = {
  format: ImageFormat;
  byteOrder?: ByteOrder;
  file: FileFacts & { width?: number; height?: number };
  sections: ExifSection[];
  gps?: GpsInfo;
  thumbnail?: { bytes: Uint8Array; width?: number; height?: number };
  extras: ExifExtras;
  findings: Finding[];
  warnings: string[];
};

/** Largest file we will read into memory. */
export const MAX_FILE_BYTES = 100 * 1024 * 1024;

const XMP_NAMESPACE = 'http://ns.adobe.com/xap/1.0/';

/**
 * Read a JPEG's SOF frame header for the true pixel dimensions.
 *
 * EXIF's own PixelXDimension can disagree with the encoded frame; the frame
 * header is what a decoder actually uses.
 */
export function readJpegDimensions(
  bytes: Uint8Array
): { width: number; height: number } | undefined {
  let at = 2;
  while (at + 4 <= bytes.length) {
    if (bytes[at] !== 0xff) { at++; continue; }
    const marker = bytes[at + 1];
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      at += 2;
      continue;
    }
    if (marker === 0xda || marker === 0xd9) return undefined; // start of image data
    const length = (bytes[at + 2] << 8) | bytes[at + 3];
    // SOF0-SOF15, excluding the non-frame markers DHT (C4), JPGA (C8) and DAC (CC).
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      if (at + 9 > bytes.length) return undefined;
      return {
        height: (bytes[at + 5] << 8) | bytes[at + 6],
        width: (bytes[at + 7] << 8) | bytes[at + 8],
      };
    }
    at += 2 + length;
  }
  return undefined;
}

type ContainerScan = {
  tiff?: Uint8Array;
  width?: number;
  height?: number;
  extras: ExifExtras;
  textSection?: ExifSection;
  warnings: string[];
};

function scanJpeg(bytes: Uint8Array): ContainerScan {
  const scan: ContainerScan = { extras: { xmp: false, iptc: false, icc: false }, warnings: [] };
  let at = 2;

  while (at + 4 <= bytes.length) {
    if (bytes[at] !== 0xff) {
      scan.warnings.push(`Expected a marker at offset ${at}; the segment structure is damaged.`);
      break;
    }
    const marker = bytes[at + 1];
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      at += 2;
      continue;
    }
    if (marker === 0xda || marker === 0xd9) break; // image data begins; no more metadata

    const length = (bytes[at + 2] << 8) | bytes[at + 3];
    const payloadStart = at + 4;
    const payloadEnd = at + 2 + length;
    if (length < 2 || payloadEnd > bytes.length) {
      scan.warnings.push(
        `Segment 0xFF${marker.toString(16).toUpperCase()} at offset ${at} claims ${length} bytes, which runs past the end of the file.`
      );
      break;
    }
    const payload = bytes.subarray(payloadStart, payloadEnd);

    if (marker === 0xe1) {
      if (asciiAt(payload, 0, 4) === 'Exif' && !scan.tiff) {
        scan.tiff = payload.subarray(6);
      } else if (asciiAt(payload, 0, XMP_NAMESPACE.length) === XMP_NAMESPACE) {
        scan.extras.xmp = true;
      }
    } else if (marker === 0xe2 && asciiAt(payload, 0, 11) === 'ICC_PROFILE') {
      scan.extras.icc = true;
    } else if (marker === 0xed && asciiAt(payload, 0, 13) === 'Photoshop 3.0') {
      scan.extras.iptc = true;
    } else if (marker === 0xfe) {
      scan.extras.comment = decodeAscii(payload);
    } else if (
      marker >= 0xc0 && marker <= 0xcf &&
      marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc &&
      scan.width === undefined
    ) {
      scan.height = (payload[1] << 8) | payload[2];
      scan.width = (payload[3] << 8) | payload[4];
    }

    at = payloadEnd;
  }

  return scan;
}

function scanPng(bytes: Uint8Array): ContainerScan {
  const scan: ContainerScan = { extras: { xmp: false, iptc: false, icc: false }, warnings: [] };
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const textTags: ExifTag[] = [];
  let at = 8;

  while (at + 8 <= bytes.length) {
    const length = view.getUint32(at);
    const type = asciiAt(bytes, at + 4, 4);
    const dataStart = at + 8;
    if (dataStart + length > bytes.length) {
      scan.warnings.push(`Chunk "${type}" at offset ${at} runs past the end of the file.`);
      break;
    }
    const data = bytes.subarray(dataStart, dataStart + length);

    if (type === 'IHDR' && length >= 8) {
      scan.width = view.getUint32(dataStart);
      scan.height = view.getUint32(dataStart + 4);
    } else if (type === 'eXIf' && !scan.tiff) {
      scan.tiff = data;
    } else if (type === 'tEXt' || type === 'iTXt') {
      const split = data.indexOf(0);
      if (split > 0) {
        const keyword = decodeAscii(data.subarray(0, split));
        // iTXt adds compression flag, method, language and translated keyword
        // between the keyword and the text; skip to the last NUL before text.
        const valueStart = type === 'iTXt' ? itxtTextStart(data, split) : split + 1;
        const text = decodeAscii(data.subarray(valueStart));
        textTags.push({ id: 0, name: keyword, type, raw: text, formatted: text });
        if (keyword === 'XML:com.adobe.xmp') scan.extras.xmp = true;
      }
    } else if (type === 'zTXt') {
      // Deflate-compressed text: flagged, not decoded, since decompression is async.
      const split = data.indexOf(0);
      const keyword = split > 0 ? decodeAscii(data.subarray(0, split)) : 'zTXt';
      textTags.push({
        id: 0, name: keyword, type: 'zTXt',
        raw: '(compressed)', formatted: '(compressed text, not decoded)',
      });
    } else if (type === 'iCCP') {
      scan.extras.icc = true;
    } else if (type === 'IEND') {
      break;
    }

    at = dataStart + length + 4; // skip the trailing CRC
  }

  if (textTags.length) scan.textSection = { name: 'PNG Text', directory: 'text', tags: textTags };
  return scan;
}

/** Locate the text payload of an iTXt chunk, past its language fields. */
function itxtTextStart(data: Uint8Array, keywordEnd: number): number {
  let at = keywordEnd + 3; // compression flag + method
  for (let skipped = 0; skipped < 2 && at < data.length; skipped++) {
    const next = data.indexOf(0, at);
    if (next < 0) return data.length;
    at = next + 1;
  }
  return at;
}

function scanWebp(bytes: Uint8Array): ContainerScan {
  const scan: ContainerScan = { extras: { xmp: false, iptc: false, icc: false }, warnings: [] };
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let at = 12; // "RIFF" + size + "WEBP"

  while (at + 8 <= bytes.length) {
    const fourCC = asciiAt(bytes, at, 4);
    const size = view.getUint32(at + 4, true);
    const dataStart = at + 8;
    if (dataStart + size > bytes.length) {
      scan.warnings.push(`Chunk "${fourCC}" at offset ${at} runs past the end of the file.`);
      break;
    }

    if (fourCC === 'EXIF' && !scan.tiff) {
      scan.tiff = bytes.subarray(dataStart, dataStart + size);
    } else if (fourCC === 'XMP ') {
      scan.extras.xmp = true;
    } else if (fourCC === 'ICCP') {
      scan.extras.icc = true;
    } else if (fourCC === 'VP8X' && size >= 10) {
      // Canvas dimensions are stored as 24-bit values, minus one.
      scan.width = 1 + (bytes[dataStart + 4] | (bytes[dataStart + 5] << 8) | (bytes[dataStart + 6] << 16));
      scan.height = 1 + (bytes[dataStart + 7] | (bytes[dataStart + 8] << 8) | (bytes[dataStart + 9] << 16));
    }

    at = dataStart + size + (size % 2); // chunks are padded to an even length
  }

  return scan;
}

function scanGif(bytes: Uint8Array): ContainerScan {
  const scan: ContainerScan = { extras: { xmp: false, iptc: false, icc: false }, warnings: [] };
  if (bytes.length >= 10) {
    scan.width = bytes[6] | (bytes[7] << 8);
    scan.height = bytes[8] | (bytes[9] << 8);
  }
  return scan;
}

/**
 * Parse an image file's metadata.
 *
 * `buffer` is the whole file. Nothing here touches the DOM or the network, so
 * the same code runs in the browser and under test.
 */
export function parseImageMetadata(buffer: ArrayBuffer, file: FileFacts): ExifResult {
  const bytes = new Uint8Array(buffer);
  const format = detectFormat(bytes);

  const result: ExifResult = {
    format,
    file: { ...file },
    sections: [],
    extras: { xmp: false, iptc: false, icc: false },
    findings: [],
    warnings: [],
  };

  if (bytes.length > MAX_FILE_BYTES) {
    result.warnings.push('File is larger than 100 MB; refusing to read it.');
    return result;
  }

  let scan: ContainerScan;
  switch (format) {
    case 'JPEG': scan = scanJpeg(bytes); break;
    case 'PNG': scan = scanPng(bytes); break;
    case 'WebP': scan = scanWebp(bytes); break;
    case 'GIF': scan = scanGif(bytes); break;
    case 'TIFF':
      scan = { tiff: bytes, extras: { xmp: false, iptc: false, icc: false }, warnings: [] };
      break;
    case 'HEIC':
    case 'AVIF':
      result.warnings.push(
        `${format} metadata is not supported. The file was identified, but its metadata sits inside an ISO-BMFF box structure this tool does not read.`
      );
      return result;
    default:
      result.warnings.push('Unrecognised file type — no image container signature matched.');
      return result;
  }

  result.extras = scan.extras;
  result.warnings.push(...scan.warnings);
  result.file.width = scan.width;
  result.file.height = scan.height;

  if (scan.tiff) {
    const parsed = parseTiffBlock(scan.tiff);
    result.byteOrder = parsed.byteOrder ?? undefined;
    result.sections.push(...parsed.sections);
    result.gps = parsed.gps;
    result.warnings.push(...parsed.warnings);

    if (parsed.thumbnail) {
      const { offset, length } = parsed.thumbnail;
      if (length > 0 && offset + length <= scan.tiff.length) {
        const thumbBytes = scan.tiff.subarray(offset, offset + length);
        const size = readJpegDimensions(thumbBytes);
        result.thumbnail = { bytes: thumbBytes, width: size?.width, height: size?.height };
      } else {
        result.warnings.push('The embedded thumbnail points outside the metadata block.');
      }
    }
  }

  if (scan.textSection) result.sections.push(scan.textSection);

  result.findings = analyzePrivacy(result);

  return result;
}

// ─── Privacy report ───────────────────────────────────────────────────────────

export type Severity = 'high' | 'medium' | 'low' | 'info';

export type Finding = {
  severity: Severity;
  /** Short label, e.g. "Exact location recorded". */
  title: string;
  /** What this reveals, in plain language. */
  detail: string;
  /** The tag or block the finding came from. */
  source: string;
};

const SEVERITY_ORDER: Severity[] = ['high', 'medium', 'low', 'info'];

/** Aspect ratios within 2% are treated as the same shape. */
const ASPECT_TOLERANCE = 0.02;

/** Tags that name a person, and how to describe each one. */
const IDENTITY_TAGS: { name: string; title: string; describe: (v: string) => string }[] = [
  {
    name: 'CameraOwnerName',
    title: 'Camera owner named',
    describe: v => `The camera records its owner as "${v}".`,
  },
  {
    name: 'Artist',
    title: 'Author named',
    describe: v => `The Artist field names "${v}".`,
  },
  {
    name: 'Copyright',
    title: 'Copyright holder named',
    describe: v => `The Copyright field reads "${v}", which usually names a person or company.`,
  },
  {
    name: 'XPAuthor',
    title: 'Windows author field set',
    describe: v => `Windows stored "${v}" as the author of this file.`,
  },
];

const SERIAL_TAGS: { name: string; title: string; describe: (v: string) => string }[] = [
  {
    name: 'BodySerialNumber',
    title: 'Camera serial number',
    describe: v =>
      `The camera body's serial number (${v}) is recorded. It ties every photo from that camera together, even across accounts.`,
  },
  {
    name: 'LensSerialNumber',
    title: 'Lens serial number',
    describe: v => `The lens serial number (${v}) is recorded, which identifies specific equipment.`,
  },
];

/**
 * Turn parsed metadata into a plain-language report of what the file gives away.
 *
 * Pure: it reads the parsed result and nothing else, so each rule can be tested
 * on its own.
 */
export function analyzePrivacy(result: Omit<ExifResult, 'findings'>): Finding[] {
  const findings: Finding[] = [];

  const byName = new Map<string, ExifTag>();
  for (const s of result.sections) {
    for (const t of s.tags) if (!byName.has(t.name)) byName.set(t.name, t);
  }
  const value = (name: string) => byName.get(name)?.formatted.trim() ?? '';

  if (result.gps) {
    const { lat, lon, altitude } = result.gps;
    const height = altitude === undefined ? '' : `, at ${trimNumber(altitude)} m elevation`;
    findings.push({
      severity: 'high',
      title: 'Exact location recorded',
      detail:
        `The file records where the photo was taken: ${lat.toFixed(6)}, ${lon.toFixed(6)}${height}. ` +
        `Anyone who receives the file can put that on a map.`,
      source: 'GPSLatitude',
    });
  }

  if (value('GPSDestLatitude')) {
    findings.push({
      severity: 'high',
      title: 'Destination coordinates recorded',
      detail: 'The file also stores a destination position, separate from where the photo was taken.',
      source: 'GPSDestLatitude',
    });
  }

  for (const rule of SERIAL_TAGS) {
    const v = value(rule.name);
    if (v) findings.push({ severity: 'medium', title: rule.title, detail: rule.describe(v), source: rule.name });
  }

  for (const rule of IDENTITY_TAGS) {
    const v = value(rule.name);
    if (v) findings.push({ severity: 'medium', title: rule.title, detail: rule.describe(v), source: rule.name });
  }

  const make = value('Make');
  const model = value('Model');
  if (make || model) {
    findings.push({
      severity: 'medium',
      title: 'Device identified',
      detail:
        `The file names the device that produced it: ${[make, model].filter(Boolean).join(' ')}. ` +
        `Combined with other photos, this narrows down who took it.`,
      source: model ? 'Model' : 'Make',
    });
  }

  const software = value('Software');
  if (software) {
    findings.push({
      severity: 'medium',
      title: 'Software fingerprint',
      detail: `Written by "${software}", which identifies the application and often the operating system version.`,
      source: 'Software',
    });
  }

  const taken = value('DateTimeOriginal') || value('DateTime');
  if (taken) {
    findings.push({
      severity: 'medium',
      title: 'Capture time recorded',
      detail: `The file records when the photo was taken: ${taken}.`,
      source: value('DateTimeOriginal') ? 'DateTimeOriginal' : 'DateTime',
    });
  }

  const offset = value('OffsetTimeOriginal') || value('OffsetTime');
  if (offset) {
    findings.push({
      severity: 'medium',
      title: 'Time zone recorded',
      detail: `The capture time carries a UTC offset of ${offset}, which narrows down the time zone the photo was taken in.`,
      source: value('OffsetTimeOriginal') ? 'OffsetTimeOriginal' : 'OffsetTime',
    });
  }

  const thumb = result.thumbnail;
  const { width, height } = result.file;
  if (thumb?.width && thumb.height && width && height) {
    const imageRatio = width / height;
    const thumbRatio = thumb.width / thumb.height;
    if (Math.abs(imageRatio - thumbRatio) / imageRatio > ASPECT_TOLERANCE) {
      findings.push({
        severity: 'medium',
        title: 'Thumbnail does not match the image',
        detail:
          `The embedded preview is ${thumb.width}×${thumb.height}, a different shape from the image itself ` +
          `(${width}×${height}). If this image was cropped, the preview may still show the original framing.`,
        source: 'Thumbnail',
      });
    }
  }

  const blocks: [boolean, string, string][] = [
    [result.extras.xmp, 'XMP', 'An XMP block is present. It can hold authorship and edit history this tool does not decode.'],
    [result.extras.iptc, 'IPTC', 'An IPTC/Photoshop block is present. It commonly carries captions, credits and contact details.'],
    [result.extras.icc, 'ICC', 'An ICC colour profile is embedded. It rarely identifies a person, but it does fingerprint the software or display used.'],
  ];
  for (const [present, source, detail] of blocks) {
    if (present) {
      findings.push({ severity: 'low', title: `${source} block present`, detail, source });
    }
  }

  if (result.extras.comment) {
    findings.push({
      severity: 'low',
      title: 'File comment present',
      detail: `The file carries a free-text comment: "${result.extras.comment}".`,
      source: 'JPEG comment',
    });
  }

  for (const name of ['UserComment', 'ImageDescription', 'XPComment', 'XPSubject']) {
    const v = value(name);
    if (v) {
      findings.push({
        severity: 'low',
        title: 'Free text stored in the file',
        detail: `${name} contains "${v}".`,
        source: name,
      });
    }
  }

  if (!findings.length) {
    findings.push({
      severity: 'info',
      title: 'No identifying metadata found',
      detail:
        'This file carries no location, device, authorship or timestamp metadata. ' +
        'Either it never had any, or it was already stripped.',
      source: '—',
    });
  }

  return findings.sort(
    (a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity)
  );
}
