export interface MagicSquareResult {
  grid: number[][];
  order: number;
  magicConstant: number;
  rowSums: number[];
  colSums: number[];
  diagSum1: number;
  diagSum2: number;
  isValid: boolean;
  method: string;
}

/**
 * Magic constant formula: n(n^2+1)/2
 */
export function magicConstant(n: number): number {
  return (n * (n * n + 1)) / 2;
}

/**
 * Generate an odd-order magic square using the Siamese (De La Loubere) method.
 */
export function generateOddMagicSquare(n: number): number[][] {
  if (n % 2 === 0) throw new Error('Use generateEvenMagicSquare for even orders');
  const grid: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  let r = 0;
  let c = Math.floor(n / 2);
  for (let num = 1; num <= n * n; num++) {
    grid[r][c] = num;
    const nr = ((r - 1) + n) % n;
    const nc = (c + 1) % n;
    if (grid[nr][nc] !== 0) {
      r = (r + 1) % n;
      // c stays the same
    } else {
      r = nr;
      c = nc;
    }
  }
  return grid;
}

/**
 * Generate a doubly-even order (n divisible by 4) magic square.
 * Uses the standard method of filling 1..n^2, then swapping values
 * in certain positions based on a diagonal pattern.
 */
export function generateDoublyEvenMagicSquare(n: number): number[][] {
  const grid: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  // Fill with 1..n^2 row by row
  let num = 1;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      grid[r][c] = num++;
    }
  }
  // Swap values in positions that fall on diagonals of each 4x4 sub-block
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const br = r % 4;
      const bc = c % 4;
      // positions on diagonals of 4x4 block: (0,0),(1,1),(2,2),(3,3) and (0,3),(1,2),(2,1),(3,0)
      if (br === bc || (br + bc) === 3) {
        grid[r][c] = n * n + 1 - grid[r][c];
      }
    }
  }
  return grid;
}

/**
 * Generate a singly-even order magic square (n = 4k+2).
 * Uses the Strachey method.
 */
export function generateSinglyEvenMagicSquare(n: number): number[][] {
  const m = n / 2; // m is odd
  // Generate odd magic square of order m
  const odd = generateOddMagicSquare(m);

  // Four quadrants A, B, C, D based on the odd square
  // A = odd, B = odd + 2*m^2, C = odd + 3*m^2, D = odd + m^2
  // Layout: [A, B; C, D]  (top-left A, top-right B, bottom-left C, bottom-right D)
  const mm = m * m;
  const grid: number[][] = Array.from({ length: n }, () => Array(n).fill(0));

  for (let r = 0; r < m; r++) {
    for (let c = 0; c < m; c++) {
      grid[r][c] = odd[r][c];           // A (top-left)
      grid[r][c + m] = odd[r][c] + 2 * mm;  // B (top-right)
      grid[r + m][c] = odd[r][c] + 3 * mm;  // C (bottom-left)
      grid[r + m][c + m] = odd[r][c] + mm;  // D (bottom-right)
    }
  }

  // Strachey swaps:
  // k = (n-2)/4 columns on the left side are swapped between top and bottom halves
  // except at the pivot row (middle row of top half)
  const k = (n - 2) / 4;
  const midRow = Math.floor(m / 2); // pivot row in top half

  // Swap k left columns (col 0 to k-1), skipping pivot row
  for (let c = 0; c < k; c++) {
    for (let r = 0; r < m; r++) {
      const tmp = grid[r][c];
      grid[r][c] = grid[r + m][c];
      grid[r + m][c] = tmp;
    }
  }

  // Undo the pivot row swap for col 0 (swap it back)
  {
    const tmp = grid[midRow][0];
    grid[midRow][0] = grid[midRow + m][0];
    grid[midRow + m][0] = tmp;
  }
  // Swap pivot row at column k
  {
    const tmp = grid[midRow][k];
    grid[midRow][k] = grid[midRow + m][k];
    grid[midRow + m][k] = tmp;
  }

  // Swap k-1 right columns (cols n-1 down to n-k+1) between top and bottom halves
  for (let c = n - 1; c >= n - k + 1; c--) {
    for (let r = 0; r < m; r++) {
      const tmp = grid[r][c];
      grid[r][c] = grid[r + m][c];
      grid[r + m][c] = tmp;
    }
  }

  return grid;
}

export function generateMagicSquare(n: number): MagicSquareResult {
  if (n < 3 || n > 9) {
    throw new Error('Order must be between 3 and 9');
  }

  let grid: number[][];
  let method: string;

  if (n % 2 === 1) {
    grid = generateOddMagicSquare(n);
    method = 'Siamese (De La Loubere) method';
  } else if (n % 4 === 0) {
    grid = generateDoublyEvenMagicSquare(n);
    method = 'Doubly-even diagonal swap method';
  } else {
    grid = generateSinglyEvenMagicSquare(n);
    method = 'LUX method (singly-even)';
  }

  const mc = magicConstant(n);
  const rowSums = grid.map(row => row.reduce((s, v) => s + v, 0));
  const colSums = Array.from({ length: n }, (_, c) =>
    grid.reduce((s, row) => s + row[c], 0)
  );
  const diagSum1 = grid.reduce((s, row, i) => s + row[i], 0);
  const diagSum2 = grid.reduce((s, row, i) => s + row[n - 1 - i], 0);
  const isValid =
    rowSums.every(s => s === mc) &&
    colSums.every(s => s === mc) &&
    diagSum1 === mc &&
    diagSum2 === mc;

  return { grid, order: n, magicConstant: mc, rowSums, colSums, diagSum1, diagSum2, isValid, method };
}
