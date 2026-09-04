'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTimeboxedWorker, DEFAULT_TIMEOUT_MS } from '@/Components/Functions/useTimeboxedWorker';
import { spawnRegexWorker } from '@/lib/regex/spawn';
import type { RegexReplaceJob } from '@/lib/regex/types';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import Panel from '@/Components/MainView/MainPanel/Panel';
import {
  convertCase,
  countWords, countChars, countCharsNoSpaces, countLines, countSentences,
  generateLoremIpsum, generateLoremWords,
  removeDuplicateLines,
  sortLinesAsc, sortLinesDesc,
  reverseString, reverseLines,
  toSlug,
  trimLines, collapseSpaces, removeBlankLines,
  regexFindReplace,
  repeatText,
  formatDiffStats,
} from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

const REGEX_TIMEOUT_SECONDS = DEFAULT_TIMEOUT_MS / 1000;

// ─── 1. Case Converter ────────────────────────────────────────────────────────

export function CaseConverter() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [caseType, setCaseType] = useState('upper');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setInput(from);
    const c = params.get('case');
    if (c) setCaseType(c);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ case: caseType })

  useEffect(() => {
    if (!input.trim()) { setOutput(''); return; }
    setOutput(convertCase(input, caseType));
  }, [input, caseType]);

  return (
    <AdvancedConverter
      title="Case Converter"
      description="Convert text to different cases. For example, [1 hello world 2] becomes [1 HELLO WORLD 2] in upper case or [1 helloWorld 2] in camelCase."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="Input"
      toTitle="Output"
      backColor="rose"
      extraElements={
        <select
          value={caseType}
          onChange={(e) => setCaseType(e.target.value)}
          className="border border-gray-300 bg-white text-gray-900 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-900"
        >
          <option value="upper">UPPER CASE</option>
          <option value="lower">lower case</option>
          <option value="title">Title Case</option>
          <option value="camel">camelCase</option>
          <option value="snake">snake_case</option>
          <option value="kebab">kebab-case</option>
          <option value="pascal">PascalCase</option>
        </select>
      }
    />
  );
}

// ─── 2. Word & Character Counter ─────────────────────────────────────────────

export function WordCounter() {
  const [input, setInput] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setInput(from);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ from: input })

  const words = countWords(input);
  const chars = countChars(input);
  const charsNoSpaces = countCharsNoSpaces(input);
  const lines = input ? countLines(input) : 0;
  const sentences = countSentences(input);

  const statClass = 'flex flex-col items-center justify-center border border-gray-200 bg-gray-50 p-4 gap-1';
  const numClass = 'text-3xl font-light text-rose-300';
  const labelClass = 'text-xs text-gray-500 uppercase tracking-wider';

  return (
    <Panel
      title="Word & Character Counter"
      description="Count words, characters, lines, and sentences in your text. Paste or type below to see live statistics."
      backColor="rose"
      extraElements={
        <div className="flex flex-col gap-4">
          <textarea
            className="bg-white backdrop-blur-sm text-gray-900 placeholder:text-gray-400 p-3 w-full border border-gray-200 focus:border-gray-400 focus:outline-none resize-none transition-colors duration-200 font-mono text-sm"
            placeholder="Paste or type your text here..."
            value={input}
            rows={6}
            onChange={(e) => setInput(e.target.value)}
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
            <div className={statClass}>
              <span className={numClass}>{words}</span>
              <span className={labelClass}>Words</span>
            </div>
            <div className={statClass}>
              <span className={numClass}>{chars}</span>
              <span className={labelClass}>Characters</span>
            </div>
            <div className={statClass}>
              <span className={numClass}>{charsNoSpaces}</span>
              <span className={labelClass}>Chars (no spaces)</span>
            </div>
            <div className={statClass}>
              <span className={numClass}>{lines}</span>
              <span className={labelClass}>Lines</span>
            </div>
            <div className={statClass}>
              <span className={numClass}>{sentences}</span>
              <span className={labelClass}>Sentences</span>
            </div>
          </div>
        </div>
      }
    />
  );
}

// ─── 5. Remove Duplicate Lines ───────────────────────────────────────────────
export function RemoveDuplicateLines() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setInput(from);
  }, []);

  useEffect(() => {
    if (!input.trim()) { setOutput(''); return; }
    setOutput(removeDuplicateLines(input));
  }, [input]);

  return (
    <AdvancedConverter
      title="Remove Duplicate Lines"
      description="Remove duplicate lines from your text, preserving the order of first appearance. For example, [1 apple\nbanana\napple 2] becomes [1 apple\nbanana 2]."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="Input (with duplicates)"
      toTitle="Output (unique lines)"
      backColor="rose"
      extraElements={<></>}
    />
  );
}

