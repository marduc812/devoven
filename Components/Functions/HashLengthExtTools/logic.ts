// Hash Length Extension Attack — Educational Reference

export interface HashAlgorithmInfo {
  name: string;
  family: string;
  vulnerable: boolean;
  blockSize: number; // bytes
  outputSize: number; // bytes
  reason: string;
  recommendation: string;
}

export const HASH_ALGORITHMS: HashAlgorithmInfo[] = [
  {
    name: 'MD5',
    family: 'Merkle-Damgård',
    vulnerable: true,
    blockSize: 64,
    outputSize: 16,
    reason: 'Uses Merkle-Damgård construction. Internal state is directly exposed in the digest.',
    recommendation: 'Do not use MD5 for any security purpose. Use HMAC-SHA256 or SHA-3.',
  },
  {
    name: 'SHA-1',
    family: 'Merkle-Damgård',
    vulnerable: true,
    blockSize: 64,
    outputSize: 20,
    reason: 'Uses Merkle-Damgård construction. Internal state is directly exposed in the digest.',
    recommendation: 'SHA-1 is deprecated. Use SHA-256 with HMAC for authentication.',
  },
  {
    name: 'SHA-256',
    family: 'Merkle-Damgård',
    vulnerable: true,
    blockSize: 64,
    outputSize: 32,
    reason: 'Uses Merkle-Damgård construction. The 256-bit output IS the internal state after the last compression round.',
    recommendation: 'Use HMAC-SHA256 instead of bare SHA-256 for MACs. Never use H(key || message) as a MAC.',
  },
  {
    name: 'SHA-512',
    family: 'Merkle-Damgård',
    vulnerable: true,
    blockSize: 128,
    outputSize: 64,
    reason: 'Uses Merkle-Damgård construction with 1024-bit blocks. Same vulnerability as SHA-256 family.',
    recommendation: 'Use HMAC-SHA512 or SHA-3 with proper key handling.',
  },
  {
    name: 'SHA-3 (Keccak)',
    family: 'Sponge',
    vulnerable: false,
    blockSize: 136, // SHA3-256 rate = 1088 bits = 136 bytes
    outputSize: 32,
    reason: 'Uses a sponge construction, not Merkle-Damgård. Output is a transformed view of the internal state, not the state itself. The capacity portion remains hidden.',
    recommendation: 'SHA-3 is safe to use as H(key || message) but HMAC-SHA3 is still recommended for clarity.',
  },
  {
    name: 'BLAKE2',
    family: 'Haifa',
    vulnerable: false,
    blockSize: 64,
    outputSize: 32,
    reason: 'Uses the HAIFA construction which includes a counter and finalization flag in each compression call. This prevents state resumption attacks.',
    recommendation: 'BLAKE2b/BLAKE2s are excellent choices for fast, secure hashing and MACs.',
  },
  {
    name: 'BLAKE3',
    family: 'Merkle tree',
    vulnerable: false,
    blockSize: 64,
    outputSize: 32,
    reason: 'Uses a Merkle tree structure. The tree structure and domain separation flags make state continuation impossible.',
    recommendation: 'BLAKE3 is an excellent modern choice for both hashing and keyed MACs.',
  },
  {
    name: 'HMAC-SHA256',
    family: 'HMAC',
    vulnerable: false,
    blockSize: 64,
    outputSize: 32,
    reason: 'HMAC wraps the hash in H(K XOR opad || H(K XOR ipad || message)). The outer key prevents the attacker from continuing the inner hash.',
    recommendation: 'HMAC with any of the SHA-2 family is the standard solution. This is the correct way to use SHA-2 as a MAC.',
  },
];

export interface PaddingInfo {
  messageLength: number;
  keyLength: number;
  blockSize: number;
  paddingBytes: number;
  paddedLengthBytes: number;
  glueMessage: string; // hex representation of the padding that gets appended
  explanation: string;
}

/**
 * Calculate the MD padding bytes appended to message+key during hashing.
 * This is the "glue" padding the attacker must include in their extension payload.
 */
