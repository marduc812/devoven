'use client';

import { useState, useEffect } from 'react';
import { FileTextArea } from '@/Components/View/FileInput';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import Panel from '@/Components/MainView/MainPanel/Panel';
import {
  addLineNumbers,
  removeLineNumbers,
  indentText,
  dedentText,
  convertIndent,
  extractColumns,
  detectDelimiter,
  truncateByChars,
  truncateByWords,
  truncateByLines,
  removeEmojis,
  extractEmojis,
  wrapText,
  unwrapText,
} from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

const selectClass = 'border border-gray-300 bg-white text-gray-900 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-900';
const inputClass = 'border border-gray-300 bg-white text-gray-900 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-900';
const labelClass = 'text-xs text-gray-500 uppercase tracking-wider';

// ─── 1. Line Numberer ─────────────────────────────────────────────────────────

export function LineNumberer() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState('add');
  const [startFrom, setStartFrom] = useState('1');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setInput(from);
    const text = params.get('text');
    if (text) setInput(text);
    const start = params.get('start');
    if (start) setStartFrom(start);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ start: startFrom })

  useEffect(() => {
    if (!input.trim()) { setOutput(''); return; }
    if (mode === 'add') {
      const start = parseInt(startFrom) || 1;
      setOutput(addLineNumbers(input, start));
    } else {
      setOutput(removeLineNumbers(input));
    }
  }, [input, mode, startFrom]);

  return (
    <AdvancedConverter
      title="Line Numberer"
      description="Add or remove line numbers from text. For example, [1 apple\nbanana 2] becomes [1 1. apple\n2. banana 2] when adding numbers."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="Input"
      toTitle="Output"
      backColor="rose"
      extraElements={
        <div className="flex flex-row flex-wrap gap-3 items-center">
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className={selectClass}
          >
            <option value="add">Add Numbers</option>
            <option value="remove">Remove Numbers</option>
          </select>
          {mode === 'add' && (
            <div className="flex items-center gap-2">
              <label className={labelClass}>Start from</label>
              <input
                type="number"
                min={1}
                value={startFrom}
                onChange={(e) => setStartFrom(e.target.value)}
                className={`${inputClass} w-20`}
              />
            </div>
          )}
        </div>
      }
    />
  );
}

// ─── 2. Indent / Dedent ───────────────────────────────────────────────────────

export function IndentDedent() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState('indent');
  const [size, setSize] = useState('4');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setInput(from);
    const text = params.get('text');
    if (text) setInput(text);
  }, []);

  useEffect(() => {
    if (!input.trim()) { setOutput(''); return; }
    const spaces = parseInt(size) || 4;
    switch (mode) {
      case 'indent':
        setOutput(indentText(input, spaces));
        break;
      case 'dedent':
        setOutput(dedentText(input));
        break;
      case 'tabs-to-spaces':
        setOutput(convertIndent(input, spaces, spaces));
        break;
      case 'spaces-to-tabs':
        setOutput(input.split('\n').map(line => {
          const match = line.match(/^( +)/);
          if (!match) return line;
          const count = match[1].length;
          const tabs = Math.floor(count / spaces);
          return '\t'.repeat(tabs) + line.slice(tabs * spaces);
        }).join('\n'));
        break;
      default:
        setOutput(input);
    }
  }, [input, mode, size]);

  return (
    <AdvancedConverter
      title="Indent / Dedent"
      description="Add or remove indentation from text. Use Indent to add spaces, Dedent to strip common leading whitespace, or convert between tabs and spaces."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="Input"
      toTitle="Output"
      backColor="rose"
      extraElements={
        <div className="flex flex-row flex-wrap gap-3 items-center">
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className={selectClass}
          >
            <option value="indent">Indent</option>
            <option value="dedent">Dedent</option>
            <option value="tabs-to-spaces">Convert Tabs to Spaces</option>
            <option value="spaces-to-tabs">Convert Spaces to Tabs</option>
          </select>
          <div className="flex items-center gap-2">
            <label className={labelClass}>Size</label>
            <select
              value={size}
              onChange={(e) => setSize(e.target.value)}
              className={selectClass}
            >
              <option value="2">2</option>
              <option value="4">4</option>
              <option value="8">8</option>
            </select>
          </div>
        </div>
      }
    />
  );
}

// ─── 3. Column Extractor ──────────────────────────────────────────────────────

