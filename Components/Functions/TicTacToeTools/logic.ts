export type Cell = 'X' | 'O' | '.';
export type Board = Cell[];

export interface TicTacToeResult {
  board: Board;
  currentPlayer: 'X' | 'O' | null;
  winner: 'X' | 'O' | null;
  isDraw: boolean;
  isOngoing: boolean;
  bestMove: number | null;
  minimaxScore: number | null;
  winningLine: number[] | null;
  validationError: string | null;
}

const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
  [0, 4, 8], [2, 4, 6],             // diagonals
];

/**
 * Parse a 3x3 board from text. 3 lines of 3 chars each.
 * X, O (or x, o), . for empty.
 */
export function parseBoard(input: string): Board {
  const lines = input.trim().split('\n').filter(l => l.trim().length > 0);
  if (lines.length !== 3) {
    throw new Error(`Expected 3 rows, got ${lines.length}`);
  }
  const board: Board = [];
  for (let r = 0; r < 3; r++) {
    const line = lines[r].replace(/\s/g, '').toUpperCase();
    if (line.length !== 3) {
      throw new Error(`Row ${r + 1} has ${line.length} chars, expected 3`);
    }
    for (let c = 0; c < 3; c++) {
      const ch = line[c];
      if (ch === 'X' || ch === 'O' || ch === '.') {
        board.push(ch as Cell);
      } else {
        throw new Error(`Invalid character '${ch}' at row ${r + 1}, col ${c + 1}. Use X, O, or .`);
      }
    }
  }
  return board;
}

export function checkWinner(board: Board): { winner: 'X' | 'O' | null; line: number[] | null } {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    if (board[a] !== '.' && board[a] === board[b] && board[b] === board[c]) {
      return { winner: board[a] as 'X' | 'O', line };
    }
  }
  return { winner: null, line: null };
}

export function validateBoard(board: Board): string | null {
  const xCount = board.filter(c => c === 'X').length;
  const oCount = board.filter(c => c === 'O').length;

  // X goes first, so X count should equal O count or be 1 more
  if (xCount < oCount || xCount > oCount + 1) {
    return `Invalid board: X appears ${xCount} times, O appears ${oCount} times. X goes first so X count must equal O count or be 1 more.`;
  }

  // Check for two winners
  const { winner: w1 } = checkWinner(board);
  if (w1) {
    const countWinner = xCount === oCount + 1 ? 'X' : 'O';
    if (w1 === 'O' && xCount === oCount + 1) {
      return 'Invalid: O won but it was X\'s turn to move last.';
    }
    if (w1 === 'X' && xCount === oCount) {
      return 'Invalid: X won but it was O\'s turn to move last.';
    }
    // Check if both X and O won simultaneously (impossible)
    // Just check one more time ignoring the first winner
  }

  return null;
}

/**
 * Alpha-beta pruned minimax. The window only cuts branches that cannot change
 * the value returned to the caller, so scores are identical to a plain search —
 * it just avoids the ~550k node walk an empty board would otherwise cost.
 */
function minimax(
  board: Board,
  isMaximizing: boolean,
  depth: number,
  alpha = -Infinity,
  beta = Infinity
): number {
  const { winner } = checkWinner(board);
  if (winner === 'X') return 10 - depth;
  if (winner === 'O') return depth - 10;
  if (board.every(c => c !== '.')) return 0;

  if (isMaximizing) {
    let best = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] === '.') {
        board[i] = 'X';
        best = Math.max(best, minimax(board, false, depth + 1, alpha, beta));
        board[i] = '.';
        alpha = Math.max(alpha, best);
        if (beta <= alpha) break;
      }
    }
    return best;
  } else {
    let best = Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] === '.') {
        board[i] = 'O';
        best = Math.min(best, minimax(board, true, depth + 1, alpha, beta));
        board[i] = '.';
        beta = Math.min(beta, best);
        if (beta <= alpha) break;
      }
    }
    return best;
  }
}

