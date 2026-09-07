// Generate All Hashes — every digest DevOven can compute over one input.
//
// Nothing here implements a hash. Each row calls the same logic module the
// algorithm's own page uses, so a fix to MD4 or SM3 shows up here for free and
// the two pages can never disagree about a digest.

import CryptoJS from 'crypto-js';
import {
  sha3_224,
  sha3_256,
  sha3_384,
  sha3_512,
  keccak224,
  keccak256,
  keccak384,
  keccak512,
} from 'js-sha3';
import { blake2bHash, blake2sHash, blake3Hash } from '@/Components/Functions/BlakeHashTools/logic';
import { md4, ntlmHash } from '@/Components/Functions/Md4Tools/logic';
import { whirlpool } from '@/Components/Functions/WhirlpoolTools/logic';
import { sm3 } from '@/Components/Functions/Sm3Tools/logic';
import { crc32 } from '@/Components/Functions/Crc32Tools/logic';
import { computeAll as computeFletcherAll } from '@/Components/Functions/FletcherTools/logic';
import { computeFnvAll } from '@/Components/Functions/FnvHashTools/logic';
import { murmurHash3_32 } from '@/Components/Functions/MurmurHashTools/logic';

export type HashFamily = 'md' | 'sha' | 'sha3' | 'keccak' | 'blake' | 'other' | 'checksum';

export const FAMILY_ORDER: HashFamily[] = [
  'md',
  'sha',
  'sha3',
  'keccak',
  'blake',
  'other',
  'checksum',
];

export const familyLabel: Record<HashFamily, string> = {
  md: 'MD family',
  sha: 'SHA-1 and SHA-2',
  sha3: 'SHA-3',
  keccak: 'Keccak',
  blake: 'BLAKE',
  other: 'Other cryptographic',
  checksum: 'Checksums and non-cryptographic',
};

export const familyNote: Record<HashFamily, string> = {
  md: 'All three are collision-broken. Kept because password dumps and old file listings are full of them.',
  sha: 'SHA-1 is broken for collisions; the SHA-2 sizes are what most systems still sign with.',
  sha3: 'The NIST-standardised Keccak, with the padding fixed in FIPS 202.',
  keccak: 'Keccak as originally submitted, before the padding change. This is what Ethereum uses.',
  blake: 'Fast, unbroken, and increasingly the default where speed matters.',
  other: 'Standardised elsewhere: RIPEMD in Bitcoin addresses, SM3 in Chinese national standards.',
  checksum: 'Detect accidental corruption, nothing more. Trivial to forge on purpose.',
};

export type DigestCase = 'lower' | 'upper';

export interface HashRow {
  id: string;
  name: string;
  family: HashFamily;
  /** Digest length in bits. */
  bits: number;
  /** Hex digest, in the requested case. */
  digest: string;
  /** Checksums have a natural decimal reading too; real hashes do not. */
  decimal?: string;
  /** One line on what the algorithm is actually used for. */
  note: string;
}

export interface AllHashesOptions {
  case?: DigestCase;
}

const applyCase = (hex: string, mode: DigestCase): string =>
  mode === 'upper' ? hex.toUpperCase() : hex.toLowerCase();

/**
 * Every digest of `input`, in a fixed order so two runs of the page — or a page
 * and a pipeline block — can be diffed line by line.
 */
