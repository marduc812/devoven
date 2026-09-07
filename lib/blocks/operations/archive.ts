import { decodeBytes, encodeBytes, BinaryEncoding } from '@/Components/Functions/CompressionTools/logic';
import {
  archiveNames,
  createZip,
  extractArchiveEntry,
  formatArchiveListing,
  listArchive,
} from '@/Components/Functions/ArchiveTools/logic';
import { Operation } from '../types';

// An archive is bytes, and a pipeline carries strings, so it travels the same
// Base64/hex channel the compression blocks already use. That is what makes
// `Gzip Decompress → List Archive Contents` work on a .tar.gz.
const sourceParam = {
  id: 'source',
  label: 'Archive is',
  kind: 'select' as const,
  options: [
    { value: 'base64', label: 'Base64' },
    { value: 'hex', label: 'Hex' },
  ],
  default: 'base64',
};

const outputParam = {
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

const encodingOf = (value: string | undefined): BinaryEncoding =>
  value === 'hex' ? 'hex' : 'base64';

function archiveBytes(input: string, params: Record<string, string>): Uint8Array {
  if (!input.trim()) throw new Error('No archive to read');
  return decodeBytes(input, encodingOf(params.source));
}

export const archiveOperations: Operation[] = [
  {
    id: 'archive-list',
    name: 'List Archive Contents',
    category: 'data',
    params: [
      sourceParam,
      {
        id: 'include',
        label: 'Include',
        kind: 'select',
        options: [
          { value: 'files', label: 'Files only' },
          { value: 'all', label: 'Files and directories' },
        ],
        default: 'files',
      },
    ],
    // One name per line, so Each Line and Keep If can work the list.
    fn: (input, params) => {
      const listing = listArchive(archiveBytes(input, params));
      const names = archiveNames(listing, params.include === 'all');
      if (!names) throw new Error('The archive holds no files');
      return names;
    },
  },
  {
    id: 'archive-extract',
    name: 'Extract from Archive',
    category: 'data',
    params: [
      {
        id: 'file',
        label: 'File',
        kind: 'text',
        default: '',
      },
      sourceParam,
      outputParam,
    ],
    fn: (input, params) => {
      const bytes = extractArchiveEntry(archiveBytes(input, params), params.file ?? '');
      if (params.as === 'text' || !params.as) return new TextDecoder().decode(bytes);
      return encodeBytes(bytes, encodingOf(params.as));
    },
  },
  {
    id: 'archive-info',
    name: 'Archive Info',
    category: 'analysis',
    params: [sourceParam],
    terminal: true,
    fn: (input, params) => formatArchiveListing(listArchive(archiveBytes(input, params))),
  },
  {
    id: 'zip-create',
    name: 'Create Zip',
    category: 'data',
    params: [
      {
        id: 'file',
        label: 'File name',
        kind: 'text',
        default: 'file.txt',
      },
      {
        id: 'level',
        label: 'Level',
        kind: 'select',
        options: [
          { value: '0', label: '0 (store)' },
          { value: '1', label: '1 (fastest)' },
          { value: '6', label: '6 (default)' },
          { value: '9', label: '9 (smallest)' },
        ],
        default: '6',
      },
      {
        id: 'as',
        label: 'Output as',
        kind: 'select',
        options: [
          { value: 'base64', label: 'Base64' },
          { value: 'hex', label: 'Hex' },
        ],
        default: 'base64',
      },
    ],
    // Wraps the value in a one-entry archive. The useful end of this is the
    // pair: build a zip here, list or extract it downstream.
    fn: (input, params) => {
      const name = (params.file ?? '').trim() || 'file.txt';
      const zip = createZip([{ name, bytes: new TextEncoder().encode(input) }], params.level);
      return encodeBytes(zip, encodingOf(params.as));
    },
  },
];
