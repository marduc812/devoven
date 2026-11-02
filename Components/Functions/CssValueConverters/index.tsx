'use client';

import React, { useEffect, useState } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import { convertPxToRemBatch, convertRemToPxBatch } from './logic';

export const CssValueConverters = ({ article }: { article?: React.ReactNode } = {}) => {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');
  const [mode, setMode] = useState<'px-to-rem' | 'rem-to-px'>('px-to-rem');
  const [baseFontSize, setBaseFontSize] = useState(16);

  useEffect(() => {
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = params.get('from') ?? '';
    if (from) setFromValue(from);
  }, []);

  useEffect(() => {
    if (!fromValue.trim()) { setToValue(''); return; }
    if (mode === 'px-to-rem') {
      setToValue(convertPxToRemBatch(fromValue, baseFontSize));
    } else {
      setToValue(convertRemToPxBatch(fromValue, baseFontSize));
    }
  }, [fromValue, mode, baseFontSize]);

  const fromTitle = mode === 'px-to-rem' ? 'Pixel values (one per line)' : 'Rem values (one per line)';
  const toTitle = mode === 'px-to-rem' ? 'Rem values' : 'Pixel values';

  const extraEl = (
    <div className="flex flex-row gap-3 items-center flex-wrap">
      <select
        className="border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm focus:outline-none focus:border-gray-900"
        value={mode}
        onChange={e => {
          setMode(e.target.value as typeof mode);
          setFromValue('');
          setToValue('');
        }}
      >
        <option value="px-to-rem">px → rem</option>
        <option value="rem-to-px">rem → px</option>
      </select>
      <label className="flex items-center gap-2 text-gray-700 text-sm">
        Base:
        <input
          type="number"
          min={1}
          max={100}
          value={baseFontSize}
          onChange={e => setBaseFontSize(Number(e.target.value) || 16)}
          className="bg-white text-gray-900 border border-gray-200 px-2 py-1.5 text-sm w-16 focus:outline-none font-mono"
        />
        px
      </label>
    </div>
  );

  return (
    <AdvancedConverter
      article={article}
      title="Px to rem converter"
      description="Convert px to rem or rem to px. At a 16px root font size, [1 12px = 0.75rem 2]. Enter one value per line and set Base to match your page's root font size."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle={fromTitle}
      toTitle={toTitle}
      extraElements={extraEl}
      backColor="cyan"
    />
  );
};
