'use client';

import React, { useEffect, useState } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import { alignLines, columnAlign, wrapText } from './logic';

type AlignMode = 'left' | 'right' | 'center' | 'column' | 'wrap';

export const TextAlign = () => {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');
  const [mode, setMode] = useState<AlignMode>('left');
  const [width, setWidth] = useState('');

  useEffect(() => {
    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = searchParams.get('from') ?? '';
    if (from) setFromValue(from);
  }, []);

  useEffect(() => {
    if (!fromValue) {
      setToValue('');
      return;
    }
    try {
      const w = width ? parseInt(width) : undefined;
      if (mode === 'column') {
        setToValue(columnAlign(fromValue));
      } else if (mode === 'wrap') {
        setToValue(wrapText(fromValue, w ?? 80));
      } else {
        setToValue(alignLines(fromValue, mode, w));
      }
    } catch {
      setToValue('Error processing text');
    }
  }, [fromValue, mode, width]);

  const controls = (
    <div className="flex flex-wrap gap-3 items-center">
      <div className="flex flex-wrap gap-2">
        {([
          { value: 'left', label: 'Left' },
          { value: 'right', label: 'Right' },
          { value: 'center', label: 'Center' },
          { value: 'column', label: 'Column Align' },
          { value: 'wrap', label: 'Word Wrap' },
        ] as { value: AlignMode; label: string }[]).map(opt => (
          <button
            key={opt.value}
            onClick={() => setMode(opt.value)}
            className={`px-3 py-1.5 text-xs font-medium transition-colors duration-200 ${
              mode === opt.value
                ? 'bg-rose-500/30 text-rose-200 border border-rose-400/40'
                : 'bg-gray-50 text-gray-400 border border-gray-200 hover:border-gray-400'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {mode !== 'column' && (
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-xs">Width:</span>
          <input
            type="number"
            placeholder="auto"
            value={width}
            onChange={e => setWidth(e.target.value)}
            className="bg-white text-gray-900 text-xs p-1.5 border border-gray-200 focus:border-gray-400 focus:outline-none w-20 font-mono"
          />
        </div>
      )}
    </div>
  );

  return (
    <AdvancedConverter
      title="Text Alignment"
      description="Pad and align text in fixed-width columns. Align [1 left 2], [1 right 2], [1 center 2], auto-align [1 tab-delimited columns 2], or wrap at a given width."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="Input Text"
      toTitle="Aligned Output"
      backColor="rose"
      extraElements={controls}
    />
  );
};
