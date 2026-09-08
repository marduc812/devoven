'use client';

import { useState, useEffect, useMemo } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import { useShareLink } from '@/Components/Functions/ShareLink';
import {
  removeDiacritics,
  listDiacritics,
  stripAnsi,
  listAnsi,
  stripHtmlTags,
  padLines,
  type AnsiMode,
  type DiacriticsMode,
  type PadSide,
} from './logic';

const selectClass = 'border border-gray-300 bg-white text-gray-900 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-900';
const inputClass = 'border border-gray-300 bg-white text-gray-900 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-900';
const labelClass = 'text-xs text-gray-500 uppercase tracking-wider';

const checkbox = (label: string, checked: boolean, onChange: (v: boolean) => void) => (
  <label className="flex items-center gap-2 cursor-pointer">
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    <span className="text-gray-500 text-xs whitespace-nowrap">{label}</span>
  </label>
);

// ─── 1. Remove Diacritics ─────────────────────────────────────────────────────

export function RemoveDiacritics() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<DiacriticsMode>('marks');
  const [view, setView] = useState<'clean' | 'list'>('clean');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setInput(from);
    const m = params.get('mode');
    if (m === 'marks' || m === 'fold') setMode(m);
    if (params.get('view') === 'list') setView('list');
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ mode, view });

  const output = useMemo(() => {
    if (!input) return '';
    return view === 'list' ? listDiacritics(input, mode) : removeDiacritics(input, mode);
  }, [input, mode, view]);

  return (
    <AdvancedConverter
      title="Remove Diacritics"
      description="Strip the accents from text: [1 Crème Brûlée 2] becomes [1 Creme Brulee 2]. Combining marks come off through Unicode NFD; the fold option also transliterates the letters that hide their mark inside the code point, so [1 Straße 2] becomes [1 Strasse 2] and [1 Ærø 2] becomes [1 Aero 2]."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="Input"
      toTitle={view === 'list' ? 'Characters Changed' : 'Without Diacritics'}
      backColor="rose"
      extraElements={
        <>
          <div className="flex items-center gap-2">
            <label className={labelClass}>Mode</label>
            <select className={selectClass} value={mode} onChange={(e) => setMode(e.target.value as DiacriticsMode)}>
              <option value="marks">Combining marks only</option>
              <option value="fold">Also fold ø, ł, æ, ß</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className={labelClass}>Show</label>
            <select className={selectClass} value={view} onChange={(e) => setView(e.target.value as 'clean' | 'list')}>
              <option value="clean">Cleaned text</option>
              <option value="list">What changed</option>
            </select>
          </div>
        </>
      }
    />
  );
}

// ─── 2. Strip ANSI Codes ──────────────────────────────────────────────────────

export function StripAnsiCodes() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<AnsiMode>('strip');
  const [controls, setControls] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setInput(from);
    const m = params.get('mode');
    if (m === 'strip' || m === 'list') setMode(m);
    if (params.get('controls') === 'true') setControls(true);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ mode, controls });

  const output = useMemo(() => {
    if (!input) return '';
    return mode === 'list' ? listAnsi(input) : stripAnsi(input, controls);
  }, [input, mode, controls]);

  return (
    <AdvancedConverter
      title="Strip ANSI Escape Codes"
      description="Clean the colour out of captured terminal output: CSI sequences such as [1 ESC[31m 2], OSC sequences that set a window title or wrap a hyperlink, and the single-character escapes between them. List mode names each sequence instead of removing it, so you can see what the colouring was doing."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="Terminal Output"
      toTitle={mode === 'list' ? 'Sequences Found' : 'Plain Text'}
      backColor="rose"
      extraElements={
        <>
          <div className="flex items-center gap-2">
            <label className={labelClass}>Mode</label>
            <select className={selectClass} value={mode} onChange={(e) => setMode(e.target.value as AnsiMode)}>
              <option value="strip">Strip codes</option>
              <option value="list">List codes</option>
            </select>
          </div>
          {mode === 'strip' && checkbox('Also remove other control characters', controls, setControls)}
        </>
      }
    />
  );
}

// ─── 3. Strip HTML Tags ───────────────────────────────────────────────────────

export function StripHtmlTags() {
  const [input, setInput] = useState('');
  const [keepBreaks, setKeepBreaks] = useState(true);
  const [decode, setDecode] = useState(true);
  const [tidy, setTidy] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setInput(from);
    if (params.get('breaks') === 'false') setKeepBreaks(false);
    if (params.get('entities') === 'false') setDecode(false);
    if (params.get('tidy') === 'false') setTidy(false);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ breaks: keepBreaks, entities: decode, tidy });

  const output = useMemo(() => {
    if (!input) return '';
    return stripHtmlTags(input, { keepBreaks, decodeEntities: decode, tidy });
  }, [input, keepBreaks, decode, tidy]);

  return (
    <AdvancedConverter
      title="Strip HTML Tags"
      description="Pull the text out of a fragment of HTML. Script and style bodies go first, then comments, then the tags themselves, so [1 <p>Hello <b>world</b></p> 2] leaves [1 Hello world 2]. Block-level closers can become line breaks, and entities such as [1 &amp;amp; 2] are decoded once the markup is gone."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="HTML"
      toTitle="Text"
      backColor="rose"
      extraElements={
        <>
          {checkbox('Block tags become line breaks', keepBreaks, setKeepBreaks)}
          {checkbox('Decode entities', decode, setDecode)}
          {checkbox('Collapse blank lines', tidy, setTidy)}
        </>
      }
    />
  );
}

// ─── 4. Pad Lines ─────────────────────────────────────────────────────────────

export function PadLines() {
  const [input, setInput] = useState('');
  const [width, setWidth] = useState('20');
  const [side, setSide] = useState<PadSide>('right');
  const [fill, setFill] = useState(' ');
  const [truncate, setTruncate] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setInput(from);
    const w = params.get('width');
    if (w) setWidth(w);
    const s = params.get('side');
    if (s === 'left' || s === 'right' || s === 'both') setSide(s);
    const f = params.get('fill');
    if (f) setFill(f);
    if (params.get('truncate') === 'true') setTruncate(true);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ width, side, fill: fill === ' ' ? null : fill, truncate });

  const output = useMemo(() => {
    if (!input) return '';
    try {
      return padLines(input, { width: Number(width), side, fill, truncate });
    } catch (e: unknown) {
      return e instanceof Error ? `Error: ${e.message}` : 'Invalid width';
    }
  }, [input, width, side, fill, truncate]);

  return (
    <AdvancedConverter
      title="Pad Lines"
      description="Bring every line to the same width by padding it with a character of your choice. Pad on the right to build a fixed-width column, on the left to right-align numbers, or on both sides to centre. Lines already longer than the width are left alone unless you ask for them to be cut."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="Input"
      toTitle="Padded"
      backColor="rose"
      extraElements={
        <>
          <div className="flex items-center gap-2">
            <label className={labelClass}>Width</label>
            <input
              type="number"
              min={0}
              className={`${inputClass} w-24`}
              value={width}
              onChange={(e) => setWidth(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className={labelClass}>Pad</label>
            <select className={selectClass} value={side} onChange={(e) => setSide(e.target.value as PadSide)}>
              <option value="right">Right</option>
              <option value="left">Left</option>
              <option value="both">Both (centre)</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className={labelClass}>Fill</label>
            <input
              className={`${inputClass} w-16 font-mono`}
              maxLength={2}
              value={fill}
              onChange={(e) => setFill(e.target.value)}
            />
          </div>
          {checkbox('Cut longer lines', truncate, setTruncate)}
        </>
      }
    />
  );
}
