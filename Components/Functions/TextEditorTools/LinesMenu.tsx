'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  dedupeLines,
  removeEmptyLines,
  reverseLines,
  sortLines,
  trimTrailingWhitespace,
} from './logic';

export type DedupeSettings = {
  caseInsensitive: boolean;
  trim: boolean;
  adjacentOnly: boolean;
};

type Props = {
  settings: DedupeSettings;
  setSettings: (settings: DedupeSettings) => void;
  run: (operation: (text: string) => string, describe?: (before: string, after: string) => string) => void;
};

const itemClass = 'w-full text-left px-3 py-1.5 text-sm text-gray-900 hover:bg-gray-100';

const countLines = (text: string) => (text === '' ? 0 : text.split('\n').length);

const LinesMenu = ({ settings, setSettings, run }: Props) => {
  const [open, setOpen] = useState(false);
  const [naturalSort, setNaturalSort] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onEscape);
    };
  }, [open]);

  const choose = (
    operation: (text: string) => string,
    describe?: (before: string, after: string) => string
  ) => {
    setOpen(false);
    run(operation, describe);
  };

  const removedMessage = (noun: string) => (before: string, after: string) => {
    const removed = countLines(before) - countLines(after);
    return `Removed ${removed} ${removed === 1 ? noun : `${noun}s`}`;
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="border border-gray-300 bg-white text-gray-900 px-3 py-1.5 text-sm hover:bg-gray-100"
      >
        Lines ▾
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full mt-1 z-20 w-64 border border-gray-300 bg-white shadow-lg py-1"
        >
          <button
            type="button"
            role="menuitem"
            className={itemClass}
            onClick={() =>
              choose((text) => dedupeLines(text, settings), removedMessage('duplicate line'))
            }
          >
            Remove duplicates
          </button>

          <div className="px-3 py-2 border-b border-gray-200 flex flex-col gap-1.5">
            {(
              [
                ['caseInsensitive', 'Ignore case'],
                ['trim', 'Ignore surrounding whitespace'],
                ['adjacentOnly', 'Adjacent lines only'],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex items-center gap-1.5 text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={settings[key]}
                  onChange={(e) => setSettings({ ...settings, [key]: e.target.checked })}
                />
                {label}
              </label>
            ))}
          </div>

          <button
            type="button"
            role="menuitem"
            className={itemClass}
            onClick={() => choose((text) => sortLines(text, 'asc', naturalSort))}
          >
            Sort A → Z
          </button>
          <button
            type="button"
            role="menuitem"
            className={itemClass}
            onClick={() => choose((text) => sortLines(text, 'desc', naturalSort))}
          >
            Sort Z → A
          </button>

          <div className="px-3 py-2 border-b border-gray-200">
            <label className="flex items-center gap-1.5 text-xs text-gray-600">
              <input
                type="checkbox"
                checked={naturalSort}
                onChange={(e) => setNaturalSort(e.target.checked)}
              />
              Natural order (file9 before file10)
            </label>
          </div>

          <button type="button" role="menuitem" className={itemClass} onClick={() => choose(reverseLines)}>
            Reverse lines
          </button>
          <button
            type="button"
            role="menuitem"
            className={itemClass}
            onClick={() => choose(trimTrailingWhitespace)}
          >
            Trim trailing whitespace
          </button>
          <button
            type="button"
            role="menuitem"
            className={itemClass}
            onClick={() => choose(removeEmptyLines, removedMessage('empty line'))}
          >
            Remove empty lines
          </button>
        </div>
      )}
    </div>
  );
};

export default LinesMenu;
