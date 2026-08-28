'use client';

import { useState, useEffect } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import { toLeet, fromLeet, toAdvancedLeet } from './logic';

const selectClass = 'border border-gray-300 bg-white text-gray-900 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-900';

export function LeetSpeakTools() {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');
  const [mode, setMode] = useState<'to-leet' | 'from-leet' | 'advanced'>('to-leet');

  useEffect(() => {
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = params.get('from') ?? '';
    if (from) setFromValue(from);
    const m = params.get('mode');
    if (m === 'from-leet' || m === 'advanced') setMode(m);
  }, []);

  useEffect(() => {
    if (!fromValue.trim()) { setToValue(''); return; }
    try {
      if (mode === 'from-leet') {
        setToValue(fromLeet(fromValue));
      } else if (mode === 'advanced') {
        setToValue(toAdvancedLeet(fromValue));
      } else {
        setToValue(toLeet(fromValue));
      }
    } catch (e) {
      setToValue(`Error: ${(e as Error).message}`);
    }
  }, [fromValue, mode]);

  return (
    <AdvancedConverter
      title="Leet Speak Converter"
      description="Convert text to [1 leet speak (1337) 2] or back to normal. Advanced mode uses extended substitutions like @ for a and $ for s."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="Input"
      toTitle="Output"
      backColor="rose"
      extraElements={
        <div className="flex flex-row flex-wrap gap-3 items-center">
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as 'to-leet' | 'from-leet' | 'advanced')}
            className={selectClass}
          >
            <option value="to-leet">Text to Leet</option>
            <option value="from-leet">Leet to Text</option>
            <option value="advanced">Advanced Leet</option>
          </select>
        </div>
      }
    />
  );
}
