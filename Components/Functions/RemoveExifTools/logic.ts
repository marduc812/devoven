/**
 * Strip metadata out of an image without touching its pixels.
 *
 * Re-encoding through a canvas would also drop the metadata, but it decodes and
 * recompresses the picture: a JPEG comes back visibly worse and several times
 * larger, and a PNG loses nothing but gains bytes. So this works on the
 * container instead — walk the segments or chunks, copy the ones that carry
 * image data, drop the ones that carry metadata. The compressed image data is
 * passed through byte for byte, so the result decodes to exactly the same
 * pixels as the original.
 *
 * Every offset comes from the file, so every read is bounds-checked: a
 * truncated file is ordinary input here, not an exceptional case.
 */

import { detectFormat } from '@/Components/Functions/ExifTools/logic';

export type StripFormat = 'JPEG' | 'PNG' | 'WebP';

export interface RemovedItem {
  /** What the container calls it — "APP1 (Exif)", "tEXt", "EXIF chunk". */
  label: string;
  /** What it held, in words. */
  what: string;
  /** Size of the whole segment or chunk, including its own headers. */
  bytes: number;
}

export interface StripOptions {
  /**
   * Keep an embedded ICC colour profile. It is not identifying, but it is
   * often the largest thing in the file, so the choice is the user's.
   */
  keepColorProfile?: boolean;
}

export interface StripResult {
  format: StripFormat;
  bytes: Uint8Array;
  removed: RemovedItem[];
  originalBytes: number;
  bytesRemoved: number;
}

const ascii = (bytes: Uint8Array, at: number, length: number): string => {
  if (at + length > bytes.length) return '';
  let s = '';
  for (let i = 0; i < length; i++) s += String.fromCharCode(bytes[at + i]);
  return s;
};

/** The bytes before the first NUL, which is how PNG and JPEG both name things. */
const nulTerminated = (bytes: Uint8Array, at: number, limit: number): string => {
  let s = '';
  for (let i = at; i < Math.min(bytes.length, at + limit); i++) {
    if (bytes[i] === 0) break;
    s += String.fromCharCode(bytes[i]);
  }
  return s;
};

const concat = (parts: Uint8Array[], total: number): Uint8Array => {
  const out = new Uint8Array(total);
  let at = 0;
  for (const part of parts) {
    out.set(part, at);
    at += part.length;
  }
  return out;
};

// --- JPEG --------------------------------------------------------------------

/** What an APPn segment turns out to be, read from the string it starts with. */
function describeApp(marker: number, identifier: string): { what: string; drop: boolean } {
  if (marker === 0xe0) {
    if (identifier.startsWith('JFXX')) return { what: 'JFIF thumbnail', drop: true };
    return { what: 'JFIF header, pixel density', drop: false };
  }
  if (marker === 0xe1) {
    if (identifier.startsWith('Exif')) {
      return { what: 'EXIF: camera, timestamps, GPS', drop: true };
    }
    if (identifier.startsWith('http://ns.adobe.com/xap')) {
      return { what: 'XMP: editing history and author', drop: true };
    }
    if (identifier.startsWith('http://ns.adobe.com/xmp/extension')) {
      return { what: 'Extended XMP', drop: true };
    }
    return { what: 'Application data', drop: true };
  }
  if (marker === 0xe2) {
    if (identifier.startsWith('ICC_PROFILE')) return { what: 'ICC colour profile', drop: true };
    if (identifier.startsWith('MPF')) return { what: 'Multi-Picture: embedded copies', drop: true };
    if (identifier.startsWith('FPXR')) return { what: 'FlashPix data', drop: true };
    return { what: 'Application data', drop: true };
  }
  if (marker === 0xed) return { what: 'Photoshop IRB: IPTC, paths, thumbnail', drop: true };
  if (marker === 0xee) return { what: 'Adobe colour transform', drop: false };
  if (marker === 0xec) return { what: 'Ducky: Photoshop save-for-web', drop: true };
  return { what: 'Application data', drop: true };
}

/** True for the markers that stand alone, with no length word after them. */
const isStandalone = (marker: number): boolean =>
  marker === 0x01 || (marker >= 0xd0 && marker <= 0xd9);

