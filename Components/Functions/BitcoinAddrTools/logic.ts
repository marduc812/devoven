// Bitcoin Address Validator — pure logic, no browser APIs

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

export type BitcoinAddressInfo = {
  valid: boolean;
  type?: string;
  encoding?: string;
  network?: string;
  checksumValid?: boolean;
  details?: string;
  error?: string;
};

// Simple double-SHA256 using pure math (bit-level implementation)
// We use a lookup-based approach via pre-computed tables

function rightRotate(value: number, amount: number): number {
  return (value >>> amount) | (value << (32 - amount));
}

const SHA256_K: number[] = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
  0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
  0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
  0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
  0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
  0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
  0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

function sha256(data: Uint8Array): Uint8Array {
  // Pre-processing: adding padding bits
  const msgLen = data.length;
  const bitLen = msgLen * 8;
  // pad to 64-byte blocks, need 8 bytes for length and 1 byte for 0x80
  const padLen = ((msgLen + 9) % 64 === 0) ? 64 : (64 - ((msgLen + 9) % 64));
  const padded = new Uint8Array(msgLen + 1 + padLen + 8);
  padded.set(data);
  padded[msgLen] = 0x80;
  // length in bits as 64-bit big-endian (we only handle < 2^32 bits)
  const view = new DataView(padded.buffer);
  view.setUint32(padded.length - 4, bitLen, false);

  // Initial hash values
  let h0 = 0x6a09e667;
  let h1 = 0xbb67ae85;
  let h2 = 0x3c6ef372;
  let h3 = 0xa54ff53a;
  let h4 = 0x510e527f;
  let h5 = 0x9b05688c;
  let h6 = 0x1f83d9ab;
  let h7 = 0x5be0cd19;

  const w = new Array<number>(64);

  for (let i = 0; i < padded.length; i += 64) {
    for (let j = 0; j < 16; j++) {
      w[j] = view.getUint32(i + j * 4, false);
    }
    for (let j = 16; j < 64; j++) {
      const s0 = rightRotate(w[j - 15], 7) ^ rightRotate(w[j - 15], 18) ^ (w[j - 15] >>> 3);
      const s1 = rightRotate(w[j - 2], 17) ^ rightRotate(w[j - 2], 19) ^ (w[j - 2] >>> 10);
      w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
    }

    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;

    for (let j = 0; j < 64; j++) {
      const S1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + SHA256_K[j] + w[j]) | 0;
      const S0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) | 0;

      h = g; g = f; f = e; e = (d + temp1) | 0;
      d = c; c = b; b = a; a = (temp1 + temp2) | 0;
    }

    h0 = (h0 + a) | 0;
    h1 = (h1 + b) | 0;
    h2 = (h2 + c) | 0;
    h3 = (h3 + d) | 0;
    h4 = (h4 + e) | 0;
    h5 = (h5 + f) | 0;
    h6 = (h6 + g) | 0;
    h7 = (h7 + h) | 0;
  }

  const result = new Uint8Array(32);
  const rv = new DataView(result.buffer);
  rv.setUint32(0, h0, false);
  rv.setUint32(4, h1, false);
  rv.setUint32(8, h2, false);
  rv.setUint32(12, h3, false);
  rv.setUint32(16, h4, false);
  rv.setUint32(20, h5, false);
  rv.setUint32(24, h6, false);
  rv.setUint32(28, h7, false);
  return result;
}

function doubleSha256(data: Uint8Array): Uint8Array {
  return sha256(sha256(data));
}

