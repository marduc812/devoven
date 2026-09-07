// LZString — the LZ-based compressor from pieroxy/lz-string.
//
// The library only ships four flavours of the same compressor, and the whole
// point of picking one is where the result has to survive: a URL, a
// localStorage value, a cookie, a byte array. So the variant is the tool's main
// control, and everything here is phrased in those terms.

import {
  compressToBase64,
  compressToEncodedURIComponent,
  compressToUTF16,
  compressToUint8Array,
  decompressFromBase64,
  decompressFromEncodedURIComponent,
  decompressFromUTF16,
  decompressFromUint8Array,
} from 'lz-string';
import { bytesToHex, hexToBytes } from '@/Components/Functions/CompressionTools/logic';

export const LZ_VARIANTS = ['base64', 'uri', 'utf16', 'hex'] as const;
export type LzVariant = (typeof LZ_VARIANTS)[number];

export const variantLabel: Record<LzVariant, string> = {
  base64: 'Base64',
  uri: 'URL-safe',
  utf16: 'UTF-16',
  hex: 'Hex bytes',
};

export const variantHint: Record<LzVariant, string> = {
  base64: 'A-Z a-z 0-9 + / =. Safe anywhere Base64 is, and the widest-supported flavour.',
  uri: 'compressToEncodedURIComponent. Query-string safe with no percent-escaping.',
  utf16: 'Packs 15 bits into every character. Smallest string, but only safe where full UTF-16 survives — localStorage, not a URL.',
  hex: 'compressToUint8Array rendered as hex, for handing the bytes to something that is not JavaScript.',
};

const compressors: Record<LzVariant, (input: string) => string> = {
  base64: compressToBase64,
  uri: compressToEncodedURIComponent,
  utf16: compressToUTF16,
  hex: (input) => bytesToHex(compressToUint8Array(input)),
};

const decompressors: Record<LzVariant, (input: string) => string | null> = {
  base64: decompressFromBase64,
  uri: decompressFromEncodedURIComponent,
  utf16: decompressFromUTF16,
  hex: (input) => decompressFromUint8Array(hexToBytes(input)),
};

export function isLzVariant(value: string | null | undefined): value is LzVariant {
  return !!value && (LZ_VARIANTS as readonly string[]).includes(value);
}

export function lzCompress(input: string, variant: LzVariant): string {
  if (input === '') return '';
  return compressors[variant](input);
}

/**
 * Fed something that was never an LZString payload, the library answers in
 * three different ways depending on how far it got: it throws, it returns
 * null, or it returns an empty string. All three mean the same thing here.
 */
export function lzDecompress(input: string, variant: LzVariant): string {
  if (input === '') return '';
  let result: string | null;
  try {
    result = decompressors[variant](input);
  } catch (error) {
    // hexToBytes explains bad hex better than a generic message can.
    if (variant === 'hex' && error instanceof Error) throw error;
    throw new Error(`This is not valid LZString ${variantLabel[variant]} data`);
  }
  // An empty answer is only real if the input is what the empty string
  // compresses to ("Q===" in Base64); otherwise it is the library giving up.
  if (result === null || (result === '' && input !== compressors[variant](''))) {
    throw new Error(`This is not valid LZString ${variantLabel[variant]} data`);
  }
  return result;
}

// ─── reporting ────────────────────────────────────────────────────────────────

export type LzStats = {
  /** UTF-8 bytes of the original text — what it costs on the wire. */
  inputBytes: number;
  /** Characters of the original text. */
  inputChars: number;
  /** Characters of the compressed payload — what a URL or a quota counts. */
  outputChars: number;
  /** Compressed characters over original characters. 0.3 = 30% of the original. */
  ratio: number;
  /** Percentage saved, negative when the payload is longer than the text. */
  savedPercent: number;
  /** Length after encodeURIComponent, which is what a query string actually costs. */
  urlChars: number;
};

export function lzStats(input: string, output: string): LzStats {
  const inputChars = input.length;
  const outputChars = output.length;
  const ratio = inputChars === 0 ? 0 : outputChars / inputChars;
  return {
    inputBytes: new TextEncoder().encode(input).length,
    inputChars,
    outputChars,
    ratio,
    savedPercent: inputChars === 0 ? 0 : (1 - ratio) * 100,
    urlChars: encodeURIComponent(output).length,
  };
}

export function describeLz(stats: LzStats): string {
  const direction = stats.savedPercent >= 0 ? 'smaller' : 'larger';
  return `${stats.inputChars} → ${stats.outputChars} chars (${Math.abs(stats.savedPercent).toFixed(1)}% ${direction})`;
}
