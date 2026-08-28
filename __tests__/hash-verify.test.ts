import {
  normalizeHash,
  compareHashes,
  detectHashAlgorithm,
  formatCompareResult,
} from '../Components/Functions/HashVerifyTools/logic';

// ─── normalizeHash ────────────────────────────────────────────────────────────

describe('normalizeHash', () => {
  it('lowercases hash', () => {
    expect(normalizeHash('ABCDEF')).toBe('abcdef');
  });
  it('trims whitespace', () => {
    expect(normalizeHash('  abc  ')).toBe('abc');
  });
  it('removes internal whitespace', () => {
    expect(normalizeHash('ab cd ef')).toBe('abcdef');
  });
  it('handles already-normalized hash', () => {
    expect(normalizeHash('abc123')).toBe('abc123');
  });
});

// ─── compareHashes ────────────────────────────────────────────────────────────

describe('compareHashes', () => {
  it('matches identical hashes', () => {
    const result = compareHashes('abc123', 'abc123');
    expect(result.match).toBe(true);
  });
  it('matches despite case difference', () => {
    const result = compareHashes('ABC123', 'abc123');
    expect(result.match).toBe(true);
  });
  it('matches despite leading/trailing whitespace', () => {
    const result = compareHashes('  abc123  ', 'abc123');
    expect(result.match).toBe(true);
  });
  it('detects mismatch', () => {
    const result = compareHashes('abc123', 'def456');
    expect(result.match).toBe(false);
  });
  it('preserves original hashes', () => {
    const result = compareHashes('ABC123', 'abc123');
    expect(result.inputHash).toBe('ABC123');
    expect(result.expectedHash).toBe('abc123');
  });
  it('includes normalized hashes', () => {
    const result = compareHashes('ABC 123', 'abc123');
    expect(result.normalized.input).toBe('abc123');
    expect(result.normalized.expected).toBe('abc123');
  });
});

// ─── detectHashAlgorithm ──────────────────────────────────────────────────────

describe('detectHashAlgorithm', () => {
  it('detects MD5 (32 chars)', () => {
    expect(detectHashAlgorithm('d'.repeat(32))).toBe('MD5');
  });
  it('detects SHA-1 (40 chars)', () => {
    expect(detectHashAlgorithm('a'.repeat(40))).toBe('SHA-1');
  });
  it('detects SHA-256 (64 chars)', () => {
    expect(detectHashAlgorithm('b'.repeat(64))).toBe('SHA-256');
  });
  it('detects SHA-384 (96 chars)', () => {
    expect(detectHashAlgorithm('c'.repeat(96))).toBe('SHA-384');
  });
  it('detects SHA-512 (128 chars)', () => {
    expect(detectHashAlgorithm('e'.repeat(128))).toBe('SHA-512');
  });
  it('returns unknown for unrecognized length', () => {
    expect(detectHashAlgorithm('abc')).toContain('Unknown');
    expect(detectHashAlgorithm('abc')).toContain('3 hex chars');
  });
  it('normalizes before checking length', () => {
    expect(detectHashAlgorithm('  ' + 'd'.repeat(32) + '  ')).toBe('MD5');
  });
});

// ─── formatCompareResult ──────────────────────────────────────────────────────

describe('formatCompareResult', () => {
  it('shows match indicator for matching hashes', () => {
    const result = compareHashes('a'.repeat(32), 'a'.repeat(32));
    const formatted = formatCompareResult(result);
    expect(formatted).toContain('✓ Hashes match!');
    expect(formatted).toContain('MD5');
  });
  it('shows mismatch indicator for different hashes', () => {
    const result = compareHashes('a'.repeat(32), 'b'.repeat(32));
    const formatted = formatCompareResult(result);
    expect(formatted).toContain('✗ Hashes do NOT match');
  });
  it('shows length difference message when lengths differ', () => {
    const result = compareHashes('a'.repeat(32), 'b'.repeat(40));
    const formatted = formatCompareResult(result);
    expect(formatted).toContain('Length differs');
  });
  it('shows same-length message for same-length mismatch', () => {
    const result = compareHashes('a'.repeat(32), 'b'.repeat(32));
    const formatted = formatCompareResult(result);
    expect(formatted).toContain('Same length but different content');
  });
  it('includes algorithm in match output', () => {
    const result = compareHashes('a'.repeat(64), 'a'.repeat(64));
    const formatted = formatCompareResult(result);
    expect(formatted).toContain('SHA-256');
  });
});
