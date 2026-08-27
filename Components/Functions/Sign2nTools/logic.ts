/* -------------------------------------------------------------------------- */
/*  JWT RSA public-key recovery (the "sign2n" GCD attack)                      */
/*                                                                            */
/*  Given two RS256/384/512 JWTs signed by the same RSA private key, recover  */
/*  the public modulus n — without ever seeing the public key.               */
/*                                                                            */
/*  For an RSA signature s of a message whose EMSA-PKCS1-v1_5 encoding is m,  */
/*  we have s^e ≡ m (mod n), so n divides (s^e − m). With two such pairs:     */
/*      gcd(s1^e − m1, s2^e − m2) = k·n   for some small cofactor k.          */
/*  Stripping small prime factors from the gcd yields n. The signature byte  */
/*  length equals the modulus length, so the PKCS#1 v1.5 padding is fully     */
/*  determined and no key-size guessing is required.                          */
/*                                                                            */
/*  The s^e values are enormous for e=65537 (~16 MB each) and the GCD over   */
/*  them is the expensive step, so the actual big-integer GCD is injected     */
/*  (the Web Worker backs it with GMP-in-WebAssembly). Everything else —      */
/*  hashing, padding, small-factor stripping, validation, key encoding —      */
/*  is pure and runs on native BigInt + WebCrypto.                            */
/* -------------------------------------------------------------------------- */

export type RsaAlg = 'RS256' | 'RS384' | 'RS512';

// SHA variant + DER DigestInfo prefix (RFC 8017 §9.2) per RS* algorithm.
const ALG_DIGEST: Record<RsaAlg, { hash: 'SHA-256' | 'SHA-384' | 'SHA-512'; der: string }> = {
  RS256: { hash: 'SHA-256', der: '3031300d060960864801650304020105000420' },
  RS384: { hash: 'SHA-384', der: '3041300d060960864801650304020205000430' },
  RS512: { hash: 'SHA-512', der: '3051300d060960864801650304020305000440' },
};

// Public exponents tried, cheapest first. e=3 is instant; e=65537 is the slow,
// common case (its s^e is ~16 MB and the GCD takes minutes).
const EXPONENTS = [3, 65537];

export interface RecoveredKey {
  e: number; // recovered public exponent
  bits: number; // key size in bits
  nHex: string; // modulus, hex (no 0x prefix)
  pem: string; // SPKI PEM, with trailing newline
  pemNoNewline: string; // same PEM without the trailing newline (forge variant)
  jwk: string; // pretty-printed RSA public JWK
}

export interface RecoverResult {
  alg: RsaAlg;
  matchedExponent: number | null;
  key: RecoveredKey | null;
}

export class RecoveryError extends Error {}

// gcd(s1^e − m1, s2^e − m2) computed by the host (GMP/WASM). All inputs are
// small (~modulus-sized); the host raises to e internally so the ~16 MB
// intermediates never cross back into JS.
export type GcdOfPowDiff = (s1: bigint, m1: bigint, s2: bigint, m2: bigint, e: number) => bigint;

export type StageName = 'hashing' | 'gcd' | 'building-key';
export type StageReporter = (stage: StageName, exponent?: number) => void;

/* ------------------------------- byte helpers ----------------------------- */

function getSubtle(): SubtleCrypto {
  const c = (globalThis as { crypto?: Crypto }).crypto;
  if (!c || !c.subtle) throw new RecoveryError('WebCrypto is not available in this environment');
  return c.subtle;
}

