// ─── ZIP and TAR archives ─────────────────────────────────────────────────────
// Two containers that hold many files instead of one stream:
//   zip - a central directory at the end of the file, each entry deflated
//         or stored on its own (PKWARE APPNOTE)
//   tar - 512-byte headers interleaved with the data they describe, no
//         compression of its own (POSIX ustar, plus the GNU/pax long-name
//         extensions that any modern tar writes)
// Listing a zip reads only the central directory, so it stays fast on a large
// archive and still works when an entry uses a method we cannot decompress.
// Everything here is synchronous so the operations can run inside a Blocks
// pipeline; fflate handles the DEFLATE, the container parsing is ours.

import { unzipSync, zipSync } from 'fflate';
import { formatBytes } from '../CompressionTools/logic';

export type ArchiveFormat = 'zip' | 'tar';

export type ArchiveEntry = {
  name: string;
  /** Uncompressed size in bytes. */
  size: number;
  /** Stored size in bytes. Equal to `size` in a tar, which does not compress. */
  compressedSize: number;
  isDirectory: boolean;
  /** 'Deflate', 'Store', 'BZIP2'… for a zip; '-' for a tar entry. */
  method: string;
  encrypted: boolean;
  crc32?: number;
  modified?: Date;
};

export type ArchiveListing = {
  format: ArchiveFormat;
  entries: ArchiveEntry[];
  /** Set when the archive parsed but something in it is worth flagging. */
  notes: string[];
};

export const formatLabel: Record<ArchiveFormat, string> = {
  zip: 'ZIP',
  tar: 'TAR',
};

// ─── format detection ─────────────────────────────────────────────────────────

const ZIP_LOCAL = [0x50, 0x4b, 0x03, 0x04]; // PK\x03\x04, a normal archive
const ZIP_EMPTY = [0x50, 0x4b, 0x05, 0x06]; // PK\x05\x06, an archive with no entries
const ZIP_SPAN = [0x50, 0x4b, 0x07, 0x08]; // PK\x07\x08, a spanned archive marker

const startsWith = (bytes: Uint8Array, sig: number[]): boolean =>
  bytes.length >= sig.length && sig.every((b, i) => bytes[i] === b);

/** 'ustar' lives at offset 257 of the first header block in any POSIX tar. */
function looksLikeTar(bytes: Uint8Array): boolean {
  if (bytes.length < 512) return false;
  const magic = latin1(bytes.subarray(257, 262));
  return magic === 'ustar';
}

export function detectArchiveFormat(bytes: Uint8Array): ArchiveFormat | null {
  if (startsWith(bytes, ZIP_LOCAL) || startsWith(bytes, ZIP_EMPTY) || startsWith(bytes, ZIP_SPAN)) {
    return 'zip';
  }
  if (looksLikeTar(bytes)) return 'tar';
  return null;
}

// ─── byte readers ─────────────────────────────────────────────────────────────

const u16 = (b: Uint8Array, at: number): number => b[at] | (b[at + 1] << 8);

// Shifting past bit 31 turns negative in JS, so the top byte is multiplied in.
const u32 = (b: Uint8Array, at: number): number =>
  (b[at] | (b[at + 1] << 8) | (b[at + 2] << 16)) + b[at + 3] * 0x1000000;

const u64 = (b: Uint8Array, at: number): number => u32(b, at) + u32(b, at + 4) * 0x100000000;

function latin1(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i++) out += String.fromCharCode(bytes[i]);
  return out;
}

const utf8 = new TextDecoder('utf-8');

// ─── ZIP ──────────────────────────────────────────────────────────────────────

// Method codes worth naming; anything else is reported by number so an odd
// archive still lists cleanly instead of throwing.
const ZIP_METHODS: Record<number, string> = {
  0: 'Store',
  1: 'Shrink',
  6: 'Implode',
  8: 'Deflate',
  9: 'Deflate64',
  12: 'BZIP2',
  14: 'LZMA',
  93: 'Zstandard',
  95: 'XZ',
  98: 'PPMd',
};

const methodName = (code: number): string => ZIP_METHODS[code] ?? `Method ${code}`;

/** MS-DOS packed date and time, the only timestamp a plain zip carries. */
function dosDate(time: number, date: number): Date | undefined {
  const year = ((date >> 9) & 0x7f) + 1980;
  const month = (date >> 5) & 0x0f;
  const day = date & 0x1f;
  if (month < 1 || month > 12 || day < 1 || day > 31) return undefined;
  return new Date(
    year,
    month - 1,
    day,
    (time >> 11) & 0x1f,
    (time >> 5) & 0x3f,
    (time & 0x1f) * 2,
  );
}