export function calculateMerkleDamgardPadding(keyLength: number, messageLength: number, blockSizeBytes: number): PaddingInfo {
  const totalLength = keyLength + messageLength;
  // Merkle-Damgård padding: 0x80 byte, then 0x00 bytes, then 8-byte big-endian bit-length
  // such that (totalLength + padding) % blockSize === 0
  const lengthFieldBytes = 8; // 64-bit length encoding
  const minPad = 1; // at least 0x80
  const rawRemainder = (totalLength + minPad + lengthFieldBytes) % blockSizeBytes;
  const zeroPadBytes = rawRemainder === 0 ? 0 : blockSizeBytes - rawRemainder;
  const paddingBytes = minPad + zeroPadBytes + lengthFieldBytes;
  const paddedLengthBytes = totalLength + paddingBytes;

  // Build hex glue padding
  const glueBytes: number[] = [0x80];
  for (let i = 0; i < zeroPadBytes; i++) glueBytes.push(0x00);
  // Append bit-length as 8-byte big-endian
  const bitLength = totalLength * 8;
  // Represent as two 32-bit numbers (since JS numbers are safe up to 2^53)
  const highBits = Math.floor(bitLength / 4294967296);
  const lowBits = bitLength >>> 0;
  const push32be = (n: number) => {
    glueBytes.push((n >>> 24) & 0xff);
    glueBytes.push((n >>> 16) & 0xff);
    glueBytes.push((n >>> 8) & 0xff);
    glueBytes.push(n & 0xff);
  };
  push32be(highBits);
  push32be(lowBits);

  const glueHex = glueBytes.map(b => b.toString(16).padStart(2, '0')).join(' ');

  const explanation = [
    `Original data: key (${keyLength} bytes) || message (${messageLength} bytes) = ${totalLength} bytes`,
    `Block size: ${blockSizeBytes} bytes`,
    `Padding formula: 0x80 || (zero bytes to align) || 64-bit big-endian bit-length`,
    `Zero padding bytes: ${zeroPadBytes}`,
    `Total padding: ${paddingBytes} bytes (1 + ${zeroPadBytes} + 8)`,
    `Padded total: ${paddedLengthBytes} bytes (${paddedLengthBytes / blockSizeBytes} block(s))`,
    ``,
    `Attack: attacker appends \\x80${zeroPadBytes > 0 ? '\\x00'.repeat(zeroPadBytes) : ''}[8-byte length] || extra_data`,
    `then forges MAC = H(original_hash_as_state || extra_data_with_padding)`,
  ].join('\n');

  return {
    messageLength,
    keyLength,
    blockSize: blockSizeBytes,
    paddingBytes,
    paddedLengthBytes,
    glueMessage: glueHex,
    explanation,
  };
}

export interface ConceptSection {
  title: string;
  content: string;
}

export const CONCEPT_SECTIONS: ConceptSection[] = [
  {
    title: 'What is the Merkle-Damgård Construction?',
    content: `Merkle-Damgård (MD) is a design pattern used by MD5, SHA-1, SHA-256, and SHA-512.
A message is divided into fixed-size blocks. An iterative compression function f processes each block together with the current state H:

  H₀ = IV (initialization vector)
  H₁ = f(H₀, block₁)
  H₂ = f(H₁, block₂)
  ...
  Hₙ = f(Hₙ₋₁, blockₙ)
  output = Hₙ

The crucial property: the output IS the internal state. This means if you have the hash output you have the state needed to continue hashing.`,
  },
  {
    title: 'The Length Extension Attack',
    content: `Suppose a server computes MAC = SHA-256(secret_key || message) and sends it with the message.

An attacker who knows:
  1. The hash value (MAC)
  2. The length of secret_key (or can guess it)
  3. The message content

Can compute a valid MAC for a forged message: message || padding || extra_data

Steps:
  1. Load the known hash as the starting internal state
  2. Continue hashing from that state with the extra data
  3. The result is a valid hash for (key || message || padding || extra_data)
  4. Server verifies SHA-256(key || forged_message) — it matches!

Tools like hashpump and hash_extender automate this attack.`,
  },
  {
    title: 'The Padding (Glue)',
    content: `Before hashing each block, MD functions append a specific padding so the total length is a multiple of the block size:

  1. Append a single 0x80 byte
  2. Append zero bytes until length ≡ (blockSize - 8) mod blockSize
  3. Append the original message length as a 64-bit big-endian integer

This padding becomes part of the forged message. The attacker must know the key length to compute it correctly (they can try multiple lengths if unknown).`,
  },
  {
    title: 'Real-World Impact',
    content: `CVE-2009-3490: Flickr API used HMAC but had a length extension vulnerability in token verification.
CVE-2008-2380: Multiple web applications that used H(secret || data) as a MAC.

Affected pattern: Any code using hash(secret || user_controlled_data) as authentication or integrity check.

Secure alternatives:
  • HMAC: H(K XOR opad || H(K XOR ipad || msg)) — standard and well-studied
  • SHA-3 / BLAKE2 / BLAKE3 — not vulnerable by design
  • Authenticated Encryption (AES-GCM) — preferred for encryption + integrity`,
  },
];
