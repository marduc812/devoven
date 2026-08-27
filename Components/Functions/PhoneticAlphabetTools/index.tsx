'use client';
import { useState, useEffect } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import { textToPhonetic, phoneticToText } from './logic';
import type { AlphabetType } from './logic';

const ALPHABETS: { value: AlphabetType; label: string }[] = [
  { value: 'nato', label: 'NATO' },
  { value: 'icao', label: 'ICAO' },
  { value: 'oldBritish', label: 'Old British' },
  { value: 'german', label: 'German (DIN)' },
];

export function PhoneticAlphabetConverter() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [alphabet, setAlphabet] = useState<AlphabetType>('nato');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const from = p.get('from');
    if (from) setInput(from);
  }, []);

  useEffect(() => {
    if (!input.trim()) { setOutput(''); return; }
    try {
      if (mode === 'encode') {
        setOutput(textToPhonetic(input, alphabet));
      } else {
        setOutput(phoneticToText(input, alphabet));
      }
    } catch (e) {
      setOutput(`Error: ${(e as Error).message}`);
    }
  }, [input, alphabet, mode]);

  const selectClass =
    'bg-white text-gray-900 px-3 py-1.5 border border-gray-200 focus:border-gray-400 focus:outline-none text-sm';

  const extraElements = (
    <div className="flex flex-wrap gap-3 items-center">
      <label className="flex items-center gap-2 text-sm text-gray-400">
        Alphabet:
        <select className={selectClass} value={alphabet} onChange={e => setAlphabet(e.target.value as AlphabetType)}>
          {ALPHABETS.map(a => (
            <option key={a.value} value={a.value}>{a.label}</option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm text-gray-400">
        Mode:
        <select className={selectClass} value={mode} onChange={e => setMode(e.target.value as 'encode' | 'decode')}>
          <option value="encode">Text to Phonetic</option>
          <option value="decode">Phonetic to Text</option>
        </select>
      </label>
    </div>
  );

  return (
    <AdvancedConverter
      title="Phonetic Alphabet Converter"
      description="Convert text to NATO phonetic alphabet ([1 Alpha, Bravo, Charlie 2]) and back. Also supports ICAO, Old British, and German (DIN) phonetic alphabets."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle={mode === 'encode' ? 'Input Text' : 'Phonetic Words (one per line)'}
      toTitle={mode === 'encode' ? 'Phonetic Alphabet' : 'Decoded Text'}
      backColor="rose"
      extraElements={extraElements}
    />
  );
}
