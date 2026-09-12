import {
  compressText,
  decompressBytes,
  decodeBytes,
  encodeBytes,
  BinaryEncoding,
  CompressionFormat,
} from '@/Components/Functions/CompressionTools/logic';
import {
  LZ_VARIANTS,
  LzVariant,
  lzCompress,
  lzDecompress,
  variantLabel,
} from '@/Components/Functions/LzStringTools/logic';
import {
  compressLzma,
  decompressBzip2,
  decompressLzma,
} from '@/Components/Functions/CompressionTools2/logic';
import { Operation } from '../types';

const encodingParam = {
  id: 'encoding',
  label: 'Binary as',
  kind: 'select' as const,
  options: [
    { value: 'base64', label: 'Base64' },
    { value: 'hex', label: 'Hex' },
  ],
  default: 'base64',
};

const levelParam = {
  id: 'level',
  label: 'Level',
  kind: 'select' as const,
  options: [
    { value: '1', label: '1 (fastest)' },
    { value: '6', label: '6 (default)' },
    { value: '9', label: '9 (smallest)' },
  ],
  default: '6',
};

// What a decompressed stream should look like coming out. Text is the common
// case, but a .tar.gz decompresses to a tar, and reading those bytes as UTF-8
// would destroy them before the archive blocks could parse it.
const resultParam = {
  id: 'as',
  label: 'Output as',
  kind: 'select' as const,
  options: [
    { value: 'text', label: 'Text (UTF-8)' },
    { value: 'base64', label: 'Base64' },
    { value: 'hex', label: 'Hex' },
  ],
  default: 'text',
};

const encodingOf = (params: Record<string, string>): BinaryEncoding =>
  params.encoding === 'hex' ? 'hex' : 'base64';

/** Render decompressed bytes the way the `as` param asks for. */
function emit(bytes: Uint8Array, params: Record<string, string>): string {
  if (params.as === 'base64' || params.as === 'hex') return encodeBytes(bytes, params.as);
  return new TextDecoder().decode(bytes);
}

function decompress(
  input: string,
  format: CompressionFormat,
  params: Record<string, string>,
): string {
  if (!input.trim()) return '';
  return emit(decompressBytes(decodeBytes(input, encodingOf(params)), format), params);
}

// LZString ships one compressor in four wrappings, so the wrapping is a
// setting on one block rather than four near-identical blocks.
const variantParam = {
  id: 'variant',
  label: 'Payload as',
  kind: 'select' as const,
  options: LZ_VARIANTS.map((v) => ({ value: v, label: variantLabel[v] })),
  default: 'base64',
};

const variantOf = (params: Record<string, string>): LzVariant =>
  (LZ_VARIANTS as readonly string[]).includes(params.variant)
    ? (params.variant as LzVariant)
    : 'base64';

export const compressionOperations: Operation[] = [
  {
    id: 'gzip-compress',
    name: 'Gzip Compress',
    category: 'encoding',
    params: [encodingParam, levelParam],
    fn: (input, params) => compressText(input, 'gzip', encodingOf(params), params.level),
  },
  {
    id: 'gzip-decompress',
    name: 'Gzip Decompress',
    category: 'encoding',
    params: [encodingParam, resultParam],
    fn: (input, params) => decompress(input, 'gzip', params),
  },
  {
    id: 'zlib-deflate',
    name: 'Zlib Deflate',
    category: 'encoding',
    params: [encodingParam, levelParam],
    fn: (input, params) => compressText(input, 'zlib', encodingOf(params), params.level),
  },
  {
    id: 'zlib-inflate',
    name: 'Zlib Inflate',
    category: 'encoding',
    params: [encodingParam, resultParam],
    fn: (input, params) => decompress(input, 'zlib', params),
  },
  {
    id: 'raw-deflate',
    name: 'Raw Deflate',
    category: 'encoding',
    params: [encodingParam, levelParam],
    fn: (input, params) => compressText(input, 'raw', encodingOf(params), params.level),
  },
  {
    id: 'raw-inflate',
    name: 'Raw Inflate',
    category: 'encoding',
    params: [encodingParam, resultParam],
    fn: (input, params) => decompress(input, 'raw', params),
  },
  {
    // No compress counterpart: there is no bzip2 encoder small and sane enough
    // to sit in a pipeline. Decompressing is the direction people need anyway.
    id: 'bzip2-decompress',
    name: 'Bzip2 Decompress',
    category: 'encoding',
    params: [encodingParam, resultParam],
    fn: (input, params) => {
      if (!input.trim()) return '';
      return emit(decompressBzip2(decodeBytes(input, encodingOf(params))), params);
    },
  },
  {
    id: 'lzma-compress',
    name: 'LZMA Compress',
    category: 'encoding',
    params: [encodingParam, levelParam],
    fn: (input, params) => {
      if (!input) return '';
      const bytes = compressLzma(new TextEncoder().encode(input), params.level);
      return encodeBytes(bytes, encodingOf(params));
    },
  },
  {
    id: 'lzma-decompress',
    name: 'LZMA Decompress',
    category: 'encoding',
    params: [encodingParam, resultParam],
    fn: (input, params) => {
      if (!input.trim()) return '';
      return emit(decompressLzma(decodeBytes(input, encodingOf(params))), params);
    },
  },
  {
    id: 'lzstring-compress',
    name: 'LZString Compress',
    category: 'encoding',
    params: [variantParam],
    fn: (input, params) => lzCompress(input, variantOf(params)),
  },
  {
    id: 'lzstring-decompress',
    name: 'LZString Decompress',
    category: 'encoding',
    params: [variantParam],
    fn: (input, params) => lzDecompress(input, variantOf(params)),
  },
];
