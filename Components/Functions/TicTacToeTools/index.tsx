'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import {
  CopyButton,
  PresetRow,
  SectionTitle,
  StatTile,
  StatusBadge,
  type BadgeTone,
} from '@/Components/MainView/MainPanel/ResultUI';
import {
  analyzeTicTacToe,
  formatBoard,
  scoreAllMoves,
  type Board,
  type Cell,
  type MoveOutcome,
} from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

const EMPTY_BOARD: Board = Array(9).fill('.') as Board;

const PRESETS: { label: string; value: Board }[] = [
  { label: 'Empty', value: EMPTY_BOARD },
  { label: 'Opening', value: [...'X...O....'] as Board },
  { label: 'Fork threat', value: [...'X...O...X'] as Board },
  { label: 'X to win', value: [...'XX.OO....'] as Board },
  { label: 'X won', value: [...'XXXOO....'] as Board },
  { label: 'Draw', value: [...'XOXXOOOXX'] as Board },
];

/** The mark colours — X and O need to stay tellable apart at a glance. */
const MARK_CLASS: Record<'X' | 'O', string> = {
  X: 'text-indigo-600',
  O: 'text-amber-600',
};

const OUTCOME_TONE: Record<MoveOutcome, BadgeTone> = {
  win: 'pass',
  draw: 'neutral',
  loss: 'fail',
};

const OUTCOME_BADGE: Record<MoveOutcome, string> = {
  win: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  draw: 'bg-gray-100 text-gray-500 border-gray-300',
  loss: 'bg-rose-100 text-rose-700 border-rose-300',
};

const coords = (i: number) => `R${Math.floor(i / 3) + 1}C${(i % 3) + 1}`;

