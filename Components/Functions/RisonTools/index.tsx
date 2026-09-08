'use client';

import { useState, useEffect, useMemo } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import { useShareLink } from '@/Components/Functions/ShareLink';
import { risonToJson, jsonToRison, RISON_SAMPLE, type RisonMode } from './logic';

const selectClass = 'border border-gray-300 bg-white text-gray-900 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-900';
const labelClass = 'text-xs text-gray-500 uppercase tracking-wider';
const buttonClass = 'px-3 py-1.5 border border-gray-300 bg-white text-gray-700 text-xs font-bold uppercase tracking-wider hover:bg-gray-50 hover:border-gray-900 transition-colors cursor-pointer';

type Direction = 'decode' | 'encode';

export function RisonConverter() {
  const [input, setInput] = useState('');
  const [direction, setDirection] = useState<Direction>('decode');
  const [mode, setMode] = useState<RisonMode>('rison');
  const [unescape, setUnescape] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setInput(from);
    const d = params.get('mode');
    if (d === 'decode' || d === 'encode') setDirection(d);
    const f = params.get('flavour');
    if (f === 'rison' || f === 'o-rison' || f === 'a-rison') setMode(f);
    if (params.get('unescape') === 'false') setUnescape(false);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ mode: direction, flavour: mode, unescape });

  const output = useMemo(() => {
    if (!input.trim()) return '';
    try {
      if (direction === 'encode') return jsonToRison(input, mode);
      // A value copied out of an address bar is still percent-encoded.
      let source = input;
      if (unescape && /%[0-9a-fA-F]{2}/.test(source)) {
        try {
          source = decodeURIComponent(source);
        } catch {
          // Leave it as it was; a bad escape is not worth failing the whole parse.
        }
      }
      return risonToJson(source, mode);
    } catch (e: unknown) {
      return e instanceof Error ? `Error: ${e.message}` : 'Cannot read that value';
    }
  }, [input, direction, mode, unescape]);

  return (
    <AdvancedConverter
      title="Rison Decoder & Encoder"
      description="Rison is the compact, URL-safe serialization Kibana puts in its [1 _a 2] and [1 _g 2] parameters: [1 (query:(match:(host:web-1)),size:20) 2] is the same data as the JSON, without the characters a URL would have to escape. Kibana usually writes the bracket-less [1 o-rison 2] form, so try that when a raw parameter will not parse."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle={direction === 'decode' ? 'Rison' : 'JSON'}
      toTitle={direction === 'decode' ? 'JSON' : 'Rison'}
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
              <option value="decode">Rison to JSON</option>
              <option value="encode">JSON to Rison</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className={labelClass}>Flavour</label>
            <select className={selectClass} value={mode} onChange={(e) => setMode(e.target.value as RisonMode)}>
              <option value="rison">Rison</option>
              <option value="o-rison">o-rison (no outer parens)</option>
              <option value="a-rison">a-rison (no outer !( ))</option>
            </select>
          </div>
          {direction === 'decode' && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={unescape} onChange={(e) => setUnescape(e.target.checked)} />
              <span className="text-gray-500 text-xs whitespace-nowrap">Percent-decode first</span>
            </label>
          )}
          <button
            className={buttonClass}
            onClick={() => {
              setDirection('decode');
              setMode('rison');
              setInput(RISON_SAMPLE);
            }}
          >
            Load Sample
          </button>
        </>
      }
    />
  );
}