function base58Decode(str: string): Uint8Array | null {
  const result: number[] = [];
  let n = 0;
  // Count leading '1's
  let leadingZeros = 0;
  for (const c of str) {
    if (c === '1') leadingZeros++;
    else break;
  }

  // Decode using big integer arithmetic with plain numbers
  // Use array of bytes as big-endian integer
  const bytes: number[] = [0];
  for (const c of str) {
    const digit = BASE58_ALPHABET.indexOf(c);
    if (digit < 0) return null;
    // multiply bytes by 58 and add digit
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
    n++;
  }
  void n;

  // Remove leading zeros from decode (except preserved leading zeros)
  while (bytes.length > 1 && bytes[0] === 0) bytes.shift();

  // Add back leading zeros for leading '1's
  const output = new Uint8Array(leadingZeros + bytes.length);
  output.set(bytes, leadingZeros);
  return output;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

const BECH32_CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';

function bech32Polymod(values: number[]): number {
  const GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
  let chk = 1;
  for (const v of values) {
    const b = chk >> 25;
    chk = ((chk & 0x1ffffff) << 5) ^ v;
    for (let i = 0; i < 5; i++) {
      if ((b >> i) & 1) chk ^= GEN[i];
    }
  }
  return chk;
}

function bech32HrpExpand(hrp: string): number[] {
  const result: number[] = [];
  for (const c of hrp) result.push(c.charCodeAt(0) >> 5);
  result.push(0);
  for (const c of hrp) result.push(c.charCodeAt(0) & 31);
  return result;
}

function bech32VerifyChecksum(hrp: string, data: number[]): boolean {
  return bech32Polymod([...bech32HrpExpand(hrp), ...data]) === 1;
}

function validateBech32Address(addr: string): { valid: boolean; hrp: string; witnessVersion?: number } {
  const lower = addr.toLowerCase();
  const sepIdx = lower.lastIndexOf('1');
  if (sepIdx < 1 || sepIdx + 7 > lower.length) return { valid: false, hrp: '' };

  const hrp = lower.slice(0, sepIdx);
  const dataStr = lower.slice(sepIdx + 1);

  const data: number[] = [];
  for (const c of dataStr) {
    const idx = BECH32_CHARSET.indexOf(c);
    if (idx < 0) return { valid: false, hrp };
    data.push(idx);
  }

  if (!bech32VerifyChecksum(hrp, data)) return { valid: false, hrp };

  const witnessVersion = data[0];
  return { valid: true, hrp, witnessVersion };
}

export function validateBitcoinAddress(address: string): BitcoinAddressInfo {
  const addr = address.trim();
  if (!addr) return { valid: false, error: 'Empty input' };

  // Bech32 (native SegWit) — starts with bc1 or tb1
  if (addr.toLowerCase().startsWith('bc1') || addr.toLowerCase().startsWith('tb1')) {
    const network = addr.toLowerCase().startsWith('bc1') ? 'Mainnet' : 'Testnet';
    const result = validateBech32Address(addr.toLowerCase());
    if (!result.valid) {
      return {
        valid: false,
        type: 'Bech32 (Native SegWit)',
        encoding: 'Bech32',
        network,
        checksumValid: false,
        error: 'Invalid Bech32 checksum or character set',
      };
    }
    const wv = result.witnessVersion;
    const addrType = wv === 0 ? 'P2WPKH/P2WSH (SegWit v0)' : wv === 1 ? 'P2TR (Taproot, SegWit v1)' : `SegWit v${wv}`;
    return {
      valid: true,
      type: addrType,
      encoding: 'Bech32',
      network,
      checksumValid: true,
      details: [
        `Format:          Bech32 Native SegWit`,
        `Type:            ${addrType}`,
        `Network:         ${network}`,
        `Witness Version: ${wv}`,
        `Checksum:        Valid`,
        `Length:          ${addr.length} characters`,
      ].join('\n'),
    };
  }

  // Base58Check — P2PKH (starts with 1) or P2SH (starts with 3)
  const firstChar = addr[0];
  if (firstChar === '1' || firstChar === '3' || firstChar === 'm' || firstChar === 'n' || firstChar === '2') {
    const decoded = base58Decode(addr);
    if (!decoded) {
      return { valid: false, error: 'Invalid Base58 characters' };
    }

    if (decoded.length !== 25) {
      return {
        valid: false,
        encoding: 'Base58Check',
        error: `Invalid length: expected 25 bytes, got ${decoded.length}`,
      };
    }

    const payload = decoded.slice(0, 21);
    const checksum = decoded.slice(21);
    const computed = doubleSha256(payload).slice(0, 4);
    const checksumValid = checksum[0] === computed[0] && checksum[1] === computed[1] &&
      checksum[2] === computed[2] && checksum[3] === computed[3];

    const versionByte = decoded[0];
    let type = 'Unknown';
    let network = 'Unknown';

    if (versionByte === 0x00) { type = 'P2PKH (Legacy)'; network = 'Mainnet'; }
    else if (versionByte === 0x05) { type = 'P2SH (Script Hash)'; network = 'Mainnet'; }
    else if (versionByte === 0x6f) { type = 'P2PKH (Legacy)'; network = 'Testnet'; }
    else if (versionByte === 0xc4) { type = 'P2SH (Script Hash)'; network = 'Testnet'; }

    const pubKeyHash = bytesToHex(payload.slice(1));
    const checksumHex = bytesToHex(checksum);
    const computedHex = bytesToHex(computed);

    return {
      valid: checksumValid,
      type,
      encoding: 'Base58Check',
      network,
      checksumValid,
      details: checksumValid
        ? [
          `Format:          Base58Check`,
          `Type:            ${type}`,
          `Network:         ${network}`,
          `Version byte:    0x${versionByte.toString(16).padStart(2, '0')}`,
          `Pub key hash:    ${pubKeyHash}`,
          `Checksum:        ${checksumHex} (valid)`,
          `Length:          ${addr.length} characters`,
        ].join('\n')
        : [
          `Format:          Base58Check`,
          `Type:            ${type}`,
          `Network:         ${network}`,
          `Checksum:        INVALID`,
          `  Expected:      ${computedHex}`,
          `  Got:           ${checksumHex}`,
        ].join('\n'),
      error: checksumValid ? undefined : 'Checksum mismatch — address may be corrupted',
    };
  }

  return {
    valid: false,
    error: 'Unrecognized address format (must start with 1, 3, or bc1)',
  };
}

export function formatBitcoinResult(info: BitcoinAddressInfo): string {
  if (info.details) return info.details;
  if (info.error) return `Invalid: ${info.error}`;
  return 'Invalid address';
}
