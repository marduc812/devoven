import {
  magicConstant,
  generateOddMagicSquare,
  generateDoublyEvenMagicSquare,
  generateSinglyEvenMagicSquare,
  generateMagicSquare,
} from '@/Components/Functions/MagicSquareTools/logic';

function validateSquare(grid: number[][], n: number): boolean {
  const mc = magicConstant(n);
  // rows
  for (let r = 0; r < n; r++) {
    if (grid[r].reduce((s, v) => s + v, 0) !== mc) return false;
  }
  // cols
  for (let c = 0; c < n; c++) {
    if (grid.reduce((s, row) => s + row[c], 0) !== mc) return false;
  }
  // main diag
  if (grid.reduce((s, row, i) => s + row[i], 0) !== mc) return false;
  // anti diag
  if (grid.reduce((s, row, i) => s + row[n - 1 - i], 0) !== mc) return false;
  return true;
}

describe('magicConstant', () => {
  it('n=3 => 15', () => expect(magicConstant(3)).toBe(15));
  it('n=4 => 34', () => expect(magicConstant(4)).toBe(34));
  it('n=5 => 65', () => expect(magicConstant(5)).toBe(65));
  it('n=9 => 369', () => expect(magicConstant(9)).toBe(369));
});

describe('generateOddMagicSquare', () => {
  it('generates a valid 3x3 magic square', () => {
    const g = generateOddMagicSquare(3);
    expect(validateSquare(g, 3)).toBe(true);
  });

  it('generates a valid 5x5 magic square', () => {
    const g = generateOddMagicSquare(5);
    expect(validateSquare(g, 5)).toBe(true);
  });

  it('generates a valid 7x7 magic square', () => {
    const g = generateOddMagicSquare(7);
    expect(validateSquare(g, 7)).toBe(true);
  });

  it('contains all numbers 1 to n^2', () => {
    const n = 5;
    const g = generateOddMagicSquare(n);
    const nums = g.flat().sort((a, b) => a - b);
    expect(nums).toEqual(Array.from({ length: n * n }, (_, i) => i + 1));
  });
});

describe('generateDoublyEvenMagicSquare', () => {
  it('generates a valid 4x4 magic square', () => {
    const g = generateDoublyEvenMagicSquare(4);
    expect(validateSquare(g, 4)).toBe(true);
  });

  it('generates a valid 8x8 magic square', () => {
    const g = generateDoublyEvenMagicSquare(8);
    expect(validateSquare(g, 8)).toBe(true);
  });
});

describe('generateSinglyEvenMagicSquare', () => {
  it('generates a valid 6x6 magic square', () => {
    const g = generateSinglyEvenMagicSquare(6);
    expect(validateSquare(g, 6)).toBe(true);
  });
});

describe('generateMagicSquare', () => {
  for (const n of [3, 4, 5, 6, 7, 8, 9]) {
    it(`generates a valid ${n}x${n} magic square`, () => {
      const result = generateMagicSquare(n);
      expect(result.isValid).toBe(true);
      expect(result.magicConstant).toBe(magicConstant(n));
    });
  }

  it('throws for order below 3', () => {
    expect(() => generateMagicSquare(2)).toThrow();
  });

  it('throws for order above 9', () => {
    expect(() => generateMagicSquare(10)).toThrow();
  });
});
