export interface SudokuResult {
  grid: number[][];
  conflicts: boolean[][];
  status: 'solved' | 'in-progress' | 'invalid';
  message: string;
  conflictDetails: string[];
}

/**
 * Parse a 9x9 sudoku grid from text.
 * Accepts 9 lines of 9 chars each. '0' or '.' means empty.
 */
export function parseGrid(input: string): number[][] {
  const lines = input.trim().split('\n').filter(l => l.trim().length > 0);
  if (lines.length !== 9) {
    throw new Error(`Expected 9 rows, got ${lines.length}`);
  }
  const grid: number[][] = [];
  for (let r = 0; r < 9; r++) {
    const line = lines[r].replace(/\s/g, '');
    if (line.length !== 9) {
      throw new Error(`Row ${r + 1} has ${line.length} chars, expected 9`);
    }
    const row: number[] = [];
    for (let c = 0; c < 9; c++) {
      const ch = line[c];
      if (ch === '.' || ch === '0') {
        row.push(0);
      } else if (ch >= '1' && ch <= '9') {
        row.push(parseInt(ch, 10));
      } else {
        throw new Error(`Invalid character '${ch}' at row ${r + 1}, col ${c + 1}`);
      }
    }
    grid.push(row);
  }
  return grid;
}

/**
 * Find all conflicting cells in the grid.
 * Returns a 9x9 boolean array where true means conflict.
 */
export function findConflicts(grid: number[][]): boolean[][] {
  const conflicts: boolean[][] = Array.from({ length: 9 }, () => Array(9).fill(false));

  // Check rows
  for (let r = 0; r < 9; r++) {
    const seen: Record<number, number[]> = {};
    for (let c = 0; c < 9; c++) {
      const v = grid[r][c];
      if (v === 0) continue;
      if (!seen[v]) seen[v] = [];
      seen[v].push(c);
    }
    for (const cols of Object.values(seen)) {
      if (cols.length > 1) {
        for (const c of cols) conflicts[r][c] = true;
      }
    }
  }

  // Check columns
  for (let c = 0; c < 9; c++) {
    const seen: Record<number, number[]> = {};
    for (let r = 0; r < 9; r++) {
      const v = grid[r][c];
      if (v === 0) continue;
      if (!seen[v]) seen[v] = [];
      seen[v].push(r);
    }
    for (const rows of Object.values(seen)) {
      if (rows.length > 1) {
        for (const r of rows) conflicts[r][c] = true;
      }
    }
  }

  // Check 3x3 boxes
  for (let br = 0; br < 3; br++) {
    for (let bc = 0; bc < 3; bc++) {
      const seen: Record<number, Array<[number, number]>> = {};
      for (let dr = 0; dr < 3; dr++) {
        for (let dc = 0; dc < 3; dc++) {
          const r = br * 3 + dr;
          const c = bc * 3 + dc;
          const v = grid[r][c];
          if (v === 0) continue;
          if (!seen[v]) seen[v] = [];
          seen[v].push([r, c]);
        }
      }
      for (const cells of Object.values(seen)) {
        if (cells.length > 1) {
          for (const [r, c] of cells) conflicts[r][c] = true;
        }
      }
    }
  }

  return conflicts;
}

export function validateSudoku(input: string): SudokuResult {
  if (!input.trim()) {
    return {
      grid: Array.from({ length: 9 }, () => Array(9).fill(0)),
      conflicts: Array.from({ length: 9 }, () => Array(9).fill(false)),
      status: 'in-progress',
      message: 'Enter a Sudoku grid to validate.',
      conflictDetails: [],
    };
  }

  let grid: number[][];
  try {
    grid = parseGrid(input);
  } catch (e) {
    return {
      grid: Array.from({ length: 9 }, () => Array(9).fill(0)),
      conflicts: Array.from({ length: 9 }, () => Array(9).fill(false)),
      status: 'invalid',
      message: `Parse error: ${(e as Error).message}`,
      conflictDetails: [],
    };
  }

  const conflicts = findConflicts(grid);
  const hasConflicts = conflicts.some(row => row.some(v => v));
  const isEmpty = grid.every(row => row.every(v => v === 0));
  const isFull = grid.every(row => row.every(v => v !== 0));

  const conflictDetails: string[] = [];
  if (hasConflicts) {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (conflicts[r][c]) {
          conflictDetails.push(`R${r + 1}C${c + 1}=${grid[r][c]}`);
        }
      }
    }
  }

  let status: 'solved' | 'in-progress' | 'invalid';
  let message: string;

  if (hasConflicts) {
    status = 'invalid';
    message = `Invalid: ${conflictDetails.length} conflicting cell(s) found.`;
  } else if (isFull) {
    status = 'solved';
    message = 'Solved! The puzzle is complete and valid.';
  } else if (isEmpty) {
    status = 'in-progress';
    message = 'Grid is empty. Enter digits 1-9 (use 0 or . for empty cells).';
  } else {
    status = 'in-progress';
    message = 'Valid so far (in-progress). No conflicts detected yet.';
  }

  return { grid, conflicts, status, message, conflictDetails };
}

/**
 * Serialise a grid back to the 9-lines-of-9-digits form parseGrid accepts, so
 * edits made in the grid UI round-trip through the text input.
 */
export function formatGrid(grid: number[][]): string {
  return grid.map(row => row.map(v => (v === 0 ? '.' : String(v))).join('')).join('\n');
}

/** Which digits 1–9 are still missing, and how many of each. */
export function remainingDigits(grid: number[][]): Record<number, number> {
  const remaining: Record<number, number> = {};
  for (let d = 1; d <= 9; d++) remaining[d] = 9;
  for (const row of grid) {
    for (const v of row) {
      if (v >= 1 && v <= 9) remaining[v]--;
    }
  }
  return remaining;
}
