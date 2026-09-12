// ─── bzip2 and LZMA ───────────────────────────────────────────────────────────
// The DEFLATE family lives next door in CompressionTools/logic.ts, where fflate
// covers gzip, zlib and raw streams. These two formats need their own codecs:
//   bzip2 - the `bzip2`/`bunzip2` CLI, magic `BZh`, Burrows-Wheeler + Huffman
//   lzma  - the `lzma` CLI's alone format, magic `5d 00 00`, what `xz --format=lzma`
//           writes. Not the `.xz` container, which wraps the same stream in a
//           checksummed frame.
// Both libraries are called through their synchronous entry points so the
// operations can run inside a Blocks pipeline, and both are small enough to
// import at module scope.

import bz2Module from 'bz2';
import lzmaWorker from 'lzma/src/lzma_worker.js';
import {
  BinaryEncoding,
  decodeBytes,
  encodeBytes,
} from '../CompressionTools/logic';

const { LZMA } = lzmaWorker;

export type { BinaryEncoding };

/** LZMA-JS presets. 1 is fastest, 9 packs hardest; 6 matches the CLI default. */
export const LZMA_PRESETS = ['1', '6', '9'] as const;

function clampPreset(preset: number | string | undefined): number {
  const n = typeof preset === 'string' ? parseInt(preset, 10) : preset;
  if (n === undefined || Number.isNaN(n)) return 6;
  return Math.min(9, Math.max(1, Math.round(n)));
}

// ─── bzip2 ────────────────────────────────────────────────────────────────────

type Bzip2Decoder = { decompress(bytes: Uint8Array): Uint8Array };

/**
 * bz2 hands itself to `window.bz2` when there is a window and to
 * `module.exports` when there is not, so the import above is an empty object in
 * the browser build and the library has to be picked up off the global there.
 * Both branches run when the module is first evaluated, so one of the two is
 * always sitting there by the time this is called.
 */
function bzip2Decoder(): Bzip2Decoder {
  const imported = bz2Module as Partial<Bzip2Decoder>;
  if (typeof imported?.decompress === 'function') return imported as Bzip2Decoder;
  const published = (globalThis as { bz2?: Partial<Bzip2Decoder> }).bz2;
  if (typeof published?.decompress === 'function') return published as Bzip2Decoder;
  throw new Error('The bzip2 decoder did not load');
}

/** True when the bytes open with the `BZh<level>` bzip2 header. */
export function looksLikeBzip2(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 4 &&
    bytes[0] === 0x42 && // B
    bytes[1] === 0x5a && // Z
    bytes[2] === 0x68 && // h
    bytes[3] >= 0x31 &&
    bytes[3] <= 0x39 // block size 1-9, in hundreds of kB
  );
}

export function decompressBzip2(bytes: Uint8Array): Uint8Array {
  if (!bytes.length) return new Uint8Array(0);
  if (!looksLikeBzip2(bytes)) {
    throw new Error('Input does not start with the bzip2 header (BZh)');
  }
  const decoder = bzip2Decoder();
  try {
    return decoder.decompress(bytes);
  } catch (error) {
    const detail = error instanceof Error ? error.message : '';
    throw new Error(`Could not decompress this bzip2 data${detail ? `: ${detail}` : ''}`);
  }
}

// ─── LZMA ─────────────────────────────────────────────────────────────────────

/**
 * True when the bytes open with an LZMA alone header: a properties byte no
 * greater than (4*5+4)*9+8 = 224, a four byte dictionary size, and an eight
 * byte uncompressed size.
 */
export function looksLikeLzma(bytes: Uint8Array): boolean {
  return bytes.length >= 13 && bytes[0] <= 224;
}

// A guard, not a limit anyone should hit: the header carries the uncompressed
// size, and random bytes that pass looksLikeLzma routinely declare petabytes.
// Without this the decoder allocates until the tab dies.
const MAX_LZMA_OUTPUT = 256 * 1024 * 1024;

/** The uncompressed size from the header, or null when it is the unknown marker. */
function declaredLzmaSize(bytes: Uint8Array): number | null {
  let size = 0;
  let unknown = true;
  for (let i = 12; i >= 5; i--) {
    if (bytes[i] !== 0xff) unknown = false;
    size = size * 256 + bytes[i];
  }
  return unknown ? null : size;
}

export function compressLzma(bytes: Uint8Array, preset: number | string = 6): Uint8Array {
  // LZMA-JS hands back signed bytes; mask them back into a byte array.
  const signed = LZMA.compress(bytes, clampPreset(preset));
  return Uint8Array.from(signed, (b) => b & 0xff);
}

export function decompressLzma(bytes: Uint8Array): Uint8Array {
  if (!bytes.length) return new Uint8Array(0);
  if (!looksLikeLzma(bytes)) {
    throw new Error('Input is too short or does not start with an LZMA header');
  }
  const declared = declaredLzmaSize(bytes);
  if (declared !== null && declared > MAX_LZMA_OUTPUT) {
    throw new Error(
      `This LZMA header declares ${Math.round(declared / (1024 * 1024))} MB of output, which is past what this tool will decompress in a browser tab`,
    );
  }
  let result: string | number[];
  try {
    result = LZMA.decompress(bytes);
  } catch (error) {
    const detail = error instanceof Error ? error.message : '';
    throw new Error(`Could not decompress this LZMA data${detail ? `: ${detail}` : ''}`);
  }
  // LZMA-JS decodes the result to a string when every byte forms valid UTF-8
  // with no NUL and no four byte sequence, and returns the raw bytes otherwise.
  if (typeof result === 'string') return new TextEncoder().encode(result);
  return Uint8Array.from(result, (b) => b & 0xff);
}

// ─── text wrappers ────────────────────────────────────────────────────────────

/** Decode Base64/hex, bunzip2 it, and read the result back as UTF-8 text. */
export function bzip2DecompressText(payload: string, encoding: BinaryEncoding = 'base64'): string {
  if (!payload.trim()) return '';
  return new TextDecoder().decode(decompressBzip2(decodeBytes(payload, encoding)));
}

/** Compress text with LZMA and return the bytes as Base64 or hex. */
export function lzmaCompressText(
  text: string,
  encoding: BinaryEncoding = 'base64',
  preset: number | string = 6,
): string {
  if (!text) return '';
  return encodeBytes(compressLzma(new TextEncoder().encode(text), preset), encoding);
}

/** Decode Base64/hex, decompress it, and read the result back as UTF-8 text. */
export function lzmaDecompressText(payload: string, encoding: BinaryEncoding = 'base64'): string {
  if (!payload.trim()) return '';
  return new TextDecoder().decode(decompressLzma(decodeBytes(payload, encoding)));
}