function base64urlToBytes(s: string): Uint8Array<ArrayBuffer> {
  const clean = s.trim().replace(/-/g, '+').replace(/_/g, '/');
  const padded = clean + '==='.slice((clean.length + 3) % 4);
  if (typeof atob === 'function') {
    const bin = atob(padded);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  return new Uint8Array(Buffer.from(padded, 'base64'));
}

function bytesToBase64url(bytes: Uint8Array): string {
  let b64: string;
  if (typeof btoa === 'function') {
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    b64 = btoa(bin);
  } else {
    b64 = Buffer.from(bytes).toString('base64');
  }
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function hexToBytes(hex: string): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

// The project targets ES2015, where BigInt *literals* (0n, 1n) are a syntax
// error even though the BigInt runtime is available — so use BigInt() instead.
const ZERO = BigInt(0);
const ONE = BigInt(1);

function bytesToBigInt(bytes: Uint8Array): bigint {
  let hex = '';
  for (const b of bytes) hex += b.toString(16).padStart(2, '0');
  return hex === '' ? ZERO : BigInt('0x' + hex);
}

// Big-endian byte representation of a positive BigInt, minimally sized.
function bigIntToBytes(n: bigint): Uint8Array {
  let hex = n.toString(16);
  if (hex.length % 2) hex = '0' + hex;
  return hexToBytes(hex);
}

/* ------------------------------- math helpers ----------------------------- */

function powMod(base: bigint, exp: bigint, mod: bigint): bigint {
  let result = ONE;
  base %= mod;
  while (exp > ZERO) {
    if (exp & ONE) result = (result * base) % mod;
    base = (base * base) % mod;
    exp >>= ONE;
  }
  return result;
}

function bitLength(n: bigint): number {
  return n <= ZERO ? 0 : n.toString(2).length;
}

// Primes up to 1000 — enough to strip the small cofactor k from gcd = k·n.
const SMALL_PRIMES: bigint[] = (() => {
  const limit = 1000;
  const sieve = new Array(limit + 1).fill(true);
  const primes: bigint[] = [];
  for (let i = 2; i <= limit; i++) {
    if (!sieve[i]) continue;
    primes.push(BigInt(i));
    for (let j = i * i; j <= limit; j += i) sieve[j] = false;
  }
  return primes;
})();

/* ------------------------------ core recovery ----------------------------- */

interface ParsedJwt {
  alg: RsaAlg;
  signingInput: Uint8Array<ArrayBuffer>; // ASCII bytes of "header.payload"
  signature: Uint8Array<ArrayBuffer>;
}

function parseRsaJwt(jwt: string, which: string): ParsedJwt {
  const parts = jwt.trim().split('.');
  if (parts.length !== 3 || parts.some(p => p === '')) {
    throw new RecoveryError(`${which} is not a complete JWT (need header.payload.signature)`);
  }
  let header: { alg?: string };
  try {
    header = JSON.parse(new TextDecoder().decode(base64urlToBytes(parts[0])));
  } catch {
    throw new RecoveryError(`${which} has an unreadable header`);
  }
  if (!header.alg || !(header.alg in ALG_DIGEST)) {
    throw new RecoveryError(
      `${which} uses alg "${header.alg ?? '?'}" — only RS256/RS384/RS512 can be recovered`
    );
  }
  const signingInput = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
  return { alg: header.alg as RsaAlg, signingInput, signature: base64urlToBytes(parts[2]) };
}

// EMSA-PKCS1-v1_5 encode the signing input to the integer m (RFC 8017 §9.2).
async function buildEm(p: ParsedJwt, emLen: number): Promise<bigint> {
  const { hash, der } = ALG_DIGEST[p.alg];
  const digest = new Uint8Array(await getSubtle().digest(hash, p.signingInput));
  const digestInfo = new Uint8Array([...hexToBytes(der), ...digest]);
  const psLen = emLen - digestInfo.length - 3;
  if (psLen < 8) throw new RecoveryError('Signature is too short for its hash — corrupt token?');
  const em = new Uint8Array(emLen);
  em[0] = 0x00;
  em[1] = 0x01;
  em.fill(0xff, 2, 2 + psLen);
  em[2 + psLen] = 0x00;
  em.set(digestInfo, 3 + psLen);
  return bytesToBigInt(em);
}

// Strip small prime cofactors from gcd until a validated modulus emerges.
function extractModulus(g: bigint, e: number, s1: bigint, m1: bigint, expectedBits: number): bigint | null {
  const be = BigInt(e);
  const valid = (cand: bigint) =>
    cand > ONE && bitLength(cand) === expectedBits && powMod(s1, be, cand) === m1 % cand;
  if (valid(g)) return g;
  let n = g;
  for (const prime of SMALL_PRIMES) {
    while (n % prime === ZERO) {
      n /= prime;
      if (valid(n)) return n;
    }
  }
  return null;
}

async function buildKey(n: bigint, e: number): Promise<RecoveredKey> {
  const jwkKey: JsonWebKey = {
    kty: 'RSA',
    n: bytesToBase64url(bigIntToBytes(n)),
    e: bytesToBase64url(bigIntToBytes(BigInt(e))),
  };
  // Round-trip through WebCrypto to produce a correct SPKI DER (no hand-rolled ASN.1).
  const cryptoKey = await getSubtle().importKey(
    'jwk',
    jwkKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    true,
    ['verify']
  );
  const spki = new Uint8Array(await getSubtle().exportKey('spki', cryptoKey));
  // Standard base64 (not url-safe) for PEM bodies.
  let b64 = '';
  if (typeof btoa === 'function') {
    let bin = '';
    for (let i = 0; i < spki.length; i++) bin += String.fromCharCode(spki[i]);
    b64 = btoa(bin);
  } else {
    b64 = Buffer.from(spki).toString('base64');
  }
  const pemBody = b64.match(/.{1,64}/g)?.join('\n') ?? b64;
  const pemNoNewline = `-----BEGIN PUBLIC KEY-----\n${pemBody}\n-----END PUBLIC KEY-----`;
  return {
    e,
    bits: bitLength(n),
    nHex: n.toString(16),
    pem: pemNoNewline + '\n',
    pemNoNewline,
    jwk: JSON.stringify(jwkKey, null, 2),
  };
}

/**
 * Recover the RSA public key from two RS-signed JWTs from the same key.
 * `gcd` performs the heavy gcd(s1^e − m1, s2^e − m2) (GMP-backed in the Worker).
 * Throws RecoveryError on bad input; resolves with key: null if none was found.
 */
export async function recoverPublicKey(
  jwt1: string,
  jwt2: string,
  gcd: GcdOfPowDiff,
  onStage?: StageReporter
): Promise<RecoverResult> {
  const a = parseRsaJwt(jwt1, 'JWT #1');
  const b = parseRsaJwt(jwt2, 'JWT #2');
  if (a.signingInput.length === b.signingInput.length && bytesEqual(a.signingInput, b.signingInput)) {
    throw new RecoveryError('Both JWTs are identical — provide two different tokens from the same key');
  }
  if (a.signature.length !== b.signature.length) {
    throw new RecoveryError('The two signatures differ in length — they are not from the same RSA key');
  }
  const emLen = a.signature.length;
  const expectedBits = emLen * 8;
  const s1 = bytesToBigInt(a.signature);
  const s2 = bytesToBigInt(b.signature);

  onStage?.('hashing');
  const m1 = await buildEm(a, emLen);
  const m2 = await buildEm(b, emLen);

  for (const e of EXPONENTS) {
    onStage?.('gcd', e);
    const g = gcd(s1, m1, s2, m2, e);
    const n = extractModulus(g, e, s1, m1, expectedBits);
    if (n) {
      onStage?.('building-key', e);
      const key = await buildKey(n, e);
      return { alg: a.alg, matchedExponent: e, key };
    }
  }
  return { alg: a.alg, matchedExponent: null, key: null };
}

function bytesEqual(x: Uint8Array, y: Uint8Array): boolean {
  if (x.length !== y.length) return false;
  for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return false;
  return true;
}
