'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { textToBraille, dotsOf, type BrailleCell } from './logic';

function copy(text: string) {
  navigator.clipboard.writeText(text).catch(() => {});
}

const labelClass = 'text-xs font-bold uppercase tracking-wider text-gray-500';

/** A single Braille cell drawn as its physical 2x3 dot grid. */
function DotCell({ bits, dark }: { bits: number; dark?: boolean }) {
  const on = dotsOf(bits);
  // Physical layout: left column holds dots 1,2,3 — right column holds dots 4,5,6.
  const columns = [
    [0, 1, 2],
    [3, 4, 5],
  ];
  return (
    <div className="flex gap-[3px]">
      {columns.map((col, ci) => (
        <div key={ci} className="flex flex-col gap-[3px]">
          {col.map(idx => (
            <span
              key={idx}
              className={`w-[7px] h-[7px] rounded-full ${
                on[idx]
                  ? dark ? 'bg-white' : 'bg-gray-900'
                  : dark ? 'bg-gray-700' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function CellCard({ cell }: { cell: BrailleCell }) {
  const supported = cell.brailleChar !== '?';
  const isIndicator = !!cell.isIndicator;

  if (!supported) {
    return (
      <div className="bg-white p-3 flex flex-col items-center gap-2 opacity-60">
        <div className="h-[27px] flex items-center text-gray-300 text-xl leading-none">?</div>
        <p className="font-mono text-sm text-gray-900 leading-none">{cell.original}</p>
        <p className="text-[10px] text-gray-400 leading-none">unsupported</p>
      </div>
    );
  }

  return (
    <div
      className={`p-3 flex flex-col items-center gap-2 cursor-pointer ${
        isIndicator ? 'bg-gray-900' : 'bg-white hover:bg-gray-50'
      }`}
      onClick={() => copy(cell.brailleChar)}
      title="Click to copy this cell"
    >
      <DotCell bits={cell.bits ?? 0} dark={isIndicator} />
      <p className={`font-mono text-sm leading-none ${isIndicator ? 'text-white font-black' : 'text-gray-900'}`}>
        {isIndicator ? (cell.indicatorLabel === 'capital' ? '⇧' : '#') : cell.original}
      </p>
      <p className={`text-[10px] font-mono leading-none ${isIndicator ? 'text-gray-500' : 'text-gray-400'}`}>
        {cell.dots === '(space)' || cell.dots === '(empty)' ? '—' : cell.dots}
      </p>
    </div>
  );
}

const DEFAULT_TEXT = 'Hello World 2024';

export function BrailleConverter() {
  const [input, setInput] = useState(DEFAULT_TEXT);

  useEffect(() => {
    const p = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const from = p.get('from');
    if (from) setInput(from);
  }, []);

  const cells = useMemo(() => (input ? textToBraille(input) : []), [input]);

  const brailleStr = cells.map(c => c.brailleChar).join('');
  const indicators = cells.filter(c => c.isIndicator).length;
  const unsupported = cells.filter(c => c.brailleChar === '?').length;

  const inputClass =
    'bg-white text-gray-900 placeholder:text-gray-400 px-3 py-2 w-full border border-gray-300 focus:border-gray-900 focus:outline-none font-mono text-sm';

  return (
    <Panel
      title="Text to Braille Converter"
      description="Convert text to Grade 1 Braille Unicode patterns (U+2800–U+28FF). Every cell is drawn as its real 2×3 dot grid, so you can read the raised pattern directly. Supports [1 A-Z, a-z, 0-9 2] and basic punctuation — capital and number indicators are inserted automatically."
      backColor="rose"
      extraElements={
        <div className="flex flex-col gap-5">
          <div>
            <label className={`${labelClass} block mb-1`}>Text</label>
            <textarea
              className={`${inputClass} h-24 resize-y`}
              placeholder="e.g. Hello World 2024"
              value={input}
              onChange={e => setInput(e.target.value)}
            />
          </div>

          {cells.length > 0 && (
            <>
              {/* Braille strip */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className={labelClass}>Braille</p>
                  <button
                    className="text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-gray-900"
                    onClick={() => copy(brailleStr)}
                  >
                    Copy
                  </button>
                </div>
                <div
                  className="bg-gray-900 px-4 py-5 cursor-pointer"
                  onClick={() => copy(brailleStr)}
                  title="Click to copy"
                >
                  <p className="text-white text-3xl leading-relaxed break-all select-all font-mono">
                    {brailleStr}
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-gray-200">
                <div className="bg-white p-4">
                  <p className={`${labelClass} mb-1`}>Input Chars</p>
                  <p className="text-2xl font-black text-gray-900">{input.length}</p>
                </div>
                <div className="bg-white p-4">
                  <p className={`${labelClass} mb-1`}>Braille Cells</p>
                  <p className="text-2xl font-black text-gray-900">{cells.length}</p>
                </div>
                <div className="bg-white p-4">
                  <p className={`${labelClass} mb-1`}>Indicators</p>
                  <p className="text-2xl font-black text-gray-900">{indicators}</p>
                  <p className="text-xs text-gray-400 mt-0.5">capital + number</p>
                </div>
                <div className="bg-white p-4">
                  <p className={`${labelClass} mb-1`}>Unsupported</p>
                  <p className={`text-2xl font-black ${unsupported ? 'text-red-600' : 'text-gray-900'}`}>{unsupported}</p>
                </div>
              </div>

              {/* Cell grid */}
              <div>
                <p className={`${labelClass} mb-2`}>
                  Cells <span className="normal-case font-normal text-gray-400">(click any cell to copy it)</span>
                </p>
                <div
                  className="grid gap-px bg-gray-200 border border-gray-200"
                  style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(64px, 1fr))' }}
                >
                  {cells.map((cell, i) => (
                    <CellCard key={i} cell={cell} />
                  ))}
                </div>
              </div>

              {/* Legend */}
              <div className="border border-gray-200 p-4 flex flex-wrap gap-x-8 gap-y-3">
                <div className="flex items-center gap-2">
                  <div className="bg-gray-900 p-1.5"><DotCell bits={0x20} dark /></div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">⇧ Capital indicator</p>
                    <p className="text-[10px] text-gray-400 font-mono">dot 6</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="bg-gray-900 p-1.5"><DotCell bits={0x3c} dark /></div>
                  <div>
                    <p className="text-xs font-bold text-gray-900"># Number indicator</p>
                    <p className="text-[10px] text-gray-400 font-mono">dots 3-4-5-6</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="border border-gray-200 p-1.5"><DotCell bits={0x13} /></div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">Letter cell (h)</p>
                    <p className="text-[10px] text-gray-400 font-mono">dots 1-3 left column, 4-6 right</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      }
    />
  );
}
