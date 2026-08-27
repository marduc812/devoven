import { parseSshPublicKey, formatSshKeyInfo } from '@/Components/Functions/SshKeyTools/logic';

// A real (truncated for test) ssh-ed25519 public key base64 blob is hard to generate
// without crypto. Instead we generate a synthetic blob that matches the format.

// Helper to create a minimal valid SSH public key blob for testing
function makeBlob(keyType: string, extraParts: string[]): string {
  const allParts = [keyType, ...extraParts];
  const bytes: number[] = [];
  for (const part of allParts) {
    const len = part.length;
    bytes.push((len >>> 24) & 0xff, (len >>> 16) & 0xff, (len >>> 8) & 0xff, len & 0xff);
    for (let i = 0; i < part.length; i++) {
      bytes.push(part.charCodeAt(i));
    }
  }
  // base64 encode
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  let i = 0;
  while (i < bytes.length) {
    const b0 = bytes[i++];
    const b1 = i < bytes.length ? bytes[i++] : 0;
    const b2 = i < bytes.length ? bytes[i++] : 0;
    result += chars[b0 >> 2];
    result += chars[((b0 & 3) << 4) | (b1 >> 4)];
    result += chars[((b1 & 0xf) << 2) | (b2 >> 6)];
    result += chars[b2 & 0x3f];
  }
  // add padding
  const pad = bytes.length % 3;
  if (pad === 1) result = result.slice(0, -2) + '==';
  else if (pad === 2) result = result.slice(0, -1) + '=';
  return result;
}

describe('parseSshPublicKey - ssh-ed25519', () => {
  it('parses a synthetic ed25519 key', () => {
    // ed25519: segments = [key-type, public-key(32 bytes)]
    const pubKey = 'A'.repeat(32); // 32-char placeholder
    const blob = makeBlob('ssh-ed25519', [pubKey]);
    const keyStr = 'ssh-ed25519 ' + blob + ' test@host';
    const info = parseSshPublicKey(keyStr);
    expect(info.keyType).toBe('ssh-ed25519');
    expect(info.bitSize).toBe(256);
    expect(info.comment).toBe('test@host');
  });

  it('parses without comment', () => {
    const pubKey = 'A'.repeat(32);
    const blob = makeBlob('ssh-ed25519', [pubKey]);
    const keyStr = 'ssh-ed25519 ' + blob;
    const info = parseSshPublicKey(keyStr);
    expect(info.comment).toBe('');
  });
});

describe('parseSshPublicKey - ssh-rsa', () => {
  it('parses a synthetic RSA key and estimates bit size', () => {
    // RSA: segments = [key-type, exponent, modulus]
    // A 256-byte modulus = 2048 bits (but leading byte might affect count)
    const exponent = '\x00\x01\x00\x01'; // 65537 as 4 bytes (with leading zero to avoid sign)
    // 256 bytes for modulus, first byte 0x00 then 0xff to mark 2048 bits
    const modBytes = '\x00' + '\xff' + '\x00'.repeat(254);
    const blob = makeBlob('ssh-rsa', [exponent, modBytes]);
    const keyStr = 'ssh-rsa ' + blob + ' user@machine';
    const info = parseSshPublicKey(keyStr);
    expect(info.keyType).toBe('ssh-rsa');
    expect(info.comment).toBe('user@machine');
    expect(info.bitSize).toBeGreaterThan(0);
  });
});

describe('parseSshPublicKey - errors', () => {
  it('throws on empty input', () => {
    expect(() => parseSshPublicKey('')).toThrow();
  });
  it('throws on PEM format', () => {
    expect(() => parseSshPublicKey('-----BEGIN RSA PUBLIC KEY-----')).toThrow('PEM format');
  });
  it('throws on missing blob', () => {
    expect(() => parseSshPublicKey('ssh-rsa')).toThrow();
  });
  it('throws on key type mismatch', () => {
    const blob = makeBlob('ssh-ed25519', ['A'.repeat(32)]);
    expect(() => parseSshPublicKey('ssh-rsa ' + blob)).toThrow('mismatch');
  });
});

describe('formatSshKeyInfo', () => {
  it('includes key type in output', () => {
    const pubKey = 'A'.repeat(32);
    const blob = makeBlob('ssh-ed25519', [pubKey]);
    const info = parseSshPublicKey('ssh-ed25519 ' + blob + ' mycomment');
    const formatted = formatSshKeyInfo(info);
    expect(formatted).toContain('ssh-ed25519');
    expect(formatted).toContain('mycomment');
    expect(formatted).toContain('256 bits');
  });
});
