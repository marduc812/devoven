'use client';

import React, { useEffect, useState } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import { useShareLink } from '@/Components/Functions/ShareLink';
import {
  LZ_VARIANTS,
  LzVariant,
  describeLz,
  isLzVariant,
  lzCompress,
  lzDecompress,
  lzStats,
  variantHint,
  variantLabel,
} from './logic';

type Direction = 'compress' | 'decompress';

const selectClass =
  'border border-gray-300 bg-white text-gray-900 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-900';

export const LzStringConverter = () => {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');
  const [stats, setStats] = useState('');
  const [direction, setDirection] = useState<Direction>('compress');
  const [variant, setVariant] = useState<LzVariant>('base64');

  useEffect(() => {
    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = searchParams.get('from') ?? '';
    if (from) setFromValue(from);

    const mode = searchParams.get('mode');
    if (mode === 'compress' || mode === 'decompress') setDirection(mode);

    const v = searchParams.get('variant');
    if (isLzVariant(v)) setVariant(v);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ mode: direction, variant });

  useEffect(() => {
    if (!fromValue) {
      setToValue('');
      setStats('');
      return;
    }
    try {
      if (direction === 'compress') {
        const payload = lzCompress(fromValue, variant);
        setToValue(payload);
        setStats(describeLz(lzStats(fromValue, payload)));
      } else {
        const text = lzDecompress(fromValue, variant);
        setToValue(text);
        setStats(describeLz(lzStats(text, fromValue)));
      }
    } catch (error) {
      setToValue(error instanceof Error ? error.message : 'Could not process this input');
      setStats('');
    }
  }, [fromValue, direction, variant]);

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
          value={variant}
          onChange={(e) => setVariant(e.target.value as LzVariant)}
        >
          {LZ_VARIANTS.map((v) => (
            <option key={v} value={v}>
              {variantLabel[v]}
            </option>
          ))}
        </select>
      </div>
      {stats && <span className="text-gray-500 text-xs font-mono whitespace-nowrap">{stats}</span>}
      <p className="basis-full text-xs text-gray-500">{variantHint[variant]}</p>
    </>
  );

  return (
    <AdvancedConverter
      title="LZString Compress & Decompress"
      description="Compress text with [1 lz-string 2], the LZ-based compressor that stores its output as a string rather than as bytes — which is why it turns up holding app state in a URL, a cookie or [1 localStorage 2]. Pick the flavour that matches where the payload has to survive: [1 Base64 2], URL-safe, UTF-16 or raw hex bytes."
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
