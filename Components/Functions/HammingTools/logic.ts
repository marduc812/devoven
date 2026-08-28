export function hammingDistance(a: string, b: string): number {
  if (a.length !== b.length) throw new Error('Strings must have equal length');
  let dist = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) dist++;
  }
  return dist;
}

export function hammingDistanceBinary(a: number, b: number): number {
  let xor = (a ^ b) >>> 0;
  let count = 0;
  while (xor) { count += xor & 1; xor >>>= 1; }
  return count;
}

export interface HammingPosition {
  index: number;
  charA: string;
  charB: string;
  same: boolean;
}

export interface HammingResult {
  a: string;
  b: string;
  /** Equal length is required; when false only the length fields are meaningful. */
  equalLength: boolean;
  lengthA: number;
  lengthB: number;
  distance: number;
  /** Matching positions as a fraction of length, 0–1. */
  similarity: number;
  positions: HammingPosition[];
  /** Positions (0-based) where the two strings differ. */
  differingIndexes: number[];
  isBinary: boolean;
  /** Only set when both sides are binary and equal length. */
  xor: string | null;
}

export function compareHamming(a: string, b: string): HammingResult {
  const equalLength = a.length === b.length;
  const isBinary = /^[01]+$/.test(a) && /^[01]+$/.test(b);

  if (!equalLength) {
    return {
      a,
      b,
      equalLength: false,
      lengthA: a.length,
      lengthB: b.length,
      distance: 0,
      similarity: 0,
      positions: [],
      differingIndexes: [],
      isBinary,
      xor: null,
    };
  }

  const positions: HammingPosition[] = a
    .split('')
    .map((charA, index) => ({ index, charA, charB: b[index], same: charA === b[index] }));

  const differingIndexes = positions.filter(p => !p.same).map(p => p.index);
  const distance = differingIndexes.length;

  return {
    a,
    b,
    equalLength: true,
    lengthA: a.length,
    lengthB: b.length,
    distance,
    similarity: a.length === 0 ? 1 : (a.length - distance) / a.length,
    positions,
    differingIndexes,
    isBinary,
    // XOR bit-by-bit rather than via parseInt, which loses precision past 53 bits.
    xor: isBinary ? positions.map(p => (p.same ? '0' : '1')).join('') : null,
  };
}