function stripJpeg(bytes: Uint8Array, options: StripOptions): StripResult {
  const keep: Uint8Array[] = [];
  const removed: RemovedItem[] = [];
  let kept = 0;
  let at = 0;

  while (at + 1 < bytes.length) {
    // Not on a marker boundary: whatever is left is data we do not understand,
    // so hand it back untouched rather than guess at it.
    if (bytes[at] !== 0xff) break;

    // A run of 0xFF bytes is legal padding before the marker itself.
    let markerAt = at + 1;
    while (markerAt < bytes.length && bytes[markerAt] === 0xff) markerAt++;
    if (markerAt >= bytes.length) break;

    const marker = bytes[markerAt];

    if (isStandalone(marker)) {
      const segment = bytes.subarray(at, markerAt + 1);
      keep.push(segment);
      kept += segment.length;
      at = markerAt + 1;
      continue;
    }

    if (markerAt + 2 >= bytes.length) break;
    const length = (bytes[markerAt + 1] << 8) | bytes[markerAt + 2];
    if (length < 2) break;
    const end = markerAt + 1 + length;
    if (end > bytes.length) break;

    // Start of Scan: everything from here on is entropy-coded image data with
    // its own restart markers. Copy the rest verbatim and stop walking.
    if (marker === 0xda) break;

    const isApp = marker >= 0xe0 && marker <= 0xef;
    const isComment = marker === 0xfe;

    if (isApp || isComment) {
      const identifier = isApp ? nulTerminated(bytes, markerAt + 3, 40) : '';
      const described = isComment
        ? { what: 'Comment', drop: true }
        : describeApp(marker, identifier);

      const isIcc = marker === 0xe2 && identifier.startsWith('ICC_PROFILE');
      const drop = described.drop && !(isIcc && options.keepColorProfile);

      if (drop) {
        const name = identifier ? ` (${identifier.split(' ')[0]})` : '';
        removed.push({
          label: isComment ? 'COM' : `APP${marker - 0xe0}${name}`,
          what: described.what,
          bytes: end - at,
        });
        at = end;
        continue;
      }
    }

    const segment = bytes.subarray(at, end);
    keep.push(segment);
    kept += segment.length;
    at = end;
  }

  // The scan, and anything following a marker we could not parse.
  if (at < bytes.length) {
    const rest = bytes.subarray(at);
    keep.push(rest);
    kept += rest.length;
  }

  return {
    format: 'JPEG',
    bytes: concat(keep, kept),
    removed,
    originalBytes: bytes.length,
    bytesRemoved: bytes.length - kept,
  };
}

// --- PNG ---------------------------------------------------------------------

const PNG_SIGNATURE_LENGTH = 8;

/** Ancillary chunks that carry metadata rather than picture. */
const PNG_METADATA: Record<string, string> = {
  tEXt: 'Text: keyword and value',
  zTXt: 'Compressed text',
  iTXt: 'International text, often XMP',
  eXIf: 'EXIF: camera, timestamps, GPS',
  tIME: 'Last-modified time',
  dSIG: 'Digital signature',
};

function stripPng(bytes: Uint8Array, options: StripOptions): StripResult {
  const keep: Uint8Array[] = [bytes.subarray(0, PNG_SIGNATURE_LENGTH)];
  const removed: RemovedItem[] = [];
  let kept = PNG_SIGNATURE_LENGTH;
  let at = PNG_SIGNATURE_LENGTH;

  while (at + 12 <= bytes.length) {
    const length =
      (bytes[at] << 24 >>> 0) + (bytes[at + 1] << 16) + (bytes[at + 2] << 8) + bytes[at + 3];
    const type = ascii(bytes, at + 4, 4);
    const end = at + 12 + length;
    if (end > bytes.length) break;

    const isIcc = type === 'iCCP';
    const what = isIcc ? 'ICC colour profile' : PNG_METADATA[type];

    if (what && !(isIcc && options.keepColorProfile)) {
      const keyword =
        type === 'tEXt' || type === 'zTXt' || type === 'iTXt'
          ? nulTerminated(bytes, at + 8, Math.min(80, length))
          : '';
      removed.push({
        label: type,
        what: keyword ? `${what} (${keyword})` : what,
        bytes: end - at,
      });
      at = end;
      continue;
    }

    const chunk = bytes.subarray(at, end);
    keep.push(chunk);
    kept += chunk.length;
    at = end;
    if (type === 'IEND') break;
  }

  return {
    format: 'PNG',
    bytes: concat(keep, kept),
    removed,
    originalBytes: bytes.length,
    bytesRemoved: bytes.length - kept,
  };
}

// --- WebP --------------------------------------------------------------------

/**
 * VP8X flag bits, MSB first: two reserved, then ICC, alpha, EXIF, XMP,
 * animation, reserved. Dropping a chunk without clearing its flag leaves a file
 * claiming metadata it no longer carries, and strict decoders reject that.
 */
const VP8X_ICC = 0x20;
const VP8X_EXIF = 0x08;
const VP8X_XMP = 0x04;

const WEBP_METADATA: Record<string, string> = {
  EXIF: 'EXIF: camera, timestamps, GPS',
  'XMP ': 'XMP: editing history and author',
};

