import {
  HASH_ALGORITHMS,
  CONCEPT_SECTIONS,
  calculateMerkleDamgardPadding,
} from '@/Components/Functions/HashLengthExtTools/logic';

describe('HASH_ALGORITHMS', () => {
  it('has SHA-256 as vulnerable', () => {
    const sha256 = HASH_ALGORITHMS.find(a => a.name === 'SHA-256');
    expect(sha256).toBeDefined();
    expect(sha256!.vulnerable).toBe(true);
  });

  it('has SHA-3 as not vulnerable', () => {
    const sha3 = HASH_ALGORITHMS.find(a => a.name === 'SHA-3 (Keccak)');
    expect(sha3).toBeDefined();
    expect(sha3!.vulnerable).toBe(false);
  });

  it('has HMAC-SHA256 as not vulnerable', () => {
    const hmac = HASH_ALGORITHMS.find(a => a.name === 'HMAC-SHA256');
    expect(hmac).toBeDefined();
    expect(hmac!.vulnerable).toBe(false);
  });

  it('every algorithm has a blockSize and outputSize', () => {
    for (const a of HASH_ALGORITHMS) {
      expect(a.blockSize).toBeGreaterThan(0);
      expect(a.outputSize).toBeGreaterThan(0);
    }
  });
});

describe('calculateMerkleDamgardPadding', () => {
  it('produces padded total that is multiple of block size', () => {
    const info = calculateMerkleDamgardPadding(16, 32, 64);
    expect(info.paddedLengthBytes % 64).toBe(0);
  });

  it('handles exact block boundary', () => {
    // key=16, msg=48 → total=64, which is exactly one block
    // After adding padding it becomes 2 blocks
    const info = calculateMerkleDamgardPadding(16, 48, 64);
    expect(info.paddedLengthBytes % 64).toBe(0);
    expect(info.paddedLengthBytes).toBeGreaterThan(64);
  });

  it('glue hex contains 80 as first byte', () => {
    const info = calculateMerkleDamgardPadding(16, 32, 64);
    expect(info.glueMessage.startsWith('80')).toBe(true);
  });

  it('minimum padding is 9 bytes (0x80 + 8-byte length)', () => {
    // Any input has at least 1 + 8 = 9 bytes of padding
    const info = calculateMerkleDamgardPadding(1, 1, 64);
    expect(info.paddingBytes).toBeGreaterThanOrEqual(9);
  });

  it('SHA-512 block size (128) produces valid padding', () => {
    const info = calculateMerkleDamgardPadding(32, 100, 128);
    expect(info.paddedLengthBytes % 128).toBe(0);
  });
});

describe('CONCEPT_SECTIONS', () => {
  it('has at least 4 sections', () => {
    expect(CONCEPT_SECTIONS.length).toBeGreaterThanOrEqual(4);
  });

  it('each section has title and content', () => {
    for (const s of CONCEPT_SECTIONS) {
      expect(s.title).toBeTruthy();
      expect(s.content).toBeTruthy();
    }
  });
});
