import {
  BLAKE2B_SIZES,
  BLAKE2S_SIZES,
  BLAKE3_SIZES,
  BlakeOutput,
  blake2bHash,
  blake2sHash,
  blake3Hash,
} from '@/Components/Functions/BlakeHashTools/logic';
import { md4 } from '@/Components/Functions/Md4Tools/logic';
import { whirlpool } from '@/Components/Functions/WhirlpoolTools/logic';
import { hmacSm3, sm3 } from '@/Components/Functions/Sm3Tools/logic';
import {
  ByteFormat,
  KdfHash,
  KdfOutput,
  argon2PhcString,
  bitsToBytes,
  decodeBytes,
  deriveArgon2,
  deriveHkdf,
  derivePbkdf2,
  deriveScrypt,
  encodeKey,
} from '@/Components/Functions/KdfTools/logic';
import { Operation, ParamDefinition } from '../types';

const outputParam = (defaultValue: KdfOutput = 'hex'): ParamDefinition => ({
  id: 'output',
  label: 'Output',
  kind: 'select',
  options: [
    { value: 'hex', label: 'Hex' },
    { value: 'base64', label: 'Base64' },
  ],
  default: defaultValue,
});

const sizeParam = (sizes: readonly number[], defaultBits: number): ParamDefinition => ({
  id: 'bits',
  label: 'Digest size',
  kind: 'select',
  options: sizes.map((bits) => ({ value: String(bits), label: `${bits} bits` })),
  default: String(defaultBits),
});

const saltFormatParam: ParamDefinition = {
  id: 'saltFormat',
  label: 'Salt is',
  kind: 'select',
  options: [
    { value: 'utf8', label: 'Text' },
    { value: 'hex', label: 'Hex' },
    { value: 'base64', label: 'Base64' },
  ],
  default: 'utf8',
};

const hashParam: ParamDefinition = {
  id: 'hash',
  label: 'Hash',
  kind: 'select',
  options: [
    { value: 'sha256', label: 'SHA-256' },
    { value: 'sha512', label: 'SHA-512' },
    { value: 'sha384', label: 'SHA-384' },
    { value: 'sha1', label: 'SHA-1' },
  ],
  default: 'sha256',
};

/** Params arrive as strings; a blank field means "use the default". */
function num(value: string | undefined, fallback: number, label: string): number {
  if (value === undefined || value.trim() === '') return fallback;
  const parsed = Number(value.trim());
  if (!Number.isFinite(parsed)) throw new Error(`${label} must be a number`);
  return parsed;
}

