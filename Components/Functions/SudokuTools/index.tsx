'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import {
  CopyButton,
  Meter,
  PresetRow,
  SectionTitle,
  StatTile,
  StatusBadge,
  type BadgeTone,
} from '@/Components/MainView/MainPanel/ResultUI';
import { formatGrid, remainingDigits, validateSudoku } from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

const SOLVED = [
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

const PUZZLE = [
  '53..7....',
  '6..195...',
  '.98....6.',
  '8...6...3',
  '4..8.3..1',
  '7...2...6',
  '.6....28.',
  '...419..5',
  '....8..79',
].join('\n');

const CONFLICTED = [
  '553..7...',
  '6..195...',
  '.98....6.',
  '8...6...3',
  '4..8.3..1',
  '7...2...6',
  '.6....28.',
  '...419..5',
  '....8..79',
].join('\n');

const EMPTY = Array(9).fill('.........').join('\n');

const PRESETS = [
  { label: 'Puzzle', value: PUZZLE },
  { label: 'Solved', value: SOLVED },
  { label: 'With conflicts', value: CONFLICTED },
  { label: 'Empty', value: EMPTY },
];

const STATUS_TONE: Record<string, BadgeTone> = {
  solved: 'pass',
  'in-progress': 'info',
  invalid: 'fail',
};

export function SudokuValidator() {
  const [input, setInput] = useState(PUZZLE);
  const [focused, setFocused] = useState<[number, number] | null>(null);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const from = p.get('from');
    if (from) setInput(from);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ from: input })

  const result = useMemo(() => validateSudoku(input), [input]);

  const parseFailed = result.message.startsWith('Parse error');

  const filled = useMemo(() => result.grid.flat().filter(v => v !== 0).length, [result.grid]);

  const remaining = useMemo(() => remainingDigits(result.grid), [result.grid]);

  /** Write one cell and push the whole grid back into the text input. */
  const setCell = (r: number, c: number, value: number) => {
    if (parseFailed) return;
    const next = result.grid.map(row => [...row]);
    next[r][c] = value;
    setInput(formatGrid(next));
  };

  const handleKey = (r: number, c: number, key: string) => {
    if (/^[1-9]$/.test(key)) setCell(r, c, Number(key));
    else if (key === '0' || key === '.' || key === 'Backspace' || key === 'Delete') setCell(r, c, 0);
  };

  return (
    <Panel
      title="Sudoku Validator"
      description="Validate a 9×9 Sudoku grid. Paste [1 9 lines of 9 digits 2] (0 or . for empty), or click a cell and type a digit. Row, column and 3×3 box conflicts are highlighted as you go."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-6">
          <div className="flex flex-col lg:flex-row gap-6 lg:items-start">
            {/* Grid */}
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-9 border-2 border-gray-900 w-fit">
                {result.grid.map((row, r) =>
                  row.map((value, c) => {
                    const conflict = result.conflicts[r][c];
                    const isFocused = focused?.[0] === r && focused?.[1] === c;
                    const sameValue =
                      value !== 0 &&
                      focused !== null &&
                      result.grid[focused[0]][focused[1]] === value &&
                      !isFocused;

                    return (
                      <button
                        key={`${r}-${c}`}
                        onFocus={() => setFocused([r, c])}
                        onBlur={() => setFocused(null)}
                        onKeyDown={e => {
                          // Let arrows and Tab move focus normally.
                          if (e.key.startsWith('Arrow') || e.key === 'Tab') return;
                          e.preventDefault();
                          handleKey(r, c, e.key);
                        }}
                        title={`R${r + 1}C${c + 1}${conflict ? ' — conflict' : ''}`}
                        aria-label={`Row ${r + 1} column ${c + 1}, ${value === 0 ? 'empty' : value}`}
                        className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center font-mono text-lg transition-colors duration-100 cursor-pointer focus:outline-none
                          border-r border-b border-gray-200
                          ${c === 2 || c === 5 ? 'border-r-2 border-r-gray-900' : ''}
                          ${r === 2 || r === 5 ? 'border-b-2 border-b-gray-900' : ''}
                          ${c === 8 ? 'border-r-0' : ''}
                          ${r === 8 ? 'border-b-0' : ''}
                          ${
                            conflict
                              ? 'bg-rose-100 text-rose-800 font-bold'
                              : isFocused
                                ? 'bg-indigo-100 text-gray-900'
                                : sameValue
                                  ? 'bg-indigo-50 text-gray-900'
                                  : value === 0
                                    ? 'bg-white text-gray-400'
                                    : 'bg-white text-gray-900'
                          }`}
                      >
                        {value === 0 ? '' : value}
                      </button>
                    );
                  })
                )}
              </div>
              <p className="text-[11px] text-gray-400 max-w-[22rem]">
                Click a cell and press 1–9 to fill it, or Backspace to clear. Arrow keys and Tab move
                between cells.
              </p>
            </div>

            {/* Status & stats */}
            <div className="flex flex-col gap-4 flex-1 min-w-0">
              <div
                className={`border px-3 py-3 ${
                  result.status === 'solved'
                    ? 'bg-emerald-50 border-emerald-200'
                    : result.status === 'invalid'
                      ? 'bg-rose-50 border-rose-200'
                      : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3 mb-1">
                  <StatusBadge tone={STATUS_TONE[result.status]}>{result.status}</StatusBadge>
                </div>
                <p className="text-sm text-gray-700">{result.message}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <StatTile label="Filled cells" value={`${filled} / 81`} />
                <StatTile
                  label="Conflicts"
                  value={
                    result.conflictDetails.length > 0 ? (
                      <span className="text-rose-700">{result.conflictDetails.length}</span>
                    ) : (
                      0
                    )
                  }
                  hint={result.conflictDetails.length === 0 ? 'none detected' : 'cells in conflict'}
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-baseline justify-between font-mono text-[10px] text-gray-500">
                  <span>Completion</span>
                  <span>{Math.round((filled / 81) * 100)}%</span>
                </div>
                <Meter
                  ratio={filled / 81}
                  tone={result.status === 'invalid' ? 'fail' : filled === 81 ? 'pass' : 'info'}
                />
              </div>

              {/* Digit tally */}
              {!parseFailed && (
                <div className="flex flex-col gap-2">
                  <SectionTitle note="how many of each digit are still missing">
                    Remaining digits
                  </SectionTitle>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(remaining).map(([digit, left]) => (
                      <span
                        key={digit}
                        title={`${left} ${digit}${left === 1 ? '' : 's'} left to place`}
                        className={`inline-flex items-baseline gap-1 border px-2 py-1 font-mono text-xs ${
                          left === 0
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : left < 0
                              ? 'bg-rose-50 border-rose-200 text-rose-700'
                              : 'border-gray-200 text-gray-600'
                        }`}
                      >
                        <span className="font-bold text-sm">{digit}</span>
                        <span className="text-gray-400">
                          {left === 0 ? 'done' : left > 0 ? `×${left}` : `+${-left}`}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {result.conflictDetails.length > 0 && (
                <div className="flex flex-col gap-2">
                  <SectionTitle>Conflicting cells</SectionTitle>
                  <div className="flex flex-wrap gap-1.5">
                    {result.conflictDetails.map(d => (
                      <span
                        key={d}
                        className="font-mono text-[11px] px-1.5 py-0.5 border border-rose-200 bg-rose-50 text-rose-700"
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Text input */}
          <div className="flex flex-col gap-3">
            <SectionTitle note={<CopyButton text={input} label="grid" />}>Grid as text</SectionTitle>
            <textarea
              className="bg-white text-gray-900 placeholder:text-gray-400 p-3 w-full h-48 border border-gray-300 focus:border-gray-900 focus:outline-none transition-colors duration-150 font-mono text-sm resize-y"
              spellCheck={false}
              value={input}
              onChange={e => setInput(e.target.value)}
            />
            <PresetRow presets={PRESETS} onPick={setInput} />
          </div>
        </div>
      }
    />
  );
}
