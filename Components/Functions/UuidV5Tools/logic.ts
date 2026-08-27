// SHA-1 in pure JS (no crypto module — runs client-side)
// Based on FIPS 180-4

function rotl32(x: number, n: number): number {
  return ((x << n) | (x >>> (32 - n))) >>> 0;
}

function sha1(msgBytes: number[]): number[] {
  // Pre-processing: adding padding bits
  const ml = msgBytes.length * 8; // message length in bits
  msgBytes = msgBytes.slice();
  msgBytes.push(0x80);
  while ((msgBytes.length % 64) !== 56) msgBytes.push(0x00);
  // Append length as 64-bit big-endian (we only handle 32-bit lengths)
  msgBytes.push(0, 0, 0, 0);
  msgBytes.push(
    (ml >>> 24) & 0xff,
    (ml >>> 16) & 0xff,
    (ml >>> 8) & 0xff,
    ml & 0xff
  );

  let h0 = 0x67452301;
  let h1 = 0xEFCDAB89;
  let h2 = 0x98BADCFE;
  let h3 = 0x10325476;
  let h4 = 0xC3D2E1F0;

  for (let i = 0; i < msgBytes.length; i += 64) {
    const w: number[] = [];
    for (let j = 0; j < 16; j++) {
      w[j] = ((msgBytes[i + j * 4] << 24) |
               (msgBytes[i + j * 4 + 1] << 16) |
               (msgBytes[i + j * 4 + 2] << 8) |
               msgBytes[i + j * 4 + 3]) >>> 0;
    }
    for (let j = 16; j < 80; j++) {
      w[j] = rotl32(w[j-3] ^ w[j-8] ^ w[j-14] ^ w[j-16], 1);
    }

    let a = h0, b = h1, c = h2, d = h3, e = h4;

    for (let j = 0; j < 80; j++) {
      let f = 0, k = 0;
      if (j < 20) {
        f = ((b & c) | (~b & d)) >>> 0;
        k = 0x5A827999;
      } else if (j < 40) {
        f = (b ^ c ^ d) >>> 0;
        k = 0x6ED9EBA1;
      } else if (j < 60) {
        f = ((b & c) | (b & d) | (c & d)) >>> 0;
        k = 0x8F1BBCDC;
      } else {
        f = (b ^ c ^ d) >>> 0;
        k = 0xCA62C1D6;
      }
      const temp = (rotl32(a, 5) + f + e + k + w[j]) >>> 0;
      e = d; d = c; c = rotl32(b, 30); b = a; a = temp;
    }

    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
  }

  return [h0, h1, h2, h3, h4];
}

function sha1Bytes(msgBytes: number[]): number[] {
  const words = sha1(msgBytes);
  const out: number[] = [];
  for (let i = 0; i < words.length; i++) {
    out.push((words[i] >>> 24) & 0xff);
    out.push((words[i] >>> 16) & 0xff);
    out.push((words[i] >>> 8) & 0xff);
    out.push(words[i] & 0xff);
  }
  return out;
}

function stringToBytes(s: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i);
    if (code < 0x80) {
      bytes.push(code);
    } else if (code < 0x800) {
      bytes.push(0xC0 | (code >> 6));
      bytes.push(0x80 | (code & 0x3F));
    } else {
      bytes.push(0xE0 | (code >> 12));
      bytes.push(0x80 | ((code >> 6) & 0x3F));
      bytes.push(0x80 | (code & 0x3F));
    }
  }
  return bytes;
}

function uuidToBytes(uuid: string): number[] {
  const hex = uuid.replace(/-/g, '');
  if (hex.length !== 32) throw new Error('Invalid UUID: ' + uuid);
  const bytes: number[] = [];
  for (let i = 0; i < 32; i += 2) {
    bytes.push(parseInt(hex.slice(i, i + 2), 16));
  }
  return bytes;
}

function toHex(n: number, len: number): string {
  return n.toString(16).padStart(len, '0');
}

export const NAMESPACES: Record<string, string> = {
  DNS:  '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  URL:  '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
  OID:  '6ba7b812-9dad-11d1-80b4-00c04fd430c8',
  X500: '6ba7b814-9dad-11d1-80b4-00c04fd430c8',
};

export function generateUuidV5(namespaceUuid: string, name: string): string {
  const nsBytes = uuidToBytes(namespaceUuid);
  const nameBytes = stringToBytes(name);
  const msgBytes = nsBytes.concat(nameBytes);
  const hash = sha1Bytes(msgBytes);

  // Set version to 5 (0101 in top nibble of byte 6)
  hash[6] = (hash[6] & 0x0f) | 0x50;
  // Set variant to 10xx (RFC 4122)
  hash[8] = (hash[8] & 0x3f) | 0x80;

  return (
    toHex(hash[0], 2) + toHex(hash[1], 2) + toHex(hash[2], 2) + toHex(hash[3], 2) +
    '-' +
    toHex(hash[4], 2) + toHex(hash[5], 2) +
    '-' +
    toHex(hash[6], 2) + toHex(hash[7], 2) +
    '-' +
    toHex(hash[8], 2) + toHex(hash[9], 2) +
    '-' +
    toHex(hash[10], 2) + toHex(hash[11], 2) + toHex(hash[12], 2) +
    toHex(hash[13], 2) + toHex(hash[14], 2) + toHex(hash[15], 2)
  );
}

export function formatUuidV5(namespaceKey: string, name: string): string {
  if (!name.trim()) throw new Error('Name is required');
  const ns = NAMESPACES[namespaceKey] || namespaceKey;
  const uuid = generateUuidV5(ns, name);
  return [
    'UUID v5: ' + uuid,
    '',
    'Namespace: ' + namespaceKey + ' (' + ns + ')',
    'Name:      ' + name,
  ].join('\n');
}
