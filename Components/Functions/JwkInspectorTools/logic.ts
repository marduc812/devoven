export type JwkKeyInfo = {
  keyType: string;
  algorithm: string;
  use: string;
  keyId: string;
  keyOps: string[];
  curve: string;
  modulusBits: number;
  octKeyBits: number;
  raw: Record<string, unknown>;
  warnings: string[];
};

function base64urlByteLength(b64: string): number {
  // Each base64 character encodes 6 bits; 4 chars = 3 bytes
  const padded = b64.replace(/-/g, '+').replace(/_/g, '/');
  const len = padded.length;
  let padding = 0;
  if (padded.endsWith('==')) padding = 2;
  else if (padded.endsWith('=')) padding = 1;
  return Math.floor((len * 3) / 4) - padding;
}

function inspectSingleKey(jwk: Record<string, unknown>): JwkKeyInfo {
  const warnings: string[] = [];
  const kty = typeof jwk['kty'] === 'string' ? jwk['kty'] : 'Unknown';
  const alg = typeof jwk['alg'] === 'string' ? jwk['alg'] : '';
  const use = typeof jwk['use'] === 'string' ? jwk['use'] : '';
  const kid = typeof jwk['kid'] === 'string' ? jwk['kid'] : '';
  const keyOpsRaw = jwk['key_ops'];
  const keyOps = Array.isArray(keyOpsRaw) ? keyOpsRaw.map(String) : [];

  let curve = '';
  let modulusBits = 0;
  let octKeyBits = 0;

  if (kty === 'RSA') {
    const n = typeof jwk['n'] === 'string' ? jwk['n'] : '';
    if (n) {
      modulusBits = base64urlByteLength(n) * 8;
    }
    if (!jwk['e']) warnings.push('Missing public exponent (e)');
    if (!n) warnings.push('Missing modulus (n)');
  } else if (kty === 'EC') {
    curve = typeof jwk['crv'] === 'string' ? jwk['crv'] : '';
    if (!curve) warnings.push('Missing curve (crv)');
    if (!jwk['x'] || !jwk['y']) warnings.push('Missing public key coordinates (x, y)');
  } else if (kty === 'oct') {
    const k = typeof jwk['k'] === 'string' ? jwk['k'] : '';
    if (k) {
      octKeyBits = base64urlByteLength(k) * 8;
    } else {
      warnings.push('Missing key value (k)');
    }
  } else if (kty !== 'OKP') {
    warnings.push('Unknown key type: ' + kty);
  }

  if (!use && keyOps.length === 0) {
    warnings.push('No "use" or "key_ops" specified — key purpose is ambiguous');
  }

  return {
    keyType: kty,
    algorithm: alg,
    use,
    keyId: kid,
    keyOps,
    curve,
    modulusBits,
    octKeyBits,
    raw: jwk,
    warnings,
  };
}

export type JwkInspectResult = {
  isJwks: boolean;
  keys: JwkKeyInfo[];
  error: string;
};

export function inspectJwk(input: string): JwkInspectResult {
  const trimmed = input.trim();
  if (!trimmed) return { isJwks: false, keys: [], error: 'Empty input' };

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return { isJwks: false, keys: [], error: 'Invalid JSON' };
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return { isJwks: false, keys: [], error: 'Input must be a JSON object' };
  }

  const obj = parsed as Record<string, unknown>;

  // JWKS: has "keys" array
  if (Array.isArray(obj['keys'])) {
    const keysArr = obj['keys'] as unknown[];
    const keys: JwkKeyInfo[] = [];
    for (const k of keysArr) {
      if (typeof k === 'object' && k !== null) {
        keys.push(inspectSingleKey(k as Record<string, unknown>));
      }
    }
    return { isJwks: true, keys, error: '' };
  }

  // Single JWK
  if (typeof obj['kty'] === 'string') {
    return { isJwks: false, keys: [inspectSingleKey(obj)], error: '' };
  }

  return { isJwks: false, keys: [], error: 'Not a valid JWK or JWKS — missing "kty" or "keys" field' };
}

export function describeKeyUse(use: string): string {
  if (use === 'sig') return 'Signature verification';
  if (use === 'enc') return 'Encryption / key wrapping';
  return use || 'Not specified';
}

export function describeAlgorithm(alg: string): string {
  const ALG_MAP: Record<string, string> = {
    RS256: 'RSASSA-PKCS1-v1_5 with SHA-256',
    RS384: 'RSASSA-PKCS1-v1_5 with SHA-384',
    RS512: 'RSASSA-PKCS1-v1_5 with SHA-512',
    PS256: 'RSASSA-PSS with SHA-256 and MGF1-SHA-256',
    PS384: 'RSASSA-PSS with SHA-384 and MGF1-SHA-384',
    PS512: 'RSASSA-PSS with SHA-512 and MGF1-SHA-512',
    ES256: 'ECDSA with P-256 and SHA-256',
    ES384: 'ECDSA with P-384 and SHA-384',
    ES512: 'ECDSA with P-521 and SHA-512',
    EdDSA: 'Edwards-curve DSA (Ed25519 or Ed448)',
    HS256: 'HMAC with SHA-256',
    HS384: 'HMAC with SHA-384',
    HS512: 'HMAC with SHA-512',
    RSA_OAEP: 'RSA-OAEP encryption',
    'RSA-OAEP-256': 'RSA-OAEP with SHA-256',
    A128KW: 'AES-128 Key Wrap',
    A192KW: 'AES-192 Key Wrap',
    A256KW: 'AES-256 Key Wrap',
    A128GCM: 'AES-128 in GCM mode',
    A192GCM: 'AES-192 in GCM mode',
    A256GCM: 'AES-256 in GCM mode',
  };
  return ALG_MAP[alg] || alg || 'Not specified';
}
