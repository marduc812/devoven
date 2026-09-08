'use client';

import { useState, useEffect, useMemo } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import { useShareLink } from '@/Components/Functions/ShareLink';
import {
  parseObjectId,
  formatObjectId,
  objectIdForDate,
  parseFileTime,
  formatFileTime,
  toFileTime,
} from './logic';

const selectClass = 'border border-gray-300 bg-white text-gray-900 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-900';
const labelClass = 'text-xs text-gray-500 uppercase tracking-wider';

type Direction = 'decode' | 'encode';

const run = (fn: () => string): string => {
  try {
    return fn();
  } catch (e: unknown) {
    return e instanceof Error ? `Error: ${e.message}` : 'Invalid input';
  }
};

// ─── MongoDB ObjectId to Timestamp ────────────────────────────────────────────

export function ObjectIdTimestamp() {
  const [input, setInput] = useState('');
  const [direction, setDirection] = useState<Direction>('decode');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setInput(from);
    const mode = params.get('mode');
    if (mode === 'decode' || mode === 'encode') setDirection(mode);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ mode: direction });

  const output = useMemo(() => {
    if (!input.trim()) return '';
    return run(() =>
      direction === 'decode'
        ? formatObjectId(parseObjectId(input))
        : objectIdForDate(input),
    );
  }, [input, direction]);

  return (
    <AdvancedConverter
      title="MongoDB ObjectId to Timestamp"
      description="The first four bytes of an ObjectId are the second it was created in, so [1 507f1f77bcf86cd799439011 2] carries a date without a field to hold one. The other direction builds the lowest ObjectId for a moment in time, which is the bound you want for a range query on [1 _id 2]."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle={direction === 'decode' ? 'ObjectId' : 'Date or Unix Timestamp'}
      toTitle={direction === 'decode' ? 'Timestamp' : 'ObjectId Bound'}
      backColor="cyan"
      extraElements={
        <div className="flex items-center gap-2">
          <label className={labelClass}>Direction</label>
          <select
            className={selectClass}
            value={direction}
            onChange={(e) => setDirection(e.target.value as Direction)}
          >
            <option value="decode">ObjectId to date</option>
            <option value="encode">Date to ObjectId</option>
          </select>
        </div>
      }
    />
  );
}

// ─── Windows FILETIME to Unix ─────────────────────────────────────────────────

export function FileTimeConverter() {
  const [input, setInput] = useState('');
  const [direction, setDirection] = useState<Direction>('decode');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setInput(from);
    const mode = params.get('mode');
    if (mode === 'decode' || mode === 'encode') setDirection(mode);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ mode: direction });

  const output = useMemo(() => {
    if (!input.trim()) return '';
    return run(() =>
      direction === 'decode'
        ? formatFileTime(parseFileTime(input))
        : toFileTime(input),
    );
  }, [input, direction]);

  return (
    <AdvancedConverter
      title="Windows FILETIME to Unix Time"
      description="A FILETIME counts 100-nanosecond intervals since 1 January 1601, which is what you find in registry values, event logs, LDAP attributes and NTFS timestamps. Paste it as decimal, as [1 0x01D7A3B4C5D6E7F8 2], or as the [1 high low 2] pair a Windows structure stores."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle={direction === 'decode' ? 'FILETIME' : 'Date or Unix Timestamp'}
      toTitle={direction === 'decode' ? 'Unix Time' : 'FILETIME'}
      backColor="cyan"
      extraElements={
        <div className="flex items-center gap-2">
          <label className={labelClass}>Direction</label>
          <select
            className={selectClass}
            value={direction}
            onChange={(e) => setDirection(e.target.value as Direction)}
          >
            <option value="decode">FILETIME to Unix</option>
            <option value="encode">Unix to FILETIME</option>
          </select>
        </div>
      }
    />
  );
}
