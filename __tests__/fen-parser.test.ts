import { parseFen, pieceListToFen } from '@/Components/Functions/FenParserTools/logic';

const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const AFTER_E4 = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
const CHECK_FEN = 'r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 4'; // Scholar's mate

describe('parseFen', () => {
  it('parses the starting position', () => {
    const r = parseFen(STARTING_FEN);
    expect(r.valid).toBe(true);
    expect(r.error).toBeNull();
    expect(r.activeColor).toBe('w');
    expect(r.castling).toBe('KQkq');
    expect(r.enPassant).toBe('-');
    expect(r.halfmoveClock).toBe(0);
    expect(r.fullmoveNumber).toBe(1);
  });

  it('has correct piece count for starting position', () => {
    const r = parseFen(STARTING_FEN);
    expect(r.pieceCount['P']).toBe(8);
    expect(r.pieceCount['p']).toBe(8);
    expect(r.pieceCount['R']).toBe(2);
    expect(r.pieceCount['r']).toBe(2);
  });

  it('parses after e4', () => {
    const r = parseFen(AFTER_E4);
    expect(r.valid).toBe(true);
    expect(r.activeColor).toBe('b');
    expect(r.enPassant).toBe('e3');
  });

  it('returns error for empty FEN', () => {
    const r = parseFen('');
    expect(r.valid).toBe(false);
    expect(r.error).toBeTruthy();
  });

  it('returns error for wrong number of ranks', () => {
    const r = parseFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP w KQkq - 0 1');
    expect(r.valid).toBe(false);
    expect(r.error).toBeTruthy();
  });

  it('detects check in scholars mate position', () => {
    const r = parseFen(CHECK_FEN);
    expect(r.valid).toBe(true);
    expect(r.inCheck).toBe(true);
  });

  it('computes material correctly for starting position', () => {
    const r = parseFen(STARTING_FEN);
    // White: 8P(8) + 2R(10) + 2N(6) + 2B(6) + 1Q(9) = 39
    expect(r.whiteMaterial).toBe(39);
    expect(r.blackMaterial).toBe(39);
  });
});

describe('pieceListToFen', () => {
  it('returns starting FEN for "start"', () => {
    expect(pieceListToFen('start')).toBe(STARTING_FEN);
  });

  it('places pieces correctly', () => {
    const fen = pieceListToFen('Ke1 ke8');
    const r = parseFen(fen);
    expect(r.valid).toBe(true);
    expect(r.pieceCount['K']).toBe(1);
    expect(r.pieceCount['k']).toBe(1);
  });
});