export function generateAllHashes(input: string, options: AllHashesOptions = {}): HashRow[] {
  const mode = options.case ?? 'lower';
  const fletcher = computeFletcherAll(input);
  const fnv = computeFnvAll(input);
  const murmur = murmurHash3_32(input, 0) >>> 0;
  const crc = crc32(input) >>> 0;

  const rows: HashRow[] = [
    { id: 'md4', name: 'MD4', family: 'md', bits: 128, digest: md4(input), note: 'Obsolete since the 1990s. Survives inside NTLM.' },
    { id: 'md5', name: 'MD5', family: 'md', bits: 128, digest: CryptoJS.MD5(input).toString(), note: 'Collision-broken since 2004, still the default "checksum" on download pages.' },
    { id: 'ntlm', name: 'NTLM', family: 'md', bits: 128, digest: ntlmHash(input), note: 'MD4 of the input as UTF-16LE. Windows password hash, hashcat mode 1000.' },

    { id: 'sha1', name: 'SHA1', family: 'sha', bits: 160, digest: CryptoJS.SHA1(input).toString(), note: 'Collisions demonstrated in 2017. Git object ids and old certificates.' },
    { id: 'sha224', name: 'SHA224', family: 'sha', bits: 224, digest: CryptoJS.SHA224(input).toString(), note: 'SHA-256 truncated, with a different initial state.' },
    { id: 'sha256', name: 'SHA256', family: 'sha', bits: 256, digest: CryptoJS.SHA256(input).toString(), note: 'The default choice for signatures, certificates and content addressing.' },
    { id: 'sha384', name: 'SHA384', family: 'sha', bits: 384, digest: CryptoJS.SHA384(input).toString(), note: 'SHA-512 truncated. Common in TLS cipher suites.' },
    { id: 'sha512', name: 'SHA512', family: 'sha', bits: 512, digest: CryptoJS.SHA512(input).toString(), note: 'Faster than SHA-256 on 64-bit hardware.' },

    { id: 'sha3-224', name: 'SHA3-224', family: 'sha3', bits: 224, digest: sha3_224(input), note: 'FIPS 202.' },
    { id: 'sha3-256', name: 'SHA3-256', family: 'sha3', bits: 256, digest: sha3_256(input), note: 'FIPS 202. A different construction from SHA-2, not a patch to it.' },
    { id: 'sha3-384', name: 'SHA3-384', family: 'sha3', bits: 384, digest: sha3_384(input), note: 'FIPS 202.' },
    { id: 'sha3-512', name: 'SHA3-512', family: 'sha3', bits: 512, digest: sha3_512(input), note: 'FIPS 202.' },

    { id: 'keccak224', name: 'Keccak-224', family: 'keccak', bits: 224, digest: keccak224(input), note: 'Pre-standardisation padding.' },
    { id: 'keccak256', name: 'Keccak-256', family: 'keccak', bits: 256, digest: keccak256(input), note: 'Ethereum addresses, event topics and Solidity keccak256.' },
    { id: 'keccak384', name: 'Keccak-384', family: 'keccak', bits: 384, digest: keccak384(input), note: 'Pre-standardisation padding.' },
    { id: 'keccak512', name: 'Keccak-512', family: 'keccak', bits: 512, digest: keccak512(input), note: 'Pre-standardisation padding.' },

    { id: 'blake2b-256', name: 'BLAKE2b-256', family: 'blake', bits: 256, digest: blake2bHash(input, { bits: 256 }), note: 'Argon2 and libsodium build on BLAKE2b.' },
    { id: 'blake2b-512', name: 'BLAKE2b-512', family: 'blake', bits: 512, digest: blake2bHash(input, { bits: 512 }), note: 'The full-width BLAKE2b, and its default size.' },
    { id: 'blake2s-256', name: 'BLAKE2s-256', family: 'blake', bits: 256, digest: blake2sHash(input, { bits: 256 }), note: 'The 32-bit sibling, for small machines. WireGuard uses it.' },
    { id: 'blake3-256', name: 'BLAKE3-256', family: 'blake', bits: 256, digest: blake3Hash(input, { bits: 256 }), note: 'Parallel and extendable-output. The fastest of the shelf.' },

    { id: 'ripemd160', name: 'RIPEMD160', family: 'other', bits: 160, digest: CryptoJS.RIPEMD160(input).toString(), note: 'The second hash in a Bitcoin address, over SHA-256.' },
    { id: 'whirlpool', name: 'Whirlpool', family: 'other', bits: 512, digest: whirlpool(input), note: 'ISO/IEC 10118-3. Turns up in TrueCrypt and VeraCrypt volumes.' },
    { id: 'sm3', name: 'SM3', family: 'other', bits: 256, digest: sm3(input), note: 'Chinese national standard GB/T 32905-2016.' },

    { id: 'crc32', name: 'CRC32', family: 'checksum', bits: 32, digest: crc.toString(16).padStart(8, '0'), decimal: crc.toString(10), note: 'ZIP entries, PNG chunks, Ethernet frames.' },
    { id: 'adler32', name: 'Adler-32', family: 'checksum', bits: 32, digest: fletcher.adler32.hex, decimal: String(fletcher.adler32.decimal), note: 'The trailer on every zlib stream.' },
    { id: 'fletcher16', name: 'Fletcher-16', family: 'checksum', bits: 16, digest: fletcher.fletcher16.hex, decimal: String(fletcher.fletcher16.decimal), note: 'Two running sums mod 255.' },
    { id: 'fletcher32', name: 'Fletcher-32', family: 'checksum', bits: 32, digest: fletcher.fletcher32.hex, decimal: String(fletcher.fletcher32.decimal), note: 'The same, over 16-bit words mod 65535.' },
    { id: 'fnv1-32', name: 'FNV-1 (32-bit)', family: 'checksum', bits: 32, digest: fnv.fnv1_32.hex, decimal: fnv.fnv1_32.decimal, note: 'Multiply then xor.' },
    { id: 'fnv1a-32', name: 'FNV-1a (32-bit)', family: 'checksum', bits: 32, digest: fnv.fnv1a_32.hex, decimal: fnv.fnv1a_32.decimal, note: 'Xor then multiply. Better avalanche, and the one people mean by FNV.' },
    { id: 'fnv1-64', name: 'FNV-1 (64-bit)', family: 'checksum', bits: 64, digest: fnv.fnv1_64.hex, decimal: fnv.fnv1_64.decimal, note: 'The 64-bit prime and offset.' },
    { id: 'fnv1a-64', name: 'FNV-1a (64-bit)', family: 'checksum', bits: 64, digest: fnv.fnv1a_64.hex, decimal: fnv.fnv1a_64.decimal, note: 'Hash table keys in Go, Rust and elsewhere.' },
    { id: 'murmur3-32', name: 'MurmurHash3 (32-bit)', family: 'checksum', bits: 32, digest: murmur.toString(16).padStart(8, '0'), decimal: murmur.toString(10), note: 'Seed 0. Bloom filters, sharding, Cassandra partition keys.' },
  ];

  return rows.map((row) => ({ ...row, digest: applyCase(row.digest, mode) }));
}

/** Rows whose name, family or digest contains `query`. An empty query keeps everything. */
export function filterHashRows(rows: HashRow[], query: string): HashRow[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return rows;
  return rows.filter(
    (row) =>
      row.name.toLowerCase().includes(needle) ||
      row.id.includes(needle) ||
      familyLabel[row.family].toLowerCase().includes(needle) ||
      row.digest.toLowerCase().includes(needle),
  );
}

/** Rows in `FAMILY_ORDER`, dropping families the filter emptied. */
export function groupByFamily(rows: HashRow[]): { family: HashFamily; rows: HashRow[] }[] {
  return FAMILY_ORDER.map((family) => ({
    family,
    rows: rows.filter((row) => row.family === family),
  })).filter((group) => group.rows.length > 0);
}

/** A plain-text table, for the copy-all button and for the pipeline block. */
export function formatAllHashes(rows: HashRow[]): string {
  const width = Math.max(...rows.map((row) => row.name.length));
  return groupByFamily(rows)
    .map((group) =>
      [
        `=== ${familyLabel[group.family]} ===`,
        ...group.rows.map((row) => `${row.name.padEnd(width)}  ${row.digest}`),
      ].join('\n'),
    )
    .join('\n\n');
}
