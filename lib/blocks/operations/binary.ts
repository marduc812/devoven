import { decodeBytes } from '@/Components/Functions/CompressionTools/logic';
import {
  detectFileType,
  extractStrings,
  formatDetection,
  formatEmbedded,
  formatStrings,
  scanEmbeddedFiles,
  StringEncoding,
} from '@/Components/Functions/FileForensicsTools/logic';
import { Operation } from '../types';

// A pipeline carries strings, so the bytes to inspect arrive encoded. Base64 is
// the default because that is what the compression blocks upstream produce.
const sourceParam = {
  id: 'source',
  label: 'Input is',
  kind: 'select' as const,
  options: [
    { value: 'base64', label: 'Base64' },
    { value: 'hex', label: 'Hex' },
    { value: 'text', label: 'Raw text' },
  ],
  default: 'base64',
};

function toBytes(input: string, params: Record<string, string>): Uint8Array {
  if (params.source === 'text') return new TextEncoder().encode(input);
  if (!input.trim()) return new Uint8Array(0);
  return decodeBytes(input, params.source === 'hex' ? 'hex' : 'base64');
}

export const binaryOperations: Operation[] = [
  {
    id: 'detect-file-type',
    name: 'Detect File Type',
    category: 'analysis',
    params: [sourceParam],
    chainable: false,
    terminal: true,
    fn: (input, params) => {
      const bytes = toBytes(input, params);
      if (bytes.length === 0) throw new Error('Nothing to inspect');
      return formatDetection(detectFileType(bytes), bytes);
    },
  },
  {
    id: 'extract-strings',
    name: 'Strings',
    category: 'analysis',
    params: [
      sourceParam,
      {
        id: 'minLength',
        label: 'Min length',
        kind: 'select',
        options: [
          { value: '3', label: '3' },
          { value: '4', label: '4' },
          { value: '6', label: '6' },
          { value: '8', label: '8' },
          { value: '12', label: '12' },
        ],
        default: '4',
      },
      {
        id: 'encoding',
        label: 'Encoding',
        kind: 'select',
        options: [
          { value: 'ascii', label: 'ASCII' },
          { value: 'utf16le', label: 'UTF-16LE' },
          { value: 'both', label: 'Both' },
        ],
        default: 'ascii',
      },
    ],
    chainable: true,
    fn: (input, params) => {
      const bytes = toBytes(input, params);
      const minLength = parseInt(params.minLength, 10);
      const hits = extractStrings(bytes, {
        minLength: Number.isNaN(minLength) ? 4 : minLength,
        encoding: (params.encoding as StringEncoding) ?? 'ascii',
      });
      if (hits.length === 0) throw new Error('No printable runs at that minimum length');
      return formatStrings(hits);
    },
  },
  {
    id: 'scan-embedded-files',
    name: 'Scan for Embedded Files',
    category: 'analysis',
    params: [sourceParam],
    chainable: false,
    terminal: true,
    fn: (input, params) => {
      const bytes = toBytes(input, params);
      if (bytes.length === 0) throw new Error('Nothing to scan');
      return formatEmbedded(scanEmbeddedFiles(bytes), bytes.length);
    },
  },
];