// ─── 6. Sort Lines ────────────────────────────────────────────────────────────

export function SortLines() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [direction, setDirection] = useState('asc');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setInput(from);
    const dir = params.get('dir');
    if (dir) setDirection(dir);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ dir: direction })

  useEffect(() => {
    if (!input.trim()) { setOutput(''); return; }
    setOutput(direction === 'asc' ? sortLinesAsc(input) : sortLinesDesc(input));
  }, [input, direction]);

  return (
    <AdvancedConverter
      title="Sort Lines"
      description="Sort lines of text alphabetically in ascending (A-Z) or descending (Z-A) order."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="Input"
      toTitle="Sorted Output"
      backColor="rose"
      extraElements={
        <select
          value={direction}
          onChange={(e) => setDirection(e.target.value)}
          className="border border-gray-300 bg-white text-gray-900 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-900"
        >
          <option value="asc">A to Z (Ascending)</option>
          <option value="desc">Z to A (Descending)</option>
        </select>
      }
    />
  );
}

// ─── 7. Reverse Text / Lines ─────────────────────────────────────────────────

export function ReverseText() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState('string');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setInput(from);
    const m = params.get('mode');
    if (m) setMode(m);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ mode })

  useEffect(() => {
    if (!input.trim()) { setOutput(''); return; }
    setOutput(mode === 'string' ? reverseString(input) : reverseLines(input));
  }, [input, mode]);

  return (
    <AdvancedConverter
      title="Reverse Text / Lines"
      description="Reverse the entire string character-by-character, or reverse the order of lines. For example, [1 hello 2] becomes [1 olleh 2]."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="Input"
      toTitle="Reversed Output"
      backColor="rose"
      extraElements={
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          className="border border-gray-300 bg-white text-gray-900 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-900"
        >
          <option value="string">Reverse entire string</option>
          <option value="lines">Reverse line order</option>
        </select>
      }
    />
  );
}

// ─── 9. Whitespace Remover ───────────────────────────────────────────────────
export function WhitespaceRemover() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [doTrimLines, setDoTrimLines] = useState(true);
  const [doCollapseSpaces, setDoCollapseSpaces] = useState(true);
  const [doRemoveBlankLines, setDoRemoveBlankLines] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setInput(from);
  }, []);

  useEffect(() => {
    if (!input.trim()) { setOutput(''); return; }
    let result = input;
    if (doTrimLines) result = trimLines(result);
    if (doCollapseSpaces) result = collapseSpaces(result);
    if (doRemoveBlankLines) result = removeBlankLines(result);
    setOutput(result);
  }, [input, doTrimLines, doCollapseSpaces, doRemoveBlankLines]);

  const checkClass = 'flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none';
  const inputClass = 'w-4 h-4 rounded accent-rose-500 cursor-pointer';

  return (
    <AdvancedConverter
      title="Whitespace / Line-break Remover"
      description="Clean up whitespace in your text. Trim line edges, collapse multiple spaces, or remove blank lines."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="Input"
      toTitle="Cleaned Output"
      backColor="rose"
      extraElements={
        <div className="flex flex-row flex-wrap gap-4">
          <label className={checkClass}>
            <input
              type="checkbox"
              className={inputClass}
              checked={doTrimLines}
              onChange={(e) => setDoTrimLines(e.target.checked)}
            />
            Trim lines
          </label>
          <label className={checkClass}>
            <input
              type="checkbox"
              className={inputClass}
              checked={doCollapseSpaces}
              onChange={(e) => setDoCollapseSpaces(e.target.checked)}
            />
            Collapse spaces
          </label>
          <label className={checkClass}>
            <input
              type="checkbox"
              className={inputClass}
              checked={doRemoveBlankLines}
              onChange={(e) => setDoRemoveBlankLines(e.target.checked)}
            />
            Remove blank lines
          </label>
        </div>
      }
    />
  );
}

// ─── 10. Regex Find & Replace ─────────────────────────────────────────────────

