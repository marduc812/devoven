'use client';

import React, { useEffect, useRef } from 'react';
import type { FindOptions } from './logic';

const inputClass =
  'border border-gray-300 bg-white text-gray-900 px-2 py-1 text-sm font-mono focus:outline-none focus:border-gray-900';
const buttonClass =
  'border border-gray-300 bg-white text-gray-900 px-2 py-1 text-sm hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-white';

type Props = {
  query: string;
  setQuery: (value: string) => void;
  replacement: string;
  setReplacement: (value: string) => void;
  options: FindOptions;
  setOptions: (options: FindOptions) => void;
  showReplace: boolean;
  setShowReplace: (value: boolean) => void;
  searchAllTabs: boolean;
  toggleSearchAllTabs: () => void;
  /** False when only one tab is open, which makes an all-tabs search meaningless. */
  canSearchAllTabs: boolean;
  /** Total matches across everything currently being searched. */
  matchCount: number;
  /** How many files those matches are spread over. */
  matchFileCount: number;
  /** Matches in the visible tab — only these are ever painted, so only these can hit the cap. */
  visibleMatchCount: number;
  /** Position within the visible tab's matches, or -1 when it has none. */
  currentMatchIndex: number;
  highlightCap: number;
  error: string | null;
  onNext: () => void;
  onPrevious: () => void;
  onReplace: () => void;
  onReplaceAll: () => void;
  onCopyMatches: () => void;
  onClose: () => void;
};

const Toggle = ({
  active,
  label,
  title,
  onClick,
  disabled = false,
}: {
  active: boolean;
  label: string;
  title: string;
  onClick: () => void;
  disabled?: boolean;
}) => (
  <button
    type="button"
    title={title}
    aria-pressed={active}
    disabled={disabled}
    onClick={onClick}
    className={`border px-2 py-1 text-sm font-mono disabled:opacity-40 disabled:hover:bg-white ${
      active
        ? 'border-gray-900 bg-gray-900 text-white'
        : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-100'
    }`}
  >
    {label}
  </button>
);

const FindBar = (props: Props) => {
  const findInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    findInputRef.current?.focus();
    findInputRef.current?.select();
  }, []);

  const { options, setOptions, matchCount, matchFileCount, currentMatchIndex } = props;
  const hasMatches = matchCount > 0;
  // The current match always lives in the visible tab. An all-tabs search can
  // still turn up matches while this tab has none — stepping is what moves there.
  const selected = currentMatchIndex >= 0;
  const spread = props.searchAllTabs && matchFileCount > 1 ? ` · ${matchFileCount} files` : '';

  const counter = props.error
    ? ''
    : !props.query
    ? ''
    : !hasMatches
    ? 'No results'
    : selected
    ? `${currentMatchIndex + 1} of ${matchCount}${spread}`
    : `None here · ${matchCount} in ${matchFileCount} ${matchFileCount === 1 ? 'file' : 'files'}`;

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) props.onPrevious();
      else props.onNext();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      props.onClose();
    }
  };

  return (
    <div className="border border-gray-300 border-b-0 bg-gray-50 px-3 py-2 flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => props.setShowReplace(!props.showReplace)}
          title={props.showReplace ? 'Hide replace' : 'Show replace'}
          className={`${buttonClass} w-7`}
        >
          {props.showReplace ? '▾' : '▸'}
        </button>

        <input
          ref={findInputRef}
          value={props.query}
          onChange={(e) => props.setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Find"
          aria-label="Find"
          className={`${inputClass} w-56`}
        />

        <Toggle
          active={!!options.caseSensitive}
          label="Aa"
          title="Match case"
          onClick={() => setOptions({ ...options, caseSensitive: !options.caseSensitive })}
        />
        <Toggle
          active={!!options.wholeWord}
          label="ab|"
          title="Whole word"
          onClick={() => setOptions({ ...options, wholeWord: !options.wholeWord })}
        />
        <Toggle
          active={!!options.regex}
          label=".*"
          title="Regular expression"
          onClick={() => setOptions({ ...options, regex: !options.regex })}
        />
        <Toggle
          active={props.searchAllTabs}
          label="All"
          disabled={!props.canSearchAllTabs}
          title={
            props.canSearchAllTabs
              ? 'Search all open tabs'
              : 'Search all open tabs — only one tab is open'
          }
          onClick={props.toggleSearchAllTabs}
        />

        <button type="button" onClick={props.onPrevious} disabled={!hasMatches} title="Previous match (Shift+Enter)" className={buttonClass}>
          ↑
        </button>
        <button type="button" onClick={props.onNext} disabled={!hasMatches} title="Next match (Enter)" className={buttonClass}>
          ↓
        </button>

        {/* Copies every match the counter beside it is reporting, so it follows the
            same scope: this tab, or all of them while "All" is on. */}
        <button
          type="button"
          onClick={props.onCopyMatches}
          disabled={!hasMatches}
          title={
            hasMatches
              ? `Copy ${matchCount} ${matchCount === 1 ? 'match' : 'matches'} to the clipboard, one per line`
              : 'Copy matches to the clipboard, one per line'
          }
          className={buttonClass}
        >
          Copy
        </button>

        <span className="text-xs text-gray-500 font-mono min-w-[8rem]">{counter}</span>

        <button type="button" onClick={props.onClose} title="Close (Esc)" className={`${buttonClass} ml-auto`}>
          ✕
        </button>
      </div>

      {props.showReplace && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-7" />
          <input
            value={props.replacement}
            onChange={(e) => props.setReplacement(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={options.regex ? 'Replace ($1, \\n)' : 'Replace'}
            aria-label="Replace"
            className={`${inputClass} w-56`}
          />
          {/* Replace acts on the current match, which only exists in this tab. */}
          <button type="button" onClick={props.onReplace} disabled={!selected} className={buttonClass}>
            Replace
          </button>
          <button type="button" onClick={props.onReplaceAll} disabled={!hasMatches} className={buttonClass}>
            Replace all
          </button>
          {options.regex && (
            <span className="text-xs text-gray-500 font-mono">
              {'\\n \\t \\r \\uFFFF'} become real characters · {'$1'} inserts a group
            </span>
          )}
        </div>
      )}

      {props.error && <p className="text-xs text-red-600">{props.error}</p>}

      {!props.error && props.visibleMatchCount > props.highlightCap && (
        <p className="text-xs text-gray-500">
          Highlighting {props.highlightCap.toLocaleString()} of {props.visibleMatchCount.toLocaleString()} matches in
          this tab, around the current one. Stepping and Replace all still cover every match.
        </p>
      )}
    </div>
  );
};

export default FindBar;