/**
 * Finds the End Of Central Directory record, which is the only fixed landmark
 * in a zip. It sits at the end, behind a comment of up to 64 KB, so the search
 * runs backwards from the last byte.
 */
function findEocd(bytes: Uint8Array): number {
  const min = Math.max(0, bytes.length - 22 - 0xffff);
  for (let i = bytes.length - 22; i >= min; i--) {
    if (bytes[i] === 0x50 && bytes[i + 1] === 0x4b && bytes[i + 2] === 0x05 && bytes[i + 3] === 0x06) {
      return i;
    }
  }
  return -1;
}

/**
 * Reads the Zip64 extended information extra field, which holds the real sizes
 * when the 32-bit fields are saturated with 0xFFFFFFFF.
 */
function zip64Sizes(
  extra: Uint8Array,
  size: number,
  compressedSize: number,
): { size: number; compressedSize: number } {
  let at = 0;
  while (at + 4 <= extra.length) {
    const id = u16(extra, at);
    const len = u16(extra, at + 2);
    if (id === 0x0001) {
      const body = extra.subarray(at + 4, at + 4 + len);
      let read = 0;
      // The fields are present only when their 32-bit counterpart overflowed,
      // and always in this order.
      if (size === 0xffffffff && read + 8 <= body.length) {
        size = u64(body, read);
        read += 8;
      }
      if (compressedSize === 0xffffffff && read + 8 <= body.length) {
        compressedSize = u64(body, read);
      }
      break;
    }
    at += 4 + len;
  }
  return { size, compressedSize };
}

function listZip(bytes: Uint8Array): ArchiveListing {
  const notes: string[] = [];
  const eocd = findEocd(bytes);
  if (eocd < 0) {
    throw new Error('No end-of-central-directory record — the ZIP is truncated or not a ZIP');
  }

  let count = u16(bytes, eocd + 10);
  let start = u32(bytes, eocd + 16);

  // A Zip64 archive saturates those fields and keeps the real ones in a
  // locator immediately before the EOCD.
  if (count === 0xffff || start === 0xffffffff) {
    const locator = eocd - 20;
    if (locator >= 0 && u32(bytes, locator) === 0x07064b50) {
      const record = u64(bytes, locator + 8);
      if (record >= 0 && record + 56 <= bytes.length && u32(bytes, record) === 0x06064b50) {
        count = u64(bytes, record + 32);
        start = u64(bytes, record + 48);
      }
    }
  }

  const entries: ArchiveEntry[] = [];
  let at = start;
  for (let i = 0; i < count; i++) {
    if (at + 46 > bytes.length || u32(bytes, at) !== 0x02014b50) {
      notes.push(`Central directory ends after ${entries.length} of ${count} entries`);
      break;
    }
    const flags = u16(bytes, at + 8);
    const method = u16(bytes, at + 10);
    const nameLength = u16(bytes, at + 28);
    const extraLength = u16(bytes, at + 30);
    const commentLength = u16(bytes, at + 32);
    const rawName = bytes.subarray(at + 46, at + 46 + nameLength);
    // Bit 11 promises UTF-8. Without it the name is nominally CP437, but every
    // modern writer emits UTF-8 anyway, so decoding it that way is the safer
    // guess than mangling non-ASCII on purpose.
    const name = utf8.decode(rawName);
    const extra = bytes.subarray(at + 46 + nameLength, at + 46 + nameLength + extraLength);

    const sizes = zip64Sizes(extra, u32(bytes, at + 24), u32(bytes, at + 20));

    entries.push({
      name,
      size: sizes.size,
      compressedSize: sizes.compressedSize,
      // A directory is stored as a zero-length entry with a trailing slash.
      isDirectory: name.endsWith('/'),
      method: methodName(method),
      encrypted: (flags & 0x1) !== 0,
      crc32: u32(bytes, at + 16),
      modified: dosDate(u16(bytes, at + 12), u16(bytes, at + 14)),
    });

    at += 46 + nameLength + extraLength + commentLength;
  }

  if (entries.some(e => e.encrypted)) {
    notes.push('Some entries are encrypted and cannot be extracted here');
  }
  const unsupported = [...new Set(
    entries.filter(e => !e.isDirectory && e.method !== 'Store' && e.method !== 'Deflate').map(e => e.method),
  )];
  if (unsupported.length > 0) {
    notes.push(`Only Store and Deflate can be extracted here — this archive also uses ${unsupported.join(', ')}`);
  }

  return { format: 'zip', entries, notes };
}

