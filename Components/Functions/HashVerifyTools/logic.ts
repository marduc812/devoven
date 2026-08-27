export type HashCompareResult = {
  match: boolean;
  inputHash: string;
  expectedHash: string;
  normalized: {
    input: string;
    expected: string;
  };
};

export function normalizeHash(hash: string): string {
  return hash.trim().toLowerCase().replace(/\s+/g, '');
}

export function compareHashes(inputHash: string, expectedHash: string): HashCompareResult {
  const normalInput = normalizeHash(inputHash);
  const normalExpected = normalizeHash(expectedHash);
  return {
    match: normalInput === normalExpected,
    inputHash,
    expectedHash,
    normalized: {
      input: normalInput,
      expected: normalExpected,
    },
  };
}

export function detectHashAlgorithm(hash: string): string {
  const clean = normalizeHash(hash);
  const lengths: Record<number, string> = {
    32: 'MD5',
    40: 'SHA-1',
    56: 'SHA-224',
    64: 'SHA-256',
    96: 'SHA-384',
    128: 'SHA-512',
  };
  return lengths[clean.length] ?? `Unknown (${clean.length} hex chars)`;
}

export function formatCompareResult(result: HashCompareResult): string {
  const algo = detectHashAlgorithm(result.normalized.expected);
  if (result.match) {
    return [
      '✓ Hashes match!',
      '',
      `Algorithm: ${algo}`,
      `Hash: ${result.normalized.expected}`,
    ].join('\n');
  }
  return [
    '✗ Hashes do NOT match',
    '',
    `Algorithm: ${algo}`,
    `Expected:  ${result.normalized.expected}`,
    `Got:       ${result.normalized.input}`,
    '',
    result.normalized.expected.length !== result.normalized.input.length
      ? `Length differs: expected ${result.normalized.expected.length} chars, got ${result.normalized.input.length} chars`
      : 'Same length but different content',
  ].join('\n');
}
