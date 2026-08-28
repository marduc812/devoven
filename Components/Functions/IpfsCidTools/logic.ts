// IPFS CID Decoder — pure logic, no browser APIs

// Multibase prefixes
const MULTIBASE_PREFIXES: Record<string, string> = {
  'Q': 'base58btc (implicit, CIDv0)',
  '1': 'base58btc',
  'b': 'base32 (RFC 4648, lowercase)',
  'B': 'base32 (RFC 4648, uppercase)',
  'z': 'base58btc',
  'Z': 'base58flickr',
  'm': 'base64',
  'M': 'base64pad',
  'u': 'base64url',
  'U': 'base64urlpad',
  'f': 'base16 (hex lowercase)',
  'F': 'base16 (hex uppercase)',
};

// Multicodec names (partial list of common ones)
const MULTICODEC_NAMES: Record<number, string> = {
  0x70: 'dag-pb (MerkleDAG protobuf)',
  0x71: 'dag-cbor (MerkleDAG CBOR)',
  0x72: 'libp2p-key',
  0x55: 'raw (binary)',
  0x0200: 'dag-json',
  0x0129: 'dag-jose',
  0x12: 'sha2-256 (multihash)',
  0x11: 'sha1 (multihash)',
  0x13: 'sha2-512 (multihash)',
  0x14: 'sha3-512 (multihash)',
  0x15: 'sha3-384 (multihash)',
  0x16: 'sha3-256 (multihash)',
  0x17: 'sha3-224 (multihash)',
};

// Multihash function codes
const MULTIHASH_FUNCTIONS: Record<number, string> = {
  0x11: 'sha1',
  0x12: 'sha2-256',
  0x13: 'sha2-512',
  0x14: 'sha3-512',
  0x15: 'sha3-384',
  0x16: 'sha3-256',
  0x17: 'sha3-224',
  0x20: 'blake2b-256',
  0x40: 'murmur3-128',
};

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function base58Decode(str: string): Uint8Array | null {
  let leadingZeros = 0;
  for (const c of str) {
    if (c === '1') leadingZeros++;
    else break;
  }

  const bytes: number[] = [0];
  for (const c of str) {
    const digit = BASE58_ALPHABET.indexOf(c);
    if (digit < 0) return null;
    let carry = digit;
    for (let i = bytes.length - 1; i >= 0; i--) {
      const val = bytes[i] * 58 + carry;
      bytes[i] = val & 0xff;
      carry = val >> 8;
    }
    while (carry > 0) {
      bytes.unshift(carry & 0xff);
      carry >>= 8;
    }
  }

  while (bytes.length > 1 && bytes[0] === 0) bytes.shift();

  const result = new Uint8Array(leadingZeros + bytes.length);
  result.set(bytes, leadingZeros);
  return result;
}

const BASE32_ALPHABET = 'abcdefghijklmnopqrstuvwxyz234567';

function base32Decode(input: string): Uint8Array | null {
  const s = input.toLowerCase().replace(/=+$/, '');
  const output: number[] = [];
  let buffer = 0;
  let bitsLeft = 0;

  for (const c of s) {
    const val = BASE32_ALPHABET.indexOf(c);
    if (val < 0) return null;
    buffer = (buffer << 5) | val;
    bitsLeft += 5;
    if (bitsLeft >= 8) {
      bitsLeft -= 8;
      output.push((buffer >> bitsLeft) & 0xff);
    }
  }

  return new Uint8Array(output);
}