function extractZip(bytes: Uint8Array, name: string): Uint8Array {
  let found: Uint8Array | undefined;
  try {
    const files = unzipSync(bytes, { filter: file => file.name === name });
    found = files[name];
  } catch (err) {
    throw new Error(
      `Could not extract "${name}": ${err instanceof Error ? err.message : String(err)}`,
    );
  }
  if (!found) throw new Error(`"${name}" is not in the archive`);
  return found;
}

// ─── TAR ──────────────────────────────────────────────────────────────────────

const BLOCK = 512;

/** Rounds a data length up to the 512-byte block a tar pads it to. */
const padded = (size: number): number => Math.ceil(size / BLOCK) * BLOCK;

/**
 * Tar numbers are NUL- or space-terminated octal. GNU switches to base-256
 * with the top bit of the first byte set for sizes an octal field cannot hold.
 */
function tarNumber(field: Uint8Array): number {
  if (field.length > 0 && (field[0] & 0x80) !== 0) {
    let value = 0;
    for (let i = 1; i < field.length; i++) value = value * 256 + field[i];
    return value;
  }
  const text = latin1(field).replace(/\0/g, ' ').trim();
  if (!text) return 0;
  const value = parseInt(text, 8);
  return Number.isNaN(value) ? 0 : value;
}

/** Everything up to the first NUL; tar pads its string fields with them. */
function tarString(field: Uint8Array): string {
  const end = field.indexOf(0);
  return utf8.decode(end === -1 ? field : field.subarray(0, end));
}

const isZeroBlock = (bytes: Uint8Array, at: number): boolean => {
  for (let i = at; i < at + BLOCK && i < bytes.length; i++) {
    if (bytes[i] !== 0) return false;
  }
  return true;
};

/** The `path=` record of a pax extended header, if it carries one. */
function paxPath(data: Uint8Array): string | undefined {
  // Records are "<length> <key>=<value>\n", length counting the whole record.
  const text = utf8.decode(data);
  const match = /\d+ path=([^\n]*)\n/.exec(text);
  return match ? match[1] : undefined;
}

type TarWalkHit = { entry: ArchiveEntry; data: Uint8Array };

/**
 * Walks the header blocks once, yielding a resolved entry per archived file.
 * `want` short-circuits the walk for extraction; leaving it out lists the lot.
 */
function walkTar(bytes: Uint8Array, want?: string): { hits: TarWalkHit[]; notes: string[] } {
  const hits: TarWalkHit[] = [];
  const notes: string[] = [];
  // A GNU 'L' block or a pax 'x' block names the entry that follows it.
  let pendingName: string | undefined;
  let at = 0;

  while (at + BLOCK <= bytes.length) {
    if (isZeroBlock(bytes, at)) break; // the two-zero-block terminator

    const header = bytes.subarray(at, at + BLOCK);
    const size = tarNumber(header.subarray(124, 136));
    const type = String.fromCharCode(header[156] || 0x30);
    const dataAt = at + BLOCK;
    const data = bytes.subarray(dataAt, Math.min(dataAt + size, bytes.length));
    const next = dataAt + padded(size);

    if (type === 'L') {
      // GNU long name: this block's data is the next entry's name.
      pendingName = tarString(data);
      at = next;
      continue;
    }
    if (type === 'x' || type === 'X') {
      pendingName = paxPath(data) ?? pendingName;
      at = next;
      continue;
    }
    if (type === 'g') {
      at = next; // global pax header, nothing per-entry to take from it
      continue;
    }

    const prefix = tarString(header.subarray(345, 500));
    const base = tarString(header.subarray(0, 100));
    const name = pendingName ?? (prefix ? `${prefix}/${base}` : base);
    pendingName = undefined;

    if (name) {
      const mtime = tarNumber(header.subarray(136, 148));
      hits.push({
        entry: {
          name,
          size,
          compressedSize: size, // a tar stores its members verbatim
          isDirectory: type === '5' || name.endsWith('/'),
          method: '-',
          encrypted: false,
          modified: mtime > 0 ? new Date(mtime * 1000) : undefined,
        },
        data,
      });
      if (want !== undefined && name === want) break;
    }

    if (next <= at) {
      notes.push('Stopped early on a malformed header');
      break;
    }
    at = next;
  }

  return { hits, notes };
}

