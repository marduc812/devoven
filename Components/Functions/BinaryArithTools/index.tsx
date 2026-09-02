'use client';

import { useState, useEffect } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { computeBinaryArith, BinaryOp } from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

const inputClass =
  'bg-white text-gray-900 placeholder:text-gray-400 p-3 w-full border border-gray-300 focus:border-gray-900 focus:outline-none font-mono text-sm';
const labelClass = 'text-xs font-bold uppercase tracking-wider text-gray-500 mb-1 block';

const OPS: { value: BinaryOp; label: string }[] = [
  { value: '+', label: 'Add (+)' },
  { value: '-', label: 'Subtract (−)' },
  { value: '*', label: 'Multiply (×)' },
  { value: '/', label: 'Divide (÷)' },
];

export function BinaryArithCalculator() {
  const [inputA, setInputA] = useState('');
  const [inputB, setInputB] = useState('');
  const [op, setOp] = useState<BinaryOp>('+');

  useEffect(() => {
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = params.get('from') ?? '';
    if (from) setInputA(from);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ from: inputA })

  const result =
    inputA.trim() && inputB.trim()
      ? computeBinaryArith(inputA, inputB, op)
      : null;

  return (
    <Panel
      title="Binary Arithmetic Calculator"
      description="Perform arithmetic on binary numbers with step-by-step visualization. Supports addition (carry), subtraction (two's complement), multiplication (shift-and-add), and division."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Binary A</label>
              <input
                type="text"
                className={inputClass}
                placeholder="e.g. 1010"
                value={inputA}
                onChange={(e) => setInputA(e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>Binary B</label>
              <input
                type="text"
                className={inputClass}
                placeholder="e.g. 0011"
                value={inputB}
                onChange={(e) => setInputB(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {OPS.map((o) => (
              <button
                key={o.value}
                onClick={() => setOp(o.value)}
                className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider border transition-colors ${
                  op === o.value
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-500 border-gray-300 hover:border-gray-900 hover:text-gray-900'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>

          {result && (
            result.error ? (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm">
                {result.error}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {/* Summary */}
                <div className="p-3 bg-gray-50 border border-gray-200 font-mono text-sm">
                  <div className="flex gap-2 items-center flex-wrap">
                    <span className="text-gray-900">{result.opA}</span>
                    <span className="text-gray-500">{op}</span>
                    <span className="text-gray-900">{result.opB}</span>
                    <span className="text-gray-400">=</span>
                    <span className="text-gray-900 font-black">{result.binaryResult}</span>
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    Decimal: {result.decA} {op} {result.decB} = {result.decResult}
                  </div>
                </div>

                {/* Steps */}
                <div className="p-3 bg-gray-50 border border-gray-200">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Step-by-step</p>
                  <div className="flex flex-col gap-1 font-mono text-xs">
                    {result.steps.map((s, i) => (
                      <div key={i} className="flex gap-3 items-baseline">
                        <span className="text-gray-400 w-44 flex-shrink-0 text-right pr-2">{s.label}</span>
                        <span className="text-gray-900">{s.value}</span>
                        {s.note && <span className="text-gray-500 text-xs ml-2 not-italic">{s.note}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      }
    />
  );
}
