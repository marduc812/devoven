'use client';

import { useState, useEffect } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import { interpretBrainfuck } from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

const labelClass = 'text-xs text-gray-500 uppercase tracking-wider';
const textareaClass = 'bg-white text-gray-900 border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-white/30 w-full font-mono resize-none';

export function BrainfuckTools() {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');
  const [stdinValue, setStdinValue] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = params.get('from') ?? '';
    if (from) setFromValue(from);
    const stdin = params.get('stdin') ?? '';
    if (stdin) setStdinValue(stdin);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ stdin: stdinValue })

  useEffect(() => {
    if (!fromValue.trim()) { setToValue(''); return; }
    try {
      setToValue(interpretBrainfuck(fromValue, stdinValue));
    } catch (e) {
      setToValue(`Error: ${(e as Error).message}`);
    }
  }, [fromValue, stdinValue]);

  return (
    <AdvancedConverter
      title="Brainfuck Interpreter"
      description="Run [1 Brainfuck 2] programs directly in your browser. Enter your code in the input area, optionally provide stdin input for the [1 , 2] command, and see the output."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="Brainfuck Code"
      toTitle="Program Output"
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-2 w-full">
          <label className={labelClass}>Input (stdin)</label>
          <textarea
            rows={2}
            value={stdinValue}
            onChange={(e) => setStdinValue(e.target.value)}
            className={textareaClass}
          />
        </div>
      }
    />
  );
}
