// Bcrypt Hash Info — parse a bcrypt hash and extract its structure
// Bcrypt format: $<version>$<cost>$<22-char-salt><31-char-hash>

export interface BcryptInfo {
  valid: boolean;
  version: string;
  costFactor: number;
  rounds: number;
  saltBase64: string;
  saltHex: string;
  hashBase64: string;
  hashHex: string;
  fullEncoded: string;
  algorithm: string;
  keyLength: number;
  error?: string;
}

// Bcrypt uses a modified base64 alphabet
const BCRYPT_ALPHABET = './ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

function bcryptBase64Decode(str: string): number[] {
  const result: number[] = [];
  let i = 0;
  while (i < str.length) {
    const c0 = BCRYPT_ALPHABET.indexOf(str[i++]);
    const c1 = BCRYPT_ALPHABET.indexOf(str[i++]);
    const c2 = i <= str.length ? BCRYPT_ALPHABET.indexOf(str[i++]) : -1;
    const c3 = i <= str.length ? BCRYPT_ALPHABET.indexOf(str[i++]) : -1;

    if (c0 < 0 || c1 < 0) break;

    result.push(((c0 << 2) | (c1 >> 4)) & 0xff);
    if (c2 >= 0) result.push(((c1 << 4) | (c2 >> 2)) & 0xff);
    if (c3 >= 0) result.push(((c2 << 6) | c3) & 0xff);
  }
  return result;
}

function bytesToHex(bytes: number[]): string {
  return bytes.map(b => ('0' + b.toString(16)).slice(-2)).join('');
}

export function parseBcryptHash(input: string): BcryptInfo {
  const trimmed = input.trim();

  if (!trimmed.startsWith('$')) {
    return {
      valid: false, version: '', costFactor: 0, rounds: 0,
      saltBase64: '', saltHex: '', hashBase64: '', hashHex: '',
      fullEncoded: trimmed, algorithm: '', keyLength: 0,
      error: 'Not a valid bcrypt hash — must start with $',
    };
  }

  const parts = trimmed.split('$');
  // parts[0] = '', parts[1] = version, parts[2] = cost, parts[3] = salt+hash
  if (parts.length < 4) {
    return {
      valid: false, version: '', costFactor: 0, rounds: 0,
      saltBase64: '', saltHex: '', hashBase64: '', hashHex: '',
      fullEncoded: trimmed, algorithm: '', keyLength: 0,
      error: 'Invalid bcrypt format — expected $version$cost$salt+hash',
    };
  }

  const version = parts[1];
  const costStr = parts[2];
  const encoded = parts[3];

  const supportedVersions = ['2', '2a', '2b', '2x', '2y'];
  if (!supportedVersions.includes(version)) {
    return {
      valid: false, version, costFactor: 0, rounds: 0,
      saltBase64: '', saltHex: '', hashBase64: '', hashHex: '',
      fullEncoded: trimmed, algorithm: '', keyLength: 0,
      error: 'Unsupported bcrypt version: $' + version + ' (expected 2a, 2b, 2y)',
    };
  }

  const costFactor = parseInt(costStr, 10);
  if (isNaN(costFactor) || costFactor < 4 || costFactor > 31) {
    return {
      valid: false, version, costFactor, rounds: 0,
      saltBase64: '', saltHex: '', hashBase64: '', hashHex: '',
      fullEncoded: trimmed, algorithm: '', keyLength: 0,
      error: 'Invalid cost factor: ' + costStr + ' (must be 4-31)',
    };
  }

  if (encoded.length !== 53) {
    return {
      valid: false, version, costFactor, rounds: 0,
      saltBase64: '', saltHex: '', hashBase64: '', hashHex: '',
      fullEncoded: trimmed, algorithm: '', keyLength: 0,
      error: 'Invalid encoded section length: ' + encoded.length + ' (expected 53 characters)',
    };
  }

  const saltBase64 = encoded.slice(0, 22);
  const hashBase64 = encoded.slice(22);

  const saltBytes = bcryptBase64Decode(saltBase64);
  const hashBytes = bcryptBase64Decode(hashBase64);

  const saltHex = bytesToHex(saltBytes);
  const hashHex = bytesToHex(hashBytes);

  const rounds = Math.pow(2, costFactor);

  return {
    valid: true,
    version: '$' + version,
    costFactor,
    rounds,
    saltBase64,
    saltHex,
    hashBase64,
    hashHex,
    fullEncoded: trimmed,
    algorithm: 'Blowfish (EksBlowfish)',
    keyLength: 184,
  };
}

export function formatBcryptInfo(info: BcryptInfo): string {
  if (!info.valid) {
    return 'Error: ' + (info.error || 'Invalid bcrypt hash');
  }

  const lines: string[] = [
    '=== Bcrypt Hash Analysis ===',
    '',
    'Valid bcrypt hash: Yes',
    'Version:          ' + info.version,
    'Algorithm:        ' + info.algorithm,
    'Cost Factor:      ' + info.costFactor,
    'Rounds:           ' + info.rounds.toLocaleString() + ' (2^' + info.costFactor + ')',
    'Key Length:       ' + info.keyLength + ' bits (internal)',
    '',
    '=== Salt ===',
    'Base64 (bcrypt):  ' + info.saltBase64,
    'Hex:              ' + info.saltHex,
    'Bytes:            ' + (info.saltHex.length / 2),
    '',
    '=== Hash ===',
    'Base64 (bcrypt):  ' + info.hashBase64,
    'Hex:              ' + info.hashHex,
    'Bytes:            ' + (info.hashHex.length / 2),
    '',
    '=== Security ===',
    'Cost factor ' + info.costFactor + ' means ' + info.rounds.toLocaleString() + ' iterations.',
    'Recommended minimum cost factor: 10 (1,024 rounds).',
    info.costFactor < 10
      ? 'WARNING: Cost factor is below the recommended minimum of 10!'
      : 'Cost factor is at or above the recommended minimum.',
  ];

  return lines.join('\n');
}
