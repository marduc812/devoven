import { parseGrid, findConflicts, validateSudoku, formatGrid, remainingDigits } from '@/Components/Functions/SudokuTools/logic';

const SOLVED_GRID = [
  '534678912',
  '672195348',
  '198342567',
  '859761423',
  '426853791',
  '713924856',
  '961537284',
  '287419635',
  '345286179',
].join('\n');

describe('formatGrid', () => {
  it('round-trips through parseGrid', () => {
    expect(formatGrid(parseGrid(SOLVED_GRID))).toBe(SOLVED_GRID);
  });

  it('writes empty cells as a dot', () => {
    const grid = Array.from({ length: 9 }, () => Array(9).fill(0));
    expect(formatGrid(grid).split('\n')[0]).toBe('.........');
  });

  it('produces 9 lines of 9 characters', () => {
    const lines = formatGrid(parseGrid(SOLVED_GRID)).split('\n');
    expect(lines).toHaveLength(9);
    for (const line of lines) expect(line).toHaveLength(9);
  });

  it('output is still parseable after an edit', () => {
    const grid = parseGrid(SOLVED_GRID);
    grid[0][0] = 0;
    expect(parseGrid(formatGrid(grid))[0][0]).toBe(0);
  });
});

describe('remainingDigits', () => {
  it('reports nothing left for a solved grid', () => {
    const remaining = remainingDigits(parseGrid(SOLVED_GRID));
    for (let d = 1; d <= 9; d++) expect(remaining[d]).toBe(0);
  });

  it('reports 9 of each for an empty grid', () => {
    const remaining = remainingDigits(Array.from({ length: 9 }, () => Array(9).fill(0)));
    for (let d = 1; d <= 9; d++) expect(remaining[d]).toBe(9);
  });

  it('goes negative when a digit is over-placed', () => {
    const grid = Array.from({ length: 9 }, () => Array(9).fill(1));
    expect(remainingDigits(grid)[1]).toBe(9 - 81);
  });
});

const VALID_SOLVED = [
  '534678912',
  '672195348',
  '198342567',
  '859761423',
  '426853791',
  '713924856',
  '961537284',
  '287419635',
  '345286179',
].join('\n');

const VALID_PARTIAL = [
  '53.678912',
  '672195348',
  '198342567',
  '859761423',
  '426853791',
  '713924856',
  '961537284',
  '287419635',
  '345286179',
].join('\n');

const CONFLICT_GRID = [
  '553678912',
  '672195348',
  '198342567',
  '859761423',
  '426853791',
  '713924856',
  '961537284',
  '287419635',
  '345286179',
].join('\n');

describe('parseGrid', () => {
  it('parses a valid solved grid', () => {
    const grid = parseGrid(VALID_SOLVED);
    expect(grid.length).toBe(9);
    expect(grid[0][0]).toBe(5);
  });

  it('accepts dots as empty', () => {
    const grid = parseGrid(VALID_PARTIAL);
    expect(grid[0][2]).toBe(0);
  });

  it('throws for wrong number of rows', () => {
    expect(() => parseGrid('123456789')).toThrow();
  });

  it('throws for wrong row length', () => {
    const bad = '1234\n' + '123456789\n'.repeat(8);
    expect(() => parseGrid(bad)).toThrow();
  });

  it('throws for invalid characters', () => {
    const bad = '12345678X\n' + '123456789\n'.repeat(8);
    expect(() => parseGrid(bad)).toThrow();
  });
});

describe('findConflicts', () => {
  it('finds no conflicts in a valid solved grid', () => {
    const grid = parseGrid(VALID_SOLVED);
    const conflicts = findConflicts(grid);
    expect(conflicts.flat().every(v => !v)).toBe(true);
  });

  it('finds conflicts in a grid with duplicate row values', () => {
    const grid = parseGrid(CONFLICT_GRID);
    const conflicts = findConflicts(grid);
    expect(conflicts.flat().some(v => v)).toBe(true);
  });
});

describe('validateSudoku', () => {
  it('returns solved for a complete valid grid', () => {
    const result = validateSudoku(VALID_SOLVED);
    expect(result.status).toBe('solved');
  });

  it('returns in-progress for a partial valid grid', () => {
    const result = validateSudoku(VALID_PARTIAL);
    expect(result.status).toBe('in-progress');
  });

  it('returns invalid for a grid with conflicts', () => {
    const result = validateSudoku(CONFLICT_GRID);
    expect(result.status).toBe('invalid');
    expect(result.conflictDetails.length).toBeGreaterThan(0);
  });

  it('returns in-progress for empty input', () => {
    const result = validateSudoku('');
    expect(result.status).toBe('in-progress');
  });
});
