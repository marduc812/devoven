'use client';

import { useState, useEffect } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import { iniToJson, jsonToIni } from './logic';

export function IniParser() {
  const [input, setInput] = useState('');
  const [direction, setDirection] = useState<'ini-to-json' | 'json-to-ini'>('ini-to-json');
  const [output, setOutput] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setInput(from);
  }, []);

  useEffect(() => {
    if (!input.trim()) { setOutput(''); return; }
    if (direction === 'ini-to-json') {
      setOutput(iniToJson(input));
    } else {
      setOutput(jsonToIni(input));
    }
  }, [input, direction]);

  const extraElements = (
    <div className="flex items-center gap-3">
      <span className="text-gray-400 text-sm">Mode:</span>
      <select
        className="bg-white text-gray-900 text-sm border border-gray-200 px-3 py-1.5 focus:outline-none focus:border-white/30"
        value={direction}
        onChange={e => setDirection(e.target.value as 'ini-to-json' | 'json-to-ini')}
      >
        <option value="ini-to-json">INI → JSON</option>
        <option value="json-to-ini">JSON → INI</option>
      </select>
    </div>
  );

  return (
    <AdvancedConverter
      title="INI / Config File Parser"
      description="Parse INI/config files to JSON or convert JSON back to INI format. Handles [1 [sections] 2], [1 key=value 2], [1 key: value 2], comments ([1 ; 2] and [1 # 2]), and quoted values."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="Input"
      toTitle="Output"
      backColor="cyan"
      extraElements={extraElements}
    />
  );
}
