'use client';

import React, { useState, useEffect } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { convertNumeral, getReferenceTable } from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

export function NumeralSystems() {
  const [input, setInput] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setInput(from);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ from: input })

  const result = input.trim() ? convertNumeral(input) : null;
  const refTable = getReferenceTable(0, 256);

  const inputClass =
    'bg-white text-gray-900 placeholder:text-gray-400 p-3 w-full border border-gray-300 focus:border-gray-900 focus:outline-none transition-colors duration-150 text-sm font-mono';

  const Row = ({ label, value }: { label: string; value: string }) => (
    <div className="flex items-start gap-3 py-2 border-b border-gray-200">
      <span className="text-gray-500 text-xs w-36 shrink-0 pt-0.5">{label}</span>
      <span className="text-gray-900 font-mono text-sm break-all">{value}</span>
    </div>
  );

  return (
    <Panel
      title="Numeral Systems Reference"
      description="Enter a number to see it in decimal, binary, octal, hex, base-36, Roman numerals, scientific notation, English words, IEEE 754 float, and as a fraction. Or browse the [1 first 256 2] values as a reference table."
      backColor="cyan"
      extraElements={
        <div className="flex flex-col gap-4 w-full">
          <input
            className={inputClass}
            placeholder="Enter a number (e.g. 255, 3.14, -42)..."
            value={input}
            onChange={e => setInput(e.target.value)}
          />

          {result ? (
            <div className="border border-gray-200 bg-gray-50 p-4">
              <Row label="Decimal" value={result.decimal} />
              <Row label="Binary" value={result.binary} />
              <Row label="Octal" value={result.octal} />
              <Row label="Hexadecimal" value={result.hexadecimal} />
              <Row label="Base-36" value={result.base36} />
              <Row label="Roman Numerals" value={result.roman} />
              <Row label="Scientific" value={result.scientific} />
              <Row label="English Words" value={result.words} />
              <Row label="IEEE 754 (32-bit)" value={result.ieee754} />
              <Row label="Fraction" value={result.fraction} />
            </div>
          ) : input.trim() ? (
            <p className="text-red-400 text-sm">Invalid number</p>
          ) : null}

          {!input.trim() && (
            <>
              <p className="text-gray-500 text-xs">First 256 values — decimal, binary, octal, hex, ASCII</p>
              <div className="overflow-auto max-h-96">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="py-2 pr-3 text-left text-gray-400 font-normal">Dec</th>
                      <th className="py-2 pr-3 text-left text-gray-400 font-normal font-mono">Binary</th>
                      <th className="py-2 pr-3 text-left text-gray-400 font-normal font-mono">Oct</th>
                      <th className="py-2 pr-3 text-left text-gray-400 font-normal font-mono">Hex</th>
                      <th className="py-2 text-left text-gray-400 font-normal">Char</th>
                    </tr>
                  </thead>
                  <tbody>
                    {refTable.map(row => (
                      <tr key={row.decimal} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="py-1 pr-3 text-gray-900 font-mono">{row.decimal}</td>
                        <td className="py-1 pr-3 text-gray-300 font-mono text-xs">{row.binary}</td>
                        <td className="py-1 pr-3 text-gray-300 font-mono">{row.octal}</td>
                        <td className="py-1 pr-3 text-gray-300 font-mono">{row.hex}</td>
                        <td className="py-1 text-gray-900 font-mono">{row.char}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      }
    />
  );
}