export function RegexFindReplace() {
  const [text, setText] = useState('');
  const [pattern, setPattern] = useState('');
  const [flags, setFlags] = useState('g');
  const [replacement, setReplacement] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setText(from);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ from: text })

  // The replace runs in a worker: a pattern like `(a+)+$` backtracks for
  // minutes on a few dozen characters, and a running RegExp cannot be
  // interrupted - only the worker holding it can be killed.
  const job = useMemo<RegexReplaceJob | null>(
    () => (text ? { kind: 'replace', text, pattern, flags, replacement } : null),
    [text, pattern, flags, replacement],
  );

  const run = useTimeboxedWorker<RegexReplaceJob, string>({
    spawn: spawnRegexWorker,
    request: job,
    fallback: (j) => regexFindReplace(j.text, j.pattern, j.flags, j.replacement),
  });

  const output = run.result ?? '';
  const error = run.timedOut
    ? `Stopped after ${REGEX_TIMEOUT_SECONDS} seconds — this pattern backtracks catastrophically on this text.`
    : run.error
      ? 'Invalid regular expression'
      : '';

  const inputClass = 'border border-gray-300 bg-white text-gray-900 px-3 py-1.5 text-sm font-mono focus:outline-none focus:border-gray-900 w-full';
  const labelClass = 'text-xs text-gray-500 uppercase tracking-wider mb-1';

  return (
    <Panel
      title="Regex Find & Replace"
      description="Apply a regular expression find and replace to any text. Supports flags like [1 g 2] (global), [1 i 2] (case-insensitive), and capture groups."
      backColor="rose"
      extraElements={
        <div className="flex flex-col gap-4">
          <div>
            <p className={labelClass}>Input Text</p>
            <textarea
              className="bg-white text-gray-900 placeholder:text-gray-400 p-3 w-full border border-gray-200 focus:border-gray-400 focus:outline-none resize-none font-mono text-sm transition-colors duration-200"
              placeholder="Your text here..."
              value={text}
              rows={5}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <p className={labelClass}>Find (regex pattern)</p>
              <input
                type="text"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                placeholder="e.g. \b\w+\b"
                className={inputClass}
              />
            </div>
            <div>
              <p className={labelClass}>Flags</p>
              <input
                type="text"
                value={flags}
                onChange={(e) => setFlags(e.target.value)}
                placeholder="g, i, m, gi..."
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <p className={labelClass}>Replace With</p>
            <input
              type="text"
              value={replacement}
              onChange={(e) => setReplacement(e.target.value)}
              placeholder="Replacement (use $1, $2 for groups)"
              className={inputClass}
            />
          </div>
          {error && (
            <p className="text-rose-400 text-sm font-mono">{error}</p>
          )}
          <div>
            <p className={labelClass}>Result</p>
            <textarea
              className="bg-gray-50 text-gray-900 p-3 w-full border border-gray-200 resize-none font-mono text-sm cursor-default"
              rows={5}
              value={output}
              readOnly
            />
          </div>
        </div>
      }
    />
  );
}

// ─── 11. Text Repeater ────────────────────────────────────────────────────────

export function TextRepeater() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [times, setTimes] = useState(3);
  const [separator, setSeparator] = useState('\\n');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setInput(from);
  }, []);

  useEffect(() => {
    if (!input.trim()) { setOutput(''); return; }
    // Resolve escape sequences in separator
    const resolvedSep = separator.replace(/\\n/g, '\n').replace(/\\t/g, '\t');
    setOutput(repeatText(input, times, resolvedSep));
  }, [input, times, separator]);

  return (
    <AdvancedConverter
      title="Text Repeater"
      description="Repeat any text N times with a custom separator. Use [1 \n 2] for newline or [1 \t 2] for tab as the separator."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="Text to Repeat"
      toTitle="Repeated Output"
      backColor="rose"
      extraElements={
        <div className="flex flex-row flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 uppercase tracking-wider">Times</label>
            <input
              type="number"
              min={1}
              max={1000}
              value={times}
              onChange={(e) => setTimes(Math.max(1, parseInt(e.target.value) || 1))}
              className="bg-white text-gray-900 border border-gray-200 px-3 py-1.5 text-sm w-20 focus:outline-none focus:border-white/30"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 uppercase tracking-wider">Separator</label>
            <input
              type="text"
              value={separator}
              onChange={(e) => setSeparator(e.target.value)}
              placeholder="\\n"
              className="bg-white text-gray-900 border border-gray-200 px-3 py-1.5 text-sm w-24 font-mono focus:outline-none focus:border-white/30"
            />
          </div>
        </div>
      }
    />
  );
}