export function ColumnExtractor() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [delimiter, setDelimiter] = useState(',');
  const [columns, setColumns] = useState('1,2');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setInput(from);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ from: input })

  useEffect(() => {
    if (!input.trim()) { setOutput(''); return; }
    const delim = delimiter === 'tab' ? '\t' : delimiter === 'space' ? ' ' : delimiter;
    const cols = columns.split(',').map(c => parseInt(c.trim())).filter(c => !isNaN(c) && c > 0);
    if (cols.length === 0) { setOutput(input); return; }
    setOutput(extractColumns(input, delim, cols));
  }, [input, delimiter, columns]);

  function handleDetect() {
    if (!input) return;
    const detected = detectDelimiter(input);
    if (detected === '\t') setDelimiter('tab');
    else if (detected === ' ') setDelimiter('space');
    else setDelimiter(detected);
  }

  const textareaClass = 'bg-white backdrop-blur-sm text-gray-900 placeholder:text-gray-400 p-3 w-full border border-gray-200 focus:border-gray-400 focus:outline-none resize-none transition-colors duration-200 font-mono text-sm';

  return (
    <Panel
      title="Column Extractor"
      description="Extract specific columns from delimited text (CSV, TSV, or space-separated). Enter column numbers separated by commas (e.g. [1 1,3,5 2])."
      backColor="rose"
      extraElements={
        <div className="flex flex-col gap-4">
          <div>
            <p className={`${labelClass} mb-1`}>Input Text</p>
            <FileTextArea>
              <textarea
                className={textareaClass}
                placeholder="Paste your delimited text here..."
                value={input}
                rows={6}
                onChange={(e) => setInput(e.target.value)}
              />
            </FileTextArea>
          </div>
          <div className="flex flex-row flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2">
              <label className={labelClass}>Delimiter</label>
              <select
                value={delimiter}
                onChange={(e) => setDelimiter(e.target.value)}
                className={selectClass}
              >
                <option value=",">Comma (,)</option>
                <option value="tab">Tab</option>
                <option value="space">Space</option>
                <option value="|">Pipe (|)</option>
                <option value=";">Semicolon (;)</option>
              </select>
            </div>
            <button
              onClick={handleDetect}
              className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 px-3 py-1.5 text-sm transition-colors duration-200"
            >
              Auto-detect
            </button>
            <div className="flex items-center gap-2">
              <label className={labelClass}>Columns</label>
              <input
                type="text"
                value={columns}
                onChange={(e) => setColumns(e.target.value)}
                placeholder="e.g. 1,3,5"
                className={`${inputClass} w-32`}
              />
            </div>
          </div>
          <div>
            <p className={`${labelClass} mb-1`}>Output</p>
            <textarea
              className="bg-gray-50 text-gray-900 p-3 w-full border border-gray-200 resize-none font-mono text-sm cursor-default"
              rows={6}
              value={output}
              readOnly
            />
          </div>
        </div>
      }
    />
  );
}

// ─── 4. Text Truncator ────────────────────────────────────────────────────────

export function TextTruncator() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState('chars');
  const [limit, setLimit] = useState('100');
  const [ellipsis, setEllipsis] = useState('...');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setInput(from);
  }, []);

  useEffect(() => {
    if (!input.trim()) { setOutput(''); return; }
    const lim = parseInt(limit) || 100;
    switch (mode) {
      case 'chars':
        setOutput(truncateByChars(input, lim, ellipsis));
        break;
      case 'words':
        setOutput(truncateByWords(input, lim, ellipsis));
        break;
      case 'lines':
        setOutput(truncateByLines(input, lim, ellipsis));
        break;
    }
  }, [input, mode, limit, ellipsis]);

  return (
    <AdvancedConverter
      title="Text Truncator"
      description="Truncate text to a character, word, or line limit with a configurable ellipsis. For example, [1 Hello World 2] truncated to 8 chars becomes [1 Hello... 2]."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="Input"
      toTitle="Truncated Output"
      backColor="rose"
      extraElements={
        <div className="flex flex-row flex-wrap gap-3 items-center">
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className={selectClass}
          >
            <option value="chars">Characters</option>
            <option value="words">Words</option>
            <option value="lines">Lines</option>
          </select>
          <div className="flex items-center gap-2">
            <label className={labelClass}>Limit</label>
            <input
              type="number"
              min={1}
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              className={`${inputClass} w-24`}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className={labelClass}>Ellipsis</label>
            <input
              type="text"
              value={ellipsis}
              onChange={(e) => setEllipsis(e.target.value)}
              placeholder="..."
              className={`${inputClass} w-24 font-mono`}
            />
          </div>
        </div>
      }
    />
  );
}

// ─── 6. Emoji Remover ─────────────────────────────────────────────────────────

export function EmojiRemover() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState('remove');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setInput(from);
  }, []);

  useEffect(() => {
    if (!input) { setOutput(''); return; }
    setOutput(mode === 'remove' ? removeEmojis(input) : extractEmojis(input));
  }, [input, mode]);

  return (
    <AdvancedConverter
      title="Emoji Remover"
      description="Remove all emoji characters from text, or extract just the emojis. For example, [1 Hello 😀 World 2] with Remove Emojis becomes [1 Hello World 2]."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="Input"
      toTitle="Output"
      backColor="rose"
      extraElements={
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          className={selectClass}
        >
          <option value="remove">Remove Emojis</option>
          <option value="extract">Extract Emojis</option>
        </select>
      }
    />
  );
}

// ─── 7. Word Wrap ─────────────────────────────────────────────────────────────

export function WordWrap() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState('wrap');
  const [width, setWidth] = useState('80');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setInput(from);
    const w = params.get('width');
    if (w) setWidth(w);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ width })

  useEffect(() => {
    if (!input) { setOutput(''); return; }
    if (mode === 'wrap') {
      const w = parseInt(width) || 80;
      setOutput(wrapText(input, w));
    } else {
      setOutput(unwrapText(input));
    }
  }, [input, mode, width]);

  return (
    <AdvancedConverter
      title="Word Wrap"
      description="Wrap text at a specified column width, or unwrap (join) lines back together. Default wrap width is [1 80 2] characters."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="Input"
      toTitle="Output"
      backColor="rose"
      extraElements={
        <div className="flex flex-row flex-wrap gap-3 items-center">
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className={selectClass}
          >
            <option value="wrap">Wrap</option>
            <option value="unwrap">Unwrap</option>
          </select>
          {mode === 'wrap' && (
            <div className="flex items-center gap-2">
              <label className={labelClass}>Width</label>
              <input
                type="number"
                min={1}
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                className={`${inputClass} w-20`}
              />
            </div>
          )}
        </div>
      }
    />
  );
}