function listTar(bytes: Uint8Array): ArchiveListing {
  const { hits, notes } = walkTar(bytes);
  if (hits.length === 0) throw new Error('No entries found — the TAR is empty or truncated');
  return { format: 'tar', entries: hits.map(h => h.entry), notes };
}

function extractTar(bytes: Uint8Array, name: string): Uint8Array {
  const { hits } = walkTar(bytes, name);
  const hit = hits.find(h => h.entry.name === name);
  if (!hit) throw new Error(`"${name}" is not in the archive`);
  if (hit.entry.isDirectory) throw new Error(`"${name}" is a directory, not a file`);
  // walkTar hands back a view into the archive; copy so callers own their bytes.
  return hit.data.slice();
}

// ─── public API ───────────────────────────────────────────────────────────────

/** Lists a ZIP or TAR, picking the parser from the bytes themselves. */
export function listArchive(bytes: Uint8Array): ArchiveListing {
  const format = detectArchiveFormat(bytes);
  if (!format) {
    throw new Error('Not a ZIP or TAR archive. A .tar.gz must be decompressed first.');
  }
  return format === 'zip' ? listZip(bytes) : listTar(bytes);
}

/**
 * Pulls one entry out by name. An exact match wins; failing that a
 * case-insensitive match, then a unique match on the file name alone, so
 * "app.json" finds "build/app.json" without the user retyping the path.
 */
export function extractArchiveEntry(bytes: Uint8Array, name: string): Uint8Array {
  const wanted = name.trim();
  if (!wanted) throw new Error('Name which file to extract');

  const format = detectArchiveFormat(bytes);
  if (!format) throw new Error('Not a ZIP or TAR archive');

  const listing = format === 'zip' ? listZip(bytes) : listTar(bytes);
  const files = listing.entries.filter(e => !e.isDirectory);

  const resolved =
    files.find(e => e.name === wanted) ??
    files.find(e => e.name.toLowerCase() === wanted.toLowerCase()) ??
    matchByBasename(files, wanted);

  if (!resolved) {
    const available = files.slice(0, 8).map(e => e.name).join(', ');
    const more = files.length > 8 ? `, and ${files.length - 8} more` : '';
    throw new Error(
      files.length === 0
        ? `"${wanted}" is not in the archive, which holds no files`
        : `"${wanted}" is not in the archive. It holds ${available}${more}`,
    );
  }
  if (resolved.encrypted) throw new Error(`"${resolved.name}" is encrypted`);

  return format === 'zip' ? extractZip(bytes, resolved.name) : extractTar(bytes, resolved.name);
}

function matchByBasename(files: ArchiveEntry[], wanted: string): ArchiveEntry | undefined {
  const target = wanted.toLowerCase();
  const hits = files.filter(e => {
    const base = e.name.slice(e.name.lastIndexOf('/') + 1);
    return base.toLowerCase() === target;
  });
  // Ambiguous is worse than absent: two "index.js" and we should not guess.
  return hits.length === 1 ? hits[0] : undefined;
}

export type ZipInput = { name: string; bytes: Uint8Array };

// A zip stores MS-DOS dates, which start at 1980, so gzip's `mtime: 0` trick
// for a reproducible build is rejected outright. Built from local parts rather
// than an instant, so the packed date is the same in every timezone.
const DOS_EPOCH = new Date(1980, 0, 2);

/** Builds a ZIP from files already in memory. */
export function createZip(files: ZipInput[], level: number | string = 6): Uint8Array {
  if (files.length === 0) throw new Error('Add at least one file');
  const parsed = typeof level === 'string' ? parseInt(level, 10) : level;
  const clamped = Number.isNaN(parsed) ? 6 : Math.min(9, Math.max(0, Math.round(parsed)));

  const payload: Record<string, Uint8Array> = {};
  for (const file of files) {
    // Two files of the same name would silently collapse into one entry.
    payload[uniqueName(payload, file.name)] = file.bytes;
  }
  return zipSync(payload, {
    level: clamped as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9,
    mtime: DOS_EPOCH,
  });
}

function uniqueName(taken: Record<string, unknown>, name: string): string {
  if (!(name in taken)) return name;
  const dot = name.lastIndexOf('.');
  const stem = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : '';
  let n = 2;
  while (`${stem} (${n})${ext}` in taken) n++;
  return `${stem} (${n})${ext}`;
}

// ─── reporting ────────────────────────────────────────────────────────────────

export type ArchiveTotals = {
  files: number;
  directories: number;
  size: number;
  compressedSize: number;
  /** Stored size as a fraction of the original; 0 when the archive is empty. */
  ratio: number;
};

