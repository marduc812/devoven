export interface FenParseResult {
  valid: boolean;
  error: string | null;
  fen: string;
  // Piece placement
  board: string[][];       // 8x8 array, empty string = empty square
  // FEN fields
  activeColor: 'w' | 'b' | null;
  castling: string | null;
  enPassant: string | null;
  halfmoveClock: number | null;
  fullmoveNumber: number | null;
  // Analysis
  material: Record<string, number>;
  whiteMaterial: number;
  blackMaterial: number;
  inCheck: boolean;
  checkColor: 'w' | 'b' | null;
  pieceCount: Record<string, number>;
  asciiBoard: string;
}

const PIECE_VALUES: Record<string, number> = {
  P: 1, N: 3, B: 3, R: 5, Q: 9, K: 0,
  p: 1, n: 3, b: 3, r: 5, q: 9, k: 0,
};

const PIECE_UNICODE: Record<string, string> = {
  K: 'K', Q: 'Q', R: 'R', B: 'B', N: 'N', P: 'P',
  k: 'k', q: 'q', r: 'r', b: 'b', n: 'n', p: 'p',
};

/**
 * Parse the piece placement portion of a FEN string.
 * Returns 8x8 board (rank 8 at index 0, rank 1 at index 7).
 */
function parsePlacement(placement: string): string[][] {
  const ranks = placement.split('/');
  if (ranks.length !== 8) {
    throw new Error(`Placement must have 8 ranks separated by /, got ${ranks.length}`);
  }
  const board: string[][] = [];
  for (let r = 0; r < 8; r++) {
    const row: string[] = [];
    for (const ch of ranks[r]) {
      if (ch >= '1' && ch <= '8') {
        const n = parseInt(ch, 10);
        for (let i = 0; i < n; i++) row.push('');
      } else if (/[KQRBNPkqrbnp]/.test(ch)) {
        row.push(ch);
      } else {
        throw new Error(`Invalid character '${ch}' in placement`);
      }
    }
    if (row.length !== 8) {
      throw new Error(`Rank ${8 - r} has ${row.length} squares, expected 8`);
    }
    board.push(row);
  }
  return board;
}

/**
 * Find the position of a piece on the board.
 */
function findPiece(board: string[][], piece: string): [number, number] | null {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] === piece) return [r, c];
    }
  }
  return null;
}

/**
 * Check if a square is attacked by any piece of the given color.
 * Only checks basic attacks (not en passant or castling).
 */
function isSquareAttacked(board: string[][], row: number, col: number, byColor: 'w' | 'b'): boolean {
  const isWhite = byColor === 'w';

  // Check pawn attacks
  const pawn = isWhite ? 'P' : 'p';
  const pawnDir = isWhite ? 1 : -1; // white pawns attack upward (toward lower rank index)
  for (const dc of [-1, 1]) {
    const pr = row + pawnDir;
    const pc = col + dc;
    if (pr >= 0 && pr < 8 && pc >= 0 && pc < 8 && board[pr][pc] === pawn) return true;
  }

  // Check knight attacks
  const knight = isWhite ? 'N' : 'n';
  const knightMoves = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
  for (const [dr, dc] of knightMoves) {
    const nr = row + dr;
    const nc = col + dc;
    if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && board[nr][nc] === knight) return true;
  }

  // Check sliding pieces (rook, bishop, queen)
  const rook = isWhite ? 'R' : 'r';
  const bishop = isWhite ? 'B' : 'b';
  const queen = isWhite ? 'Q' : 'q';

  // Rook/Queen lines
  for (const [dr, dc] of [[0,1],[0,-1],[1,0],[-1,0]]) {
    let nr = row + dr;
    let nc = col + dc;
    while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
      const p = board[nr][nc];
      if (p !== '') {
        if (p === rook || p === queen) return true;
        break;
      }
      nr += dr;
      nc += dc;
    }
  }

  // Bishop/Queen diagonals
  for (const [dr, dc] of [[1,1],[1,-1],[-1,1],[-1,-1]]) {
    let nr = row + dr;
    let nc = col + dc;
    while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
      const p = board[nr][nc];
      if (p !== '') {
        if (p === bishop || p === queen) return true;
        break;
      }
      nr += dr;
      nc += dc;
    }
  }

  // King attacks
  const king = isWhite ? 'K' : 'k';
  for (const [dr, dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) {
    const nr = row + dr;
    const nc = col + dc;
    if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && board[nr][nc] === king) return true;
  }

  return false;
}

function buildAsciiBoard(board: string[][], inCheckKing: string | null): string {
  const lines: string[] = [];
  lines.push('  +---+---+---+---+---+---+---+---+');
  for (let r = 0; r < 8; r++) {
    const rank = 8 - r;
    let row = `${rank} |`;
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      const display = piece ? PIECE_UNICODE[piece] || piece : ' ';
      row += ` ${display} |`;
    }
    lines.push(row);
    lines.push('  +---+---+---+---+---+---+---+---+');
  }
  lines.push('    a   b   c   d   e   f   g   h');
  return lines.join('\n');
}

