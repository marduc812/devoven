import { crc32 } from '@/Components/Functions/Crc32Tools/logic';
import { computeAll as computeFletcherAll } from '@/Components/Functions/FletcherTools/logic';
import { murmurHash3_32 } from '@/Components/Functions/MurmurHashTools/logic';
import { computeFnvAll } from '@/Components/Functions/FnvHashTools/logic';
import { formatIdentifyReport } from '@/Components/Functions/HashIdentifierTools/logic';
import { Operation } from '../types';

const caseParam = {
  id: 'case',
  label: 'Output',
  kind: 'select' as const,
  options: [
    { value: 'lower', label: 'lowercase hex' },
    { value: 'upper', label: 'UPPERCASE HEX' },
    { value: 'decimal', label: 'Decimal' },
  ],
  default: 'lower',
};

function renderNumber(value: number, mode: string, width: number): string {
  if (mode === 'decimal') return value.toString(10);
  const hex = (value >>> 0).toString(16).padStart(width, '0');
  return mode === 'upper' ? hex.toUpperCase() : hex;
}

export const hashingExtraOperations: Operation[] = [
  {
    id: 'crc32',
    name: 'CRC32',
    category: 'hashing',
    params: [caseParam],
    chainable: true,
    fn: (input, p) => renderNumber(crc32(input), p.case ?? 'lower', 8),
  },
  {
    id: 'adler32',
    name: 'Adler-32',
    category: 'hashing',
    params: [caseParam],
    chainable: true,
    fn: (input, p) => renderNumber(computeFletcherAll(input).adler32.decimal, p.case ?? 'lower', 8),
  },
  {
    id: 'fletcher16',
    name: 'Fletcher-16',
    category: 'hashing',
    params: [caseParam],
    chainable: true,
    fn: (input, p) => renderNumber(computeFletcherAll(input).fletcher16.decimal, p.case ?? 'lower', 4),
  },
  {
    id: 'fletcher32',
    name: 'Fletcher-32',
    category: 'hashing',
    params: [caseParam],
    chainable: true,
    fn: (input, p) => renderNumber(computeFletcherAll(input).fletcher32.decimal, p.case ?? 'lower', 8),
  },
  {
    id: 'murmur3',
    name: 'MurmurHash3 (32-bit)',
    category: 'hashing',
    params: [
      { id: 'seed', label: 'Seed', kind: 'text', default: '0' },
      caseParam,
    ],
    chainable: true,
    fn: (input, p) => {
      const seed = parseInt(p.seed ?? '0');
      if (isNaN(seed)) throw new Error('Seed must be a number');
      return renderNumber(murmurHash3_32(input, seed), p.case ?? 'lower', 8);
    },
  },
  {
    id: 'fnv',
    name: 'FNV Hash',
    category: 'hashing',
    params: [
      {
        id: 'variant',
        label: 'Variant',
        kind: 'select',
        options: [
          { value: 'fnv1a_32', label: 'FNV-1a 32' },
          { value: 'fnv1_32', label: 'FNV-1 32' },
          { value: 'fnv1a_64', label: 'FNV-1a 64' },
          { value: 'fnv1_64', label: 'FNV-1 64' },
        ],
        default: 'fnv1a_32',
      },
      {
        id: 'case',
        label: 'Output',
        kind: 'select',
        options: [
          { value: 'lower', label: 'lowercase hex' },
          { value: 'upper', label: 'UPPERCASE HEX' },
          { value: 'decimal', label: 'Decimal' },
        ],
        default: 'lower',
      },
    ],
    chainable: true,
    fn: (input, p) => {
      const all = computeFnvAll(input);
      const variant = (p.variant ?? 'fnv1a_32') as keyof typeof all;
      const entry = all[variant];
      if (!entry) throw new Error(`Unknown FNV variant: ${String(variant)}`);
      if (p.case === 'decimal') return entry.decimal;
      return p.case === 'upper' ? entry.hex : entry.hex.toLowerCase();
    },
  },
  {
    id: 'hash-identify',
    name: 'Identify Hash Type',
    category: 'hashing',
    params: [],
    chainable: false,
    terminal: true,
    fn: (input) => formatIdentifyReport(input),
  },
];
