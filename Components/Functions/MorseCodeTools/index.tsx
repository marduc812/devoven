'use client';

import { useState, useEffect } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import { textToMorse, morseToText } from './logic';

const selectClass = 'border border-gray-300 bg-white text-gray-900 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-900';

export function MorseCodeConverter() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setInput(from);
    const m = params.get('mode');
    if (m === 'decode') setMode('decode');
  }, []);

  useEffect(() => {
    if (!input.trim()) { setOutput(''); return; }
    try {
      if (mode === 'encode') {
        setOutput(textToMorse(input));
      } else {
        setOutput(morseToText(input));
      }
    } catch {
      setOutput('');
    }
  }, [input, mode]);

  return (
    <AdvancedConverter
      title="Morse Code Converter"
      description="Convert text to Morse code or decode Morse code back to text. Words are separated by [1 / 2] in Morse output."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle={mode === 'encode' ? 'Text' : 'Morse Code'}
      toTitle={mode === 'encode' ? 'Morse Code' : 'Text'}
      backColor="rose"
      extraElements={
        <div className="flex flex-row flex-wrap gap-3 items-center">
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as 'encode' | 'decode')}
            className={selectClass}
          >
            <option value="encode">Text → Morse</option>
            <option value="decode">Morse → Text</option>
          </select>
        </div>
      }
    />
  );
}
