// ─── SSH Public Key Parser ─────────────────────────────────────────────────────
// Parses OpenSSH public key format: <type> <base64-blob> [comment]
// Decodes the binary blob to extract key type, and for RSA: modulus length → bit size.
// No crypto operations — pure structural parsing.

export type SshKeyInfo = {
  keyType: string;
  bitSize: number | null;
  comment: string;
  blobLength: number;
  parts: string[];
  raw: string;
};

// Read a 4-byte big-endian uint32 from a byte array at offset
function readUint32(bytes: number[], offset: number): number {
  return (
    ((bytes[offset] & 0xff) << 24 |
      (bytes[offset + 1] & 0xff) << 16 |
      (bytes[offset + 2] & 0xff) << 8 |
      (bytes[offset + 3] & 0xff)) >>> 0
  );
}

// Decode a standard base64 string to array of byte values
function base64ToBytes(b64: string): number[] {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const padded = b64.replace(/[^A-Za-z0-9+/=]/g, '');
  const bytes: number[] = [];
  let i = 0;
  while (i < padded.length) {
    const c0 = chars.indexOf(padded[i++]);
    const c1 = chars.indexOf(padded[i++]);
    const c2 = padded[i] === '=' ? 0 : chars.indexOf(padded[i++]);
    const c3 = padded[i] === '=' ? 0 : chars.indexOf(padded[i++]);
    if (c2 === -1 || c3 === -1) break;
    bytes.push((c0 << 2) | (c1 >> 4));
    if (padded[i - 2] !== '=') bytes.push(((c1 & 0xf) << 4) | (c2 >> 2));
    if (padded[i - 1] !== '=') bytes.push(((c2 & 0x3) << 6) | c3);
  }
  return bytes;
}

// Read segments from SSH binary blob: each segment is uint32-len + data
function readSegments(bytes: number[]): string[] {
  const segments: string[] = [];
  let offset = 0;
  while (offset + 4 <= bytes.length) {
    const len = readUint32(bytes, offset);
    offset += 4;
    if (offset + len > bytes.length) break;
    const seg = bytes.slice(offset, offset + len);
    segments.push(seg.map(b => String.fromCharCode(b)).join(''));
    offset += len;
  }
  return segments;
}

// Count bits in a big-endian byte array (ignoring leading zeros)
function countBits(bytes: number[]): number {
  let i = 0;
  while (i < bytes.length && bytes[i] === 0) i++;
  if (i === bytes.length) return 0;
  const msb = bytes[i];
  let bits = (bytes.length - i) * 8;
  // Subtract leading zero bits in the most significant byte
  let mask = 0x80;
  while (mask > 0 && (msb & mask) === 0) {
    bits--;
    mask >>= 1;
  }
  return bits;
}

export function parseSshPublicKey(input: string): SshKeyInfo {
  const trimmed = input.trim();
  if (!trimmed) throw new Error('Empty input');

  // Handle "---- BEGIN ..." (PEM-style) — not supported
  if (trimmed.startsWith('-----')) {
    throw new Error('PEM format not supported. Paste an SSH public key (e.g. from id_rsa.pub).');
  }

  const parts = trimmed.split(/\s+/);
  if (parts.length < 2) throw new Error('Invalid SSH public key format');

  const keyTypePrefix = parts[0];
  const blob = parts[1];
  const comment = parts.slice(2).join(' ');

  const bytes = base64ToBytes(blob);
  if (bytes.length < 4) throw new Error('Invalid or empty base64 blob');

  const segments = readSegments(bytes);
  if (segments.length === 0) throw new Error('Could not parse key blob segments');

  const blobKeyType = segments[0];

  // Validate that the prefix matches the blob's encoded key type
  if (blobKeyType !== keyTypePrefix) {
    throw new Error('Key type mismatch: prefix "' + keyTypePrefix + '" vs blob "' + blobKeyType + '"');
  }

  let bitSize: number | null = null;
  const segNames: string[] = [];

  if (keyTypePrefix === 'ssh-rsa') {
    // segments: [key-type, exponent, modulus]
    segNames.push('key-type', 'exponent', 'modulus');
    if (segments.length >= 3) {
      const modulusBytes = segments[2].split('').map(c => c.charCodeAt(0));
      bitSize = countBits(modulusBytes);
    }
  } else if (keyTypePrefix === 'ssh-dss') {
    // segments: [key-type, p, q, g, y]
    segNames.push('key-type', 'p', 'q', 'g', 'y');
    if (segments.length >= 2) {
      const pBytes = segments[1].split('').map(c => c.charCodeAt(0));
      bitSize = countBits(pBytes);
    }
  } else if (keyTypePrefix.startsWith('ecdsa-sha2-')) {
    // segments: [key-type, curve-name, public-key-point]
    segNames.push('key-type', 'curve-name', 'public-key-point');
    const curve = keyTypePrefix.replace('ecdsa-sha2-', '');
    if (curve === 'nistp256') bitSize = 256;
    else if (curve === 'nistp384') bitSize = 384;
    else if (curve === 'nistp521') bitSize = 521;
  } else if (keyTypePrefix === 'ssh-ed25519') {
    // segments: [key-type, public-key]
    segNames.push('key-type', 'public-key');
    bitSize = 256;
  } else if (keyTypePrefix === 'ssh-ed448') {
    segNames.push('key-type', 'public-key');
    bitSize = 448;
  }

  return {
    keyType: blobKeyType,
    bitSize,
    comment,
    blobLength: bytes.length,
    parts: segNames.length > 0 ? segNames.slice(0, segments.length) : segments.map((_, i) => 'segment-' + i),
    raw: trimmed,
  };
}

export function formatSshKeyInfo(info: SshKeyInfo): string {
  const lines: string[] = [];
  lines.push('Key Type:     ' + info.keyType);
  lines.push('Bit Size:     ' + (info.bitSize !== null ? info.bitSize + ' bits' : 'N/A'));
  lines.push('Comment:      ' + (info.comment || '(none)'));
  lines.push('Blob Size:    ' + info.blobLength + ' bytes');
  lines.push('Segments:     ' + info.parts.join(', '));
  return lines.join('\n');
}
