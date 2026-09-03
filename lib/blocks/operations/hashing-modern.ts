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

// A KDF takes the secret and the salt as two named fields; the cost settings
// stay parameters.
const kdfFields = [
  { id: 'password', label: 'Password' },
  { id: 'salt', label: 'Salt' },
];

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
    fn: (input) => md4(input),
  },
  {
    id: 'whirlpool',
    name: 'Whirlpool',
    category: 'hashing',
    params: [],
    fn: (input) => whirlpool(input),
  },
  {
    id: 'sm3',
    name: 'SM3',
    category: 'hashing',
    params: [{ id: 'key', label: 'HMAC key (optional)', kind: 'text', default: '' }],
    fn: (input, p) => (p.key ? hmacSm3(input, p.key) : sm3(input)),
  },
  {
    id: 'pbkdf2',
    name: 'PBKDF2',
    category: 'hashing',
    inputs: kdfFields,
    params: [
      saltFormatParam,
      { id: 'iterations', label: 'Iterations', kind: 'text', default: '100000' },
      hashParam,
      { id: 'bits', label: 'Key size (bits)', kind: 'text', default: '256' },
      outputParam(),
    ],
    fn: (_input, p) =>
      encodeKey(
        derivePbkdf2(p.password ?? '', {
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
    inputs: [
      { id: 'ikm', label: 'Key material' },
      { id: 'salt', label: 'Salt', placeholder: 'optional' },
    ],
    params: [
      saltFormatParam,
      { id: 'info', label: 'Info (context)', kind: 'text', default: '' },
      hashParam,
      { id: 'bits', label: 'Key size (bits)', kind: 'text', default: '256' },
      outputParam(),
    ],
    fn: (_input, p) =>
      encodeKey(
        deriveHkdf(p.ikm ?? '', {
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
    inputs: kdfFields,
    params: [
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
    fn: (_input, p) => {
      const exponent = num(p.logn, 14, 'log2(N)');
      if (!Number.isInteger(exponent) || exponent < 1 || exponent > 24) {
        throw new Error('log2(N) must be a whole number between 1 and 24');
      }
      return encodeKey(
        deriveScrypt(p.password ?? '', {
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
    inputs: [
      { id: 'password', label: 'Password' },
      { id: 'salt', label: 'Salt', placeholder: 'at least 8 bytes' },
    ],
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
    fn: (_input, p) => {
      const options = {
        salt: decodeBytes(p.salt ?? '', (p.saltFormat ?? 'utf8') as ByteFormat, 'Salt'),
        t: num(p.t, 2, 't'),
        m: num(p.m, 16384, 'm'),
        p: num(p.p, 1, 'p'),
        variant: (p.variant ?? 'argon2id') as 'argon2id' | 'argon2i' | 'argon2d',
        dkLen: bitsToBytes(num(p.bits, 256, 'Key size')),
      };
      const key = deriveArgon2(p.password ?? '', options);
      return p.output === 'phc' || p.output === undefined
        ? argon2PhcString(key, options)
        : encodeKey(key, p.output as KdfOutput);
    },
  },
];