export function archiveTotals(listing: ArchiveListing): ArchiveTotals {
  let files = 0;
  let directories = 0;
  let size = 0;
  let compressedSize = 0;
  for (const entry of listing.entries) {
    if (entry.isDirectory) {
      directories++;
      continue;
    }
    files++;
    size += entry.size;
    compressedSize += entry.compressedSize;
  }
  return { files, directories, size, compressedSize, ratio: size === 0 ? 0 : compressedSize / size };
}

/** Entry names, one per line — the form a pipeline can keep working on. */
export function archiveNames(listing: ArchiveListing, includeDirectories = false): string {
  return listing.entries
    .filter(e => includeDirectories || !e.isDirectory)
    .map(e => e.name)
    .join('\n');
}

const pad = (text: string, width: number): string => text.padEnd(width, ' ');
const padStart = (text: string, width: number): string => text.padStart(width, ' ');

/**
 * A zip stores a wall-clock date with no timezone at all, so rendering it in
 * UTC would move an archive's timestamps by the reader's offset. These are
 * printed as the local parts they were read as.
 */
const stamp = (date?: Date): string => {
  if (!date || Number.isNaN(date.getTime())) return '';
  const two = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${two(date.getMonth() + 1)}-${two(date.getDate())} ${two(date.getHours())}:${two(date.getMinutes())}`;
};

/** A human-readable table, the way `unzip -l` and `tar -tv` report an archive. */
export function formatArchiveListing(listing: ArchiveListing): string {
  const { entries, format } = listing;
  const totals = archiveTotals(listing);
  const zip = format === 'zip';

  const rows = entries.map(entry => ({
    size: entry.isDirectory ? '' : String(entry.size),
    packed: entry.isDirectory ? '' : String(entry.compressedSize),
    method: entry.isDirectory ? '' : entry.method,
    date: stamp(entry.modified),
    name: entry.name + (entry.encrypted ? '  (encrypted)' : ''),
  }));

  const widthOf = (key: 'size' | 'packed' | 'method' | 'date', header: string): number =>
    Math.max(header.length, ...rows.map(r => r[key].length), 0);

  const sizeWidth = widthOf('size', 'Length');
  const packedWidth = widthOf('packed', 'Packed');
  const methodWidth = widthOf('method', 'Method');
  const dateWidth = widthOf('date', 'Modified');

  const header = zip
    ? `${padStart('Length', sizeWidth)}  ${padStart('Packed', packedWidth)}  ${pad('Method', methodWidth)}  ${pad('Modified', dateWidth)}  Name`
    : `${padStart('Length', sizeWidth)}  ${pad('Modified', dateWidth)}  Name`;

  const lines = rows.map(r =>
    zip
      ? `${padStart(r.size, sizeWidth)}  ${padStart(r.packed, packedWidth)}  ${pad(r.method, methodWidth)}  ${pad(r.date, dateWidth)}  ${r.name}`
      : `${padStart(r.size, sizeWidth)}  ${pad(r.date, dateWidth)}  ${r.name}`,
  );

  const rule = '-'.repeat(header.length);
  const summary = zip
    ? `${totals.files} file${totals.files === 1 ? '' : 's'}, ${formatBytes(totals.size)} → ${formatBytes(totals.compressedSize)}${
        totals.size > 0 ? ` (${((1 - totals.ratio) * 100).toFixed(1)}% smaller)` : ''
      }`
    : `${totals.files} file${totals.files === 1 ? '' : 's'}, ${formatBytes(totals.size)}`;

  return [
    `${formatLabel[format]} archive`,
    '',
    header,
    rule,
    ...lines,
    rule,
    summary + (totals.directories > 0 ? `, ${totals.directories} director${totals.directories === 1 ? 'y' : 'ies'}` : ''),
    ...(listing.notes.length > 0 ? ['', ...listing.notes.map(n => `Note: ${n}`)] : []),
  ].join('\n');
}

/** One line for a pane caption: "ZIP · 12 files · 4.1 MB → 1.2 MB". */
export function describeArchive(listing: ArchiveListing): string {
  const totals = archiveTotals(listing);
  const parts = [
    formatLabel[listing.format],
    `${totals.files} file${totals.files === 1 ? '' : 's'}`,
  ];
  if (listing.format === 'zip') {
    parts.push(`${formatBytes(totals.size)} → ${formatBytes(totals.compressedSize)}`);
  } else {
    parts.push(formatBytes(totals.size));
  }
  return parts.join(' · ');
}
