import { OPERATION_MAP } from '@/lib/blocks/registry';
import { blake2bHash, blake3Hash } from '@/Components/Functions/BlakeHashTools/logic';
import { md4 } from '@/Components/Functions/Md4Tools/logic';
import { whirlpool } from '@/Components/Functions/WhirlpoolTools/logic';
import { hmacSm3, sm3 } from '@/Components/Functions/Sm3Tools/logic';

/**
 * Run an operation the way the pipeline does: defaults filled in, the input
 * in the first named field of a multi-input block, then overrides.
 */
function run(id: string, input: string, overrides: Record<string, string> = {}): string {
  const op = OPERATION_MAP[id];
  if (!op) throw new Error(`operation "${id}" is not registered`);
  const params = Object.fromEntries(op.params.map((p) => [p.id, p.default]));
  const fields = Object.fromEntries((op.inputs ?? []).map((f) => [f.id, '']));
  const linked = op.inputs?.[0]?.id;
  return op.fn(input, { ...params, ...fields, ...(linked ? { [linked]: input } : {}), ...overrides });
}

const NEW_IDS = [
  'blake2b',
  'blake2s',
  'blake3',
  'md4',
  'whirlpool',
  'sm3',
  'pbkdf2',
  'hkdf',
  'scrypt',
  'argon2',
];

describe('hashing-modern registration', () => {
  it.each(NEW_IDS)('registers %s in the blocks registry', (id) => {
    expect(OPERATION_MAP[id]).toBeDefined();
  });

  it('files every one of them under the hashing category', () => {
    for (const id of NEW_IDS) expect(OPERATION_MAP[id].category).toBe('hashing');
  });

  it('marks none of them terminal', () => {
    for (const id of NEW_IDS) expect(OPERATION_MAP[id].terminal).toBeUndefined();
  });
});

describe('hashing-modern behaviour', () => {
  it('produces the same digests as the tool pages', () => {
    expect(run('md4', 'abc')).toBe(md4('abc'));
    expect(run('whirlpool', 'abc')).toBe(whirlpool('abc'));
    expect(run('sm3', 'abc')).toBe(sm3('abc'));
    expect(run('blake2b', 'abc')).toBe(blake2bHash('abc'));
    expect(run('blake3', 'abc')).toBe(blake3Hash('abc'));
  });

  it('switches SM3 to HMAC when a key is given', () => {
    expect(run('sm3', 'abc', { key: 'k' })).toBe(hmacSm3('abc', 'k'));
  });

  it('honours the BLAKE2b digest size and output params', () => {
    expect(run('blake2b', 'abc', { bits: '256' })).toHaveLength(64);
    const b64 = run('blake2b', 'abc', { bits: '256', output: 'base64' });
    expect(Buffer.from(b64, 'base64').toString('hex')).toBe(run('blake2b', 'abc', { bits: '256' }));
  });

  it('derives a PBKDF2 key with the default parameters', () => {
    // 256 bits by default, so 64 hex characters.
    expect(run('pbkdf2', 'password', { salt: 'salt', iterations: '1000' })).toHaveLength(64);
  });

  it('takes the key size in bits', () => {
    expect(run('pbkdf2', 'password', { salt: 'salt', iterations: '1000', bits: '128' })).toHaveLength(32);
    expect(() => run('pbkdf2', 'password', { salt: 'salt', iterations: '1000', bits: '100' })).toThrow(
      /multiple of 8 bits/,
    );
  });

  it('pads an odd-length hex salt instead of refusing it', () => {
    expect(
      run('pbkdf2', '123', {
        salt: '123',
        saltFormat: 'hex',
        iterations: '6000',
        hash: 'sha256',
        bits: '128',
      }),
    ).toBe('faf0cea6834c1fdd0efa3aa1e9ab8d46');
  });

  it('reads a hex salt when told to', () => {
    const viaHex = run('pbkdf2', 'password', {
      salt: '73616c74',
      saltFormat: 'hex',
      iterations: '1000',
    });
    const viaText = run('pbkdf2', 'password', { salt: 'salt', iterations: '1000' });
    expect(viaHex).toBe(viaText);
  });

  it('derives an HKDF key that changes with the info string', () => {
    expect(run('hkdf', 'secret', { info: 'a' })).not.toBe(run('hkdf', 'secret', { info: 'b' }));
  });

  it('derives a scrypt key at a low cost setting', () => {
    expect(run('scrypt', 'password', { salt: 'salt', logn: '10' })).toHaveLength(64);
  });

  it('returns a PHC string from the Argon2 block by default', () => {
    const result = run('argon2', 'password', { salt: 'somesalt', m: '256', t: '1' });
    expect(result).toMatch(/^\$argon2id\$v=19\$m=256,t=1,p=1\$/);
  });

  it('takes the password and the salt as named fields', () => {
    for (const id of ['pbkdf2', 'hkdf', 'scrypt', 'argon2']) {
      const fields = OPERATION_MAP[id].inputs?.map((f) => f.id);
      expect(fields).toHaveLength(2);
      expect(fields).toContain('salt');
    }
  });

  it('surfaces a readable error for a bad parameter', () => {
    expect(() => run('scrypt', 'password', { salt: 'salt', logn: '99' })).toThrow(
      /between 1 and 24/,
    );
    expect(() => run('argon2', 'password', { salt: 'short' })).toThrow(/at least 8 bytes/);
    expect(() => run('pbkdf2', 'password', { salt: 'x', iterations: 'lots' })).toThrow(
      /Iterations must be a number/,
    );
  });
});