export function parseFen(fen: string): FenParseResult {
  const trimmed = fen.trim();
  const empty: FenParseResult = {
    valid: false, error: null, fen: trimmed,
    board: [], activeColor: null, castling: null, enPassant: null,
    halfmoveClock: null, fullmoveNumber: null,
    material: {}, whiteMaterial: 0, blackMaterial: 0,
    inCheck: false, checkColor: null, pieceCount: {}, asciiBoard: '',
  };

  if (!trimmed) return { ...empty, error: 'Empty FEN string' };

  const parts = trimmed.split(' ');
  if (parts.length < 1) return { ...empty, error: 'Invalid FEN format' };

  let board: string[][];
  try {
    board = parsePlacement(parts[0]);
  } catch (e) {
    return { ...empty, error: `Placement error: ${(e as Error).message}` };
  }

  const activeColor = (parts[1] === 'w' || parts[1] === 'b') ? parts[1] as 'w' | 'b' : null;
  const castling = parts[2] || null;
  const enPassant = parts[3] || null;
  const halfmoveClock = parts[4] ? parseInt(parts[4], 10) : null;
  const fullmoveNumber = parts[5] ? parseInt(parts[5], 10) : null;

  // Count material
  const material: Record<string, number> = {};
  const pieceCount: Record<string, number> = {};
  let whiteMaterial = 0;
  let blackMaterial = 0;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p) {
        pieceCount[p] = (pieceCount[p] || 0) + 1;
        material[p] = (material[p] || 0) + (PIECE_VALUES[p] || 0);
        if (p === p.toUpperCase()) {
          whiteMaterial += PIECE_VALUES[p] || 0;
        } else {
          blackMaterial += PIECE_VALUES[p] || 0;
        }
      }
    }
  }

  // Check detection
  let inCheck = false;
  let checkColor: 'w' | 'b' | null = null;

  const whiteKingPos = findPiece(board, 'K');
  const blackKingPos = findPiece(board, 'k');

  if (whiteKingPos && isSquareAttacked(board, whiteKingPos[0], whiteKingPos[1], 'b')) {
    inCheck = true;
    checkColor = 'w';
  }
  if (blackKingPos && isSquareAttacked(board, blackKingPos[0], blackKingPos[1], 'w')) {
    inCheck = true;
    checkColor = checkColor ? checkColor : 'b';
  }

  const asciiBoard = buildAsciiBoard(board, inCheck ? (checkColor === 'w' ? 'K' : 'k') : null);

  return {
    valid: true, error: null, fen: trimmed,
    board, activeColor, castling, enPassant, halfmoveClock, fullmoveNumber,
    material, whiteMaterial, blackMaterial, inCheck, checkColor, pieceCount, asciiBoard,
  };
}

/**
 * Convert a simple piece-position format to FEN placement.
 * Input: one piece per line, e.g. "Ke1 Qd1 Ra1 Rh1 ke8 ..."
 * Also handles the starting position keyword.
 */
export function pieceListToFen(pieceList: string): string {
  if (pieceList.trim().toLowerCase() === 'start' || pieceList.trim().toLowerCase() === 'starting') {
    return 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  }

  const board: string[][] = Array.from({ length: 8 }, () => Array(8).fill(''));
  const tokens = pieceList.trim().split(/\s+/);

  for (const token of tokens) {
    if (token.length < 2 || token.length > 3) continue;
    let piece: string;
    let sq: string;
    if (token.length === 3) {
      piece = token[0];
      sq = token.slice(1).toLowerCase();
    } else {
      // Pawn: just the square, assume white if uppercase... use 'P' default
      piece = 'P';
      sq = token.toLowerCase();
    }
    if (!/^[KQRBNPkqrbnp]$/.test(piece)) continue;
    const col = sq.charCodeAt(0) - 97; // a=0
    const rowNum = parseInt(sq[1], 10);
    if (isNaN(rowNum) || col < 0 || col > 7 || rowNum < 1 || rowNum > 8) continue;
    const row = 8 - rowNum;
    board[row][col] = piece;
  }

  // Build FEN placement
  const ranks: string[] = [];
  for (let r = 0; r < 8; r++) {
    let rank = '';
    let empty = 0;
    for (let c = 0; c < 8; c++) {
      if (board[r][c] === '') {
        empty++;
      } else {
        if (empty > 0) { rank += empty; empty = 0; }
        rank += board[r][c];
      }
    }
    if (empty > 0) rank += empty;
    ranks.push(rank);
  }
  return ranks.join('/') + ' w - - 0 1';
}
