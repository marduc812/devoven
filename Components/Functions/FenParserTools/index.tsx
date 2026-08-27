'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import {
  CopyButton,
  ErrorNote,
  Meter,
  PresetRow,
  SectionTitle,
  StatTile,
  StatusBadge,
  inputClass,
} from '@/Components/MainView/MainPanel/ResultUI';
import { parseFen, type FenParseResult } from './logic';

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const PRESETS = [
  { label: 'Start', value: START_FEN },
  { label: 'Sicilian', value: 'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq c6 0 2' },
  { label: 'Scholar’s mate', value: 'r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 4' },
  { label: 'Endgame', value: '8/5k2/8/8/3K4/8/6Q1/8 w - - 0 1' },
];

/** Outline glyphs for White, solid for Black — the usual print convention. */
const GLYPH: Record<string, string> = {
  K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙',
  k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟',
};

const PIECE_NAME: Record<string, string> = {
  k: 'King', q: 'Queen', r: 'Rook', b: 'Bishop', n: 'Knight', p: 'Pawn',
};

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

/** "e3" → [row, col] in board coordinates (row 0 is rank 8). */
function squareToIndex(square: string | null): [number, number] | null {
  if (!square || square === '-' || square.length < 2) return null;
  const col = square.toLowerCase().charCodeAt(0) - 97;
  const rank = parseInt(square[1], 10);
  if (col < 0 || col > 7 || isNaN(rank) || rank < 1 || rank > 8) return null;
  return [8 - rank, col];
}

