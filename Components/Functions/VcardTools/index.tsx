'use client';

import { useState, useEffect } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import { generateVcard, parseVcard, detectVcardOrInput } from './logic';

export function VcardGenerator() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'auto' | 'generate' | 'parse'>('auto');
  const [output, setOutput] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setInput(from);
  }, []);

  useEffect(() => {
    if (!input.trim()) { setOutput(''); return; }
    try {
      const effectiveMode =
        mode === 'auto'
          ? (detectVcardOrInput(input) === 'vcard' ? 'parse' : 'generate')
          : mode;
      if (effectiveMode === 'generate') {
        setOutput(generateVcard(input));
      } else {
        setOutput(parseVcard(input));
      }
    } catch (e: unknown) {
      setOutput(e instanceof Error ? 'Error: ' + e.message : 'Error: invalid input');
    }
  }, [input, mode]);

  const extraElements = (
    <div className="flex items-center gap-3">
      <span className="text-gray-400 text-sm">Mode:</span>
      <select
        className="bg-white text-gray-200 text-sm border border-gray-200 px-3 py-1.5 focus:outline-none focus:border-white/30"
        value={mode}
        onChange={e => setMode(e.target.value as 'auto' | 'generate' | 'parse')}
      >
        <option value="auto">Auto-detect</option>
        <option value="generate">key=value → vCard</option>
        <option value="parse">vCard → structured</option>
      </select>
    </div>
  );

  return (
    <AdvancedConverter
      title="vCard Generator"
      description="Generate [1vCard 3.0 (.vcf)2] from [1key=value lines2] (name, email, phone, org, title, url, address, note). Paste a vCard to parse it back to structured display."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="Input (key=value or vCard)"
      toTitle="Output"
      backColor="lime"
      extraElements={extraElements}
    />
  );
}
