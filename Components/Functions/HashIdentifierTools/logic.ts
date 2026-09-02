import { prototypes } from './hashes';
import { HashCandidate, IdentifyResult } from './types';

export type { HashCandidate, IdentifyResult } from './types';

/**
 * The types worth seeing first. Without this, a plain 32-char hex string lists
 * Skype and Haval-128 with the same weight as MD5 and NTLM, which is useless in
 * practice. Ported from Name-That-Hash's popularity set.
 */
const POPULAR = new Set([
  'MD5',
  'MD4',
  'NTLM',
  'SHA-256',
  'SHA-512',
  'Keccak-256',
  'Keccak-512',
  'Blake2',
  'bcrypt',
  'SHA-1',
  'HMAC-SHA1 (key = $salt)',
  'CryptoCurrency(PrivateKey)',
  'SHA-338',
  'Domain Cached Credentials',
  'Domain Cached Credentials 2',
]);

/** Hash names that DevOven has a generator or inspector for. */
const TOOL_LINKS: Record<string, string> = {
  'MD5': '/hashing/md5',
  'SHA-1': '/hashing/sha1',
  'SHA-224': '/hashing/sha224',
  'SHA-256': '/hashing/sha256',
  'SHA-384': '/hashing/sha384',
  'SHA-512': '/hashing/sha512',
  'SHA3-224': '/hashing/sha3-224',
  'SHA3-256': '/hashing/sha3-256',
  'SHA3-384': '/hashing/sha3-384',
  'SHA3-512': '/hashing/sha3-512',
  'Keccak-224': '/hashing/keccak224',
  'Keccak-256': '/hashing/keccak256',
  'Keccak-384': '/hashing/keccak384',
  'Keccak-512': '/hashing/keccak512',
  'RIPEMD-160': '/hashing/ripemd160',
  'NTLM': '/hashing/ntlm',
  'MD4': '/hashing/md4',
  'md4(utf16($pass))': '/hashing/ntlm',
  'Whirlpool': '/hashing/whirlpool',
  'Blake2': '/hashing/blake2b',
  'Blake2b-256': '/hashing/blake2b',
  'BLAKE2-224': '/hashing/blake2b',
  'BLAKE2-256': '/hashing/blake2b',
  'BLAKE2-384': '/hashing/blake2b',
  'BLAKE2b-512': '/hashing/blake2b',
  'Adler-32': '/hashing/adler32',
  'Argon2d': '/hashing/argon2',
  'Argon2i': '/hashing/argon2',
  'Argon2id': '/hashing/argon2',
  'scrypt': '/hashing/scrypt',
  'PBKDF2-SHA1(Generic)': '/hashing/pbkdf2',
  'PBKDF2-SHA256(Generic)': '/hashing/pbkdf2',
  'PBKDF2-SHA512(Generic)': '/hashing/pbkdf2',
  'CRC-32': '/hashing/crc32',
  'CRC-32B': '/hashing/crc32',
  'bcrypt': '/hashing/bcrypt-info',
  'Fletcher-32': '/hashing/fletcher',
  'FNV-132': '/hashing/fnv',
  'FNV-164': '/hashing/fnv',
  'HMAC-MD5 (key = $pass)': '/hashing/hmac-md5',
  'HMAC-MD5 (key = $salt)': '/hashing/hmac-md5',
  'HMAC-SHA1 (key = $pass)': '/hashing/hmac-sha1',
  'HMAC-SHA1 (key = $salt)': '/hashing/hmac-sha1',
  'HMAC-SHA256 (key = $pass)': '/hashing/hmac-sha256',
  'HMAC-SHA256 (key = $salt)': '/hashing/hmac-sha256',
  'HMAC-SHA512 (key = $pass)': '/hashing/hmac-sha512',
  'HMAC-SHA512 (key = $salt)': '/hashing/hmac-sha512',
};

/**
 * Candidate types for one hash, popular ones first.
 *
 * Every prototype whose regex matches from the start of the string contributes
 * its modes, in database order. Duplicate names (a 32-hex string matches several
 * prototypes) are collapsed to their first occurrence.
 */
export function identifyHash(input: string): HashCandidate[] {
  const hash = input.trim();
  if (!hash) return [];

  const seen = new Set<string>();
  const popular: HashCandidate[] = [];
  const rest: HashCandidate[] = [];

  for (const prototype of prototypes) {
    if (!prototype.regex.test(hash)) continue;
    for (const mode of prototype.modes) {
      if (seen.has(mode.name)) continue;
      seen.add(mode.name);
      const isPopular = POPULAR.has(mode.name);
      const candidate: HashCandidate = {
        ...mode,
        popular: isPopular,
        tool: TOOL_LINKS[mode.name] ?? null,
      };
      (isPopular ? popular : rest).push(candidate);
    }
  }

  return [...popular, ...rest];
}

/** Identifies every non-empty line of the input as its own hash. */
export function identifyLines(input: string): IdentifyResult[] {
  return input
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((hash) => ({ hash, candidates: identifyHash(hash) }));
}

/** The hashcat mode as it appears in the mode column. */
export function modeLabel(hashcat: number | null): string {
  return hashcat === null ? '-' : String(hashcat);
}

/**
 * Plain-text report, used by the Blocks pipeline and the copy button.
 *
 * Two aligned columns per hash, mode then type, so a five-hash paste stays
 * scannable and greppable rather than turning into prose.
 */
export function formatIdentifyReport(input: string): string {
  const results = identifyLines(input);
  if (results.length === 0) throw new Error('Nothing to identify');

  return results
    .map(({ hash, candidates }) => {
      const lines = [hash];
      if (candidates.length === 0) {
        lines.push('  no matching hash type found');
        return lines.join('\n');
      }
      const width = Math.max(4, ...candidates.map((c) => modeLabel(c.hashcat).length));
      for (const candidate of candidates) {
        lines.push(`  ${modeLabel(candidate.hashcat).padEnd(width)}  ${candidate.name}`);
      }
      return lines.join('\n');
    })
    .join('\n\n');
}