const Board = ({
  result,
  flipped,
}: {
  result: FenParseResult;
  flipped: boolean;
}) => {
  const epSquare = squareToIndex(result.enPassant);
  const checkedKing = result.inCheck ? (result.checkColor === 'w' ? 'K' : 'k') : null;

  const rows = flipped ? [...result.board].reverse() : result.board;
  const rankLabels = flipped ? [1, 2, 3, 4, 5, 6, 7, 8] : [8, 7, 6, 5, 4, 3, 2, 1];
  const fileLabels = flipped ? [...FILES].reverse() : FILES;

  return (
    <div className="inline-flex flex-col">
      <div className="flex">
        {/* Rank labels */}
        <div className="flex flex-col justify-around pr-1">
          {rankLabels.map(r => (
            <div
              key={r}
              className="h-9 sm:h-11 flex items-center font-mono text-[10px] text-gray-400"
            >
              {r}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-8 border border-gray-900">
          {rows.map((row, r) => {
            const cells = flipped ? [...row].reverse() : row;
            return cells.map((piece, c) => {
              // Original board coordinates, so highlights survive a flip.
              const origR = flipped ? 7 - r : r;
              const origC = flipped ? 7 - c : c;
              const isDark = (origR + origC) % 2 === 1;
              const isEnPassant = epSquare && epSquare[0] === origR && epSquare[1] === origC;
              const isChecked = checkedKing !== null && piece === checkedKing;
              const square = `${FILES[origC]}${8 - origR}`;

              return (
                <div
                  key={`${origR}-${origC}`}
                  title={piece ? `${square} — ${piece === piece.toUpperCase() ? 'White' : 'Black'} ${PIECE_NAME[piece.toLowerCase()]}` : square}
                  className={`w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center text-2xl sm:text-3xl leading-none select-none ${
                    isChecked
                      ? 'bg-rose-200'
                      : isEnPassant
                        ? 'bg-amber-100'
                        : isDark
                          ? 'bg-gray-300'
                          : 'bg-gray-50'
                  }`}
                >
                  <span className="text-gray-900">{piece ? GLYPH[piece] : ''}</span>
                </div>
              );
            });
          })}
        </div>
      </div>

      {/* File labels */}
      <div className="flex pl-[calc(0.25rem+1ch)]">
        {fileLabels.map(f => (
          <div
            key={f}
            className="w-9 sm:w-11 text-center font-mono text-[10px] text-gray-400 pt-1"
          >
            {f}
          </div>
        ))}
      </div>
    </div>
  );
};

const CastlingRights = ({ castling }: { castling: string | null }) => {
  const rights = [
    { flag: 'K', label: 'White O-O' },
    { flag: 'Q', label: 'White O-O-O' },
    { flag: 'k', label: 'Black O-O' },
    { flag: 'q', label: 'Black O-O-O' },
  ];
  const value = castling && castling !== '-' ? castling : '';

  return (
    <div className="flex flex-wrap gap-1.5">
      {rights.map(r => (
        <StatusBadge key={r.flag} tone={value.includes(r.flag) ? 'pass' : 'neutral'}>
          {r.label}
        </StatusBadge>
      ))}
    </div>
  );
};

const PieceInventory = ({
  title,
  pieces,
  counts,
  points,
}: {
  title: string;
  pieces: string[];
  counts: Record<string, number>;
  points: number;
}) => (
  <div className="border border-gray-200 px-3 py-2 flex-1 min-w-0">
    <div className="flex items-baseline justify-between gap-3 mb-2">
      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{title}</span>
      <span className="font-mono text-sm font-bold text-gray-900">{points} pts</span>
    </div>
    <div className="flex flex-wrap gap-2">
      {pieces.filter(p => counts[p]).map(p => (
        <span
          key={p}
          title={PIECE_NAME[p.toLowerCase()]}
          className="inline-flex items-baseline gap-1 font-mono text-xs text-gray-600"
        >
          <span className="text-lg leading-none text-gray-900">{GLYPH[p]}</span>
          <span>×{counts[p]}</span>
        </span>
      ))}
      {!pieces.some(p => counts[p]) && <span className="text-xs text-gray-400">no pieces</span>}
    </div>
  </div>
);

export function FenParser() {
  const [input, setInput] = useState(START_FEN);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const from = p.get('from');
    if (from) setInput(from);
  }, []);

  const result = useMemo(() => (input.trim() ? parseFen(input) : null), [input]);

  const advantage = result ? result.whiteMaterial - result.blackMaterial : 0;
  const totalMaterial = result ? result.whiteMaterial + result.blackMaterial : 0;

  return (
    <Panel
      title="Chess FEN Parser"
      description="Parse a [1 FEN (Forsyth–Edwards Notation) 2] string into a real board. Shows side to move, castling rights, the en passant square, move clocks, material balance and basic check detection."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-6">
          {/* Input */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                className={inputClass}
                placeholder={START_FEN}
                value={input}
                onChange={e => setInput(e.target.value)}
              />
              <button
                onClick={() => setFlipped(f => !f)}
                className="px-3 py-2 text-xs font-bold border border-gray-200 text-gray-500 hover:border-gray-900 hover:text-gray-900 transition-colors duration-150 cursor-pointer flex-shrink-0"
              >
                Flip board
              </button>
            </div>
            <PresetRow presets={PRESETS} onPick={setInput} />
          </div>

          {result?.error && <ErrorNote>{result.error}</ErrorNote>}

          {result && !result.error && (
            <>
              {result.inCheck && (
                <div className="border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  <span className="font-bold">
                    {result.checkColor === 'w' ? 'White' : 'Black'} is in check
                  </span>{' '}
                  — the attacked king is highlighted on the board.
                </div>
              )}

              <div className="flex flex-col lg:flex-row gap-6 lg:items-start">
                <Board result={result} flipped={flipped} />

                <div className="flex flex-col gap-4 flex-1 min-w-0">
                  {/* Position fields */}
                  <div className="grid grid-cols-2 gap-2">
                    <StatTile
                      label="Side to move"
                      value={
                        result.activeColor === 'w'
                          ? 'White'
                          : result.activeColor === 'b'
                            ? 'Black'
                            : '—'
                      }
                      hint={result.activeColor ? undefined : 'field missing'}
                    />
                    <StatTile
                      label="En passant"
                      value={result.enPassant && result.enPassant !== '-' ? result.enPassant : '—'}
                      hint={
                        result.enPassant && result.enPassant !== '-'
                          ? 'highlighted on board'
                          : 'not available'
                      }
                    />
                    <StatTile
                      label="Halfmove clock"
                      value={result.halfmoveClock ?? '—'}
                      hint="plies since a capture or pawn move"
                    />
                    <StatTile
                      label="Fullmove number"
                      value={result.fullmoveNumber ?? '—'}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <SectionTitle>Castling rights</SectionTitle>
                    <CastlingRights castling={result.castling} />
                  </div>

                  {/* Material */}
                  <div className="flex flex-col gap-2">
                    <SectionTitle
                      note={
                        advantage === 0
                          ? 'material is level'
                          : `${advantage > 0 ? 'White' : 'Black'} is up ${Math.abs(advantage)} points`
                      }
                    >
                      Material
                    </SectionTitle>
                    {totalMaterial > 0 && (
                      <Meter
                        ratio={result.whiteMaterial / totalMaterial}
                        tone={advantage === 0 ? 'neutral' : advantage > 0 ? 'pass' : 'fail'}
                      />
                    )}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <PieceInventory
                        title="White"
                        pieces={['K', 'Q', 'R', 'B', 'N', 'P']}
                        counts={result.pieceCount}
                        points={result.whiteMaterial}
                      />
                      <PieceInventory
                        title="Black"
                        pieces={['k', 'q', 'r', 'b', 'n', 'p']}
                        counts={result.pieceCount}
                        points={result.blackMaterial}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border border-gray-200 bg-gray-50 px-3 py-2">
                <span className="font-mono text-xs text-gray-700 break-all">{result.fen}</span>
                <CopyButton text={result.fen} label="FEN" />
              </div>
            </>
          )}
        </div>
      }
    />
  );
}