export const hashingModernOperations: Operation[] = [
  {
    id: 'blake2b',
    name: 'BLAKE2b',
    category: 'hashing',
    params: [
      sizeParam(BLAKE2B_SIZES, 512),
      { id: 'key', label: 'Key (optional)', kind: 'text', default: '' },
      outputParam(),
    ],
    chainable: true,
    fn: (input, p) =>
      blake2bHash(input, {
        bits: num(p.bits, 512, 'Digest size'),
        key: p.key ?? '',
        output: (p.output ?? 'hex') as BlakeOutput,
      }),
  },
  {
    id: 'blake2s',
    name: 'BLAKE2s',
    category: 'hashing',
    params: [
      sizeParam(BLAKE2S_SIZES, 256),
      { id: 'key', label: 'Key (optional)', kind: 'text', default: '' },
      outputParam(),
    ],
    chainable: true,
    fn: (input, p) =>
      blake2sHash(input, {
        bits: num(p.bits, 256, 'Digest size'),
        key: p.key ?? '',
        output: (p.output ?? 'hex') as BlakeOutput,
      }),
  },
  {
    id: 'blake3',
    name: 'BLAKE3',
    category: 'hashing',
    params: [
      sizeParam(BLAKE3_SIZES, 256),
      { id: 'context', label: 'Derivation context (optional)', kind: 'text', default: '' },
      outputParam(),
    ],
    chainable: true,
    fn: (input, p) =>
      blake3Hash(input, {
        bits: num(p.bits, 256, 'Output size'),
        context: p.context || undefined,
        output: (p.output ?? 'hex') as BlakeOutput,
      }),
  },
  {
    id: 'md4',
    name: 'MD4',
    category: 'hashing',
    params: [],
    chainable: true,
    fn: (input) => md4(input),
  },
  {
    id: 'whirlpool',
    name: 'Whirlpool',
    category: 'hashing',
    params: [],
    chainable: true,
    fn: (input) => whirlpool(input),
  },
  {
    id: 'sm3',
    name: 'SM3',
    category: 'hashing',
    params: [{ id: 'key', label: 'HMAC key (optional)', kind: 'text', default: '' }],
    chainable: true,
    fn: (input, p) => (p.key ? hmacSm3(input, p.key) : sm3(input)),
  },
  {
    id: 'pbkdf2',
    name: 'PBKDF2',
    category: 'hashing',
    params: [
      { id: 'salt', label: 'Salt', kind: 'text', default: '' },
      saltFormatParam,
      { id: 'iterations', label: 'Iterations', kind: 'text', default: '100000' },
      hashParam,
      { id: 'bits', label: 'Key size (bits)', kind: 'text', default: '256' },
      outputParam(),
    ],
    chainable: true,
    fn: (input, p) =>
      encodeKey(
        derivePbkdf2(input, {
          salt: decodeBytes(p.salt ?? '', (p.saltFormat ?? 'utf8') as ByteFormat, 'Salt'),
          iterations: num(p.iterations, 100000, 'Iterations'),
          hash: (p.hash ?? 'sha256') as KdfHash,
          dkLen: bitsToBytes(num(p.bits, 256, 'Key size')),
        }),
        (p.output ?? 'hex') as KdfOutput,
      ),
  },
  {
    id: 'hkdf',
    name: 'HKDF',
    category: 'hashing',
    params: [
      { id: 'salt', label: 'Salt (optional)', kind: 'text', default: '' },
      saltFormatParam,
      { id: 'info', label: 'Info (context)', kind: 'text', default: '' },
      hashParam,
      { id: 'bits', label: 'Key size (bits)', kind: 'text', default: '256' },
      outputParam(),
    ],
    chainable: true,
    fn: (input, p) =>
      encodeKey(
        deriveHkdf(input, {
          salt: p.salt
            ? decodeBytes(p.salt, (p.saltFormat ?? 'utf8') as ByteFormat, 'Salt')
            : undefined,
          info: p.info ? decodeBytes(p.info, 'utf8', 'Info') : undefined,
          hash: (p.hash ?? 'sha256') as KdfHash,
          dkLen: bitsToBytes(num(p.bits, 256, 'Key size')),
        }),
        (p.output ?? 'hex') as KdfOutput,
      ),
  },
  {
    id: 'scrypt',
    name: 'scrypt',
    category: 'hashing',
    params: [
      { id: 'salt', label: 'Salt', kind: 'text', default: '' },
      saltFormatParam,
      // Blocks run on every keystroke upstream, so the default cost here is a
      // fraction of what a password store should use. The tool page defaults to
      // 2^15; anyone who wants that in a pipeline can type it.
      { id: 'logn', label: 'log2(N)', kind: 'text', default: '14' },
      { id: 'r', label: 'r (block size)', kind: 'text', default: '8' },
      { id: 'p', label: 'p (parallelism)', kind: 'text', default: '1' },
      { id: 'bits', label: 'Key size (bits)', kind: 'text', default: '256' },
      outputParam(),
    ],
    chainable: true,
    fn: (input, p) => {
      const exponent = num(p.logn, 14, 'log2(N)');
      if (!Number.isInteger(exponent) || exponent < 1 || exponent > 24) {
        throw new Error('log2(N) must be a whole number between 1 and 24');
      }
      return encodeKey(
        deriveScrypt(input, {
          salt: decodeBytes(p.salt ?? '', (p.saltFormat ?? 'utf8') as ByteFormat, 'Salt'),
          N: 2 ** exponent,
          r: num(p.r, 8, 'r'),
          p: num(p.p, 1, 'p'),
          dkLen: bitsToBytes(num(p.bits, 256, 'Key size')),
        }),
        (p.output ?? 'hex') as KdfOutput,
      );
    },
  },
  {
    id: 'argon2',
    name: 'Argon2',
    category: 'hashing',
    params: [
      {
        id: 'variant',
        label: 'Variant',
        kind: 'select',
        options: [
          { value: 'argon2id', label: 'Argon2id' },
          { value: 'argon2i', label: 'Argon2i' },
          { value: 'argon2d', label: 'Argon2d' },
        ],
        default: 'argon2id',
      },
      { id: 'salt', label: 'Salt (min 8 bytes)', kind: 'text', default: 'somesalt' },
      saltFormatParam,
      { id: 't', label: 't (passes)', kind: 'text', default: '2' },
      { id: 'm', label: 'm (KiB)', kind: 'text', default: '16384' },
      { id: 'p', label: 'p (lanes)', kind: 'text', default: '1' },
      { id: 'bits', label: 'Key size (bits)', kind: 'text', default: '256' },
      {
        id: 'output',
        label: 'Output',
        kind: 'select',
        options: [
          { value: 'phc', label: 'PHC string' },
          { value: 'hex', label: 'Hex' },
          { value: 'base64', label: 'Base64' },
        ],
        default: 'phc',
      },
    ],
    chainable: true,
    fn: (input, p) => {
      const options = {
        salt: decodeBytes(p.salt ?? '', (p.saltFormat ?? 'utf8') as ByteFormat, 'Salt'),
        t: num(p.t, 2, 't'),
        m: num(p.m, 16384, 'm'),
        p: num(p.p, 1, 'p'),
        variant: (p.variant ?? 'argon2id') as 'argon2id' | 'argon2i' | 'argon2d',
        dkLen: bitsToBytes(num(p.bits, 256, 'Key size')),
      };
      const key = deriveArgon2(input, options);
      return p.output === 'phc' || p.output === undefined
        ? argon2PhcString(key, options)
        : encodeKey(key, p.output as KdfOutput);
    },
  },
];