export function TicTacToeAnalyzer() {
  // The text form is the single source of truth; the grid is parsed back out of
  // it, so clicking a square and editing the text can never disagree.
  const [text, setText] = useState(formatBoard(EMPTY_BOARD));
  const [hovered, setHovered] = useState<number | null>(null);

  useEffect(() => {
    const from = new URLSearchParams(window.location.search).get('from');
    if (from) setText(from);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ from: text })

  // A cleared textarea means an empty board, not "no input" — analyzing the
  // explicit form keeps the recommended move consistent with the ranking below.
  const analysisText = text.trim() ? text : formatBoard(EMPTY_BOARD);

  const result = useMemo(() => analyzeTicTacToe(analysisText), [analysisText]);
  const board = result.board;

  /** Whose turn it is, derived from the board alone so it survives odd states. */
  const sideToMove: 'X' | 'O' = useMemo(() => {
    const x = board.filter(c => c === 'X').length;
    const o = board.filter(c => c === 'O').length;
    return x <= o ? 'X' : 'O';
  }, [board]);

  const moves = useMemo(
    () =>
      result.isOngoing && !result.validationError
        ? scoreAllMoves([...board] as Board, sideToMove)
        : [],
    [board, sideToMove, result.isOngoing, result.validationError]
  );

  const moveByIndex = useMemo(() => new Map(moves.map(m => [m.index, m])), [moves]);

  const filled = board.filter(c => c !== '.').length;
  const winningCells = new Set(result.winningLine ?? []);

  const commit = (next: Board) => setText(formatBoard(next));

  const withCell = (i: number, cell: Cell): Board => {
    const next = [...board] as Board;
    next[i] = cell;
    return next;
  };

  /** Empty squares take the side to move; filled ones cycle X → O → empty. */
  const clickCell = (i: number) =>
    commit(withCell(i, board[i] === '.' ? sideToMove : board[i] === 'X' ? 'O' : '.'));

  const playBest = () => {
    if (result.bestMove !== null) commit(withCell(result.bestMove, sideToMove));
  };

  const clearBoard = () => commit(EMPTY_BOARD);

  const statusTone: BadgeTone = result.validationError
    ? 'fail'
    : result.winner
      ? 'pass'
      : result.isDraw
        ? 'neutral'
        : 'info';

  const statusLabel = result.validationError
    ? 'invalid'
    : result.winner
      ? `${result.winner} wins`
      : result.isDraw
        ? 'draw'
        : 'in progress';

  const perfectPlay =
    result.minimaxScore === null
      ? null
      : result.minimaxScore > 0
        ? 'X wins'
        : result.minimaxScore < 0
          ? 'O wins'
          : 'Draw';

  return (
    <Panel
      title="Tic-Tac-Toe Analyzer"
      description="Click the squares to set up a position — no typing needed. Every legal move is scored with the [1 minimax algorithm 2], so you see the best reply, what each square is worth, and how the game ends with perfect play."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-6">
          <div className="flex flex-col lg:flex-row gap-6 lg:items-start">
            {/* Board */}
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-3 border-2 border-gray-900 w-fit">
                {board.map((cell, i) => {
                  const r = Math.floor(i / 3);
                  const c = i % 3;
                  const move = moveByIndex.get(i);
                  const isBest = result.bestMove === i && result.isOngoing;
                  const isHovered = hovered === i;
                  const won = winningCells.has(i);

                  return (
                    <button
                      key={i}
                      onClick={() => clickCell(i)}
                      onMouseEnter={() => setHovered(i)}
                      onMouseLeave={() => setHovered(null)}
                      title={
                        move
                          ? `${coords(i)} — play ${sideToMove} here: ${move.outcome} (minimax ${move.score})`
                          : `${coords(i)} — ${cell === '.' ? 'empty' : cell}`
                      }
                      aria-label={`Row ${r + 1} column ${c + 1}, ${cell === '.' ? 'empty' : cell}`}
                      className={`relative w-[4.5rem] h-[4.5rem] sm:w-24 sm:h-24 flex items-center justify-center font-black text-4xl sm:text-5xl leading-none cursor-pointer transition-colors duration-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gray-900
                        border-r-2 border-b-2 border-gray-900
                        ${c === 2 ? 'border-r-0' : ''}
                        ${r === 2 ? 'border-b-0' : ''}
                        ${
                          won
                            ? 'bg-emerald-100'
                            : isBest
                              ? 'bg-emerald-50'
                              : isHovered
                                ? 'bg-gray-100'
                                : 'bg-white'
                        }`}
                    >
                      {cell === '.' ? (
                        // Ghost preview of the move this click would make.
                        <span
                          className={`${MARK_CLASS[sideToMove]} ${isHovered ? 'opacity-30' : 'opacity-0'} transition-opacity duration-100`}
                        >
                          {sideToMove}
                        </span>
                      ) : (
                        <span className={won ? 'text-emerald-700' : MARK_CLASS[cell as 'X' | 'O']}>
                          {cell}
                        </span>
                      )}

                      {/* Position number, so the text form stays readable */}
                      <span className="absolute bottom-1 left-1.5 font-mono text-[10px] text-gray-300">
                        {i + 1}
                      </span>

                      {move && (
                        <span
                          className={`absolute top-1 right-1 border px-1 font-mono text-[9px] font-bold uppercase tracking-wider ${OUTCOME_BADGE[move.outcome]}`}
                        >
                          {move.outcome === 'win' ? 'W' : move.outcome === 'loss' ? 'L' : 'D'}
                        </span>
                      )}

                      {isBest && (
                        <span className="absolute inset-1 border-2 border-dashed border-emerald-500 pointer-events-none" />
                      )}
                    </button>
                  );
                })}
              </div>

              <p className="text-[11px] text-gray-400 max-w-[19rem] leading-relaxed">
                Click an empty square to play <span className="font-mono font-bold">{sideToMove}</span>.
                Click a filled one to cycle it X → O → empty. The dashed square is the best move; the
                corner letter is the result each square leads to for {sideToMove}.
              </p>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={playBest}
                  disabled={result.bestMove === null || !result.isOngoing}
                  className="font-mono text-xs px-2 py-1 border border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white transition-colors duration-150 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-900"
                >
                  Play best move
                </button>
                <button
                  onClick={clearBoard}
                  className="font-mono text-xs px-2 py-1 border border-gray-200 text-gray-600 hover:border-gray-900 hover:text-gray-900 transition-colors duration-150 cursor-pointer"
                >
                  Clear board
                </button>
              </div>
            </div>

            {/* Verdict & stats */}
            <div className="flex flex-col gap-4 flex-1 min-w-0">
              <div
                className={`border px-3 py-3 ${
                  result.validationError
                    ? 'bg-rose-50 border-rose-200'
                    : result.winner
                      ? 'bg-emerald-50 border-emerald-200'
                      : result.isDraw
                        ? 'bg-gray-50 border-gray-200'
                        : 'bg-indigo-50 border-indigo-200'
                }`}
              >
                <div className="flex items-center gap-3 mb-1">
                  <StatusBadge tone={statusTone}>{statusLabel}</StatusBadge>
                </div>
                <p className="text-sm text-gray-700">
                  {result.validationError
                    ? result.validationError
                    : result.winner
                      ? `${result.winner} has three in a row — ${(result.winningLine ?? []).map(coords).join(', ')}.`
                      : result.isDraw
                        ? 'The board is full with no three in a row.'
                        : result.bestMove !== null
                          ? `${sideToMove} to move. Best square is ${result.bestMove + 1} (${coords(result.bestMove)}).`
                          : `${sideToMove} to move.`}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <StatTile label="Move" value={filled + (result.isOngoing ? 1 : 0)} hint={`${filled} played`} />
                <StatTile
                  label="To move"
                  value={
                    result.isOngoing ? (
                      <span className={MARK_CLASS[sideToMove]}>{sideToMove}</span>
                    ) : (
                      '—'
                    )
                  }
                  hint={result.isOngoing ? undefined : 'game over'}
                />
                <StatTile
                  label="Perfect play"
                  value={perfectPlay ?? (result.winner ? `${result.winner} won` : result.isDraw ? 'Draw' : '—')}
                  hint={result.minimaxScore !== null ? `minimax ${result.minimaxScore}` : undefined}
                />
              </div>

              {moves.length > 0 && (
                <div className="flex flex-col gap-2">
                  <SectionTitle note={`${moves.length} legal ${moves.length === 1 ? 'move' : 'moves'}, best first`}>
                    Move ranking for {sideToMove}
                  </SectionTitle>
                  <div className="border border-gray-200 overflow-x-auto">
                    <table className="w-full border-collapse text-xs">
                      <thead>
                        <tr className="bg-gray-50">
                          {['Square', 'Result', 'Score', ''].map((h, i) => (
                            <th
                              key={i}
                              className={`px-3 py-2 font-bold uppercase tracking-widest text-[10px] text-gray-500 whitespace-nowrap ${i === 2 ? 'text-right' : 'text-left'}`}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {moves.map(m => (
                          <tr
                            key={m.index}
                            onMouseEnter={() => setHovered(m.index)}
                            onMouseLeave={() => setHovered(null)}
                            onClick={() => clickCell(m.index)}
                            title={`Play ${sideToMove} on square ${m.index + 1}`}
                            className={`border-t border-gray-200 cursor-pointer ${hovered === m.index ? 'bg-gray-50' : ''}`}
                          >
                            <td className="px-3 py-1.5 font-mono text-gray-900 whitespace-nowrap">
                              {m.index + 1}{' '}
                              <span className="text-gray-400">{coords(m.index)}</span>
                            </td>
                            <td className="px-3 py-1.5">
                              <StatusBadge tone={OUTCOME_TONE[m.outcome]}>{m.outcome}</StatusBadge>
                            </td>
                            <td className="px-3 py-1.5 font-mono text-gray-900 text-right">{m.score}</td>
                            <td className="px-3 py-1.5 text-gray-400 whitespace-nowrap">
                              {m.outcome === 'draw'
                                ? 'holds the draw'
                                : `${m.outcome === 'win' ? 'wins' : 'loses'} in ${m.distance} ${m.distance === 1 ? 'ply' : 'plies'}`}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Text form */}
          <div className="flex flex-col gap-3">
            <SectionTitle note={<CopyButton text={text} label="board" />}>Board as text</SectionTitle>
            <textarea
              className="bg-white text-gray-900 placeholder:text-gray-400 p-3 w-full h-24 border border-gray-300 focus:border-gray-900 focus:outline-none transition-colors duration-150 font-mono text-sm resize-y"
              spellCheck={false}
              value={text}
              onChange={e => setText(e.target.value)}
            />
            <PresetRow presets={PRESETS} onPick={commit} />
          </div>
        </div>
      }
    />
  );
}
