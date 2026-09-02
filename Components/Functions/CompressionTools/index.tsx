'use client';

import React, { useEffect, useState } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import {
  BinaryEncoding,
  CompressionFormat,
  compressBytes,
  compressionStats,
  decodeBytes,
  decompressBytes,
  describeCompression,
  encodeBytes,
  formatBytes,
} from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

type Direction = 'compress' | 'decompress';

const selectClass =
  'border border-gray-300 bg-white text-gray-900 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-900';

type ConverterProps = {
  format: CompressionFormat;
  title: string;
  description: string;
};

const CompressionConverter = ({ format, title, description }: ConverterProps) => {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');
  const [stats, setStats] = useState('');
  const [direction, setDirection] = useState<Direction>('compress');
  const [encoding, setEncoding] = useState<BinaryEncoding>('base64');
  const [level, setLevel] = useState('6');

  useEffect(() => {
    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = searchParams.get('from') ?? '';
    if (from) setFromValue(from);

    const mode = searchParams.get('mode');
    if (mode === 'compress' || mode === 'decompress') setDirection(mode);

    const enc = searchParams.get('encoding');
    if (enc === 'base64' || enc === 'hex') setEncoding(enc);

    const lvl = searchParams.get('level');
    if (lvl && /^[0-9]$/.test(lvl)) setLevel(lvl);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ mode: direction, encoding, level })

  useEffect(() => {
    if (!fromValue.trim()) {
      setToValue('');
      setStats('');
      return;
    }
    try {
      if (direction === 'compress') {
        const compressed = compressBytes(new TextEncoder().encode(fromValue), format, level);
        setToValue(encodeBytes(compressed, encoding));
        setStats(describeCompression(compressionStats(fromValue, compressed)));
      } else {
        const compressed = decodeBytes(fromValue, encoding);
        const plain = decompressBytes(compressed, format);
        setToValue(new TextDecoder().decode(plain));
        setStats(`${formatBytes(compressed.length)} → ${formatBytes(plain.length)}`);
      }
    } catch (error) {
      setToValue(error instanceof Error ? error.message : 'Could not process this input');
      setStats('');
    }
  }, [fromValue, direction, encoding, level, format]);

  const extraElements = (
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
      <div className="flex items-center gap-2">
        <label className="text-gray-400 text-xs whitespace-nowrap">
          {direction === 'compress' ? 'Output as' : 'Input is'}
        </label>
        <select
          className={selectClass}
          value={encoding}
          onChange={(e) => setEncoding(e.target.value as BinaryEncoding)}
        >
          <option value="base64">Base64</option>
          <option value="hex">Hex</option>
        </select>
      </div>
      {direction === 'compress' && (
        <div className="flex items-center gap-2">
          <label className="text-gray-400 text-xs whitespace-nowrap">Level</label>
          <select className={selectClass} value={level} onChange={(e) => setLevel(e.target.value)}>
            <option value="1">1 (fastest)</option>
            <option value="6">6 (default)</option>
            <option value="9">9 (smallest)</option>
          </select>
        </div>
      )}
      {stats && (
        <span className="text-gray-500 text-xs font-mono whitespace-nowrap">{stats}</span>
      )}
    </>
  );

  return (
    <AdvancedConverter
      title={title}
      description={description}
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle={direction === 'compress' ? 'Input' : 'Compressed'}
      toTitle={direction === 'compress' ? 'Compressed' : 'Output'}
      extraElements={extraElements}
      backColor="yellow"
    />
  );
};

export const GzipConverter = () => (
  <CompressionConverter
    format="gzip"
    title="Gzip Compress & Decompress"
    description="Compress text with [1 gzip 2] (RFC 1952) or gunzip it back. This is the format the [1 gzip 2] command line tool and [1 Content-Encoding: gzip 2] use: a DEFLATE stream wrapped in a header and a CRC-32 footer. Compressed bytes are shown as Base64 or hex."
  />
);

export const ZlibConverter = () => (
  <CompressionConverter
    format="zlib"
    title="Zlib Deflate & Inflate"
    description="Compress text into a [1 zlib 2] stream (RFC 1950) or inflate one back. Zlib wraps DEFLATE in a two byte header and an Adler-32 checksum, and usually starts with [1 78 9c 2]. Compressed bytes are shown as Base64 or hex."
  />
);

export const RawDeflateConverter = () => (
  <CompressionConverter
    format="raw"
    title="Raw Deflate & Inflate"
    description="Compress text into a bare [1 DEFLATE 2] stream (RFC 1951) or inflate one back. No header, no checksum, no length. This is what sits inside zlib, gzip and ZIP entries, and what [1 Content-Encoding: deflate 2] servers sometimes send. Compressed bytes are shown as Base64 or hex."
  />
);
