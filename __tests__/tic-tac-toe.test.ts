import {
  parseBoard,
  checkWinner,
  validateBoard,
  findBestMove,
  analyzeTicTacToe,
  scoreAllMoves,
  formatBoard,
} from '@/Components/Functions/TicTacToeTools/logic';

describe('parseBoard', () => {
  it('parses a valid board', () => {
    const b = parseBoard('XOX\nOXO\n...');
    expect(b.length).toBe(9);
    expect(b[0]).toBe('X');
    expect(b[6]).toBe('.');
  });

  it('throws for wrong number of rows', () => {
    expect(() => parseBoard('XOX\nOXO')).toThrow();
  });

  it('throws for wrong row length', () => {
    expect(() => parseBoard('XO\nOXO\n...')).toThrow();
  });

  it('throws for invalid characters', () => {
    expect(() => parseBoard('XAX\nOXO\n...')).toThrow();
  });

  it('is case-insensitive', () => {
    const b = parseBoard('xox\noxo\n...');
    expect(b[0]).toBe('X');
  });
});

describe('checkWinner', () => {
  it('detects row win for X', () => {
    const b = parseBoard('XXX\nO.O\n...');
    const { winner } = checkWinner(b);
    expect(winner).toBe('X');
  });

  it('detects col win for O', () => {
    const b = parseBoard('OXX\nO..\nO..');
    const { winner } = checkWinner(b);
    expect(winner).toBe('O');
  });

  it('detects diagonal win', () => {
    const b = parseBoard('X..\n.X.\n..X');
    const { winner } = checkWinner(b);
    expect(winner).toBe('X');
  });

  it('returns null winner for no winner', () => {
    const b = parseBoard('XOX\nOXO\nOXO');
    const { winner } = checkWinner(b);
    expect(winner).toBeNull();
  });
});

describe('validateBoard', () => {
  it('accepts a valid board', () => {
    expect(validateBoard(parseBoard('X..\n...\n...'))).toBeNull();
  });

  it('rejects a board with too many O', () => {
    const b = parseBoard('OOO\nO..\n...');
    expect(validateBoard(b)).toBeTruthy();
  });
});

describe('findBestMove', () => {
  it('finds winning move for X', () => {
    // X has two in a row, can win
    const b = parseBoard('XX.\nO.O\n...');
    const result = findBestMove([...b], 'X');
    expect(result).not.toBeNull();
    expect(result!.move).toBe(2); // complete top row
  });

  it('returns null for full board', () => {
    const b = parseBoard('XOX\nOXO\nOXO');
    expect(findBestMove([...b], 'X')).toBeNull();
  });
});

describe('analyzeTicTacToe', () => {
  it('detects X wins', () => {
    const r = analyzeTicTacToe('XXX\nO.O\n...');
    expect(r.winner).toBe('X');
    expect(r.isOngoing).toBe(false);
  });

  it('detects draw', () => {
    // X=5, O=4, full board, no winner: XOX / OXX / OXO
    // Row 0: X O X, Row 1: O X X, Row 2: O X O
    // Rows: XOX=no, OXX=no, OXO=no
    // Cols: XOO=no, OXX=no, XXO=no
    // Diag: X X O=no, X X O=no → draw
    const r = analyzeTicTacToe('XOX\nOXX\nOXO');
    expect(r.isDraw).toBe(true);
  });

  it('detects ongoing game', () => {
    const r = analyzeTicTacToe('X..\n...\n...');
    expect(r.isOngoing).toBe(true);
    expect(r.bestMove).not.toBeNull();
  });

  it('returns validation error for illegal board', () => {
    const r = analyzeTicTacToe('OOO\nO..\n...');
    expect(r.validationError).toBeTruthy();
  });
});

describe('scoreAllMoves', () => {
  it('scores every empty square', () => {
    const b = parseBoard('XX.\nOO.\n...');
    const moves = scoreAllMoves(b, 'X');
    expect(moves.length).toBe(5);
    expect(moves.map(m => m.index).sort()).toEqual([2, 5, 6, 7, 8]);
  });

  it('does not mutate the board it is given', () => {
    const b = parseBoard('X.O\n.X.\n...');
    const before = [...b];
    scoreAllMoves(b, 'O');
    expect(b).toEqual(before);
  });

  it('ranks the immediate win first', () => {
    // X has two in the top row; square 2 completes it.
    const moves = scoreAllMoves(parseBoard('XX.\nOO.\n...'), 'X');
    expect(moves[0].index).toBe(2);
    expect(moves[0].outcome).toBe('win');
  });

  it('marks a losing move as a loss for the mover', () => {
    // X to move: anything but square 2 lets O complete the middle row.
    const moves = scoreAllMoves(parseBoard('XX.\nOO.\n...'), 'X');
    const other = moves.find(m => m.index === 6);
    expect(other?.outcome).toBe('loss');
  });

  it('reports outcomes from O\'s perspective when O moves', () => {
    // O has two in the middle row; square 5 completes it.
    const moves = scoreAllMoves(parseBoard('XX.\nOO.\nX..'), 'O');
    expect(moves[0].index).toBe(5);
    expect(moves[0].outcome).toBe('win');
    expect(moves[0].score).toBeLessThan(0);
  });

  it('calls a drawn position a draw for every move', () => {
    // Perfect play from an empty board is a draw whatever X opens with.
    const moves = scoreAllMoves(parseBoard('...\n...\n...'), 'X');
    expect(moves.length).toBe(9);
    expect(moves.every(m => m.outcome === 'draw')).toBe(true);
  });

  it('returns nothing for a full board', () => {
    expect(scoreAllMoves(parseBoard('XOX\nOXX\nOXO'), 'X')).toEqual([]);
  });
});

describe('formatBoard', () => {
  it('round-trips through parseBoard', () => {
    const text = 'XOX\nO.X\n..O';
    expect(formatBoard(parseBoard(text))).toBe(text);
  });

  it('renders an empty board as three rows of dots', () => {
    expect(formatBoard(Array(9).fill('.'))).toBe('...\n...\n...');
  });
});