function stripWebp(bytes: Uint8Array, options: StripOptions): StripResult {
  const keep: Uint8Array[] = [];
  const removed: RemovedItem[] = [];
  let kept = 12; // The RIFF header, rewritten once the size is known.
  let at = 12;
  let clearFlags = 0;
  let vp8xFlagsAt = -1;

  while (at + 8 <= bytes.length) {
    const fourcc = ascii(bytes, at, 4);
    const size =
      bytes[at + 4] + (bytes[at + 5] << 8) + (bytes[at + 6] << 16) + bytes[at + 7] * 0x1000000;
    // Chunks are padded to an even length, and the pad byte is not in the size.
    const padded = size + (size % 2);
    const end = at + 8 + padded;
    if (end > bytes.length) break;

    const isIcc = fourcc === 'ICCP';
    const what = isIcc ? 'ICC colour profile' : WEBP_METADATA[fourcc];

    if (what && !(isIcc && options.keepColorProfile)) {
      removed.push({ label: `${fourcc.trim()} chunk`, what, bytes: end - at });
      if (fourcc === 'EXIF') clearFlags |= VP8X_EXIF;
      if (fourcc === 'XMP ') clearFlags |= VP8X_XMP;
      if (isIcc) clearFlags |= VP8X_ICC;
      at = end;
      continue;
    }

    // The flags live in the first byte of the VP8X payload.
    if (fourcc === 'VP8X' && size >= 1) vp8xFlagsAt = kept + 8;

    const chunk = bytes.subarray(at, end);
    keep.push(chunk);
    kept += chunk.length;
    at = end;
  }

  const out = new Uint8Array(kept);
  out.set(bytes.subarray(0, 12), 0);
  let write = 12;
  for (const chunk of keep) {
    out.set(chunk, write);
    write += chunk.length;
  }

  // The RIFF size word counts everything after itself.
  const riffSize = kept - 8;
  out[4] = riffSize & 0xff;
  out[5] = (riffSize >>> 8) & 0xff;
  out[6] = (riffSize >>> 16) & 0xff;
  out[7] = (riffSize >>> 24) & 0xff;

  if (vp8xFlagsAt >= 0 && clearFlags) out[vp8xFlagsAt] &= ~clearFlags;

  return {
    format: 'WebP',
    bytes: out,
    removed,
    originalBytes: bytes.length,
    bytesRemoved: bytes.length - kept,
  };
}

// --- entry point -------------------------------------------------------------

/** Formats whose metadata cannot be lifted out without rebuilding the image. */
const UNSUPPORTED: Record<string, string> = {
  TIFF: 'A TIFF is metadata all the way down: its EXIF directory is also the index of the image data, so there is nothing to strip without rewriting the file.',
  HEIC: 'HEIC keeps its metadata inside an ISO base media container. Convert it to JPEG first, then strip that.',
  AVIF: 'AVIF keeps its metadata inside an ISO base media container. Convert it to PNG or JPEG first, then strip that.',
  GIF: 'A GIF carries almost no metadata to begin with: no EXIF, no GPS.',
};

export function stripMetadata(input: Uint8Array, options: StripOptions = {}): StripResult {
  const format = detectFormat(input);

  if (format === 'JPEG') {
    if (input.length < 4) throw new Error('This JPEG is truncated.');
    return stripJpeg(input, options);
  }
  if (format === 'PNG') {
    if (input.length < PNG_SIGNATURE_LENGTH + 12) throw new Error('This PNG is truncated.');
    return stripPng(input, options);
  }
  if (format === 'WebP') {
    if (input.length < 20) throw new Error('This WebP is truncated.');
    return stripWebp(input, options);
  }

  const known = UNSUPPORTED[format];
  if (known) throw new Error(known);
  throw new Error('That is not a JPEG, PNG or WebP.');
}

/** `photo.jpg` becomes `photo-clean.jpg`, keeping an extension the format allows. */
export function strippedName(sourceName: string, format: StripFormat): string {
  const base = sourceName.replace(/\.[^./\\]+$/, '') || 'image';
  const original = sourceName.match(/\.([^./\\]+)$/)?.[1]?.toLowerCase() ?? '';
  const fallback = format === 'JPEG' ? 'jpg' : format === 'PNG' ? 'png' : 'webp';
  // Keep .jpeg when that is what they had; only fall back when it is wrong.
  const suffix = format === 'JPEG' && original === 'jpeg' ? 'jpeg' : fallback;
  return `${base}-clean.${suffix}`;
}

export const mimeFor: Record<StripFormat, string> = {
  JPEG: 'image/jpeg',
  PNG: 'image/png',
  WebP: 'image/webp',
};

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

/** One line for the result pane: what came off, and what it was worth. */
export function describeStrip(result: StripResult): string {
  if (result.removed.length === 0) return 'Nothing to remove: this file carried no metadata.';
  const count = result.removed.length;
  const noun = count === 1 ? 'block' : 'blocks';
  return `${count} ${noun} removed, ${formatBytes(result.bytesRemoved)} smaller`;
}