function readVarint(bytes: Uint8Array, offset: number): { value: number; bytesRead: number } {
  let value = 0;
  let shift = 0;
  let bytesRead = 0;
  while (offset + bytesRead < bytes.length) {
    const byte = bytes[offset + bytesRead];
    bytesRead++;
    value |= (byte & 0x7f) << shift;
    shift += 7;
    if ((byte & 0x80) === 0) break;
    if (shift >= 28) break; // protect against overflow for safe numbers
  }
  return { value, bytesRead };
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

export type CIDInfo = {
  valid: boolean;
  version?: number;
  codec?: string;
  codecCode?: number;
  hashFunction?: string;
  hashFunctionCode?: number;
  digestLength?: number;
  digestHex?: string;
  baseEncoding?: string;
  error?: string;
};

export function decodeCID(cid: string): CIDInfo {
  const input = cid.trim();
  if (!input) return { valid: false, error: 'Empty input' };

  // CIDv0: starts with "Qm" (base58btc, 46 chars, implicit dag-pb + sha2-256)
  if (input.startsWith('Qm') && input.length === 46) {
    const decoded = base58Decode(input);
    if (!decoded) return { valid: false, error: 'Invalid base58 characters in CIDv0' };

    // CIDv0 is a raw multihash: <hash-fn-code><digest-length><digest>
    const { value: hashFnCode, bytesRead: r1 } = readVarint(decoded, 0);
    const { value: digestLen, bytesRead: r2 } = readVarint(decoded, r1);
    const digest = decoded.slice(r1 + r2);

    return {
      valid: true,
      version: 0,
      codec: 'dag-pb (MerkleDAG protobuf)',
      codecCode: 0x70,
      hashFunction: MULTIHASH_FUNCTIONS[hashFnCode] ?? `unknown (0x${hashFnCode.toString(16)})`,
      hashFunctionCode: hashFnCode,
      digestLength: digestLen,
      digestHex: bytesToHex(digest),
      baseEncoding: 'base58btc (implicit)',
    };
  }

  // CIDv1: first character is multibase prefix
  const prefix = input[0];
  const baseEncoding = MULTIBASE_PREFIXES[prefix] ?? `unknown prefix '${prefix}'`;

  // Decode the multibase-encoded bytes (skip first char which is the prefix)
  let decoded: Uint8Array | null = null;

  if (prefix === 'b' || prefix === 'B') {
    decoded = base32Decode(input.slice(1));
  } else if (prefix === 'z' || prefix === '1') {
    decoded = base58Decode(input.slice(1));
  } else if (prefix === 'f' || prefix === 'F') {
    const hex = input.slice(1);
    if (hex.length % 2 !== 0) return { valid: false, error: 'Invalid hex length' };
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    }
    decoded = bytes;
  } else {
    return {
      valid: false,
      error: `Unsupported multibase prefix '${prefix}'. Supported: b (base32), z (base58btc), f (base16/hex)`,
    };
  }

  if (!decoded) return { valid: false, error: 'Failed to decode CID bytes' };

  // Parse CIDv1: <version-varint><codec-varint><multihash>
  let offset = 0;
  const versionResult = readVarint(decoded, offset);
  const version = versionResult.value;
  offset += versionResult.bytesRead;

  if (version !== 1) {
    return { valid: false, error: `Unexpected CID version: ${version} (expected 1)` };
  }

  const codecResult = readVarint(decoded, offset);
  const codecCode = codecResult.value;
  offset += codecResult.bytesRead;

  // Multihash
  const multihashResult = readVarint(decoded, offset);
  const hashFnCode = multihashResult.value;
  offset += multihashResult.bytesRead;

  const digestLenResult = readVarint(decoded, offset);
  const digestLen = digestLenResult.value;
  offset += digestLenResult.bytesRead;

  const digest = decoded.slice(offset, offset + digestLen);

  return {
    valid: true,
    version: 1,
    codec: MULTICODEC_NAMES[codecCode] ?? `unknown (0x${codecCode.toString(16)})`,
    codecCode,
    hashFunction: MULTIHASH_FUNCTIONS[hashFnCode] ?? `unknown (0x${hashFnCode.toString(16)})`,
    hashFunctionCode: hashFnCode,
    digestLength: digestLen,
    digestHex: bytesToHex(digest),
    baseEncoding,
  };
}

export function formatCIDInfo(info: CIDInfo): string {
  if (!info.valid) return `Error: ${info.error}`;

  return [
    `CID Version:     v${info.version}`,
    `Base Encoding:   ${info.baseEncoding}`,
    `Codec:           ${info.codec} (0x${info.codecCode?.toString(16)})`,
    ``,
    `Multihash Info:`,
    `  Hash Function: ${info.hashFunction} (0x${info.hashFunctionCode?.toString(16)})`,
    `  Digest Length: ${info.digestLength} bytes`,
    `  Digest (hex):  ${info.digestHex}`,
    ``,
    `Structure: <version><codec><hash-fn><digest-len><digest>`,
  ].join('\n');
}
