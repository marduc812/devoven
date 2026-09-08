'use client';

import { useState, useEffect, useMemo } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import { useShareLink } from '@/Components/Functions/ShareLink';
import { phpToJson, jsonToPhp, PHP_SAMPLE } from './logic';

const selectClass = 'border border-gray-300 bg-white text-gray-900 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-900';
const labelClass = 'text-xs text-gray-500 uppercase tracking-wider';
const buttonClass = 'px-3 py-1.5 border border-gray-300 bg-white text-gray-700 text-xs font-bold uppercase tracking-wider hover:bg-gray-50 hover:border-gray-900 transition-colors cursor-pointer';

type Direction = 'unserialize' | 'serialize';

export function PhpSerializer() {
  const [input, setInput] = useState('');
  const [direction, setDirection] = useState<Direction>('unserialize');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setInput(from);
    const mode = params.get('mode');
    if (mode === 'unserialize' || mode === 'serialize') setDirection(mode);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ mode: direction });

  const output = useMemo(() => {
    if (!input.trim()) return '';
    try {
      return direction === 'unserialize' ? phpToJson(input) : jsonToPhp(input);
    } catch (e: unknown) {
      return e instanceof Error ? `Error: ${e.message}` : 'Cannot read that value';
    }
  }, [input, direction]);

  return (
    <AdvancedConverter
      title="PHP Serialize & Unserialize"
      description="Read and write PHP's [1 serialize() 2] format. Arrays, objects, enums and back references all come through: a class keeps its name as [1 $class 2], and a private or protected property keeps its visibility instead of showing the NUL bytes PHP writes around it. String lengths are counted in bytes, which is where hand-edited payloads usually break."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle={direction === 'unserialize' ? 'Serialized PHP' : 'JSON'}
      toTitle={direction === 'unserialize' ? 'JSON' : 'Serialized PHP'}
      backColor="lime"
      extraElements={
        <>
          <div className="flex items-center gap-2">
            <label className={labelClass}>Direction</label>
            <select
              className={selectClass}
              value={direction}
              onChange={(e) => setDirection(e.target.value as Direction)}
            >
              <option value="unserialize">Unserialize to JSON</option>
              <option value="serialize">Serialize from JSON</option>
            </select>
          </div>
          <button
            className={buttonClass}
            onClick={() => {
              setDirection('unserialize');
              setInput(PHP_SAMPLE);
            }}
          >
            Load Sample
          </button>
        </>
      }
    />
  );
}