export function findBestMove(board: Board, player: 'X' | 'O'): { move: number; score: number } | null {
  const emptyCount = board.filter(c => c === '.').length;
  if (emptyCount === 0) return null;

  const isMaximizing = player === 'X';
  let bestScore = isMaximizing ? -Infinity : Infinity;
  let bestMove = -1;

  for (let i = 0; i < 9; i++) {
    if (board[i] === '.') {
      board[i] = player;
      const score = minimax(board, !isMaximizing, 1);
      board[i] = '.';
      if (isMaximizing ? score > bestScore : score < bestScore) {
        bestScore = score;
        bestMove = i;
      }
    }
  }

  return bestMove === -1 ? null : { move: bestMove, score: bestScore };
}

/** Outcome of a candidate move, from the perspective of the player making it. */
export type MoveOutcome = 'win' | 'draw' | 'loss';

export interface ScoredMove {
  /** Cell index 0-8. */
  index: number;
  /** Raw minimax score — positive favours X, negative favours O. */
  score: number;
  /** What the move leads to with perfect play by both sides, for the mover. */
  outcome: MoveOutcome;
  /** Plies until the decided result; smaller means a faster win / slower loss. */
  distance: number;
}

/**
 * Score every legal move for `player`, best first. The board is restored before
 * returning, so callers can pass their own array.
 */
export function scoreAllMoves(board: Board, player: 'X' | 'O'): ScoredMove[] {
  const isMaximizing = player === 'X';
  const moves: ScoredMove[] = [];

  for (let i = 0; i < 9; i++) {
    if (board[i] !== '.') continue;
    board[i] = player;
    const score = minimax(board, !isMaximizing, 1);
    board[i] = '.';

    // minimax returns ±(10 - depth), so the magnitude encodes how far off the
    // decided result is. A score of 0 is a draw and has no distance.
    const forMover = isMaximizing ? score : -score;
    moves.push({
      index: i,
      score,
      outcome: forMover > 0 ? 'win' : forMover < 0 ? 'loss' : 'draw',
      distance: score === 0 ? 0 : 10 - Math.abs(score),
    });
  }

  // Best for the mover first. The score magnitude already encodes speed, so this
  // also puts the faster win (and the slower loss) ahead of the slower one.
  moves.sort((a, b) => (isMaximizing ? b.score - a.score : a.score - b.score));
  return moves;
}

/** Render a board back to the three-line text form the parser accepts. */
export function formatBoard(board: Board): string {
  return [board.slice(0, 3), board.slice(3, 6), board.slice(6, 9)]
    .map(row => row.join(''))
    .join('\n');
}

export function analyzeTicTacToe(input: string): TicTacToeResult {
  if (!input.trim()) {
    return {
      board: Array(9).fill('.') as Board,
      currentPlayer: 'X',
      winner: null,
      isDraw: false,
      isOngoing: true,
      bestMove: 4, // center
      minimaxScore: null,
      winningLine: null,
      validationError: null,
    };
  }

  let board: Board;
  try {
    board = parseBoard(input);
  } catch (e) {
    return {
      board: Array(9).fill('.') as Board,
      currentPlayer: null,
      winner: null,
      isDraw: false,
      isOngoing: false,
      bestMove: null,
      minimaxScore: null,
      winningLine: null,
      validationError: (e as Error).message,
    };
  }

  const validationError = validateBoard(board);
  if (validationError) {
    return {
      board,
      currentPlayer: null,
      winner: null,
      isDraw: false,
      isOngoing: false,
      bestMove: null,
      minimaxScore: null,
      winningLine: null,
      validationError,
    };
  }

  const { winner, line: winningLine } = checkWinner(board);
  const xCount = board.filter(c => c === 'X').length;
  const oCount = board.filter(c => c === 'O').length;
  const currentPlayer: 'X' | 'O' = xCount === oCount ? 'X' : 'O';
  const isFull = board.every(c => c !== '.');
  const isDraw = isFull && !winner;
  const isOngoing = !winner && !isDraw;

  let bestMove: number | null = null;
  let minimaxScore: number | null = null;

  if (isOngoing) {
    const boardCopy = [...board] as Board;
    const result = findBestMove(boardCopy, currentPlayer);
    if (result) {
      bestMove = result.move;
      minimaxScore = result.score;
    }
  }

  return {
    board,
    currentPlayer: isOngoing ? currentPlayer : null,
    winner,
    isDraw,
    isOngoing,
    bestMove,
    minimaxScore,
    winningLine,
    validationError: null,
  };
}
