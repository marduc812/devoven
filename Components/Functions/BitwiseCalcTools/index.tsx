'use client';
import { useState, useEffect } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import { formatBitwise } from './logic';

export function BitwiseCalculator() {
  const [aVal, setAVal] = useState('');
  const [bVal, setBVal] = useState('');
  const [shift, setShift] = useState('1');
  const [output, setOutput] = useState('');

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const from = p.get('from');
    if (from) setAVal(from);
  }, []);

  useEffect(() => {
    if (!aVal.trim() || !bVal.trim()) { setOutput(''); return; }
    try {
      setOutput(formatBitwise(aVal, bVal, shift));
    } catch (e) {
      setOutput(`Error: ${(e as Error).message}`);
    }
  }, [aVal, bVal, shift]);

  return (
    <AdvancedConverter
      title="Bitwise Operations Calculator"
      description="Compute [1 AND, OR, XOR, NAND, NOR, NOT, shifts 2] for two integers. Enter decimal or hex (0xFF). Shows 32-bit binary representation and two's complement handling."
      fromValue={aVal}
      toValue={output}
      setFromValue={setAVal}
      fromTitle="Value A (decimal or 0xFF hex)"
      toTitle="Results"
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-gray-400 text-sm">Value B (decimal or 0xFF hex)</label>
            <input
              className="bg-white backdrop-blur-sm text-gray-900 p-3 w-full border border-gray-200 focus:border-gray-400 focus:outline-none transition-colors duration-200 text-sm"
              value={bVal}
              onChange={e => setBVal(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-gray-400 text-sm">Shift amount (0-31)</label>
            <input
              className="bg-white backdrop-blur-sm text-gray-900 p-3 w-full border border-gray-200 focus:border-gray-400 focus:outline-none transition-colors duration-200 text-sm"
              value={shift}
              onChange={e => setShift(e.target.value)}
              type="number"
              min="0"
              max="31"
            />
          </div>
        </div>
      }
    />
  );
}
