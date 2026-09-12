'use client';

import React, { useEffect, useState } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import {
  BinaryEncoding,
  compressionStats,
  decodeBytes,
  describeCompression,
  encodeBytes,
  formatBytes,
} from '../CompressionTools/logic';
import { compressLzma, decompressBzip2, decompressLzma } from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

type Direction = 'compress' | 'decompress';

const selectClass =
  'border border-gray-300 bg-white text-gray-900 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-900';

const EncodingSelect = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: BinaryEncoding;
  onChange: (value: BinaryEncoding) => void;
}) => (
  <div className="flex items-center gap-2">
    <label className="text-gray-400 text-xs whitespace-nowrap">{label}</label>
    <select
      className={selectClass}
      value={value}
      onChange={(e) => onChange(e.target.value as BinaryEncoding)}
    >
      <option value="base64">Base64</option>
      <option value="hex">Hex</option>
    </select>
  </div>
);

const Stats = ({ children }: { children: string }) =>
  children ? (
    <span className="text-gray-500 text-xs font-mono whitespace-nowrap">{children}</span>
  ) : null;

// ─── Bzip2 ────────────────────────────────────────────────────────────────────

export const Bzip2Decompressor = () => {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');
  const [stats, setStats] = useState('');
  const [encoding, setEncoding] = useState<BinaryEncoding>('base64');

  useEffect(() => {
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = params.get('from') ?? '';
    if (from) setFromValue(from);

    const enc = params.get('encoding');
    if (enc === 'base64' || enc === 'hex') setEncoding(enc);
  }, []);

  useShareLink({ encoding });

  useEffect(() => {
    if (!fromValue.trim()) {
      setToValue('');
      setStats('');
      return;
    }
    try {
      const compressed = decodeBytes(fromValue, encoding);
      const plain = decompressBzip2(compressed);
      setToValue(new TextDecoder().decode(plain));
      setStats(`${formatBytes(compressed.length)} → ${formatBytes(plain.length)}`);
    } catch (error) {
      setToValue(error instanceof Error ? error.message : 'Could not process this input');
      setStats('');
    }
  }, [fromValue, encoding]);

  return (
    <AdvancedConverter
      title="Bzip2 Decompress"
      description="Decompress a [1 bzip2 2] stream — what the [1 bzip2 2] command line tool writes and what sits inside a [1 .tar.bz2 2]. Paste the compressed bytes as Base64 or hex; they start with [1 BZh 2]. There is no compress direction here: bzip2 encoders are large and slow in a browser, and decoding is the direction people need."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="Compressed"
      toTitle="Output"
      extraElements={
        <>
          <EncodingSelect label="Input is" value={encoding} onChange={setEncoding} />
          <Stats>{stats}</Stats>
        </>
      }
      backColor="yellow"
    />
  );
};

// ─── LZMA ─────────────────────────────────────────────────────────────────────

export const LzmaConverter = () => {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');
  const [stats, setStats] = useState('');
  const [direction, setDirection] = useState<Direction>('compress');
  const [encoding, setEncoding] = useState<BinaryEncoding>('base64');
  const [level, setLevel] = useState('6');

  useEffect(() => {
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = params.get('from') ?? '';
    if (from) setFromValue(from);

    const mode = params.get('mode');
    if (mode === 'compress' || mode === 'decompress') setDirection(mode);

    const enc = params.get('encoding');
    if (enc === 'base64' || enc === 'hex') setEncoding(enc);

    const lvl = params.get('level');
    if (lvl && /^[1-9]$/.test(lvl)) setLevel(lvl);
  }, []);

  useShareLink({ mode: direction, encoding, level });

  useEffect(() => {
    if (!fromValue.trim()) {
      setToValue('');
      setStats('');
      return;
    }
    try {
      if (direction === 'compress') {
        const compressed = compressLzma(new TextEncoder().encode(fromValue), level);
        setToValue(encodeBytes(compressed, encoding));
        setStats(describeCompression(compressionStats(fromValue, compressed)));
      } else {
        const compressed = decodeBytes(fromValue, encoding);
        const plain = decompressLzma(compressed);
        setToValue(new TextDecoder().decode(plain));
        setStats(`${formatBytes(compressed.length)} → ${formatBytes(plain.length)}`);
      }
    } catch (error) {
      setToValue(error instanceof Error ? error.message : 'Could not process this input');
      setStats('');
    }
  }, [fromValue, direction, encoding, level]);

  return (
    <AdvancedConverter
      title="LZMA Compress & Decompress"
      description="Compress text with [1 LZMA 2] or decompress it back. This is the [1 alone 2] format the [1 lzma 2] command line tool writes — a properties byte, a dictionary size and a length, then the stream — and what [1 xz --format=lzma 2] produces. It is not the [1 .xz 2] container. Compressed bytes are shown as Base64 or hex."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle={direction === 'compress' ? 'Input' : 'Compressed'}
      toTitle={direction === 'compress' ? 'Compressed' : 'Output'}
      extraElements={
        <>
          <div className="flex items-center gap-2">
            <label className="text-gray-400 text-xs whitespace-nowrap">Direction</label>
            <select
              className={selectClass}
              value={direction}
              onChange={(e) => setDirection(e.target.value as Direction)}
            >
              <option value="compress">Compress</option>
              <option value="decompress">Decompress</option>
            </select>
          </div>
          <EncodingSelect
            label={direction === 'compress' ? 'Output as' : 'Input is'}
            value={encoding}
            onChange={setEncoding}
          />
          {direction === 'compress' && (
            <div className="flex items-center gap-2">
              <label className="text-gray-400 text-xs whitespace-nowrap">Preset</label>
              <select className={selectClass} value={level} onChange={(e) => setLevel(e.target.value)}>
                <option value="1">1 (fastest)</option>
                <option value="6">6 (default)</option>
                <option value="9">9 (smallest)</option>
              </select>
            </div>
          )}
          <Stats>{stats}</Stats>
        </>
      }
      backColor="yellow"
    />
  );
};
