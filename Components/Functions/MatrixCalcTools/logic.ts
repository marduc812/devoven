export type MatrixOp = 'add' | 'subtract' | 'multiply' | 'transposeA' | 'determinantA' | 'inverseA';

export function parseMatrix(input: string): number[][] {
  const rows = input.trim().split('\n').filter(r => r.trim() !== '').map(row =>
    row.trim().split(/\s+/).map(n => {
      const v = parseFloat(n);
      if (isNaN(v)) throw new Error('Not a number: "' + n + '"');
      return v;
    })
  );
  if (rows.length === 0) throw new Error('Empty matrix');
  const cols = rows[0].length;
  if (rows.some(r => r.length !== cols)) throw new Error('All rows must have equal length');
  return rows;
}

export function formatMatrix(m: number[][]): string {
  const colWidths: number[] = [];
  const strs = m.map(row => row.map(v => {
    const s = parseFloat(v.toFixed(6)).toString();
    return s;
  }));
  for (let j = 0; j < strs[0].length; j++) {
    colWidths[j] = Math.max(...strs.map(row => row[j].length));
  }
  return strs.map(row =>
    '[ ' + row.map((s, j) => s.padStart(colWidths[j])).join('  ') + ' ]'
  ).join('\n');
}

export function matrixAdd(a: number[][], b: number[][]): number[][] {
  if (a.length !== b.length || a[0].length !== b[0].length)
    throw new Error('Matrix dimensions must match for addition');
  return a.map((row, i) => row.map((v, j) => v + b[i][j]));
}

export function matrixSubtract(a: number[][], b: number[][]): number[][] {
  if (a.length !== b.length || a[0].length !== b[0].length)
    throw new Error('Matrix dimensions must match for subtraction');
  return a.map((row, i) => row.map((v, j) => v - b[i][j]));
}

export function matrixMultiply(a: number[][], b: number[][]): number[][] {
  if (a[0].length !== b.length)
    throw new Error('Columns of A (' + a[0].length + ') must equal rows of B (' + b.length + ')');
  const m = a.length, k = a[0].length, n = b[0].length;
  const result: number[][] = [];
  for (let i = 0; i < m; i++) {
    result[i] = [];
    for (let j = 0; j < n; j++) {
      let sum = 0;
      for (let p = 0; p < k; p++) sum += a[i][p] * b[p][j];
      result[i][j] = sum;
    }
  }
  return result;
}

export function matrixTranspose(m: number[][]): number[][] {
  return m[0].map((_, j) => m.map(row => row[j]));
}

export function matrixDeterminant(m: number[][]): number {
  const n = m.length;
  if (m.some(r => r.length !== n)) throw new Error('Determinant requires a square matrix');
  if (n === 1) return m[0][0];
  if (n === 2) return m[0][0] * m[1][1] - m[0][1] * m[1][0];
  let det = 0;
  for (let j = 0; j < n; j++) {
    const minor = m.slice(1).map(row => row.filter((_, c) => c !== j));
    det += (j % 2 === 0 ? 1 : -1) * m[0][j] * matrixDeterminant(minor);
  }
  return det;
}

export function matrixInverse(m: number[][]): number[][] {
  const n = m.length;
  if (m.some(r => r.length !== n)) throw new Error('Inverse requires a square matrix');
  const det = matrixDeterminant(m);
  if (Math.abs(det) < 1e-10) throw new Error('Matrix is singular (determinant ≈ 0), no inverse exists');

  // Build augmented matrix [m | I]
  const aug: number[][] = m.map((row, i) => {
    const id = Array(n).fill(0) as number[];
    id[i] = 1;
    return row.map(v => v).concat(id);
  });

  // Gauss-Jordan elimination
  for (let col = 0; col < n; col++) {
    // Find pivot
    let pivotRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(aug[row][col]) > Math.abs(aug[pivotRow][col])) pivotRow = row;
    }
    const tmp = aug[col]; aug[col] = aug[pivotRow]; aug[pivotRow] = tmp;
    const pivot = aug[col][col];
    if (Math.abs(pivot) < 1e-12) throw new Error('Matrix is singular, no inverse exists');
    for (let j = 0; j < 2 * n; j++) aug[col][j] /= pivot;
    for (let row = 0; row < n; row++) {
      if (row === col) continue;
      const factor = aug[row][col];
      for (let j = 0; j < 2 * n; j++) aug[row][j] -= factor * aug[col][j];
    }
  }

  return aug.map(row => row.slice(n));
}

export function processMatrixOp(inputA: string, inputB: string, op: MatrixOp): string {
  if (!inputA.trim()) return '';
  const A = parseMatrix(inputA);

  if (op === 'transposeA') {
    const T = matrixTranspose(A);
    return 'Transpose of A:\n' + formatMatrix(T);
  }
  if (op === 'determinantA') {
    const d = matrixDeterminant(A);
    return 'Determinant of A: ' + parseFloat(d.toFixed(8)).toString();
  }
  if (op === 'inverseA') {
    const inv = matrixInverse(A);
    return 'Inverse of A:\n' + formatMatrix(inv);
  }

  if (!inputB.trim()) return 'Matrix B is required for this operation';
  const B = parseMatrix(inputB);
  let result: number[][];
  let label = '';

  if (op === 'add') {
    result = matrixAdd(A, B);
    label = 'A + B';
  } else if (op === 'subtract') {
    result = matrixSubtract(A, B);
    label = 'A - B';
  } else {
    result = matrixMultiply(A, B);
    label = 'A × B';
  }

  const aRows = A.length, aCols = A[0].length;
  const bRows = B.length, bCols = B[0].length;

  return [
    'A: ' + aRows + '×' + aCols + '   B: ' + bRows + '×' + bCols,
    '',
    label + ':',
    formatMatrix(result),
  ].join('\n');
}
