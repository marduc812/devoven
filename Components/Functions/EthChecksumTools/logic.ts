// Ethereum Address Checksum (EIP-55) — pure logic, no browser APIs
import { keccak_256 } from 'js-sha3';

/** What the case of the input told us, before we recomputed it. */
export type EthChecksumForm =
  /** Matches the EIP-55 capitalisation — the checksum passes. */
  | 'checksummed'
  /** No letters are uppercase, so the address carries no checksum. */
  | 'lowercase'
  /** Every letter is uppercase, so the address carries no checksum. */
  | 'uppercase'
  /** Mixed case that disagrees with EIP-55 — a typo or a corrupted address. */
  | 'mismatch';

export type EthChecksumResult = {
  valid: boolean;
  error?: string;
  /** 0x-prefixed, EIP-55 capitalised. */
  checksummed?: string;
  /** 0x-prefixed, all lowercase. */
  normalized?: string;
  /** The input as given, minus surrounding whitespace, 0x-prefixed. */
  input?: string;
  form?: EthChecksumForm;
  /** How many of the 40 characters are hex letters, and so carry a checksum bit. */
  letterCount?: number;
  /** How many of those letters EIP-55 uppercases. */
  upperCount?: number;
  /** Body indexes (0-39) whose case disagrees with the checksum. */
  mismatches?: number[];
};

export function toEIP55Checksum(address: string): EthChecksumResult {
  let addr = address.trim();
  if (!addr) return { valid: false, error: 'Empty input' };

  if (addr.startsWith('0x') || addr.startsWith('0X')) addr = addr.slice(2);

  if (!/^[0-9a-fA-F]{40}$/.test(addr)) {
    return {
      valid: false,
      error: 'Invalid Ethereum address: must be 40 hex characters (optionally prefixed with 0x)',
    };
  }

  const lower = addr.toLowerCase();
  const hashHex = keccak_256(lower);

  let body = '';
  let letterCount = 0;
  let upperCount = 0;
  for (let i = 0; i < 40; i++) {
    const c = lower[i];
    if (c >= 'a' && c <= 'f') {
      letterCount++;
      // EIP-55: uppercase the letter when the matching hash nibble is >= 8.
      if (parseInt(hashHex[i], 16) >= 8) {
        upperCount++;
        body += c.toUpperCase();
      } else {
        body += c;
      }
    } else {
      body += c;
    }
  }

  const mismatches: number[] = [];
  for (let i = 0; i < 40; i++) {
    if (addr[i] !== body[i]) mismatches.push(i);
  }

  const form: EthChecksumForm =
    mismatches.length === 0
      ? 'checksummed'
      : addr === lower
      ? 'lowercase'
      : addr === addr.toUpperCase()
      ? 'uppercase'
      : 'mismatch';

  return {
    valid: true,
    checksummed: '0x' + body,
    normalized: '0x' + lower,
    input: '0x' + addr,
    form,
    letterCount,
    upperCount,
    mismatches,
  };
}
