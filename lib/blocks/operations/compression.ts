import { compressText, decompressText, BinaryEncoding } from '@/Components/Functions/CompressionTools/logic';
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

const encodingOf = (params: Record<string, string>): BinaryEncoding =>
  params.encoding === 'hex' ? 'hex' : 'base64';

export const compressionOperations: Operation[] = [
  {
    id: 'gzip-compress',
    name: 'Gzip Compress',
    category: 'encoding',
    params: [encodingParam, levelParam],
    chainable: true,
    fn: (input, params) => compressText(input, 'gzip', encodingOf(params), params.level),
  },
  {
    id: 'gzip-decompress',
    name: 'Gzip Decompress',
    category: 'encoding',
    params: [encodingParam],
    chainable: true,
    fn: (input, params) => decompressText(input, 'gzip', encodingOf(params)),
  },
  {
    id: 'zlib-deflate',
    name: 'Zlib Deflate',
    category: 'encoding',
    params: [encodingParam, levelParam],
    chainable: true,
    fn: (input, params) => compressText(input, 'zlib', encodingOf(params), params.level),
  },
  {
    id: 'zlib-inflate',
    name: 'Zlib Inflate',
    category: 'encoding',
    params: [encodingParam],
    chainable: true,
    fn: (input, params) => decompressText(input, 'zlib', encodingOf(params)),
  },
  {
    id: 'raw-deflate',
    name: 'Raw Deflate',
    category: 'encoding',
    params: [encodingParam, levelParam],
    chainable: true,
    fn: (input, params) => compressText(input, 'raw', encodingOf(params), params.level),
  },
  {
    id: 'raw-inflate',
    name: 'Raw Inflate',
    category: 'encoding',
    params: [encodingParam],
    chainable: true,
    fn: (input, params) => decompressText(input, 'raw', encodingOf(params)),
  },
];
